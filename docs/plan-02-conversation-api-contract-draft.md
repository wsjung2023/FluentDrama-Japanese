<!-- Plan 02 Sprint 1: conversation core API contract draft for Japanese-learning flow. -->
# Plan 02 API 계약 초안 — Conversation Core (일본어 학습 전용)

## 범위
- 본 문서는 Plan 02 Sprint 1의 `/api/conversation/*` 계약 초안입니다.
- 일본어 학습 세션 기준으로 정의하며, 영어 모드는 제외합니다.

## 1) POST `/api/conversation/start`
### Request
```json
{
  "scenarioId": "string",
  "difficulty": "beginner|intermediate|advanced",
  "characterId": "string",
  "userGoal": "string"
}
```

### Response
```json
{
  "sessionId": "string",
  "initialPrompt": "string",
  "scenario": {
    "title": "string",
    "context": "string"
  },
  "message": "세션이 시작되었습니다"
}
```

### Error
- `400`: schema validation failed
- `401`: unauthorized
- `429`: usage limit exceeded
- `500`: conversation start failed

## 2) POST `/api/conversation/turn`
### Request
```json
{
  "sessionId": "string",
  "userInput": "string",
  "history": [
    { "speaker": "user|assistant|character", "text": "string" }
  ],
  "audioMeta": {
    "sttConfidence": 0.91,
    "durationMs": 3200
  }
}
```

### Response
```json
{
  "response": "string",
  "feedback": {
    "accuracy": 0,
    "suggestions": ["string"],
    "pronunciation": "string"
  },
  "subtitle": {
    "ja": "string",
    "ko": "string",
    "yomigana": "string"
  },
  "message": "대화 턴이 처리되었습니다"
}
```

### Error
- `400`: schema validation failed
- `401`: unauthorized
- `404`: session not found
- `429`: usage limit exceeded
- `500`: conversation turn failed

## 3) POST `/api/conversation/resume`
### Request
```json
{
  "sessionId": "string"
}
```

### Response
```json
{
  "sessionId": "string",
  "history": [
    { "speaker": "user|assistant|character", "text": "string", "timestamp": 1710000000000 }
  ],
  "lastFeedback": {
    "accuracy": 0,
    "suggestions": ["string"],
    "pronunciation": "string"
  },
  "message": "세션이 복원되었습니다"
}
```

### Error
- `400`: invalid session id
- `401`: unauthorized
- `404`: session not found
- `500`: conversation resume failed

---

## 공통 계약 규칙
- 모든 응답은 JSON.
- 문자열 입력은 `trim().min(1)` 검증.
- `speaker`는 enum 강제(`user|assistant|character`).
- 실패 시 `message` 필드를 반드시 포함.
