# FluentDrama-Japanese 개발 업데이트 문서
## 버전: 2.0 | 작성일: 2025-11-28

---

## 📋 개요

이 문서는 다음 핵심 기능 추가를 위한 개발 계획입니다:
1. **요금제 시스템** - 4단계 구독 플랜 (Free → Starter → Pro → Premium)
2. **PortOne 결제 연동** - V2 API 기반 정기 구독
3. **OpenAI 모델 이중 구조** - 기본(gpt-4o-mini) / 프리미엄(gpt-5-mini)
4. **대화 세션 지속성** - "이어하기" 기능
5. **비용/토큰 추적** - 크레딧 시스템 준비

---

## [1] 요금제 / 한도 정의

### 1.1 billing_plans 테이블 구조

```typescript
// shared/schema.ts 추가

export const billingPlans = pgTable("billing_plans", {
  id: varchar("id").primaryKey(), // fluent_free, fluent_starter 등
  app: varchar("app").notNull().default("fluentdrama"),
  name: varchar("name").notNull(),
  priceMonthlyKrw: varchar("price_monthly_krw").notNull().default("0"),
  type: varchar("type").notNull().default("subscription"), // subscription, one-time
  features: jsonb("features").$type<{
    conversation_limit_month: number;
    image_limit_month: number;
    model_tier: "basic" | "premium";
    tts_limit_month?: number;
    priority_support?: boolean;
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 1.2 사전 정의 플랜 데이터

| Plan ID | Name | 월 가격 | 대화 한도 | 이미지 한도 | 모델 티어 |
|---------|------|---------|----------|------------|----------|
| `fluent_free` | Free | ₩0 | 30회/월 | 1장/월 | basic (gpt-4o-mini) |
| `fluent_starter` | Starter | ₩4,900 | 300회/월 | 15장/월 | basic |
| `fluent_pro` | Pro | ₩9,900 | 600회/월 | 25장/월 | premium (gpt-5-mini) |
| `fluent_premium` | Premium | ₩19,900 | 1,200회/월 | 60장/월 | premium |

### 1.3 user_subscriptions 테이블

```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => billingPlans.id).notNull(),
  
  // 상태
  status: varchar("status").notNull().default("pending"), 
  // pending, active, canceled, failed, expired
  
  // PortOne 관련
  portoneCustomerUid: varchar("portone_customer_uid"),
  merchantUid: varchar("merchant_uid"), // 내부 주문 ID
  paymentId: varchar("payment_id"), // PortOne payment ID
  
  // 구독 기간
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  // 취소 관련
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 1.4 user_usage 테이블

```typescript
export const userUsage = pgTable("user_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  usageKey: varchar("usage_key").notNull(), // conversation_count, image_count, tts_count
  usedInPeriod: varchar("used_in_period").notNull().default("0"),
  limitInPeriod: varchar("limit_in_period").notNull().default("0"),
  
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## [2] PortOne V2 연동 (정기 구독)

### 2.1 환경 변수

```bash
# .env 추가
PORTONE_API_SECRET=        # V2 API Secret
PORTONE_MERCHANT_ID=       # 상점 ID
PORTONE_STORE_ID=          # 스토어 ID
PORTONE_WEBHOOK_SECRET=    # 웹훅 검증용 시크릿
PORTONE_IS_SANDBOX=true    # 테스트 환경 여부
```

### 2.2 PortOne 클라이언트 (`server/services/portoneClient.ts`)

```typescript
// PortOne V2 API 클라이언트

const PORTONE_API_BASE = "https://api.portone.io";

interface PortOneConfig {
  apiSecret: string;
  merchantId: string;
  storeId: string;
  isSandbox: boolean;
}

export class PortOneClient {
  private config: PortOneConfig;
  
