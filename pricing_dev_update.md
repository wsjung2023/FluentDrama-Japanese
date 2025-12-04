# FluentDrama-Japanese 개발 업데이트 문서
## 버전: 3.0 | 작성일: 2025-12-04
## 참조: VidDigest Hub 시행착오 가이드 v2 기반

---

## 📋 개요

이 문서는 다음 핵심 기능 추가를 위한 개발 계획입니다:
1. **요금제 시스템** - 4단계 구독 플랜 (Free → Starter → Pro → Premium)
2. **PortOne V2 결제 연동** - 빌링키 기반 정기 구독 (스케줄 관리 포함)
3. **⚠️ 구독 해지 vs 환불 분리** - 핵심 개념! (섹션 5)
4. **환불 정책** - 한국 전자상거래법 준수 (섹션 6)
5. **업그레이드 시 자동 환불** - 유료→유료 업그레이드 처리 (섹션 7)
6. **OpenAI 모델 이중 구조** - 기본(gpt-4o-mini) / 프리미엄(gpt-4o)
7. **대화 세션 지속성** - "이어하기" 기능
8. **PG사 심사 필수 페이지** - 이용약관, 개인정보처리방침, 환불정책

---

## [1] 데이터베이스 스키마

### 1.1 billing_plans 테이블

```typescript
export const billingPlans = pgTable("billing_plans", {
  id: text("id").primaryKey(),
  app: text("app").notNull().default("fluentdrama"),
  name: text("name").notNull(),
  priceMonthlyKrw: integer("price_monthly_krw").notNull().default(0),
  priceMonthlyUsd: text("price_monthly_usd"),  // PayPal용
  features: jsonb("features").$type<{
    conversation_limit_month: number;
    image_limit_month: number;
    tts_limit_month: number;
    model_tier: "basic" | "premium";
  }>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.2 user_subscriptions 테이블

```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  app: text("app").notNull().default("fluentdrama"),
  planId: text("plan_id").notNull(),
  
  // 상태: active, cancelled, past_due, expired
  status: text("status").notNull().default("active"),
  
  // ⭐ PortOne 관련 (필드 분리 필수!)
  portoneSubscriptionId: text("portone_subscription_id"), // 결제 ID
  portoneScheduleId: text("portone_schedule_id"),         // 스케줄 ID (별도!)
  billingKeyId: text("billing_key_id"),
  paymentMethod: text("payment_method"),  // 'card' | 'kakaopay' | 'paypal'
  
  // 구독 기간
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  
  // ⭐ 해지 관리 (canceledAt만 설정, status는 active 유지!)
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.3 payment_transactions 테이블 (신규)

