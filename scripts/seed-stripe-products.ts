import { getUncachableStripeClient } from '../server/services/stripeClient';
import { db } from '../server/db';
import { billingPlans } from '../shared/schema';
import { eq } from 'drizzle-orm';

const PLANS = [
  {
    id: 'fluent_free',
    name: 'Free',
    priceKrw: 0,
    priceUsd: '0',
    features: {
      conversation_limit_month: 30,
      image_limit_month: 1,
      tts_limit_month: 50,
      model_tier: 'basic' as const,
    },
    sortOrder: 0,
  },
  {
    id: 'fluent_starter',
    name: 'Starter',
    priceKrw: 4900,
    priceUsd: '3.30',
    features: {
      conversation_limit_month: 300,
      image_limit_month: 15,
      tts_limit_month: 500,
      model_tier: 'basic' as const,
    },
    sortOrder: 1,
  },
  {
    id: 'fluent_pro',
    name: 'Pro',
    priceKrw: 9900,
    priceUsd: '6.60',
    features: {
      conversation_limit_month: 600,
      image_limit_month: 25,
      tts_limit_month: 1000,
      model_tier: 'premium' as const,
    },
    sortOrder: 2,
  },
  {
    id: 'fluent_premium',
    name: 'Premium',
    priceKrw: 19900,
    priceUsd: '13.00',
    features: {
      conversation_limit_month: 1200,
      image_limit_month: 60,
      tts_limit_month: 2000,
      model_tier: 'premium' as const,
    },
    sortOrder: 3,
  },
];

async function seedStripeProducts() {
  console.log('🚀 Starting Stripe products seed...');

  let stripe;
  try {
    stripe = await getUncachableStripeClient();
  } catch (error) {
    console.log('⚠️ Stripe not configured, seeding DB plans only...');
    await seedDbPlansOnly();
    return;
  }

  for (const plan of PLANS) {
    console.log(`\n📦 Processing ${plan.name} plan...`);

    if (plan.priceKrw === 0) {
      console.log(`  ↳ Free plan, skipping Stripe product creation`);
      await upsertDbPlan(plan, null, null);
      continue;
    }

    try {
      const existingProducts = await stripe.products.search({
        query: `name:'FluentDrama ${plan.name}'`,
      });

      let product;
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`  ↳ Found existing product: ${product.id}`);
      } else {
        product = await stripe.products.create({
          name: `FluentDrama ${plan.name}`,
          description: `FluentDrama ${plan.name} 월간 구독`,
          metadata: {
            planId: plan.id,
            conversation_limit: String(plan.features.conversation_limit_month),
            image_limit: String(plan.features.image_limit_month),
            tts_limit: String(plan.features.tts_limit_month),
            model_tier: plan.features.model_tier,
          },
        });
        console.log(`  ↳ Created product: ${product.id}`);
      }

      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      });

      let price = existingPrices.data.find(
        (p) => p.unit_amount === plan.priceKrw && p.currency === 'krw'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceKrw,
          currency: 'krw',
          recurring: { interval: 'month' },
          metadata: { planId: plan.id },
        });
        console.log(`  ↳ Created price: ${price.id} (₩${plan.priceKrw})`);
      } else {
        console.log(`  ↳ Found existing price: ${price.id}`);
      }

      await upsertDbPlan(plan, product.id, price.id);
    } catch (error) {
      console.error(`  ❌ Error processing ${plan.name}:`, error);
    }
  }

  console.log('\n✅ Stripe products seed complete!');
  process.exit(0);
}

async function seedDbPlansOnly() {
  console.log('📦 Seeding DB plans without Stripe...');
  
  for (const plan of PLANS) {
    await upsertDbPlan(plan, null, null);
    console.log(`  ↳ ${plan.name} plan saved to DB`);
  }
  
  console.log('✅ DB plans seed complete!');
  process.exit(0);
}

async function upsertDbPlan(
  plan: typeof PLANS[0],
  stripeProductId: string | null,
  stripePriceId: string | null
) {
  const existing = await db.select().from(billingPlans).where(eq(billingPlans.id, plan.id));

  if (existing.length > 0) {
    await db
      .update(billingPlans)
      .set({
        name: plan.name,
        priceMonthlyKrw: plan.priceKrw,
        priceMonthlyUsd: plan.priceUsd,
        stripeProductId,
        stripePriceId,
        features: plan.features,
        sortOrder: plan.sortOrder,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(billingPlans.id, plan.id));
    console.log(`  ↳ Updated ${plan.name} in DB`);
  } else {
    await db.insert(billingPlans).values({
      id: plan.id,
      app: 'fluentdrama',
      name: plan.name,
      priceMonthlyKrw: plan.priceKrw,
      priceMonthlyUsd: plan.priceUsd,
      stripeProductId,
      stripePriceId,
      features: plan.features,
      sortOrder: plan.sortOrder,
      isActive: true,
    });
    console.log(`  ↳ Inserted ${plan.name} in DB`);
  }
}

seedStripeProducts().catch(console.error);
