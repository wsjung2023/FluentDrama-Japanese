# FluentDrama Japanese — 상세 작업 지시서 인덱스

  작성일: 2026-03-14  
  기반: FluentDrama_Japanese_Recovered_Analysis 문서 + 실제 코드 분석

  ---

  ## 작업 순서 (권장)

  ```
  Phase 1 — 구조 수정 (기반 먼저)
    Ticket 01: 시나리오 키 통합          → scenarios.ts 신규 생성
    Ticket 02: audience 버그 수정        → drama-scene.tsx 1줄 수정
    Ticket 04: 랜덤 점수 제거            → aiCoreRoutes.ts 피드백 교체
    Ticket 05: 일본어 앱 정체성 정리     → 잔재 문구 제거

  Phase 2 — 엔진 통합
    Ticket 03: 대화 API 단일화           → useConversationSession 훅 생성

  Phase 3 — UI/UX 고급화 (Phase 1 완료 후)
    Ticket 09: 디자인 토큰 정비          → tailwind + css 토큰 (먼저 해야 후속 적용 가능)
    Ticket 06: 홈 화면 리디자인          → scene-first dashboard
    Ticket 07: 시나리오 선택 갤러리      → cinematic card gallery
    Ticket 08: 대화 화면 Immersive Studio → 3-zone 레이아웃
  ```

  ---

  ## 파일 목록

  | 파일 | Phase | 핵심 수정 파일 |
  |------|-------|----------------|
  | ticket-01-scenario-keys.md | 1 | presets.ts, drama-scene.tsx, **scenarios.ts(신규)** |
  | ticket-02-audience-bug.md | 1 | drama-scene.tsx line 180 |
  | ticket-03-api-unify.md | 2 | **useConversationSession.ts(신규)**, drama-scene.tsx, playground-new.tsx, voice-chat.tsx |
  | ticket-04-random-score.md | 1 | aiCoreRoutes.ts lines 346, 489 |
  | ticket-05-identity.md | 1 | useAppStore.ts, Home.tsx, drama-scene.tsx |
  | ticket-06-home-redesign.md | 3 | Home.tsx (전체 재작성) |
  | ticket-07-scenario-gallery.md | 3 | scenario.tsx (전체 재작성) |
  | ticket-08-drama-studio.md | 3 | drama-scene.tsx (대대적 리팩토링) |
  | ticket-09-design-tokens.md | 3 | tailwind.config.ts, index.css |

  ---

  ## Replit Project Tasks 매핑

  | Ticket | Project Task |
  |--------|-------------|
  | 01 + 02 + 04 + 05 | Task #1 — 코어 버그 수정 |
  | 03 | Task #2 — 대화 엔진 단일화 |
  | 06 + 07 + 08 + 09 | Task #3 — 프리미엄 UX 리디자인 |
  