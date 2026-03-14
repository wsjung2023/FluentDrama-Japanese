# Ticket 05 — 일본어 앱 정체성 정리

  ## 문제 요약
  코드 곳곳에 영어 학습앱 잔재가 남아 있어 신규 기여자나 AI 툴이 방향을 잘못 잡을 수 있음.

  ### 확인된 잔재 목록
  1. `client/src/store/useAppStore.ts` line 128: `name: 'ai-english-tutor-storage-v2'`
  2. `client/src/pages/Home.tsx` line 36: `"오늘도 재미있는 영어 학습을 시작해보세요!"`
  3. `client/src/pages/Home.tsx` line 104: `"나의 영어 실력 향상을 확인하세요"`
  4. `client/src/pages/drama-scene.tsx` line 256/296: `'English practice'` 하드코딩 문자열

  ## 수정 방법

  ### `client/src/store/useAppStore.ts`
  ```ts
  // line 128
  name: 'fluent-drama-japanese-v1',  // 'ai-english-tutor-storage-v2' → 변경
  ```
  ⚠️ **주의**: persist key 변경 시 기존 로컬스토리지 데이터는 손실됨. 의도된 동작.

  ### `client/src/pages/Home.tsx`
  - line 36: `"오늘도 재미있는 영어 학습을 시작해보세요!"` → `"오늘 어떤 일본어 장면을 연습해볼까요?"`
  - line 104: `"나의 영어 실력 향상을 확인하세요"` → `"나의 일본어 학습 진도를 확인하세요"`
  - line 37 title: `"안녕하세요, {user}님! 👋"` 유지 가능

  ### `client/src/pages/drama-scene.tsx`
  - line 256: `'English practice'` → `'일본어 대화 연습'`
  - line 296: `'English practice'` → `'일본어 대화 연습'`
  - line 274: `"🎭 ${character.name} is speaking!"` → `"🎭 ${character.name}이(가) 말합니다!"`
  - line 275: `"The scene has begun. Listen and respond when ready."` → `"장면이 시작됐습니다. 들으신 후 말씀해주세요."`

  ### 전체 검색 필요
  ```bash
  grep -rn "english\|English tutor\|ai-english" client/src --include="*.ts" --include="*.tsx"
  ```
  결과에서 일본어 앱과 무관한 영어 관련 문구 추가 교체.

  ## 완료 기준
  - `grep -rn "ai-english" client/src` 결과 없음
  - `grep -rn "영어 학습\|영어 실력" client/src` 결과 없음
  - persist key가 `fluent-drama-japanese-v1`으로 변경됨

  ## 관련 파일
  - `client/src/store/useAppStore.ts` (line 128)
  - `client/src/pages/Home.tsx` (lines 36, 104)
  - `client/src/pages/drama-scene.tsx` (lines 256, 274-275, 296)
  