<!-- Persistent project memory for coding rules and architecture guardrails across conversations. -->
# Project Memory (항상 유지할 핵심 메모)

## 개발 규칙 (Vibe Coding Guide)
- 상황: 파일이 250~400줄을 넘기기 시작함 → 행동: 기능 단위로 분리한다 (`api`, `service`, `ui`, `hook`, `utils` 등).
- 상황: 외부 API/DB/결제/파일/네트워크 호출이 있음 → 행동: 실패 대비 안전장치(입력 검증, timeout, fallback, 로깅, 사용자 메시지)를 넣는다.
- 상황: 새 파일 생성 → 행동: 파일 최상단에 한 줄 설명을 작성한다.
- 상황: 한 파일에 기능이 과도하게 몰림 (`App.tsx` 등) → 행동: 책임 분리를 먼저 설계하고 화면/상태/비즈니스 로직을 분리한다.
- 상황: 폴더가 생기거나 책임이 커짐 → 행동: 해당 폴더에 `README.md` 또는 `GUIDE.md`를 추가한다.
- 상황: 같은 기능을 여러 군데 중복 구현하려고 함 → 행동: 공통 모듈로 캡슐화해 단일 진실 공급원(SSOT)으로 유지한다.

## Replit 백엔드 보호 원칙
- 상황: 서버 미들웨어 순서를 변경하려 함 → 행동: Stripe 웹훅 raw body 요구사항과 `express.json()` 순서를 먼저 검증한다.
- 상황: 세션/인증 수정이 필요함 → 행동: `passport`, `express-session`, `connect-pg-simple`, `users/sessions` 스키마 호환성을 먼저 확인한다.
- 상황: DB 스키마 확장/정리 필요 → 행동: Drizzle 스키마 + 마이그레이션 + 저장소 계층(storage) + API 계약을 함께 수정한다.
- 상황: 결제 구조 변경 필요 → 행동: 기존 Paddle/Stripe 라우트 영향 범위를 문서화하고 점진적으로 전환한다.

## 제품 방향 메모
- 일본어 학습 중심 전환: 캐릭터 대화, 실시간 튜터링, 발음/표현 피드백, 다국어 자막 저장.
- 시나리오 기반 단막 드라마 생성: 사용자 프롬프트 → 씬/캐릭터/대화 자동 생성.
- 난이도 조절 + 향후 부분 유료화(Free/Starter/Pro/Premium) 고려.


## Replit 인수인계/적응 메모 (운영 즉시 확인용)
- 매 배포 시 아래 5가지를 남긴다:
  1) 배포 커밋 SHA / 배포 시각 / 담당자
  2) 인증 점검 결과(로그인, 세션 지속, 로그아웃)
  3) 결제·웹훅 점검 결과(raw body 순서 포함)
  4) 핵심 API smoke 결과(`/api/user`, `/api/check-usage`, `/api/subscribe`)
  5) 장애 시 롤백 커밋과 실행 명령어
- Plan 02 구현 시에는 스프린트 종료마다 `docs/plan-02-product-vision-strategy.md`의 Replit 적응 실행 기록을 반드시 갱신한다.

- Plan 02 현재 우선순위는 일본어 학습 제품 완성으로 고정하며, 영어 학습 모드는 별도 계획으로 분리한다.

- Plan 02 개발 사이클마다 `npm run check`, `npm run build`, `npm test`, 필수 API 스모크를 순서대로 실행하고 결과를 대시보드에 기록한다.