  constructor() {
    this.config = {
      apiSecret: process.env.PORTONE_API_SECRET || "",
      merchantId: process.env.PORTONE_MERCHANT_ID || "",
      storeId: process.env.PORTONE_STORE_ID || "",
      isSandbox: process.env.PORTONE_IS_SANDBOX === "true",
    };
  }
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${PORTONE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `PortOne ${this.config.apiSecret}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  }
  
  // 정기결제 빌링키 발급 요청
  async createBillingKeyRequest(params: {
    customerId: string;
    customerEmail: string;
    customerName: string;
    planId: string;
    returnUrl: string;
  }) {
    // PortOne V2 빌링키 발급 API
    return this.request("/billing-keys", {
      method: "POST",
      body: JSON.stringify({
        storeId: this.config.storeId,
        channelKey: "your-channel-key", // 설정 필요
        customer: {
          id: params.customerId,
          email: params.customerEmail,
          name: params.customerName,
        },
        customData: { planId: params.planId },
        redirectUrl: params.returnUrl,
      }),
    });
  }
  
  // 빌링키로 결제 요청
  async payWithBillingKey(params: {
    billingKey: string;
    merchantUid: string;
    amount: number;
    orderName: string;
  }) {
    return this.request("/payments/billing-key", {
      method: "POST",
      body: JSON.stringify({
        storeId: this.config.storeId,
        billingKey: params.billingKey,
        paymentId: params.merchantUid,
        orderName: params.orderName,
        amount: { total: params.amount },
        currency: "KRW",
      }),
    });
  }
  
  // 결제 조회
  async getPayment(paymentId: string) {
    return this.request(`/payments/${paymentId}`);
  }
  
  // 웹훅 검증
  verifyWebhook(payload: string, signature: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.PORTONE_WEBHOOK_SECRET || "")
      .update(payload)
      .digest("hex");
    return signature === expectedSignature;
  }
}

export const portoneClient = new PortOneClient();
```

### 2.3 API 엔드포인트

#### POST /api/billing/create-checkout-session
```typescript
// 구독 결제 세션 생성
Request: { planId: string }
Response: { 
  redirectUrl: string,      // 결제 페이지 URL
  merchantUid: string,      // 내부 주문 ID
  subscriptionId: string    // user_subscriptions.id
}
```

#### POST /api/billing/portone-webhook
```typescript
// PortOne 웹훅 수신
// 1. 시그니처 검증
// 2. 결제 결과 조회
// 3. user_subscriptions 상태 업데이트
// 4. user_usage 한도 초기화
```

#### POST /api/billing/cancel-subscription
```typescript
// 구독 취소
Request: { subscriptionId: string, reason?: string }
Response: { success: boolean, canceledAt: string }
```

#### GET /api/billing/my-subscription
```typescript
// 현재 구독 정보 조회
Response: {
  plan: BillingPlan,
  subscription: UserSubscription | null,
  usage: {
    conversation: { used: number, limit: number },
    image: { used: number, limit: number }
  }
}
```

---

## [3] OpenAI 모델 전략 개편

### 3.1 모델 구성 객체 (`server/config/ai-models.ts`)

```typescript
export const AI_MODELS = {
  // 기본 튜터: 일상 회화, 간단한 문법 설명
  basic_tutor: {
    model: process.env.BASIC_TUTOR_MODEL || "gpt-4o-mini",
    maxTokens: 500,
    temperature: 0.7,
    costPer1kInput: 0.00015,   // $0.15/1M input
    costPer1kOutput: 0.0006,   // $0.60/1M output
  },
  
  // 프리미엄 튜터: 롤플레이, 스토리텔링, 긴 답변
  premium_tutor: {
    model: process.env.PREMIUM_TUTOR_MODEL || "gpt-4o",  // 추후 gpt-5-mini로 업그레이드
    maxTokens: 1000,
    temperature: 0.8,
    costPer1kInput: 0.0025,    // $2.50/1M input
    costPer1kOutput: 0.01,     // $10/1M output
  },
  
  // 이미지 생성
  image_generator: {
    model: "dall-e-3",
    quality: "hd",
    size: "1024x1792",
    costPerImage: 0.08,
  },
  
  // TTS 음성
  tts: {
    model: "tts-1-hd",
    costPer1kChars: 0.03,
  },
};

// 플랜 티어별 모델 선택
export function getModelForTier(tier: "basic" | "premium", useCase: "conversation" | "roleplay" | "explanation") {
  if (tier === "premium" && (useCase === "roleplay" || useCase === "explanation")) {
    return AI_MODELS.premium_tutor;
  }
  return AI_MODELS.basic_tutor;
}
```

### 3.2 기능별 모델 매핑

| 기능 | 사용 모델 | 대상 플랜 |
|------|----------|----------|
| 기본 회화 연습 | `basic_tutor` (gpt-4o-mini) | All |
| 간단한 문법 질문 | `basic_tutor` | All |
| 드라마 롤플레이 | `premium_tutor` (gpt-4o) | Pro, Premium |
| 스토리텔링/긴 대화 | `premium_tutor` | Pro, Premium |
| JLPT 문제 해설 | `premium_tutor` | Premium only |

---

## [4] 사용량 체크 미들웨어

### 4.1 미들웨어 구현 (`server/middleware/usageLimit.ts`)

```typescript
import { storage } from "../storage";

export async function checkUsageLimit(
  userId: string, 
  usageKey: "conversation_count" | "image_count" | "tts_count"
): Promise<{ allowed: boolean; used: number; limit: number; planName: string }> {
  
  // 1. 현재 활성 구독 조회
  const subscription = await storage.getActiveSubscription(userId);
  const planId = subscription?.planId || "fluent_free";
  
  // 2. 플랜 정보 조회
  const plan = await storage.getBillingPlan(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }
  
  // 3. 사용량 조회/생성
  const usage = await storage.getOrCreateUsage(userId, usageKey);
  
  // 4. 한도 매핑
  const limitMap = {
    conversation_count: plan.features.conversation_limit_month,
    image_count: plan.features.image_limit_month,
    tts_count: plan.features.tts_limit_month || 100,
  };
  
  const limit = limitMap[usageKey];
  const used = parseInt(usage.usedInPeriod);
  
  return {
    allowed: used < limit,
    used,
    limit,
    planName: plan.name,
  };
}

export async function incrementUsage(userId: string, usageKey: string): Promise<void> {
  await storage.incrementUsage(userId, usageKey);
}
```

### 4.2 API 적용 예시

```typescript
// 대화 생성 API에 적용
app.post("/api/conversation/continue", async (req, res) => {
  const { allowed, used, limit, planName } = await checkUsageLimit(
    req.user.id, 
    "conversation_count"
  );
  
  if (!allowed) {
    return res.status(402).json({
      error: "USAGE_LIMIT_EXCEEDED",
      message: `이번 달 대화 한도(${limit}회)를 초과했습니다.`,
      currentUsage: used,
      limit,
      planName,
      upgradeUrl: "/pricing"
    });
  }
  
  // ... 대화 처리 ...
  
  await incrementUsage(req.user.id, "conversation_count");
});
```

---

## [5] 대화 세션 지속성 ("이어하기" 기능)

### 5.1 DB 스키마

```typescript
// 대화 세션 테이블
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // 세션 메타데이터
  title: varchar("title").default("새 대화"),
  targetLevel: varchar("target_level").default("beginner"),
  audience: varchar("audience"),
  
  // 캐릭터 정보
  characterId: varchar("character_id").references(() => savedCharacters.id),
  characterData: jsonb("character_data"),
  
  // 시나리오
  scenarioType: varchar("scenario_type"),
  scenarioContent: text("scenario_content"),
  
  // 상태
  status: varchar("status").default("active"),
  turnCount: varchar("turn_count").default("0"),
  
  // 요약 (긴 대화용)
  summaryText: text("summary_text"),
  summaryUpdatedAt: timestamp("summary_updated_at"),
  
  // 비용 추적
  estimatedCost: varchar("estimated_cost").default("0"),
  totalInputTokens: varchar("total_input_tokens").default("0"),
  totalOutputTokens: varchar("total_output_tokens").default("0"),
  
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 대화 메시지 테이블
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => conversationSessions.id).notNull(),
  
  role: varchar("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentLang: varchar("content_lang").default("ja"),
  
  translationKo: text("translation_ko"),
  feedbackKo: text("feedback_ko"),
  
  audioUrl: text("audio_url"),
  feedbackData: jsonb("feedback_data"),
  
  inputTokens: varchar("input_tokens").default("0"),
  outputTokens: varchar("output_tokens").default("0"),
  estimatedCost: varchar("estimated_cost").default("0"),
  modelUsed: varchar("model_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 5.2 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/conversation/start` | 새 세션 시작, 첫 인사 생성 |
| `GET /api/conversation/sessions` | 내 세션 목록 |
| `GET /api/conversation/session/:id` | 세션 상세 + 최근 메시지 |
| `POST /api/conversation/continue` | 대화 이어가기 |
| `PATCH /api/conversation/session/:id` | 세션 수정 (제목 등) |
| `DELETE /api/conversation/session/:id` | 세션 삭제 |

---

## [6] 프론트엔드 UI

### 6.1 /pricing 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│                     💎 요금제 선택                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   FREE      │ │  STARTER    │ │    PRO      │ │  PREMIUM    ││
│  │             │ │             │ │  ⭐ 인기    │ │             ││
│  │   ₩0/월    │ │ ₩4,900/월  │ │ ₩9,900/월  │ │₩19,900/월   ││
│  │             │ │             │ │             │ │             ││
│  │ • 30회/월   │ │ • 300회/월  │ │ • 600회/월  │ │ • 1,200회/월││
│  │ • 1 이미지  │ │ • 15 이미지 │ │ • 25 이미지 │ │ • 60 이미지 ││
│  │ • 기본 AI   │ │ • 기본 AI   │ │ • 고급 AI   │ │ • 고급 AI   ││
│  │             │ │             │ │             │ │             ││
│  │ [현재 플랜] │ │ [구독하기]  │ │ [구독하기]  │ │ [구독하기]  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 마이페이지 사용량 표시

```
┌─────────────────────────────────────────────────────┐
│  📊 이번 달 사용량                                  │
├─────────────────────────────────────────────────────┤
│  현재 플랜: Pro (₩9,900/월)                        │
│  다음 결제일: 2025년 12월 28일                      │
│                                                     │
│  대화: ████████░░ 480/600회 (80%)                  │
│  이미지: ██░░░░░░░░ 5/25장 (20%)                   │
│                                                     │
│  [플랜 변경] [구독 취소]                            │
└─────────────────────────────────────────────────────┘
```

### 6.3 /sessions 세션 목록 페이지

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
│  ┌───────────────────────────────────────────────┐  │
│  │ 💼 비즈니스 미팅                              │  │
│  │ 타나카 부장(冷静) • 고급 • 28턴               │  │
│  │ 마지막 대화: 어제                             │  │
│  │                           [이어하기] [삭제]   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## [7] 구현 순서 (점진적 적용)

### Phase 1: DB 스키마 및 모델 구조 (1-2시간)
1. ✅ `billing_plans`, `user_subscriptions`, `user_usage` 테이블 추가
2. ✅ `conversation_sessions`, `conversation_messages` 테이블 추가
3. ✅ `server/config/ai-models.ts` 생성
4. ✅ `npm run db:push` 실행
5. ✅ 기본 플랜 시드 데이터 삽입

### Phase 2: PortOne 연동 (2-3시간)
1. ✅ `server/services/portoneClient.ts` 생성
2. ✅ `/api/billing/create-checkout-session` 구현
3. ✅ `/api/billing/portone-webhook` 구현
4. ✅ `/api/billing/my-subscription` 구현

### Phase 3: 사용량 관리 (1-2시간)
1. ✅ 사용량 체크 미들웨어 구현
2. ✅ 기존 API에 미들웨어 적용
3. ✅ 모델 티어 분기 로직 추가

### Phase 4: 대화 세션 API (2-3시간)
1. ✅ `/api/conversation/start` 구현
2. ✅ `/api/conversation/sessions` 구현
3. ✅ `/api/conversation/continue` 구현
4. ✅ 대화 컨텍스트 관리 및 요약 로직

### Phase 5: 프론트엔드 UI (2-3시간)
1. ✅ `/pricing` 페이지 생성
2. ✅ `/sessions` 페이지 생성
3. ✅ 마이페이지 사용량 표시
4. ✅ 결제 플로우 연결

---

## [8] 기존 코드 영향 분석

### 영향 받는 파일
| 파일 | 변경 유형 | 위험도 |
|------|----------|--------|
| `shared/schema.ts` | 테이블 5개 추가 | 🟢 낮음 |
| `server/services/openai.ts` | 모델 선택 로직 추가 | 🟡 중간 |
| `server/storage.ts` | 새 CRUD 메서드 추가 | 🟢 낮음 |
| `server/routes.ts` | 새 API 추가 + 미들웨어 | 🟡 중간 |
| `client/src/App.tsx` | 라우트 추가 | 🟢 낮음 |

### 영향 없는 파일 (보존)
- `server/auth.ts` - 인증 로직 유지 ✅
- 기존 `/api/generate-dialogue` - 하위 호환 ✅
- 기존 `/api/tts` - 변경 없음 ✅
- 기존 `/api/generate-image` - 변경 없음 ✅

---

## [9] 테스트 체크리스트

### 기존 기능 보존
- [ ] 로그인/회원가입 작동 확인
- [ ] 캐릭터 생성 → 학습 흐름 확인
- [ ] 기존 대화 생성 정상 작동
- [ ] TTS 재생 정상 작동

### 새 기능 테스트
- [ ] Free 플랜 한도 적용 확인
- [ ] 구독 결제 플로우 테스트 (PortOne sandbox)
- [ ] 웹훅 수신 및 상태 변경 확인
- [ ] 사용량 초과 시 402 에러 확인
- [ ] 세션 이어하기 정상 작동
- [ ] 긴 대화 시 요약 생성 테스트

---

*문서 작성: AI Architect*
*승인 대기 중...*
