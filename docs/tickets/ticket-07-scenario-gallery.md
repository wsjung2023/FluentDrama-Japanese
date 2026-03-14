# Ticket 07 — 시나리오 선택 화면 갤러리 전환

  ## 문제 요약
  현재 `scenario.tsx`는 preset 목록이 단순 나열되어 "장면을 고른다"는 감성 없음.

  ## 현재 구조 (204줄)
  - SCENARIO_PRESETS 목록을 카드로 렌더링
  - custom scenario textarea
  - subtitle 설정 옵션

  ## 목표 레이아웃

  ```
  ┌─────────────────────────────────────────────────────┐
  │ [헤더] 어떤 장면으로 들어갈까요?                    │
  │         오늘 연습할 시나리오를 선택하세요            │
  ├─────────────────────────────────────────────────────┤
  │ [SCENARIO CARDS — grid 2 cols on mobile, 3 on desk] │
  │                                                     │
  │ ┌──────────────┐  ┌──────────────┐                  │
  │ │ 🛫 Travel    │  │ ☕ Café      │                  │
  │ │ 비즈니스 여행│  │ 커피 주문    │                  │
  │ │ [N2] [공손체]│  │ [N4] [캐주얼]│                  │
  │ │ ⏱ 10-15분  │  │ ⏱ 5-10분   │                  │
  │ └──────────────┘  └──────────────┘                  │
  │                                                     │
  ├─────────────────────────────────────────────────────┤
  │ [CUSTOM SCENARIO] (접힌 상태로 기본 배치)            │
  │  "또는 직접 시나리오를 입력해보세요..."             │
  │  [textarea] [시작하기 →]                           │
  └─────────────────────────────────────────────────────┘
  ```

  ## 카드 메타데이터 추가
  Ticket 01의 `scenarios.ts`에 각 시나리오에 아래 메타데이터 추가:

  ```ts
  interface ScenarioMeta {
    id: ScenarioId;
    title: string;       // "여행 회화"
    description: string; // "공항/호텔에서 자연스럽게"
    icon: string;        // emoji or FontAwesome class
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    tone: '캐주얼' | '공손체' | '존댓말' | '비즈니스';
    estimatedMinutes: number;  // 예: 10
    audience: 'student' | 'general' | 'business' | 'all';
  }
  ```

  ## 카드 컴포넌트 스타일

  ```
  - 배경: bg-gray-900 border border-gray-700 rounded-2xl
  - hover: border-amber-500/50 shadow-amber-500/10 shadow-lg
  - selected: border-amber-400 bg-amber-400/5
  - 레벨 badge: JLPT 레벨 (N5-N1) — 파랑
  - 톤 badge: 캐주얼/존댓말 등 — 그레이
  - 시간: ⏱ 10분 — 우하단 소자
  ```

  ## subtitle 설정 이동
  현재 시나리오 선택 화면에 있는 subtitle 토글을 대화 화면 내부 설정으로 이동
  (drama-scene.tsx 상단 settings 아이콘 드롭다운으로)

  ## 완료 기준
  - 시나리오 카드마다 레벨 badge, 톤 badge, 예상 시간 표시
  - 선택된 카드 시각적 구별 (amber 테두리)
  - custom scenario 입력이 하단 접힌 영역에 배치

  ## 관련 파일
  - `client/src/pages/scenario.tsx` (전체 204줄 재작성)
  - `client/src/constants/scenarios.ts` (Ticket 01에서 생성, 메타데이터 추가)
  