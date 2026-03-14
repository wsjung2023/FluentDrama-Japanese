# Replit 전달용 핸드오프 (Ticket 01~09 완료본)

이 문서는 **Replit 에이전트/팀에게 바로 전달**할 수 있도록 현재 상태를 짧고 명확하게 정리한 것입니다.

## 1) 현재 상태 한 줄 요약

- Ticket **01~09 구현 완료**(코드 반영 + 타입체크/빌드 통과).
- Ticket 08은 **press-to-record(길게 눌러 녹음)**까지 반영 완료.

## 2) 반영된 핵심 변경

- 시나리오 단일 소스:
  - `client/src/constants/scenarios.ts`
  - `ScenarioId`, `SCENARIO_CONFIGS`, `DAILY_SCENES`
- 대화 엔진 단일화:
  - `client/src/hooks/useConversationSession.ts`
- 마이크 길게 눌러 녹음:
  - `client/src/hooks/usePressToRecord.ts`
  - `client/src/pages/drama-scene.tsx` action bar 연동
- UI 리디자인(씬 중심):
  - `Home.tsx`, `scenario.tsx`, `drama-scene.tsx`, `playground-new.tsx`, `voice-chat.tsx`
- 서버 피드백 결정론화:
  - `server/routes/aiCoreRoutes.ts`의 `computeDeterministicFeedback`
- 디자인 토큰/폰트:
  - `tailwind.config.ts`, `client/src/index.css`, `client/index.html`

## 3) Replit에서 바로 실행할 체크 순서

```bash
npm install
npm test
npm run build
npm run dev
```

## 4) Replit 환경변수 필수

`npm run dev` 전에 아래가 반드시 필요합니다.

- `DATABASE_URL`
- `OPENAI_API_KEY`
- (배포/결제 기능 확인 시) Stripe/Replit connector 관련 값

> 참고: 이전 QA 환경에서는 `DATABASE_URL`이 없어 dev 서버가 기동되지 않았습니다.

## 5) Replit 수동 QA 체크리스트 (빠른 버전)

1. 로그인 후 Home에서 **오늘의 추천 장면**이 보이는지 확인
2. Scenario 페이지 카드에서 레벨/톤/예상시간 표시 확인
3. Drama Scene 진입 후:
   - 헤더/피드/액션바 3-zone 구성 확인
   - 마이크 버튼 **길게 눌러 녹음**, 손 떼면 STT 후 전송되는지 확인
   - 한국어/발음 토글 정상 동작 확인
4. 피드백 카드(Natural/Clear 등) 색상 라벨 표시 확인
5. `/api/conversation/turn` 흐름에서 응답/피드백 정상 수신 확인

## 6) 장애 발생 시 우선 확인

- `DATABASE_URL` 누락 여부
- OpenAI 키 누락/권한 문제
- 브라우저 마이크 권한 차단 여부
- Replit 배포 환경에서 HTTPS/마이크 권한 정책

## 7) 기준 QA 문서

자세한 검증 로그는 아래 문서 참고:

- `docs/reports/ticket-01-09-final-qa.md`
