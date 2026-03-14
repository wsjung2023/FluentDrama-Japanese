# Ticket 06 — 홈 화면 Scene-First 리디자인

  ## 문제 요약
  현재 Home.tsx는 4개의 기능 카드(빠른시작, 내세션, 학습진도, 구독관리)가 나열된 범용 SaaS 대시보드. 일본어 몰입형 앱의 감성이 없음.

  ## 목표 레이아웃

  ```
  ┌─────────────────────────────────────────────────┐
  │ [헤더] 이름 + 구독 뱃지 + 로그아웃             │
  ├─────────────────────────────────────────────────┤
  │ [HERO] 오늘의 추천 장면                          │
  │   큰 카드 1개: 장면 이름 / 상황 설명 / 시작 버튼 │
  ├─────────────────────────────────────────────────┤
  │ [QUICK CHIPS] 빠른 입장                          │
  │  여행   카페   학교   비즈니스   자유대화         │
  ├─────────────────────────────────────────────────┤
  │ [2단] 이전 세션 이어하기  |  저장된 표현 복습    │
  ├─────────────────────────────────────────────────┤
  │ [UPSELL] 프리미엄 블록 (무료 유저에게만 표시)    │
  └─────────────────────────────────────────────────┘
  ```

  ## 디자인 가이드

  ### 컬러
  - 배경: `from-gray-950 to-gray-900` (dark charcoal, Ticket 09 토큰 적용 예정)
  - 헤더 텍스트: white
  - hero 카드: 반투명 다크 `bg-white/5 backdrop-blur border border-white/10`
  - quick chip: `bg-white/10 hover:bg-white/20` 알약형 버튼
  - accent 강조: `text-amber-400` (muted gold)

  ### 타이포그래피
  - hero 장면 제목: `text-3xl font-bold tracking-tight`
  - 상황 설명: `text-sm text-gray-400`
  - chip 텍스트: `text-xs font-medium`

  ### 인터랙션
  - hero 카드 클릭 → 해당 시나리오로 바로 진입
  - chip 클릭 → audience 선택 없이 해당 카테고리 시나리오로 바로 진입

  ## 구현 참고

  ### 오늘의 추천 장면 로직 (프론트 only, API 불필요)
  ```ts
  // 요일 기반 rotate (고정값, 서버 불필요)
  const DAILY_SCENES: ScenarioId[] = ['travel', 'cafe_order', 'meeting_opener', 'cafeteria', 'small_talk', 'club', 'negotiation_basics'];
  const todayIndex = new Date().getDay(); // 0-6
  const todayScene = SCENARIO_CONFIGS[DAILY_SCENES[todayIndex]];
  ```

  ### Quick chips 구성
  - 각 chip은 가장 많이 쓰이는 ScenarioId 하나로 매핑
  - 클릭 시 `setAudience`, `setScenario`, `setCurrentPage('character')` 순서로 호출

  ## 완료 기준
  - 첫 화면 로드 시 오늘의 장면 hero 카드가 가장 먼저 눈에 들어옴
  - quick chip 5개가 hero 아래 수평 배치
  - "오늘도 재미있는 영어 학습" 문구 없음

  ## 관련 파일
  - `client/src/pages/Home.tsx` (전체 200줄 재작성 수준)
  - `client/src/constants/scenarios.ts` (Ticket 01에서 생성, 이 Ticket에서 참조)
  