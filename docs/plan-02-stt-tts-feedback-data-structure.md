<!-- Plan 02 Sprint 1 detail: STT/TTS/tutor-feedback canonical data structure spec. -->
# Plan 02 데이터 구조 상세안 — STT / TTS / 튜터 피드백

## 0) 목적
- 일본어 학습 세션에서 STT/TTS/피드백 데이터를 **단일 표준 구조**로 고정해
  서버/클라이언트/저장소 간 불일치로 인한 오류를 줄입니다.

---

## 1) STT 표준 응답 구조

### Type
```ts
interface SttSegment {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number; // 0.0 ~ 1.0
}

interface SttResult {
  text: string;
  confidence: number; // 0.0 ~ 1.0
  language: 'ja';
  segments: SttSegment[];
}
```

### Validation Rules
- `text`: `trim().min(1)`
- `confidence`: `0 <= value <= 1`
- `segments[*].startMs < endMs`
- `segments`는 시간순 정렬

---

## 2) TTS 요청/응답 표준 구조

### Request
```ts
interface TtsRequest {
  text: string;
  voiceStyle?: 'cheerful' | 'calm' | 'strict';
  speed?: number; // 0.7 ~ 1.2
}
```

### Response
```ts
interface TtsResult {
  audioUrl: string; // data URL or CDN URL
  durationMs?: number;
  voiceModel: string;
}
```

### Validation Rules
- `text`: `trim().min(1)`
- `speed`: 존재 시 `0.7 <= speed <= 1.2`
- `audioUrl`: URL 또는 `data:audio/` prefix 허용

---

## 3) 튜터 피드백 표준 구조

### Type
```ts
interface TutorFeedback {
  accuracy: number; // 0 ~ 100
  fluency?: number; // 0 ~ 100
  pronunciation?: string;
  suggestions: string[];
  correctedSentence?: string;
  koExplanation?: string;
}
```

### Validation Rules
- `accuracy`, `fluency`: 존재 시 `0 <= value <= 100`
- `suggestions`: 문자열 배열, 각 원소 `trim().min(1)`
- `correctedSentence`: 일본어 문장 기준 `trim().min(1)`

---

## 4) 저장소 매핑 가이드
- `conversation_messages`
  - `stt_json` (SttResult)
  - `tts_json` (TtsResult)
  - `feedback_json` (TutorFeedback)
- 저장 전 반드시 zod 검증 후 직렬화(JSON stringify).
- 읽기 시 파싱 실패하면 fallback 객체를 반환하고 logError 기록.

---

## 5) 도입 순서 (적용 지시)
1. `shared/schema.ts`에 위 구조 zod 스키마 추가
2. `server/services/speech-recognition.ts` 출력 정규화
3. `server/routes/aiCoreRoutes.ts` conversation-turn 응답 구조 적용
4. `client/src/pages/voice-chat.tsx` 타입/렌더링 동기화

---

## 6) 완료 기준
- STT/TTS/피드백 응답이 전부 공통 타입으로 직렬화/역직렬화 가능
- `npm run check`, `npm run build` 통과
- `/api/conversation/turn` 스모크에서 schema validation error 0건
