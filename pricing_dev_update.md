# FluentDrama-Japanese 개발 업데이트 문서
## 버전: 2.0 | 작성일: 2025-11-28

---

## 📋 개요

이 문서는 다음 3가지 핵심 기능 추가를 위한 개발 계획입니다:
1. OpenAI 모델 이중 구조 (기본/프리미엄)
2. 대화 세션 지속성 및 "이어하기" 기능
3. 크레딧/결제 시스템 준비

---

## [1] OpenAI 모델 전략 개편

### 1.1 현재 상태 분석

| 파일 | 사용 모델 | 용도 |
|------|----------|------|
| `server/services/openai.ts` | gpt-4o | 대화 생성 |
| `server/services/openai-tts.ts` | tts-1-hd | 음성 합성 |
| `server/services/speech-recognition.ts` | whisper-1, gpt-4o | 음성인식, 대화 |

### 1.2 새로운 모델 구조

```typescript
// server/config/ai-models.ts (신규 파일)

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
  
  // 프로 설명자: JLPT 해설, 문법 분석 (옵션)
  pro_explainer: {
    model: process.env.PRO_EXPLAINER_MODEL || "gpt-4o",  // 추후 gpt-5.1로 업그레이드
    maxTokens: 2000,
    temperature: 0.5,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  },
  
  // 이미지 생성
  image_generator: {
    model: "dall-e-3",
    quality: "hd",
    size: "1024x1792",
    costPerImage: 0.08,  // $0.08 per HD image
  },
  
  // TTS 음성
  tts: {
    model: "tts-1-hd",
    costPer1kChars: 0.03,  // $30/1M chars
  },
  
  // 음성 인식
  whisper: {
    model: "whisper-1",
    costPerMinute: 0.006,  // $0.006/minute
  }
};
```

### 1.3 기능별 모델 매핑

| 기능 | 사용 모델 | 대상 구독 티어 |
|------|----------|--------------|
| 기본 회화 연습 | `basic_tutor` | Free, Starter |
| 간단한 문법 질문 | `basic_tutor` | Free, Starter |
| 드라마 롤플레이 | `premium_tutor` | Pro, Premium |
| 스토리텔링/긴 대화 | `premium_tutor` | Pro, Premium |
| JLPT 문제 해설 | `pro_explainer` | Premium only |
| 문법 심층 분석 | `pro_explainer` | Premium only |

### 1.4 환경 변수 추가

```bash
# .env 추가 항목
BASIC_TUTOR_MODEL=gpt-4o-mini
PREMIUM_TUTOR_MODEL=gpt-4o
PRO_EXPLAINER_MODEL=gpt-4o

# 추후 업그레이드 시
# PREMIUM_TUTOR_MODEL=gpt-5-mini
# PRO_EXPLAINER_MODEL=gpt-5.1
```

---

## [2] 대화 세션 지속성 ("이어하기" 기능)

### 2.1 새로운 DB 스키마

```typescript
// shared/schema.ts 추가

// 대화 세션 테이블
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // 세션 메타데이터
  title: varchar("title").default("새 대화"),
  targetLevel: varchar("target_level").default("beginner"), // beginner, intermediate, advanced
  audience: varchar("audience"), // student, general, business
  
  // 캐릭터 정보 (저장된 캐릭터 참조)
  characterId: varchar("character_id").references(() => savedCharacters.id),
  characterData: jsonb("character_data").$type<{
    name: string;
    gender: string;
    style: string;
    imageUrl?: string;
  }>(),
  
  // 시나리오 정보
  scenarioType: varchar("scenario_type"), // preset, custom
  scenarioContent: text("scenario_content"),
  
  // 세션 상태
  status: varchar("status").default("active"), // active, paused, completed
  turnCount: varchar("turn_count").default("0"),
  
  // 요약 (긴 대화용)
  summaryText: text("summary_text"), // AI 생성 대화 요약
  summaryUpdatedAt: timestamp("summary_updated_at"),
  
  // 비용 추적 (크레딧 시스템 준비)
  estimatedCost: varchar("estimated_cost").default("0"), // 누적 비용 (USD)
  totalInputTokens: varchar("total_input_tokens").default("0"),
  totalOutputTokens: varchar("total_output_tokens").default("0"),
  
  // 타임스탬프
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 대화 메시지 테이블
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => conversationSessions.id).notNull(),
  
  // 메시지 내용
  role: varchar("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentLang: varchar("content_lang").default("ja"), // ja, ko, en
  
  // 한국어 번역/설명 (선택)
  translationKo: text("translation_ko"),
  feedbackKo: text("feedback_ko"), // 문법/발음 피드백
  
  // 음성 관련
  audioUrl: text("audio_url"),
  audioFormat: varchar("audio_format"), // mp3, wav
  
  // 피드백 데이터
  feedbackData: jsonb("feedback_data").$type<{
    accuracy?: number;
    pronunciation?: string;
    suggestions?: string[];
    grammarNotes?: string[];
  }>(),
  
  // 비용 추적
  inputTokens: varchar("input_tokens").default("0"),
  outputTokens: varchar("output_tokens").default("0"),
  estimatedCost: varchar("estimated_cost").default("0"),
  modelUsed: varchar("model_used"), // gpt-4o-mini, gpt-4o, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2.2 새로운 API 엔드포인트

#### 세션 관리 API

```typescript
// POST /api/conversation/start
// 새 대화 세션 시작
Request: {
  title?: string,
  targetLevel?: "beginner" | "intermediate" | "advanced",
  audience?: "student" | "general" | "business",
  characterId?: string,  // 저장된 캐릭터 사용
  characterData?: { name, gender, style, imageUrl },  // 새 캐릭터
  scenarioType?: "preset" | "custom",
  scenarioContent?: string
}
Response: {
  sessionId: string,
  session: ConversationSession,
  initialGreeting?: string  // 캐릭터의 첫 인사
}

