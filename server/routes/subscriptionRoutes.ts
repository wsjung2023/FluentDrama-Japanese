// Subscription and billing API routes for plan changes and payment provider flows.
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { getErrorMessage, getErrorStatus } from "../lib/apiError";
import { parseOrThrow } from "../lib/validate";
import { logError } from "../lib/logger";
import { requireAuthenticated } from "./middleware/authGuard";

type SubscriptionTier = 'starter' | 'pro' | 'premium';

function getPaddlePriceId(tier: SubscriptionTier): string {
  switch (tier) {
    case 'starter':
      return 'pri_01k3xqqv4bp4xdjxn2b0p0f0n4';
    case 'pro':
      return 'pri_01k3xqt841ry893jwdbjybyp2q';
    case 'premium':
      return 'pri_01k3xqw6mges1rt7kmkv57xpb0';
    default:
      throw new Error(`Invalid tier: ${tier}`);
  }
}

export function registerSubscriptionRoutes(app: Express) {
  app.post('/api/subscribe', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const subscribeSchema = z.object({
        tier: z.enum(['starter', 'pro', 'premium']),
        provider: z.enum(['paddle']),
      });
      const { tier, provider } = parseOrThrow(subscribeSchema, req.body);
      const userId = req.user.id;

      if (!process.env.PADDLE_API_KEY) {
        return res.status(400).json({
          message: "Paddle API 키가 설정되지 않았습니다.",
        });
      }

      const paddlePayment = await fetch('https://api.paddle.com/transactions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          'Paddle-Version': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              price_id: getPaddlePriceId(tier),
              quantity: 1,
            },
          ],
          collection_mode: 'automatic',
          custom_data: {
            user_id: userId,
            tier,
          },
        }),
      });

      const paddleData = await paddlePayment.json();

      if (paddlePayment.ok) {
        const user = await storage.updateUserSubscription(userId, {
          subscriptionTier: tier,
          paymentProvider: provider,
          subscriptionStatus: 'active',
          customerId: paddleData.customer_id || userId,
          subscriptionId: paddleData.id || `paddle_${Date.now()}`,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        return res.json({ success: true, user, paymentData: paddleData });
      }

      res.status(400).json({ message: "Paddle 결제 실패", error: paddleData });
    } catch (error) {
      logError("Subscription error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to create subscription");
      res.status(status).json({ message });
    }
  });

  app.post('/api/cancel-subscription', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const user = await storage.updateUserSubscription(userId, {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
      });
      res.json({ success: true, user });
    } catch (error) {
      logError("Cancel subscription error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to cancel subscription");
      res.status(status).json({ message });
    }
  });
}
