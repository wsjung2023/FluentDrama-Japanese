# Ticket 01 — 시나리오 키 통합

  ## 문제 요약
  `presets.ts`와 `drama-scene.tsx`가 서로 다른 시나리오 키를 쓰고 있어 선택한 장면이 잘못 연결됨.

  | presets.ts (실제 선택됨) | drama-scene.tsx SCENARIOS (실제 사용됨) |
  |---|---|
  | `travel` | `airport`, `hotel` (travel 없음) |
  | `cafe_order` | `coffee_shop` (cafe_order 없음) |
  | `meeting_opener` | `business_meeting` (meeting_opener 없음) |
  | `cafeteria` ✅ | `cafeteria` ✅ |
  | `club` ✅ | `club` ✅ |

  나머지 presets 키도 drama-scene.tsx SCENARIOS에 없음:
  - student: `homework`, `school_trip`, `new_friend`, `confidence_talk` → SCENARIOS에 없음
  - business: `email_etiquette`, `negotiation_basics`, `small_talk`, `deadline_followup`, `presentation_qa` → SCENARIOS에 없음

  ## 수정 방법

  ### Step 1: `client/src/constants/scenarios.ts` 신규 생성
  모든 시나리오의 단일 소스 오브 트루스.

  ```ts
  export type ScenarioId =
    | 'cafeteria'        // student
    | 'club'             // student
    | 'homework'         // student
    | 'school_trip'      // student
    | 'new_friend'       // student
    | 'confidence_talk'  // student
    | 'travel'           // general (airport + hotel 통합)
    | 'cafe_order'       // general
    | 'job_interview'    // general
    | 'roommate_chat'    // general
    | 'hobby_club'       // general
    | 'presentation_basics' // general
    | 'email_etiquette'  // business
    | 'meeting_opener'   // business
    | 'negotiation_basics' // business
    | 'small_talk'       // business
    | 'deadline_followup' // business
    | 'presentation_qa'; // business

  export interface ScenarioConfig {
    id: ScenarioId;
    background: string;
    situation: string;
    userRole: string;
    characterRole: string;
    objective: string;
  }

  export const SCENARIO_CONFIGS: Record<ScenarioId, ScenarioConfig> = {
    cafeteria: { ... },
    club: { ... },
    travel: {  // 기존 airport + hotel 통합. situation은 "여행 중 공항/호텔 상황"
      background: "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)",
      situation: "공항 체크인 또는 호텔 체크인 상황",
      userRole: "여행자",
      characterRole: "항공사/호텔 직원",
      objective: "일본어로 체크인하고 필요한 것을 요청하기",
    },
    cafe_order: { // 기존 coffee_shop
      background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #654321 100%)",
      situation: "카페에서 음료 주문하기",
      userRole: "손님",
      characterRole: "바리스타",
      objective: "일본어로 음료를 주문하고 캐주얼 대화 나누기",
    },
    meeting_opener: { // 기존 business_meeting
      background: "linear-gradient(135deg, #2F4F4F 0%, #708090 50%, #B0C4DE 100%)",
      situation: "비즈니스 미팅 시작과 자기소개",
      userRole: "프로젝트 담당자",
      characterRole: "시니어 임원",
      objective: "비즈니스 일본어로 회의 오프닝 진행",
    },
    // ... 나머지 모두 추가
  };
  ```

  ### Step 2: `client/src/constants/presets.ts` 수정
  - `SCENARIO_PRESETS` 각 항목의 `key` 값이 `ScenarioId` 타입과 일치하도록 변경
  - 기존 key는 이미 올바름 (travel, cafe_order, meeting_opener 등 presets.ts 기준으로 확정)

  ### Step 3: `client/src/pages/drama-scene.tsx` 수정
  - 파일 상단 `const SCENARIOS: Record<string, ScenarioConfig> = { ... }` 블록 전체 삭제
  - `import { SCENARIO_CONFIGS } from '@/constants/scenarios';` 추가
  - `initializeScene()` 함수에서 `SCENARIOS[scenario.presetKey]` → `SCENARIO_CONFIGS[scenario.presetKey as ScenarioId]` 로 교체
  - 존재하지 않는 키 접근 시 TypeScript 타입 에러 발생하도록 타입 안전성 보장

  ### Step 4: `client/src/store/useAppStore.ts` 선택적 수정
  - `Scenario.presetKey` 타입을 `string` → `ScenarioId | undefined` 로 강화 (선택사항)

  ## 완료 기준
  - `travel` preset 선택 시 drama-scene에서 여행 관련 ScenarioConfig가 로드됨
  - `cafe_order` preset 선택 시 카페 ScenarioConfig 로드됨
  - `meeting_opener` preset 선택 시 비즈니스 미팅 ScenarioConfig 로드됨
  - 존재하지 않는 presetKey는 TypeScript 레벨에서 막히거나 안전한 fallback 처리됨

  ## 관련 파일
  - `client/src/constants/presets.ts` (lines 1-130)
  - `client/src/pages/drama-scene.tsx` (lines 20-78: SCENARIOS 맵 전체 교체 대상)
  - `client/src/store/useAppStore.ts` (line 17: Scenario interface)
  