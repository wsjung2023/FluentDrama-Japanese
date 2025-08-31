// 한국 결제 시스템 통합 서비스
import { User } from "@shared/schema";

export interface PaymentProvider {
  name: string;
  createSubscription(user: User, plan: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  verifyPayment(paymentData: any): Promise<boolean>;
}

export interface SubscriptionResult {
  subscriptionId: string;
  customerId: string;
  status: 'active' | 'pending' | 'failed';
  redirectUrl?: string;
  nextAction?: any;
}

// PortOne (구 아임포트) 결제 서비스
export class PortOneProvider implements PaymentProvider {
  name = 'portone';
  
  async createSubscription(user: User, plan: string): Promise<SubscriptionResult> {
    // PortOne 구독 생성 로직
    const response = await fetch('https://api.iamport.kr/subscribe/payments/again', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PORTONE_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        customer_uid: user.id,
        merchant_uid: `subscription_${Date.now()}`,
        amount: this.getPlanAmount(plan),
        name: `FluentDrama-Japanese ${plan} Plan`,
        buyer_email: user.email,
        buyer_name: `${user.firstName} ${user.lastName}`,
      })
    });

    const result = await response.json();
    
    return {
      subscriptionId: result.imp_uid,
      customerId: user.id,
      status: result.status === 'paid' ? 'active' : 'failed'
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // PortOne 구독 취소
    await fetch(`https://api.iamport.kr/subscribe/customers/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.PORTONE_ACCESS_TOKEN}`
      }
    });
  }

  async verifyPayment(paymentData: any): Promise<boolean> {
    // 결제 검증
    const response = await fetch(`https://api.iamport.kr/payments/${paymentData.imp_uid}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PORTONE_ACCESS_TOKEN}`
      }
    });
    
    const payment = await response.json();
    return payment.response.status === 'paid';
  }

  private getPlanAmount(plan: string): number {
    switch (plan) {
      case 'premium': return 9900; // 9,900원
      case 'pro': return 19900; // 19,900원
      default: return 0;
    }
  }
}

// Toss Payments 결제 서비스
export class TossProvider implements PaymentProvider {
  name = 'toss';

  async createSubscription(user: User, plan: string): Promise<SubscriptionResult> {
    // Toss 구독 생성
    const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerKey: user.id,
        cardNumber: '', // 카드 정보는 프론트엔드에서 처리
        cardExpirationYear: '',
        cardExpirationMonth: '',
        cardPassword: '',
        customerBirthday: '',
        consumerName: `${user.firstName} ${user.lastName}`,
      })
    });

    const result = await response.json();
    
    return {
      subscriptionId: result.billingKey,
      customerId: user.id,
      status: 'pending',
      nextAction: {
        type: 'redirect',
        url: result.approvalUrl
      }
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Toss 구독 취소
    await fetch(`https://api.tosspayments.com/v1/billing/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`
      }
    });
  }

  async verifyPayment(paymentData: any): Promise<boolean> {
    // Toss 결제 검증
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentData.paymentKey}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`
      }
    });
    
    const payment = await response.json();
    return payment.status === 'DONE';
  }
}

// Paddle 결제 서비스 (글로벌 + 한국 지원)
export class PaddleProvider implements PaymentProvider {
  name = 'paddle';

  async createSubscription(user: User, plan: string): Promise<SubscriptionResult> {
    // Paddle 구독 생성
    const response = await fetch('https://api.paddle.com/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: user.id,
        items: [{
          price_id: this.getPlanPriceId(plan),
          quantity: 1
        }],
        collection_mode: 'automatic'
      })
    });

    const result = await response.json();
    
    return {
      subscriptionId: result.data.id,
      customerId: user.id,
      status: result.data.status === 'active' ? 'active' : 'pending'
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Paddle 구독 취소
    await fetch(`https://api.paddle.com/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scheduled_change: {
          action: 'cancel',
          effective_at: 'next_billing_period'
        }
      })
    });
  }

  async verifyPayment(paymentData: any): Promise<boolean> {
    // Paddle 결제 검증
    const response = await fetch(`https://api.paddle.com/transactions/${paymentData.transaction_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`
      }
    });
    
    const transaction = await response.json();
    return transaction.data.status === 'completed';
  }

  private getPlanPriceId(plan: string): string {
    switch (plan) {
      case 'premium': return process.env.PADDLE_PREMIUM_PRICE_ID || '';
      case 'pro': return process.env.PADDLE_PRO_PRICE_ID || '';
      default: return '';
    }
  }
}

// 결제 서비스 팩토리
export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.providers.set('portone', new PortOneProvider());
    this.providers.set('toss', new TossProvider());
    this.providers.set('paddle', new PaddleProvider());
  }

  getProvider(name: string): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  // 사용자의 지역에 따라 최적의 결제 수단 추천
  getRecommendedProvider(userLocation?: string): PaymentProvider {
    if (userLocation === 'KR' || userLocation === 'Korea') {
      // 한국 사용자에게는 PortOne 또는 Toss 추천
      return this.providers.get('portone') || this.providers.get('toss')!;
    }
    // 글로벌 사용자에게는 Paddle 추천
    return this.providers.get('paddle')!;
  }
}

export const paymentService = new PaymentService();