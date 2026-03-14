// Usage-related API routes for quota checks and usage counter updates.
import type { Express } from "express";
import { storage } from "../storage";
import { ApiError, getErrorMessage, getErrorStatus } from "../lib/apiError";
import { logError } from "../lib/logger";
import { requireAuthenticated } from "./middleware/authGuard";

type SubscriptionTier = 'free' | 'starter' | 'pro' | 'premium';

function parseUsageCount(value: string | null | undefined): number {
  const parsed = parseInt(value || '0', 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function getSubscriptionTier(tier: string | null | undefined): SubscriptionTier {
  if (tier === 'starter' || tier === 'pro' || tier === 'premium') {
    return tier;
  }

  return 'free';
}

export function registerUsageRoutes(app: Express) {
  app.post('/api/check-usage', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const now = new Date();
      const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date();
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

      let currentUsage = parseUsageCount(user.dailyUsageCount);

      if (daysSinceReset >= 30) {
        currentUsage = 0;
        await storage.updateUserSubscription(userId, {
          dailyUsageCount: "0",
          lastUsageReset: now,
        });
      }

      const limits = {
        free: { conversations: 30, images: 1 },
        starter: { conversations: 300, images: 15 },
        pro: { conversations: 600, images: 25 },
        premium: { conversations: 1200, images: 60 },
      };

      const subscriptionTier = getSubscriptionTier(user.subscriptionTier);
      const userLimit = limits[subscriptionTier];
      const canUse = currentUsage < userLimit.conversations;

      res.json({
        canUse,
        currentUsage,
        limit: userLimit.conversations,
        tier: subscriptionTier,
        daysUntilReset: Math.max(0, 30 - daysSinceReset),
      });
    } catch (error) {
      logError("Usage check error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to check usage");
      res.status(status).json({ message });
    }
  });

  app.post('/api/increment-usage', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const newUsage = parseUsageCount(user.dailyUsageCount) + 1;

      await storage.updateUserSubscription(userId, {
        dailyUsageCount: newUsage.toString(),
      });

      res.json({ success: true, newUsage });
    } catch (error) {
      logError("Usage increment error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to increment usage");
      res.status(status).json({ message });
    }
  });
}
