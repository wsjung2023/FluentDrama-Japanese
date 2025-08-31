// SB Payment Types
export interface SBPaymentConfig {
  paddleVendorId?: string;
  paddleApiKey?: string;
  environment: 'sandbox' | 'production';
  currency: 'USD' | 'KRW' | 'EUR';
  appName: string;
}

export interface SBPricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
  paddleProductId?: string;
  usageLimit: SBUsageLimit;
}

export interface SBSubscription {
  id: string;
  userId: string;
  tier: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface SBPaymentResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

export interface SBUsageLimit {
  tier: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: {
    aiGeneration: boolean;
    voiceSynthesis: boolean;
    characterGeneration: boolean;
    conversationHistory: boolean;
    customFeatures?: Record<string, boolean>;
  };
}