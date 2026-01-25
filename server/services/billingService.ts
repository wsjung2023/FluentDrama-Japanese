import { db } from '../db';
import { billingPlans, userSubscriptions, paymentTransactions, refundRequests, users } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getUncachableStripeClient } from './stripeClient';
import type { BillingPlan, UserSubscription, PaymentTransaction, RefundRequest, User } from '@shared/schema';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export class BillingService {
  async getAllPlans(): Promise<BillingPlan[]> {
    return db.select().from(billingPlans).where(eq(billingPlans.isActive, true)).orderBy(billingPlans.sortOrder);
  }

  async getPlanById(planId: string): Promise<BillingPlan | undefined> {
    const [plan] = await db.select().from(billingPlans).where(eq(billingPlans.id, planId));
    return plan;
  }

  async getPlanByStripePriceId(stripePriceId: string): Promise<BillingPlan | undefined> {
    const [plan] = await db.select().from(billingPlans).where(eq(billingPlans.stripePriceId, stripePriceId));
    return plan;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.app, 'fluentdrama')
      ))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createOrUpdateSubscription(data: {
    userId: string;
    planId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    paymentMethod?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<UserSubscription> {
    const existing = await this.getUserSubscription(data.userId);
    
    if (existing) {
      const [updated] = await db.update(userSubscriptions)
        .set({
          planId: data.planId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripeCustomerId: data.stripeCustomerId,
          paymentMethod: data.paymentMethod,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          status: 'active',
          canceledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, existing.id))
        .returning();
      return updated;
    }

    const [subscription] = await db.insert(userSubscriptions)
      .values({
        userId: data.userId,
        app: 'fluentdrama',
        planId: data.planId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        paymentMethod: data.paymentMethod,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        status: 'active',
      })
      .returning();
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await db.update(userSubscriptions)
      .set({
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscriptionId));
  }

  async expireSubscription(subscriptionId: string): Promise<void> {
    await db.update(userSubscriptions)
      .set({
        status: 'cancelled',
        planId: 'fluent_free',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscriptionId));
  }

  async recordPayment(data: {
    subscriptionId: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
  }): Promise<PaymentTransaction> {
    const [payment] = await db.insert(paymentTransactions)
      .values(data)
      .returning();
    return payment;
  }

  async getLastPayment(subscriptionId: string): Promise<PaymentTransaction | undefined> {
    const [payment] = await db.select()
      .from(paymentTransactions)
      .where(and(
        eq(paymentTransactions.subscriptionId, subscriptionId),
        eq(paymentTransactions.status, 'paid')
      ))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(1);
    return payment;
  }

  async createRefundRequest(data: {
    subscriptionId: string;
    userId: string;
    reason: string;
    refundAmount?: number;
  }): Promise<RefundRequest> {
    const [request] = await db.insert(refundRequests)
      .values({
        subscriptionId: data.subscriptionId,
        userId: data.userId,
        reason: data.reason,
        refundAmount: data.refundAmount,
        status: 'pending',
      })
      .returning();
    return request;
  }

  async approveRefund(refundId: string, adminNote?: string): Promise<void> {
    const [request] = await db.select().from(refundRequests).where(eq(refundRequests.id, refundId));
    if (!request) throw new Error('Refund request not found');

    const payment = await this.getLastPayment(request.subscriptionId);
    if (!payment) throw new Error('No payment found for this subscription');

    try {
      const stripe = await getUncachableStripeClient();
      
      if (payment.stripePaymentIntentId) {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          reason: 'requested_by_customer',
        });
      }
    } catch (error) {
      console.error('[Billing] Stripe refund failed:', error);
    }

    await this.expireSubscription(request.subscriptionId);

    await db.update(refundRequests)
      .set({
        status: 'approved',
        adminNote,
        processedAt: new Date(),
      })
      .where(eq(refundRequests.id, refundId));

    await db.update(paymentTransactions)
      .set({ status: 'refunded' })
      .where(eq(paymentTransactions.id, payment.id));
  }

  async rejectRefund(refundId: string, adminNote?: string): Promise<void> {
    await db.update(refundRequests)
      .set({
        status: 'rejected',
        adminNote,
        processedAt: new Date(),
      })
      .where(eq(refundRequests.id, refundId));
  }

  async getPendingRefunds(): Promise<RefundRequest[]> {
    return db.select().from(refundRequests).where(eq(refundRequests.status, 'pending'));
  }

  async calculateRefundAmount(subscriptionId: string): Promise<{
    refundAmount: number;
    refundType: 'full' | 'partial';
    reason: string;
  }> {
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, subscriptionId));
    
    if (!subscription) throw new Error('Subscription not found');

    const payment = await this.getLastPayment(subscriptionId);
    if (!payment) throw new Error('No payment found');

    const now = new Date();
    const paymentDate = new Date(payment.createdAt);
    const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date();

    const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((periodEnd.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - daysSincePayment);

    if (daysSincePayment <= 7) {
      return {
        refundAmount: payment.amount,
        refundType: 'full',
        reason: '청약철회 (7일 이내)'
      };
    }

    const dailyRate = payment.amount / Math.max(totalDays, 1);
    const refundAmount = Math.floor(dailyRate * remainingDays);

    return {
      refundAmount,
      refundType: 'partial',
      reason: `일할 계산: ${remainingDays}일 잔여`
    };
  }

  async syncUserTier(userId: string): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      await db.update(users)
        .set({ subscriptionTier: 'free', updatedAt: new Date() })
        .where(eq(users.id, userId));
      return;
    }

    const plan = await this.getPlanById(subscription.planId);
    if (!plan) return;

    const tierMap: Record<string, string> = {
      'fluent_free': 'free',
      'fluent_starter': 'starter',
      'fluent_pro': 'pro',
      'fluent_premium': 'premium',
    };

    const tier = tierMap[subscription.planId] || 'free';

    await db.update(users)
      .set({ 
        subscriptionTier: tier,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        subscriptionStatus: subscription.canceledAt ? 'cancelled' : 'active',
        subscriptionExpiresAt: subscription.currentPeriodEnd,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    const stripe = await getUncachableStripeClient();
    
    const [user] = await db.select().from(users).where(eq(users.id, params.userId));
    
    let customerId = user?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: params.userEmail,
        metadata: { userId: params.userId },
      });
      customerId = customer.id;
      
      await db.update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, params.userId));
    }

    const existingSub = await this.getUserSubscription(params.userId);
    const existingPlan = existingSub ? await this.getPlanById(existingSub.planId) : null;
    const isPaidUpgrade = existingPlan && existingPlan.priceMonthlyKrw > 0;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: isPaidUpgrade && existingSub?.stripeSubscriptionId ? {
        metadata: {
          userId: params.userId,
          previousSubscriptionId: existingSub.stripeSubscriptionId,
          upgradeFrom: existingSub.planId,
        },
      } : {
        metadata: { userId: params.userId },
      },
      metadata: {
        userId: params.userId,
        upgradeFrom: isPaidUpgrade ? existingSub?.planId : undefined,
        previousStripeSubId: isPaidUpgrade ? existingSub?.stripeSubscriptionId : undefined,
      },
    });

    return session.url || '';
  }

  async handlePaidUpgradeRefund(userId: string, previousSubscriptionId: string): Promise<void> {
    try {
      const stripe = await getUncachableStripeClient();

      const existingSub = await this.getUserSubscription(userId);
      if (!existingSub) return;

      const payment = await this.getLastPayment(existingSub.id);
      if (!payment || !payment.stripePaymentIntentId) {
        console.log('[Billing] No refundable payment found for upgrade');
        return;
      }

      const refundCalc = await this.calculateRefundAmount(existingSub.id);
      
      if (refundCalc.refundAmount > 0) {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: refundCalc.refundAmount,
          reason: 'requested_by_customer',
          metadata: {
            type: 'upgrade_prorated_refund',
            userId,
            originalAmount: String(payment.amount),
            refundedAmount: String(refundCalc.refundAmount),
          },
        });

        console.log(`[Billing] Auto-refund for upgrade: ₩${refundCalc.refundAmount} (${refundCalc.reason})`);

        await db.update(paymentTransactions)
          .set({ status: 'partially_refunded' })
          .where(eq(paymentTransactions.id, payment.id));
      }

      if (previousSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(previousSubscriptionId);
        } catch (e) {
          console.log('[Billing] Previous subscription already cancelled or not found');
        }
      }
    } catch (error) {
      console.error('[Billing] Upgrade refund error:', error);
    }
  }

  async createCustomerPortal(customerId: string, returnUrl: string): Promise<string> {
    const stripe = await getUncachableStripeClient();
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  async handleStripeWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        
        const plan = await this.getPlanByStripePriceId(priceId);
        if (!plan) {
          console.log('[Stripe Webhook] No matching plan for price:', priceId);
          return;
        }

        const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        if (!user) {
          console.log('[Stripe Webhook] No user found for customer:', customerId);
          return;
        }

        const previousSubscriptionId = subscription.metadata?.previousSubscriptionId;
        const upgradeFrom = subscription.metadata?.upgradeFrom;

        if (event.type === 'customer.subscription.created' && previousSubscriptionId && upgradeFrom) {
          console.log(`[Stripe Webhook] Paid upgrade detected: ${upgradeFrom} → ${plan.id}`);
          await this.handlePaidUpgradeRefund(user.id, previousSubscriptionId);
        }

        await this.createOrUpdateSubscription({
          userId: user.id,
          planId: plan.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        await this.syncUserTier(user.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        if (!user) return;

        const userSub = await this.getUserSubscription(user.id);
        if (userSub) {
          await this.expireSubscription(userSub.id);
        }

        await this.syncUserTier(user.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        if (!user) return;

        const userSub = await this.getUserSubscription(user.id);
        if (userSub) {
          await this.recordPayment({
            subscriptionId: userSub.id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid,
            currency: invoice.currency.toUpperCase(),
            status: 'paid',
          });
        }
        break;
      }
    }
  }
}

export const billingService = new BillingService();
