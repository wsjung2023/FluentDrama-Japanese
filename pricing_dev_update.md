# FluentDrama-Japanese 개발 업데이트 문서
## 버전: 2.1 | 작성일: 2025-11-28
## 참조: VidDigest Hub 시행착오 가이드 기반

---

## 📋 개요

이 문서는 다음 핵심 기능 추가를 위한 개발 계획입니다:
1. **요금제 시스템** - 4단계 구독 플랜 (Free → Starter → Pro → Premium)
2. **PortOne V2 결제 연동** - 빌링키 기반 정기 구독 (스케줄 관리 포함)
3. **OpenAI 모델 이중 구조** - 기본(gpt-4o-mini) / 프리미엄(gpt-4o → gpt-5-mini)
4. **대화 세션 지속성** - "이어하기" 기능
5. **PG사 심사 필수 페이지** - 이용약관, 개인정보처리방침, 환불정책

---

## [1] 요금제 / 한도 정의

### 1.1 billing_plans 테이블 구조

```typescript
// shared/schema.ts 추가

export const billingPlans = pgTable("billing_plans", {
  id: text("id").primaryKey(), // fluent_free, fluent_starter 등
  app: text("app").notNull().default("fluentdrama"),
  name: text("name").notNull(),
  priceMonthlyKrw: integer("price_monthly_krw").notNull().default(0),
  features: jsonb("features").$type<{
    conversation_limit_month: number;
    image_limit_month: number;
    tts_limit_month: number;
    model_tier: "basic" | "premium";
    priority_support?: boolean;
  }>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.2 사전 정의 플랜 데이터

| Plan ID | Name | 월 가격 | 대화 한도 | 이미지 한도 | 모델 티어 |
|---------|------|---------|----------|------------|----------|
| `fluent_free` | Free | ₩0 | 30회/월 | 1장/월 | basic (gpt-4o-mini) |
| `fluent_starter` | Starter | ₩4,900 | 300회/월 | 15장/월 | basic |
| `fluent_pro` | Pro | ₩9,900 | 600회/월 | 25장/월 | premium (gpt-4o) |
| `fluent_premium` | Premium | ₩19,900 | 1,200회/월 | 60장/월 | premium |

```sql
-- 초기 데이터 삽입
INSERT INTO billing_plans (id, app, name, price_monthly_krw, features, sort_order, is_active) VALUES
('fluent_free', 'fluentdrama', 'Free', 0, 
  '{"conversation_limit_month": 30, "image_limit_month": 1, "tts_limit_month": 50, "model_tier": "basic"}', 0, true),
('fluent_starter', 'fluentdrama', 'Starter', 4900, 
  '{"conversation_limit_month": 300, "image_limit_month": 15, "tts_limit_month": 500, "model_tier": "basic"}', 1, true),
('fluent_pro', 'fluentdrama', 'Pro', 9900, 
  '{"conversation_limit_month": 600, "image_limit_month": 25, "tts_limit_month": 1000, "model_tier": "premium"}', 2, true),
('fluent_premium', 'fluentdrama', 'Premium', 19900, 
  '{"conversation_limit_month": 1200, "image_limit_month": 60, "tts_limit_month": 2000, "model_tier": "premium"}', 3, true);
```

### 1.3 user_subscriptions 테이블

```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  app: text("app").notNull().default("fluentdrama"),
  planId: text("plan_id").notNull(),
  
  // 상태: active, canceled, past_due, expired
  status: text("status").notNull().default("active"),
  
  // ⭐ PortOne 관련 (시행착오 반영)
  portoneSubscriptionId: text("portone_subscription_id"), // 결제 ID
  portoneScheduleId: text("portone_schedule_id"),         // 스케줄 ID (별도!)
  billingKeyId: text("billing_key_id"),                   // 빌링키
  
  // 구독 기간
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  
  // 해지 관리
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.4 user_usage 테이블

```typescript
export const userUsage = pgTable("user_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  usageKey: text("usage_key").notNull(),  // conversation_count, image_count, tts_count
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  usedInPeriod: integer("used_in_period").notNull().default(0),
  limitInPeriod: integer("limit_in_period").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

## [2] PortOne V2 연동 (빌링키 + 스케줄 관리)

### 2.1 환경 변수

```bash
# .env 추가
PORTONE_API_SECRET=your_portone_api_secret
PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_CHANNEL_KEY=channel-key-xxxxx        # KG이니시스 (카드)
PORTONE_KAKAOPAY_CHANNEL_KEY=channel-key-xxxxx  # 카카오페이
PORTONE_PAYPAL_CHANNEL_KEY=channel-key-xxxxx    # PayPal (선택)
PORTONE_WEBHOOK_SECRET=your_webhook_secret

