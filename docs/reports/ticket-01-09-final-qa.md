# Ticket 01~09 최종 QA 체크리스트 (실사용 관점)

- 실행 시각: 2026-03-14 19:26 UTC
- 기준 브랜치 HEAD: `7cbb5a9`

## 1) 빌드/타입 안정성

- [x] `npm test` (내부적으로 `npm run check`) 통과
- [x] `npm run build` 통과

## 2) 회귀 문자열/엔드포인트 검증

- [x] legacy 문구(`ai-english`, `영어 학습`, `영어 실력`, `English practice`) 미검출
- [x] `Math.random()` 학습 피드백 경로 미사용 확인
  - 참고: `client/src/components/ui/sidebar.tsx`의 랜덤 퍼센트 표시는 학습 피드백과 무관
- [x] 클라이언트에서 `/api/conversation-response`, `/api/generate-dialogue` 직접 호출 미검출

## 3) 구조/분리 기준(250~400줄 초과 방지)

- [x] `drama-scene.tsx`: 266줄
- [x] `useConversationSession.ts`: 165줄
- [x] `usePressToRecord.ts`: 125줄
- [x] `Home.tsx`: 94줄
- [x] `scenario.tsx`: 97줄

## 4) Ticket별 최종 확인

- [x] Ticket 01 — 시나리오 키 단일 소스/타입 통합
- [x] Ticket 02 — audience 하드코딩 제거
- [x] Ticket 03 — 대화 API 훅 단일화
- [x] Ticket 04 — 랜덤 점수 제거(Deterministic feedback)
- [x] Ticket 05 — 일본어 앱 정체성 정리
- [x] Ticket 06 — Home Scene-first 리디자인
- [x] Ticket 07 — Scenario 카드 갤러리화
- [x] Ticket 08 — Immersive Studio + press-to-record 마이크 동작
- [x] Ticket 09 — 디자인 토큰/JP폰트/Button variant 반영

## 5) 환경 제한 이슈

- [!] `npm run dev`는 현재 컨테이너에서 `DATABASE_URL` 미설정으로 실행 불가.
- [!] 따라서 백엔드 연동형 E2E 런타임 검증은 DB 환경변수 주입 후 재검증 필요.

## 사용한 커맨드

```bash
git status --short
git log --oneline -5
npm test
npm run build
rg -n "ai-english|영어 학습|영어 실력|English practice|Math\.random\(" client/src server/routes
rg -n "/api/conversation-response|/api/generate-dialogue" client/src
wc -l client/src/pages/drama-scene.tsx client/src/hooks/useConversationSession.ts client/src/hooks/usePressToRecord.ts client/src/pages/Home.tsx client/src/pages/scenario.tsx
npm run dev
```