// GET /api/conversation/sessions
// 사용자의 모든 세션 목록
Response: {
  sessions: ConversationSession[],
  totalCount: number
}

// GET /api/conversation/session/:id
// 특정 세션 상세 정보
Response: {
  session: ConversationSession,
  recentMessages: ConversationMessage[]  // 최근 20개
}

// POST /api/conversation/continue
// 기존 세션 이어가기
Request: {
  sessionId: string,
  userMessage: string,
  audioBlob?: string  // base64 음성 (선택)
}
Response: {
  assistantMessage: string,
  translationKo?: string,
  feedbackKo?: string,
  feedbackData?: FeedbackData,
  audioUrl?: string,
  updatedSession: ConversationSession
}

// PATCH /api/conversation/session/:id
// 세션 업데이트 (제목 변경, 상태 변경 등)
Request: {
  title?: string,
  status?: "active" | "paused" | "completed"
}

// DELETE /api/conversation/session/:id
// 세션 삭제
```

### 2.3 대화 컨텍스트 관리 전략

```typescript
// 메시지 로딩 전략
const MAX_CONTEXT_MESSAGES = 20;
const SUMMARY_THRESHOLD = 30;  // 30턴 초과 시 요약 생성

async function buildConversationContext(sessionId: string) {
  const session = await getSession(sessionId);
  const messages = await getMessages(sessionId);
  
  if (messages.length <= MAX_CONTEXT_MESSAGES) {
    // 전체 메시지 사용
    return messages.map(m => ({ role: m.role, content: m.content }));
  }
  
  // 요약 + 최근 메시지 사용
  if (!session.summaryText || needsNewSummary(session)) {
    const summary = await generateSummary(messages.slice(0, -MAX_CONTEXT_MESSAGES));
    await updateSessionSummary(sessionId, summary);
  }
  
  return [
    { role: "system", content: `[이전 대화 요약]\n${session.summaryText}` },
    ...messages.slice(-MAX_CONTEXT_MESSAGES).map(m => ({ role: m.role, content: m.content }))
  ];
}
```

---

## [3] 프론트엔드 UI 계획

### 3.1 새로운 페이지: "내 드라마 세션" (/sessions)

```
┌─────────────────────────────────────────────────────┐
│  📚 내 드라마 세션                    [+ 새 대화]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🎭 카페에서 주문하기                          │  │
│  │ 유키(陽気) • 초급 • 12턴                      │  │
│  │ 마지막 대화: 2시간 전                         │  │
│  │                           [이어하기] [삭제]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 💼 비즈니스 미팅                              │  │
│  │ 타나카 부장(冷静) • 고급 • 28턴               │  │
│  │ 마지막 대화: 어제                             │  │
│  │                           [이어하기] [삭제]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🏫 학교에서 친구 사귀기                       │  │
│  │ 하루카(活発) • 중급 • 5턴                     │  │
│  │ 마지막 대화: 3일 전                           │  │
│  │                           [이어하기] [삭제]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 채팅 화면 업데이트

```
┌─────────────────────────────────────────────────────┐
│ ← 세션 목록    카페에서 주문하기    세션ID: abc123  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                    🎭 유키                          │
│                  (陽気 • 친절함)                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ こんにちは！いらっしゃいませ！              │    │
│  │ 何にしますか？                              │ 🔊 │
│  │ ─────────────────────────                   │    │
│  │ (안녕하세요! 어서오세요! 뭘로 하시겠어요?)  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│    ┌─────────────────────────────────────────────┐  │
│    │ コーヒーをください                         │  │
│    │ ─────────────────────────                   │  │
│    │ 정확도: 95% ✅                              │  │
│    └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ はい！ホットとアイス、どちらになさいますか？│    │
│  │ ─────────────────────────                   │ 🔊 │
│  │ (네! 핫과 아이스, 어느 쪽으로 하시겠어요?)   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [🎤 음성으로 말하기]    [⌨️ 텍스트 입력]          │
└─────────────────────────────────────────────────────┘
```