# 이메일 알림
RESEND_API_KEY=re_xxxxx

# 관리자 계정 (1원 테스트 결제용)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### 2.2 ⚠️ 핵심: 정기결제 스케줄 관리

> **중요!** PortOne V2의 정기결제 스케줄은 **1회성**입니다.
> 매월 Webhook에서 **다음 달 스케줄을 새로 등록**해야 합니다!

```
1월 1일: 첫 결제 + 2월 스케줄 등록
    ↓
2월 1일: PortOne 스케줄 실행 → Webhook 수신 → 3월 스케줄 등록 (필수!)
    ↓
3월 1일: PortOne 스케줄 실행 → Webhook 수신 → 4월 스케줄 등록 (필수!)
    ↓
... 무한 반복
```

### 2.3 PortOne V2 API 엔드포인트 (정확한 정보)

| 기능 | HTTP 메서드 | 엔드포인트 |
|------|-----------|-----------|
| 빌링키로 결제 | `POST` | `/payments/{paymentId}/billing-key` |
| 스케줄 등록 | `POST` | `/payments/{paymentId}/schedule` |
| 스케줄 조회 | `GET` | `/payments/{paymentId}/schedule` |
| ⭐ 스케줄 취소 | `DELETE` | `/payment-schedules/{scheduleId}` |

> **주의:** 스케줄 취소는 `DELETE` 메서드입니다! (POST가 아님)

### 2.4 PortOne 서비스 (`server/services/portoneClient.ts`)

