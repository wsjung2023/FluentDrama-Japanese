# FluentDrama Japanese — 상세 작업 지시서 인덱스

  작성일: 2026-03-14  
  기반: FluentDrama_Japanese_Recovered_Analysis 문서 + 실제 코드 분석
  상태: docs/tickets 폴더 최신 수정 사항 반영

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

  ---

  ## 최근 수정 사항

  - `docs/tickets/` 내 상세 지시서 구조 및 우선순위를 다시 검토하고,
    현재 티켓 파일 목록(01~09)과 인덱스 매핑이 일치하는지 재확인했습니다.
  - 향후 티켓이 추가되면 이 문서의 **파일 목록**과 **Project Tasks 매핑**을
    동일 커밋에서 함께 갱신하는 것을 권장합니다.
  


  ## 구현 상태

  - Ticket 01~09 기준 코드 반영 작업을 순차 적용했습니다.
  - 공통 시나리오 소스, 대화 API 훅 단일화, UI 토큰/레이아웃 개편을 포함합니다.


  ## 01~09 구현 재확인 체크 (풀 구현 기준)

  - [x] Ticket 01 — 시나리오 키 단일 소스 및 타입 통합
  - [x] Ticket 02 — audience 하드코딩 제거
  - [x] Ticket 03 — 대화 API 훅 단일화
  - [x] Ticket 04 — 랜덤 점수 제거 (deterministic feedback)
  - [x] Ticket 05 — 일본어 앱 정체성 문구/스토리지 정리
  - [x] Ticket 06 — Home Scene-first 레이아웃
  - [x] Ticket 07 — 시나리오 카드 갤러리 + 메타정보
  - [x] Ticket 08 — Immersive Studio 3-zone + press-to-record 마이크 액션바
  - [x] Ticket 09 — 디자인 토큰/버튼 variant/JP 폰트
