# Ticket 02 — audience 하드코딩 버그 수정

  ## 문제 요약
  `drama-scene.tsx` line 180에서 opening dialogue 생성 시 audience가 항상 `'general'`로 고정됨.

  ```ts
  // drama-scene.tsx line 180 — 현재 잘못된 코드
  audience: 'general', // or get from user settings
  ```

  student를 선택한 학생이나 business를 선택한 직장인도 모두 general 톤의 일본어 대화를 받게 됨.

  ## 수정 방법

  ### `client/src/pages/drama-scene.tsx` line 180 수정

  현재:
  ```ts
  const dialogueResponseRaw = await apiRequest('POST', '/api/generate-dialogue', {
    audience: 'general', // or get from user settings
    character: { ... },
    scenario: { ... }
  });
  ```

  수정 후:
  ```ts
  // 파일 상단 useAppStore에서 audience 이미 구조분해됨 (line 98)
  // const { character, scenario, audience, ... } = useAppStore();

  const dialogueResponseRaw = await apiRequest('POST', '/api/generate-dialogue', {
    audience: audience ?? 'general',  // 실제 store 값 사용, null이면 fallback
    character: { ... },
    scenario: { ... }
  });
  ```

  ### 확인 사항
  - `drama-scene.tsx` line 98: `const { character, scenario, audience, setCurrentPage, subtitleSettings } = useAppStore();`
    → audience가 이미 구조분해되어 있음. 그냥 쓰면 됨.
  - audience가 null인 경우는 사용자가 audience 선택 화면을 거치지 않은 케이스. `?? 'general'` fallback 충분.
  - dev 모드에서 `console.log('Opening dialogue with audience:', audience ?? 'general');` 로그 추가 권장

  ### 서버 측 확인 (수정 불필요)
  `server/routes/aiCoreRoutes.ts` line 79: `audience: audience || 'general'`
  → 이미 올바르게 처리되어 있음. 클라이언트만 고치면 됨.

  ## 완료 기준
  - student 로그인 후 drama-scene 진입 시 학생 톤(`やさしい日本語`, 반말 친근체) 대화 생성
  - business 로그인 후 진입 시 비즈니스 존댓말 대화 생성

  ## 관련 파일
  - `client/src/pages/drama-scene.tsx` (line 98, line 180 — 핵심 수정 위치)
  - `server/routes/aiCoreRoutes.ts` (line 79 — 참조만, 수정 불필요)
  