```typescript
class PortOneService {
  private apiUrl = 'https://api.portone.io';
  
  // 빌링키로 즉시 결제
  async createPayment(params: {
    paymentId: string;
    billingKey: string;
    orderName: string;
    amount: number;
    customer: { id: string; email: string };
  }) {
    const response = await fetch(`${this.apiUrl}/payments/${params.paymentId}/billing-key`, {
      method: 'POST',
      headers: {
        'Authorization': `PortOne ${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingKey: params.billingKey,
        orderName: params.orderName,
        amount: { total: params.amount },
        currency: 'KRW',
        customer: params.customer,
      }),
    });
    return response.json();
  }
  
  // ⭐ 다음 달 스케줄 등록 (Webhook에서 호출)
  async schedulePayment(params: {
    paymentId: string;
    billingKey: string;
    orderName: string;
    amount: number;
    scheduledAt: Date;
    customer: { id: string; email?: string };
  }) {
    const response = await fetch(`${this.apiUrl}/payments/${params.paymentId}/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `PortOne ${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          billingKey: params.billingKey,
          orderName: params.orderName,
          amount: { total: params.amount },
          currency: 'KRW',
          customer: params.customer,
        },
        timeToPay: params.scheduledAt.toISOString(),
      }),
    });
    const data = await response.json();
    return {
      scheduleId: data.schedule?.id || params.paymentId,
      ...data,
    };
  }
  
  // ⭐ 스케줄 취소 (DELETE 메서드!)
  async cancelSchedule(scheduleId: string) {
    const response = await fetch(`${this.apiUrl}/payment-schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `PortOne ${this.apiSecret}` },
    });
    if (!response.ok && response.status !== 404) {
      throw new Error('스케줄 취소 실패');
    }
  }
}
```

### 2.5 Webhook 핵심 로직 (다음 스케줄 등록)

```typescript
// ⭐ 결제 성공 시 다음 달 스케줄 등록 (필수!)
private async handlePaymentPaid(data: any): Promise<void> {
  const paymentId = data.paymentId;
  const subscription = await getSubscriptionByPaymentId(paymentId);
  
  if (!subscription || !subscription.currentPeriodEnd) return;
  
  // ⭐ 해지 예정인 구독은 갱신하지 않음!
  if (subscription.canceledAt) {
    console.log('[PortOne] Subscription canceled, not renewing');
    return;
  }
  
  const newPeriodEnd = new Date(subscription.currentPeriodEnd);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
  
  // 1. 구독 기간 연장
  await updateSubscription(subscription.id, {
    status: 'active',
    currentPeriodStart: subscription.currentPeriodEnd,
    currentPeriodEnd: newPeriodEnd,
  });
  
  // 2. ⭐ 다음 달 자동결제 스케줄 등록 (핵심!)
  if (subscription.billingKeyId) {
    const plan = await getBillingPlan(subscription.planId);
    if (plan && plan.priceMonthlyKrw > 0) {
      // 관리자는 1원 테스트
      const isTestPayment = isAdminEmail(user.email);
      const paymentAmount = isTestPayment ? 1 : plan.priceMonthlyKrw;
      
      const nextPaymentId = `payment_${subscription.id}_${Date.now()}`;
      const scheduleResult = await portoneService.schedulePayment({
        paymentId: nextPaymentId,
        billingKey: subscription.billingKeyId,
        orderName: `${plan.name} 월간 구독 (자동결제)`,
        amount: paymentAmount,
        scheduledAt: newPeriodEnd,
        customer: { id: subscription.userId, email: user.email },
      });
      
      // ⭐ 새 스케줄 ID 저장
      await updateSubscription(subscription.id, {
        portoneScheduleId: scheduleResult.scheduleId,
      });
    }
  }
}
```

### 2.6 결제 수단별 특이사항

| 결제 수단 | billingKeyMethod | 특이사항 |
|----------|------------------|---------|
| **카드 (KG이니시스)** | `'CARD'` | SMS 인증 (테스트 환경에서는 미발송) |
| **카카오페이** | `'EASY_PAY'` | ⭐ `windowType: { pc: 'IFRAME', mobile: 'REDIRECTION' }` 필수! |
| **PayPal** | `loadIssueBillingKeyUI` | 버튼 렌더링 방식, React DOM 충돌 주의 |

---

## [3] 구독 해지 워크플로우

### 3.1 해지 흐름 (기간 종료 시 해지)

```
사용자 "해지" 요청
    ↓
1. canceledAt = now() 설정 (status는 "active" 유지!)
2. PortOne 스케줄 취소 (DELETE 메서드)
3. 사용자에게 "X월 X일까지 사용 가능" 안내
    ↓
기간 종료 시
4. status = "expired"로 변경
5. 서비스 이용 불가
```

### 3.2 해지 처리 코드

```typescript
async cancelSubscription(subscriptionId: string, userEmail: string) {
  const subscription = await getSubscription(subscriptionId);
  
  if (!subscription) throw new Error('구독 없음');
  if (subscription.canceledAt) throw new Error('이미 해지 요청됨');
  
  // 1. 해지 예정 표시 (status는 active 유지!)
  await updateSubscription(subscriptionId, {
    canceledAt: new Date(),
  });
  
  // 2. ⭐ 다음 정기결제 스케줄 취소
  if (subscription.portoneScheduleId) {
    try {
      await portoneService.cancelSchedule(subscription.portoneScheduleId);
    } catch (error) {
      console.log('[PortOne] Schedule already processed');
    }
  }
  
  // 3. 해지 안내 이메일 발송
  await emailService.sendSubscriptionCanceled({
    to: userEmail,
    planName: subscription.planId,
    expiryDate: subscription.currentPeriodEnd,
  });
  
  return { success: true, cancelAtPeriodEnd: subscription.currentPeriodEnd };
}
```

---

## [4] OpenAI 모델 전략 개편

### 4.1 모델 구성 (`server/config/ai-models.ts`)

```typescript
export const AI_MODELS = {
  basic_tutor: {
    model: process.env.BASIC_TUTOR_MODEL || "gpt-4o-mini",
    maxTokens: 500,
    temperature: 0.7,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  premium_tutor: {
    model: process.env.PREMIUM_TUTOR_MODEL || "gpt-4o",
    maxTokens: 1000,
    temperature: 0.8,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  image_generator: {
    model: "dall-e-3",
    quality: "hd",
    costPerImage: 0.08,
  },
  tts: {
    model: "tts-1-hd",
    costPer1kChars: 0.03,
  },
};

export function getModelForTier(
  tier: "basic" | "premium", 
  useCase: "conversation" | "roleplay" | "explanation"
) {
  if (tier === "premium" && (useCase === "roleplay" || useCase === "explanation")) {
    return AI_MODELS.premium_tutor;
  }
  return AI_MODELS.basic_tutor;
}
```

---

## [5] 대화 세션 지속성 ("이어하기" 기능)

### 5.1 DB 스키마

```typescript
export const conversationSessions = pgTable("conversation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  title: text("title").default("새 대화"),
  targetLevel: text("target_level").default("beginner"),
  audience: text("audience"),
  
  characterId: text("character_id"),
  characterData: jsonb("character_data"),
  scenarioType: text("scenario_type"),
  scenarioContent: text("scenario_content"),
  
  status: text("status").default("active"),
  turnCount: integer("turn_count").default(0),
  
  summaryText: text("summary_text"),
  summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true }),
  
  // 비용 추적
  estimatedCost: text("estimated_cost").default("0"),
  totalInputTokens: integer("total_input_tokens").default(0),
  totalOutputTokens: integer("total_output_tokens").default(0),
  
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  
  role: text("role").notNull(),
  content: text("content").notNull(),
  contentLang: text("content_lang").default("ja"),
  
  translationKo: text("translation_ko"),
  feedbackKo: text("feedback_ko"),
  audioUrl: text("audio_url"),
  feedbackData: jsonb("feedback_data"),
  
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  estimatedCost: text("estimated_cost").default("0"),
  modelUsed: text("model_used"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 5.2 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/conversation/start` | 새 세션 시작 |
| `GET /api/conversation/sessions` | 내 세션 목록 |
| `GET /api/conversation/session/:id` | 세션 상세 + 최근 메시지 |
| `POST /api/conversation/continue` | 대화 이어가기 |
| `DELETE /api/conversation/session/:id` | 세션 삭제 |

---

## [6] PG사 심사 필수 페이지

> ⚠️ PG사 심사를 위해 **반드시** 아래 페이지들을 구현해야 합니다!

### 6.1 필수 페이지 목록

| 페이지 | URL | 내용 |
|--------|-----|------|
| 이용약관 | `/terms` | 서비스 이용 약관 |
| 개인정보처리방침 | `/privacy` | 개인정보 수집/이용 동의 |
| 환불정책 | `/refund` | 결제 취소/환불 규정 |
| 요금제 안내 | `/pricing` | 가격표, 결제 금액 명시 |

### 6.2 Footer 필수 정보

```tsx
<footer>
  <p>상호: FluentDrama | 대표: 홍길동</p>
  <p>사업자등록번호: 123-45-67890</p>
  <p>통신판매업신고: 제2024-서울강남-0000호</p>
  <p>주소: 서울특별시 강남구 테헤란로 123</p>
  <p>이메일: support@fluentdrama.com | 전화: 02-1234-5678</p>
  <a href="/terms">이용약관</a> | <a href="/privacy">개인정보처리방침</a> | <a href="/refund">환불정책</a>
</footer>
```

### 6.3 결제 전 동의 체크박스

```tsx
<label>
  <input type="checkbox" required />
  <a href="/terms">이용약관</a> 및 <a href="/privacy">개인정보처리방침</a>에 동의합니다.
</label>
```

---

## [7] 프론트엔드 UI

### 7.1 /pricing 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│                     💎 요금제 선택                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   FREE      │ │  STARTER    │ │    PRO      │ │  PREMIUM    ││
│  │   ₩0/월    │ │ ₩4,900/월  │ │ ⭐ ₩9,900  │ │₩19,900/월   ││
│  │ • 30회/월   │ │ • 300회/월  │ │ • 600회/월  │ │ • 1,200회/월││
│  │ • 1 이미지  │ │ • 15 이미지 │ │ • 25 이미지 │ │ • 60 이미지 ││
│  │ • 기본 AI   │ │ • 기본 AI   │ │ • 고급 AI   │ │ • 고급 AI   ││
│  │ [현재 플랜] │ │ [구독하기]  │ │ [구독하기]  │ │ [구독하기]  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 결제 수단 선택 UI

```tsx
<div className="grid grid-cols-3 gap-2">
  <button onClick={() => setPaymentMethod('card')}>💳 카드</button>
  <button onClick={() => setPaymentMethod('kakaopay')} 
          disabled={!portoneConfig?.kakaopayChannelKey}>
    🟡 카카오페이
  </button>
  <button onClick={() => setPaymentMethod('paypal')}
          disabled={!portoneConfig?.paypalChannelKey}>
    💙 PayPal
  </button>
</div>
```

### 7.3 /sessions 세션 목록 페이지

```
┌─────────────────────────────────────────────────────┐
│  📚 내 드라마 세션                    [+ 새 대화]   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ 🎭 카페에서 주문하기                          │  │
│  │ 유키(陽気) • 초급 • 12턴                      │  │
│  │ 마지막 대화: 2시간 전                         │  │
│  │                           [이어하기] [삭제]   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## [8] 구현 순서 (점진적 적용)

### Phase 1: DB 스키마 및 시드 데이터 (1시간)
- [ ] `billing_plans`, `user_subscriptions`, `user_usage` 테이블 추가
- [ ] `conversation_sessions`, `conversation_messages` 테이블 추가
- [ ] 초기 요금제 데이터 삽입
- [ ] `npm run db:push` 실행

### Phase 2: PortOne 연동 (2-3시간)
- [ ] `server/services/portoneClient.ts` 생성
- [ ] `server/config/admin.ts` (관리자 이메일 설정)
- [ ] `/api/billing/portone/config` (프론트용 설정)
- [ ] `/api/billing/subscribe` (빌링키로 구독 시작)
- [ ] `/api/billing/webhook` (Webhook 수신 + 다음 스케줄 등록)
- [ ] `/api/billing/cancel` (구독 해지)
- [ ] `/api/billing/my-subscription` (내 구독 정보)

### Phase 3: 모델 구조 + 사용량 관리 (1-2시간)
- [ ] `server/config/ai-models.ts` 생성
- [ ] 사용량 체크 미들웨어 구현
- [ ] 기존 API에 미들웨어 적용
- [ ] 모델 티어 분기 로직 추가

### Phase 4: 대화 세션 API (2시간)
- [ ] `/api/conversation/start` 구현
- [ ] `/api/conversation/sessions` 구현
- [ ] `/api/conversation/continue` 구현
- [ ] 대화 컨텍스트 관리 (30턴 초과 시 요약)

### Phase 5: 프론트엔드 UI (3시간)
- [ ] PortOne SDK 로드 (`<script src="https://cdn.portone.io/v2/browser-sdk.js">`)
- [ ] `/pricing` 페이지 생성
- [ ] 결제 수단 선택 + 빌링키 발급 구현
- [ ] `/sessions` 페이지 생성
- [ ] 마이페이지 사용량 표시

### Phase 6: PG사 심사 페이지 (1시간)
- [ ] `/terms` 이용약관 페이지
- [ ] `/privacy` 개인정보처리방침 페이지
- [ ] `/refund` 환불정책 페이지
- [ ] Footer에 사업자 정보 추가

---

## [9] 자주 발생하는 에러 (시행착오 정리)

| 에러 | 원인 | 해결 |
|------|------|------|
| "알려지지 않은 credential" | 채널 키 불일치 | PortOne 콘솔에서 채널 키 확인 |
| 카카오페이 windowType 에러 | windowType 미설정 | `{ pc: 'IFRAME', mobile: 'REDIRECTION' }` 필수 |
| 스케줄 취소 실패 (405) | POST 메서드 사용 | ⭐ `DELETE` 메서드 사용! |
| 2개월 후 자동결제 중단 | Webhook에서 다음 스케줄 미등록 | `handlePaymentPaid`에서 스케줄 등록 |
| 해지 후에도 자동결제 발생 | `canceledAt` 체크 누락 | Webhook에서 `if (subscription.canceledAt) return;` |
| PayPal DOM 충돌 | React가 PayPal DOM 관리 | 수동 DOM 관리 필요 |

---

## [10] 테스트 체크리스트

### 기존 기능 보존
- [ ] 로그인/회원가입 작동 확인
- [ ] 캐릭터 생성 → 학습 흐름 확인
- [ ] 기존 대화 생성 정상 작동
- [ ] TTS 재생 정상 작동

### 결제 테스트
- [ ] 카드 빌링키 발급 테스트
- [ ] 카카오페이 빌링키 발급 테스트 (windowType 확인)
- [ ] 구독 시작 테스트
- [ ] Webhook 수신 확인
- [ ] 다음 스케줄 등록 확인
- [ ] 구독 해지 테스트
- [ ] 스케줄 취소 확인
- [ ] 관리자 1원 결제 테스트

### 사용량 테스트
- [ ] Free 플랜 한도 적용 확인
- [ ] 한도 초과 시 402 에러 확인
- [ ] Pro/Premium 모델 분기 확인

---

*문서 작성: AI Architect*
*참조: VidDigest Hub 시행착오 가이드*
*버전: 2.1 | 최종 업데이트: 2025-11-28*
