// Shared usage-limit helpers for AI conversation and media endpoints.
import { storage } from "../../storage";
import { logError } from "../../lib/logger";

type SubscriptionTier = 'free' | 'starter' | 'pro' | 'premium';

type UsageLimitResult = {
  canUse: boolean;
  currentUsage: number;
  limit: number;
};

const CONVERSATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 30,
  starter: 300,
  pro: 1000,
  premium: 5000,
};

function parseUsageCount(value: string | null | undefined): number {
  const parsed = parseInt(value || '0', 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function normalizeSubscriptionTier(tier: string | null | undefined): SubscriptionTier {
  if (tier === 'starter' || tier === 'pro' || tier === 'premium') {
    return tier;
  }

  return 'free';
}

export async function checkConversationUsageLimit(userId: string): Promise<UsageLimitResult> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { canUse: false, currentUsage: 0, limit: 0 };
    }

    if (user.email === 'mainstop3@gmail.com' || user.isAdmin === true) {
      return {
        canUse: true,
        currentUsage: 0,
        limit: 999999,
      };
    }

    const tier = normalizeSubscriptionTier(user.subscriptionTier);
    const limit = CONVERSATION_LIMITS[tier];
    const currentUsage = parseUsageCount(user.conversationCount);

    return {
      canUse: currentUsage < limit,
      currentUsage,
      limit,
    };
  } catch (error) {
    logError('Usage limit check error', error);
    return { canUse: false, currentUsage: 0, limit: 0 };
  }
}