---

## [4] 비용/토큰 관리 준비

### 4.1 비용 계산 헬퍼

```typescript
// server/utils/cost-calculator.ts

import { AI_MODELS } from '../config/ai-models';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  modelUsed: string;
}

export function calculateCost(
  modelType: 'basic_tutor' | 'premium_tutor' | 'pro_explainer',
  usage: TokenUsage
): CostEstimate {
  const config = AI_MODELS[modelType];
  
  const inputCost = (usage.inputTokens / 1000) * config.costPer1kInput;
  const outputCost = (usage.outputTokens / 1000) * config.costPer1kOutput;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    modelUsed: config.model
  };
}

export function calculateImageCost(): number {
  return AI_MODELS.image_generator.costPerImage;
}

export function calculateTTSCost(characterCount: number): number {
  return (characterCount / 1000) * AI_MODELS.tts.costPer1kChars;
}

export function calculateWhisperCost(durationSeconds: number): number {
  return (durationSeconds / 60) * AI_MODELS.whisper.costPerMinute;
}
```

### 4.2 크레딧 시스템 준비 (향후 구현)

```typescript
// 향후 users 테이블 추가 필드
credits: varchar("credits").default("0"), // 사용자 크레딧 잔액
creditsUpdatedAt: timestamp("credits_updated_at"),

// 향후 크레딧 사용 로그 테이블
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  amount: varchar("amount"), // 양수: 충전, 음수: 사용
  type: varchar("type"), // purchase, usage, bonus, refund
  description: text("description"),
  relatedSessionId: varchar("related_session_id"),
  relatedMessageId: varchar("related_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## [5] 구현 순서 (점진적 적용)

### Phase 1: 모델 구조 개편 (1-2시간)
1. ✅ `server/config/ai-models.ts` 생성
2. ✅ 환경 변수 설정
3. ✅ `openai.ts` 모델 선택 로직 추가
4. ✅ 기존 기능 테스트

### Phase 2: DB 스키마 추가 (1시간)
1. ✅ `conversationSessions` 테이블 추가
2. ✅ `conversationMessages` 테이블 추가
3. ✅ `npm run db:push` 실행
4. ✅ Storage 인터페이스 업데이트

### Phase 3: API 엔드포인트 구현 (2-3시간)
1. ✅ `/api/conversation/start` 구현
2. ✅ `/api/conversation/sessions` 구현
3. ✅ `/api/conversation/continue` 구현
4. ✅ 대화 컨텍스트 관리 로직 구현

### Phase 4: 프론트엔드 UI (2-3시간)
1. ✅ `/sessions` 페이지 생성
2. ✅ 채팅 화면 세션 ID 표시
3. ✅ 세션 이어하기 기능 연결
4. ✅ 새로고침 시 세션 유지

### Phase 5: 비용 추적 통합 (1시간)
1. ✅ 비용 계산 헬퍼 생성
2. ✅ 메시지 저장 시 비용 기록
3. ✅ 세션 누적 비용 업데이트

---

## [6] 기존 코드 영향 분석

### 영향 받는 파일
| 파일 | 변경 유형 | 위험도 |
|------|----------|--------|
| `shared/schema.ts` | 테이블 추가 | 🟢 낮음 |
| `server/services/openai.ts` | 모델 선택 로직 추가 | 🟡 중간 |
| `server/storage.ts` | 새 CRUD 메서드 추가 | 🟢 낮음 |
| `server/routes.ts` | 새 API 추가 | 🟢 낮음 |
| `client/src/App.tsx` | 라우트 추가 | 🟢 낮음 |

### 영향 없는 파일 (보존)
- `server/auth.ts` - 인증 로직 유지
- 기존 `/api/generate-dialogue` - 하위 호환
- 기존 `/api/tts` - 변경 없음
- 기존 `/api/generate-image` - 변경 없음

---

## [7] 테스트 체크리스트

- [ ] 기존 로그인/회원가입 작동 확인
- [ ] 기존 캐릭터 생성 → 학습 흐름 확인
- [ ] 새 세션 시작 API 테스트
- [ ] 세션 이어하기 API 테스트
- [ ] 긴 대화 시 요약 생성 테스트
- [ ] 비용 추적 정확성 확인
- [ ] 새로고침 후 세션 유지 확인

---

*문서 작성: AI Architect*
*승인 대기 중...*