```typescript
export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull(),
  portonePaymentId: text("portone_payment_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("KRW"),
  status: text("status").notNull(),  // 'paid' | 'refunded' | 'failed'
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.4 refund_requests 테이블 (신규)

```typescript
export const refundRequests = pgTable("refund_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull(),
  userId: text("user_id").notNull(),
  reason: text("reason").notNull(),
  refundAmount: integer("refund_amount"),
  status: text("status").notNull().default("pending"),  // 'pending' | 'approved' | 'rejected'
  adminNote: text("admin_note"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.5 user_usage 테이블

```typescript
export const userUsage = pgTable("user_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  usageKey: text("usage_key").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  usedInPeriod: integer("used_in_period").notNull().default(0),
  limitInPeriod: integer("limit_in_period").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.6 초기 요금제 데이터

```sql
INSERT INTO billing_plans (id, app, name, price_monthly_krw, price_monthly_usd, features, sort_order) VALUES
('fluent_free', 'fluentdrama', 'Free', 0, '0', 
  '{"conversation_limit_month": 30, "image_limit_month": 1, "tts_limit_month": 50, "model_tier": "basic"}', 0),
('fluent_starter', 'fluentdrama', 'Starter', 4900, '3.30', 
  '{"conversation_limit_month": 300, "image_limit_month": 15, "tts_limit_month": 500, "model_tier": "basic"}', 1),
('fluent_pro', 'fluentdrama', 'Pro', 9900, '6.60', 
  '{"conversation_limit_month": 600, "image_limit_month": 25, "tts_limit_month": 1000, "model_tier": "premium"}', 2),
('fluent_premium', 'fluentdrama', 'Premium', 19900, '13.00', 
  '{"conversation_limit_month": 1200, "image_limit_month": 60, "tts_limit_month": 2000, "model_tier": "premium"}', 3);
```

---

## [2] 환경 변수

```bash
# PortOne 필수
PORTONE_API_SECRET=your_portone_api_secret
PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 결제 채널별 키
PORTONE_CHANNEL_KEY=channel-key-xxxxx        # KG이니시스 (카드)
PORTONE_KAKAOPAY_CHANNEL_KEY=channel-key-xxxxx  # 카카오페이
PORTONE_PAYPAL_CHANNEL_KEY=channel-key-xxxxx    # PayPal (선택)

# Webhook 검증
PORTONE_WEBHOOK_SECRET=your_webhook_secret

# 이메일 알림
RESEND_API_KEY=re_xxxxx

# 관리자 계정 (1원 테스트 결제용)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

---

## [3] PortOne V2 API 엔드포인트

> ⚠️ **주의:** PortOne V2 문서가 혼란스럽습니다. 아래가 **실제 동작하는** 엔드포인트입니다.

| 기능 | HTTP 메서드 | 엔드포인트 |
|------|-----------|-----------|
| 빌링키로 결제 | `POST` | `/payments/{paymentId}/billing-key` |
| 스케줄 등록 | `POST` | `/payments/{paymentId}/schedule` |
| 스케줄 조회 | `GET` | `/payments/{paymentId}/schedule` |
| ⭐ 스케줄 취소 | `DELETE` | `/payment-schedules/{scheduleId}` |
| 결제 취소 (환불) | `POST` | `/payments/{paymentId}/cancel` |

---

## [4] 정기결제 스케줄 관리 (핵심!)

> ⚠️ **이 섹션은 매우 중요합니다!** 이 부분을 잘못 구현하면 2개월 후부터 자동결제가 안 됩니다.

### 4.1 PortOne V2 스케줄 동작 원리

**핵심 개념:** PortOne V2의 정기결제 스케줄은 **1회성**입니다.

```
1월 1일: 첫 결제 + 2월 스케줄 등록
    ↓
2월 1일: PortOne이 스케줄 실행 → Webhook 수신 → 3월 스케줄 등록 (필수!)
    ↓
3월 1일: PortOne이 스케줄 실행 → Webhook 수신 → 4월 스케줄 등록 (필수!)
    ↓
... 무한 반복
```

### 4.2 Webhook에서 다음 스케줄 등록 (필수!)

```typescript
private async handlePaymentPaid(data: any): Promise<void> {
  const subscription = await billingService.getSubscriptionById(subscriptionId);
  
  // 1. ⭐ 해지 요청된 구독인지 확인
  if (subscription.canceledAt) {
    console.log('[Webhook] Subscription is canceled, not scheduling next payment');
    return;  // 다음 스케줄 등록 안함 → 이번이 마지막 결제
  }
  
  // 2. 구독 기간 갱신
  const nextPeriodEnd = new Date();
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
  
  // 3. ⭐ 다음 달 결제 스케줄 등록 (핵심!)
  const nextScheduleId = `payment_${subscriptionId}_${Date.now()}`;
  await portoneService.schedulePayment({
    paymentId: nextScheduleId,
    billingKey: subscription.billingKeyId,
    orderName: `${planName} 정기결제`,
    amount: plan.priceMonthlyKrw,
    scheduledAt: nextPeriodEnd,
    customer: { id: subscription.userId, email: userEmail },
  });
  
  // 4. ⭐ 새 스케줄 ID 저장!
  await billingService.updateSubscription(subscriptionId, {
    currentPeriodEnd: nextPeriodEnd,
    portoneScheduleId: nextScheduleId,
    status: 'active',
  });
}
```

---

## [5] 구독 해지 vs 환불 - 핵심 개념 분리 (CRITICAL!)

> ⚠️ **이 섹션이 가장 중요합니다!** 구독 해지와 환불을 혼동하면 심각한 버그가 발생합니다.

### 5.1 개념 비교표

| 기능 | 구독 해지 (Cancel) | 환불 (Refund) |
|------|-------------------|---------------|
| **트리거** | 사용자가 "구독 해지" 버튼 클릭 | 관리자가 환불 요청 승인 |
| **결제 취소** | ❌ 안함 (이미 결제된 금액 유지) | ✅ 실제 결제 취소 |
| **현재 플랜** | ✅ 유지 (currentPeriodEnd까지) | ❌ 즉시 Free 전환 |
| **사용량 한도** | ✅ 유지 | Free 플랜 한도로 변경 |
| **다음 결제** | ❌ 중단 (스케줄 취소) | ❌ 중단 |
| **DB 변경** | `canceledAt` 설정만 | `status='cancelled'`, `planId='free'` |

### 5.2 핵심 함수 역할 분리

#### portoneService.cancelSubscription() - 구독 해지용
```typescript
// 역할: 다음 자동결제 중단 + canceledAt 설정
// 현재 플랜은 유지함!
async cancelSubscription(subscriptionId: string, userEmail?: string) {
  // 1. canceledAt만 설정 (status, planId 변경 안함!)
  await db.update(userSubscriptions)
    .set({ canceledAt: new Date() })
    .where(eq(userSubscriptions.id, subscriptionId));
  
  // 2. 예정된 다음 결제 스케줄 취소
  if (subscription.portoneScheduleId) {
    await this.cancelSchedule(subscription.portoneScheduleId);
  }
  
  // 3. 해지 예정 이메일 발송
  await emailService.sendSubscriptionCanceled({...});
}
```

#### billingService.cancelSubscription() - 환불 승인용
```typescript
// 역할: 즉시 Free 플랜 전환 + 사용량 한도 업데이트
// 환불 승인 시에만 호출!
async cancelSubscription(subscriptionId: string) {
  // 1. 구독을 Free 플랜으로 변경
  await db.update(userSubscriptions)
    .set({ 
      status: 'cancelled',
      planId: 'fluent_free',
      canceledAt: new Date()
    })
    .where(eq(userSubscriptions.id, subscriptionId));
  
  // 2. 사용량 한도를 Free 플랜 기준으로 업데이트
  const freePlan = await this.getPlanById('fluent_free');
  await this.updateUserUsageLimits(userId, freePlan);
}
```

### 5.3 함수 호출 시점 정리

| 상황 | portoneService.cancelSubscription | billingService.cancelSubscription |
|------|-----------------------------------|-----------------------------------|
| 구독 해지 버튼 클릭 | ✅ 호출 | ❌ 호출 안함 |
| 환불 요청 승인 | - | ✅ 호출 |
| currentPeriodEnd 도달 시 | - | ✅ 호출 |

### 5.4 API 라우트 구현

```typescript
// ✅ 구독 해지 (다음 결제 중단, 현재 플랜 유지!)
router.post('/cancel', authMiddleware, async (req, res) => {
  const subscription = await billingService.getUserSubscription(req.user.id);
  
  // canceledAt만 설정, 플랜은 유지!
  await portoneService.cancelSubscription(subscription.id, req.user.email);
  
  res.json({ 
    message: `구독 해지가 예약되었습니다. ${subscription.currentPeriodEnd}까지 현재 플랜을 이용하실 수 있습니다.`
  });
});

// ✅ 환불 요청
router.post('/refund-request', authMiddleware, async (req, res) => {
  const { reason } = req.body;
  const result = await billingService.createRefundRequest(req.user.id, reason);
  res.json(result);
});

// ✅ 관리자: 환불 승인 (이때만 Free 플랜 전환!)
router.post('/admin/refunds/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { adminNote, refundAmount } = req.body;
  
  // 1. PortOne API로 실제 결제 취소
  const refundRequest = await storage.getRefundRequest(id);
  const payment = await storage.getPaymentTransactionBySubscriptionId(refundRequest.subscriptionId);
  await portoneService.cancelPayment(payment.portonePaymentId, adminNote || 'Admin approved refund');
  
  // 2. 이때만 Free 플랜 전환!
  await billingService.cancelSubscription(refundRequest.subscriptionId);
  
  // 3. 환불 요청 상태 업데이트
  await storage.updateRefundRequest(id, { status: 'approved', adminNote, processedAt: new Date() });
  
  res.json({ success: true });
});
```

---

## [6] 환불 정책 (한국 전자상거래법 준수)

### 6.1 환불 정책 규칙

| 조건 | 환불율 | 비고 |
|------|--------|------|
| 결제 후 7일 이내 + 미사용 | 100% | 청약철회 기간 |
| 결제 후 7일 이내 + 일부 사용 | 일할 계산 | 사용일수 차감 |
| 결제 후 7일 초과 | 일할 계산 | 잔여 기간 기준 |
| PayPal 결제 | 환불액 - 3% | PayPal 수수료 |

### 6.2 환불 계산 함수

```typescript
async calculateRefundAmount(subscriptionId: string) {
  const subscription = await this.getSubscriptionById(subscriptionId);
  const payment = await storage.getPaymentTransactionBySubscriptionId(subscriptionId);
  
  const now = new Date();
  const paymentDate = new Date(payment.createdAt);
  const periodEnd = new Date(subscription.currentPeriodEnd);
  
  const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor((periodEnd - paymentDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - daysSincePayment);
  
  // 7일 이내 전액 환불 (청약철회)
  if (daysSincePayment <= 7) {
    return { refundAmount: payment.amount, refundType: 'full', reason: '청약철회 (7일 이내)' };
  }
  
  // 일할 계산
  const dailyRate = payment.amount / totalDays;
  const refundAmount = Math.floor(dailyRate * remainingDays);
  
  return { refundAmount, refundType: 'partial', reason: `일할 계산: ${remainingDays}일 잔여` };
}
```

### 6.3 악용 방지 정책

```typescript
// 환불 시 사용량은 유지 (Free 한도 적용)
// 결제 → 사용 → 환불 → 리셋 악용 방지
async cancelSubscription(subscriptionId: string) {
  // 플랜은 Free로 전환
  await db.update(userSubscriptions).set({ planId: 'fluent_free' });
  
  // 사용량 한도만 Free로 변경 (사용량 자체는 유지!)
  await db.update(userUsage).set({ 
    limitInPeriod: freePlan.features.conversation_limit_month 
  });
  // usedInPeriod는 리셋 안함!
}
```

---

## [7] 업그레이드 시 자동 환불 로직

### 7.1 문제 상황
- 사용자가 Starter(₩4,900) 결제 → 바로 Pro(₩9,900)로 업그레이드
- Starter 결제금이 플랫폼에 귀속되면 안됨 → 자동 환불 필요

### 7.2 구현

```typescript
async createSubscription(params) {
  // 1. 기존 구독 확인
  const existingSubscription = await this.getUserSubscription(params.userId);
  let upgradeRefundResult = null;
  
  // 2. 유료 → 유료 업그레이드인 경우 기존 결제 환불
  if (existingSubscription && !existingSubscription.planId.includes('free')) {
    const lastPayment = await storage.getPaymentTransactionBySubscriptionId(
      existingSubscription.id
    );
    
    if (lastPayment && lastPayment.status !== 'refunded') {
      try {
        // PortOne API로 환불
        await portoneService.cancelPayment(
          lastPayment.portonePaymentId,
          `업그레이드로 인한 자동 환불: ${existingSubscription.planId} → ${params.planId}`
        );
        
        // PayPal 수수료 로깅
        if (lastPayment.paymentMethod === 'paypal') {
          const fee = lastPayment.amount * 0.03;
          console.log(`[Billing] PayPal refund fee: ${fee} USD`);
        }
        
        upgradeRefundResult = { success: true, refundedAmount: lastPayment.amount };
      } catch (error) {
        upgradeRefundResult = { success: false, error: error.message };
        // 환불 실패해도 업그레이드는 진행 (로깅 후 수동 처리)
      }
    }
  }
  
  // 3. 새 구독 생성
  const newSubscription = await this.processNewSubscription(params);
  
  return { ...newSubscription, upgradeRefundResult };
}
```

---

## [8] 결제 수단별 특이사항

| 결제 수단 | billingKeyMethod | 특이사항 |
|----------|------------------|---------|
| **카드 (KG이니시스)** | `'CARD'` | SMS 인증 (테스트 환경에서는 미발송) |
| **카카오페이** | `'EASY_PAY'` | ⭐ `windowType: { pc: 'IFRAME', mobile: 'REDIRECTION' }` 필수! |
| **PayPal** | `loadIssueBillingKeyUI` | 버튼 렌더링 방식, React DOM 충돌 주의, 환불 시 3% 수수료 |

---

## [9] 대화 세션 지속성 ("이어하기" 기능)

### 9.1 DB 스키마

```typescript
export const conversationSessions = pgTable("conversation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  title: text("title").default("새 대화"),
  targetLevel: text("target_level").default("beginner"),
  
  characterId: text("character_id"),
  characterData: jsonb("character_data"),
  scenarioType: text("scenario_type"),
  scenarioContent: text("scenario_content"),
  
  status: text("status").default("active"),
  turnCount: integer("turn_count").default(0),
  
  summaryText: text("summary_text"),
  
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
  
  modelUsed: text("model_used"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

## [10] PG사 심사 필수 페이지

### 10.1 필수 페이지 목록

| 페이지 | URL | 내용 |
|--------|-----|------|
| 이용약관 | `/terms` | 서비스 이용 약관 |
| 개인정보처리방침 | `/privacy` | 개인정보 수집/이용 동의 |
| 환불정책 | `/refund` | 결제 취소/환불 규정 |
| 요금제 안내 | `/pricing` | 가격표, 결제 금액 명시 |

### 10.2 Footer 필수 정보

```tsx
<footer className="text-sm text-gray-600">
  <p>상호명: FluentDrama | 대표: [대표자명]</p>
  <p>사업자등록번호: 000-00-00000</p>
  <p>통신판매업신고: 제0000-서울XX-0000호</p>
  <p>주소: [사업장 주소]</p>
  <p>이메일: support@fluentdrama.com | 전화: 02-0000-0000</p>
  <a href="/terms">이용약관</a> | <a href="/privacy">개인정보처리방침</a> | <a href="/refund">환불정책</a>
</footer>
```

### 10.3 결제 전 동의 체크박스

```tsx
<label className="flex items-center gap-2">
  <Checkbox checked={agreedToTerms} onCheckedChange={setAgreedToTerms} required />
  <span>[필수] 이용약관 및 결제에 동의합니다</span>
</label>

<label className="flex items-center gap-2">
  <Checkbox checked={agreedToRefund} onCheckedChange={setAgreedToRefund} required />
  <span>[필수] 환불정책을 확인하였습니다</span>
</label>
```

---

## [11] 일반적인 실수와 해결책

### 11.1 portoneSubscriptionId vs 내부 DB ID 혼동

```typescript
// ❌ 잘못된 예 - 외부 ID로 DB 조회
await db.select().from(userSubscriptions)
  .where(eq(userSubscriptions.id, portoneSubscriptionId));  // 에러!

// ✅ 올바른 예 - 내부 DB ID로 조회
await db.select().from(userSubscriptions)
  .where(eq(userSubscriptions.id, internalSubscriptionId));

// 또는 외부 ID로 조회하려면
await db.select().from(userSubscriptions)
  .where(eq(userSubscriptions.portoneSubscriptionId, portoneSubscriptionId));
```

### 11.2 status 문자열 불일치

```typescript
// ❌ 문제: 'canceled' vs 'cancelled' 혼용

// ✅ 해결: 프로젝트 전체에서 'cancelled' 통일
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',  // 'canceled' 아님!
  PAST_DUE: 'past_due',
  PENDING: 'pending'
} as const;
```

### 11.3 구독 해지 후 UI 미반영

```typescript
// 원인: React Query 캐시 무효화 안함

// ✅ 해결: 캐시 무효화 필수
const cancelMutation = useMutation({
  mutationFn: async () => {
    await apiRequest('POST', '/api/billing/cancel');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
    queryClient.invalidateQueries({ queryKey: ['/api/billing/quota'] });
    toast.success('구독이 해지되었습니다');
  }
});
```

### 11.4 구독 해지 시 즉시 Free 플랜 전환 버그

```typescript
// ❌ 원인: 구독 해지 API에서 billingService.cancelSubscription() 호출

// ✅ 해결: 구독 해지 시에는 portoneService.cancelSubscription()만 호출
// billingService.cancelSubscription()는 환불 승인 시에만!
```

---

## [12] 개발 대원칙

| 원칙 | 설명 | 위반 시 조치 |
|------|------|-------------|
| **🚫 하드코딩 금지** | 모든 마스터 데이터는 DB 테이블로 관리 | 코드 리뷰 거부 |
| **🛡️ 기존 기능 보존** | 정상 작동 중인 기능 절대 삭제/변경 금지 | 롤백 후 재작업 |
| **📦 추가 전용 개발** | 새 기능은 기존 코드 수정 없이 추가 방식으로 | 별도 파일/함수로 분리 |
| **🔧 관리자 UI 필수** | 설정값은 반드시 관리자 화면에서 변경 가능하게 | DB + Admin API 필수 |

---

## [13] 구현 순서 (점진적 적용)

### Phase 1: DB 스키마 (1시간)
- [ ] `billing_plans`, `user_subscriptions`, `user_usage` 테이블 추가
- [ ] `payment_transactions`, `refund_requests` 테이블 추가
- [ ] `conversation_sessions`, `conversation_messages` 테이블 추가
- [ ] 초기 요금제 데이터 삽입
- [ ] `npm run db:push` 실행

### Phase 2: PortOne 연동 (2-3시간)
- [ ] `server/services/portoneClient.ts` 생성
- [ ] `server/config/admin.ts` (관리자 이메일 설정)
- [ ] `/api/billing/portone/config` (프론트용 설정)
- [ ] `/api/billing/subscribe` (빌링키로 구독 시작)
- [ ] `/api/billing/webhook` (Webhook 수신 + 다음 스케줄 등록)
- [ ] `/api/billing/cancel` (구독 해지 - canceledAt만!)
- [ ] `/api/billing/refund-request` (환불 요청)
- [ ] `/api/billing/admin/refunds/:id/approve` (환불 승인 - Free 전환)

### Phase 3: 프론트엔드 UI (3시간)
- [ ] PortOne SDK 로드
- [ ] `/pricing` 페이지 생성
- [ ] 결제 수단 선택 + 빌링키 발급 구현
- [ ] 결제 전 동의 체크박스
- [ ] 캐시 무효화 처리

### Phase 4: PG사 심사 페이지 (1시간)
- [ ] `/terms` 이용약관 페이지
- [ ] `/privacy` 개인정보처리방침 페이지
- [ ] `/refund` 환불정책 페이지
- [ ] Footer에 사업자 정보 추가

---

## [14] 테스트 체크리스트

### 결제 테스트
- [ ] 카드 빌링키 발급 테스트
- [ ] 카카오페이 빌링키 발급 테스트 (windowType 확인)
- [ ] 구독 시작 테스트
- [ ] Webhook 수신 확인
- [ ] 다음 스케줄 등록 확인
- [ ] 관리자 1원 결제 테스트

### 해지/환불 테스트 (중요!)
- [ ] 구독 해지 시 플랜 유지 확인
- [ ] 구독 해지 시 canceledAt 설정 확인
- [ ] 구독 해지 시 스케줄 취소 확인
- [ ] 환불 승인 시 Free 플랜 전환 확인
- [ ] 업그레이드 시 자동 환불 확인
- [ ] PayPal 환불 3% 수수료 로깅 확인

### 기존 기능 보존
- [ ] 로그인/회원가입 작동 확인
- [ ] 캐릭터 생성 → 학습 흐름 확인
- [ ] 기존 대화 생성 정상 작동
- [ ] TTS 재생 정상 작동

---

## 부록: 자주 발생하는 에러

| # | 에러 | 원인 | 해결 |
|---|------|------|------|
| 1 | 스케줄 취소 실패 (405) | POST 메서드 사용 | `DELETE` 메서드 사용! |
| 2 | 2개월 후 자동결제 중단 | Webhook에서 다음 스케줄 미등록 | `handlePaymentPaid`에서 스케줄 등록 |
| 3 | 해지 후에도 자동결제 발생 | `canceledAt` 체크 누락 | `if (subscription.canceledAt) return;` |
| 4 | 구독 해지 시 즉시 Free 전환 | `billingService.cancelSubscription()` 호출 | 환불 승인 시에만 호출! |
| 5 | 카카오페이 windowType 에러 | windowType 미설정 | `{ pc: 'IFRAME', mobile: 'REDIRECTION' }` |
| 6 | PayPal 환불 시 수수료 미처리 | 3% 수수료 미적용 | 환불 로직에서 PayPal 체크 후 수수료 계산 |
| 7 | status 불일치 | 'canceled' vs 'cancelled' 혼용 | 프로젝트 전체 'cancelled' 통일 |

---

*문서 작성: AI Architect*
*참조: VidDigest Hub 시행착오 가이드 v2*
*버전: 3.0 | 최종 업데이트: 2025-12-04*
