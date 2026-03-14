# Ticket 03 — 대화 API 단일화

  ## 문제 요약
  세 화면이 각각 다른 API 경로를 사용해 피드백 구조가 일관되지 않음.

  | 화면 | API | 상태 |
  |---|---|---|
  | `voice-chat.tsx` | `/api/conversation/start` + `/api/conversation/turn` | ✅ 표준 |
  | `playground-new.tsx` | `/api/conversation-response` | ❌ 비표준 |
  | `drama-scene.tsx` | `/api/generate-dialogue` (초기) + 별도 처리 | ❌ 별도 흐름 |

  ## 수정 방법

  ### Step 1: `client/src/hooks/useConversationSession.ts` 신규 생성

  ```ts
  interface UseConversationSessionOptions {
    scenarioId: string;
    character: { name: string; gender: string; style: string };
    audience: 'student' | 'general' | 'business';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }

  interface Feedback {
    accuracy: number;
    naturalness?: number;
    correction?: string;
    betterExpression?: string;
    koreanExplanation?: string;
  }

  interface SessionTurn {
    speaker: 'user' | 'assistant';
    text: string;
    audioUrl?: string;
    koreanTranslation?: string;
    pronunciation?: string;
    feedback?: Feedback;
  }

  // 훅이 제공하는 것:
  // - startSession(): Promise<{ sessionId: string; openingMessage: SessionTurn }>
  // - sendTurn(userInput: string): Promise<SessionTurn>
  // - resumeSession(sessionId: string): Promise<void>
  // - isLoading: boolean
  // - error: string | null
  // - history: SessionTurn[]
  // - resetSession(): void
  ```

  ### Step 2: `server/routes/aiCoreRoutes.ts` 확인 및 표준화
  - `/api/conversation/start` — 표준. 유지.
  - `/api/conversation/turn` — 표준. 유지.
  - `/api/conversation-response` (line 428-503) — deprecated 처리:
    ```ts
    // 기존 로직을 /api/conversation/turn 으로 내부 위임하거나
    // 또는 "deprecated" 응답 헤더 추가 후 동일 응답 유지 (breaking change 방지)
    res.setHeader('Deprecation', 'true');
    ```

  ### Step 3: `client/src/pages/playground-new.tsx` 수정
  - line 217: `/api/conversation-response` 호출 → `useConversationSession` 훅으로 교체

  ### Step 4: `client/src/pages/drama-scene.tsx` 수정
  - `startScenario()` 함수 내부의 `/api/generate-dialogue` 초기화 로직을
    `useConversationSession.startSession()` 호출로 통합
  - 이후 `sendUserInput()` 함수도 훅의 `sendTurn()`으로 교체

  ### Step 5: `client/src/pages/voice-chat.tsx` 수정
  - 이미 표준 API 사용 중이나, 훅 API로 추상화하면 일관성 확보

  ## 완료 기준
  - 세 화면 모두 동일한 Feedback 인터페이스 사용
  - /api/conversation-response 직접 호출 없음
  - history 저장/복원 로직이 중복되지 않음

  ## 관련 파일
  - `client/src/pages/drama-scene.tsx` (lines 173-300: startScenario 함수)
  - `client/src/pages/voice-chat.tsx` (lines 60-90: 세션 시작, lines 230-260: 턴 전송)
  - `client/src/pages/playground-new.tsx` (line 217: /api/conversation-response 호출)
  - `server/routes/aiCoreRoutes.ts` (line 428-503: /api/conversation-response 핸들러)
  