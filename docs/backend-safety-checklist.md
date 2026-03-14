<!-- Replit backend compatibility checklist to prevent breaking auth/session/webhook behavior during refactors. -->
# Backend Safety Checklist (Replit 환경 보호)

## 1. 미들웨어/라우트 순서
- [ ] Stripe 웹훅 라우트가 `express.json()`보다 먼저 등록되어 있는가?
- [ ] 웹훅 라우트에서 raw body를 실제로 사용하고 있는가?
- [ ] CORS/보안 헤더 변경 시 `OPTIONS` 요청이 정상 응답되는가?

## 2. 인증/세션
- [ ] `passport.initialize()`와 `passport.session()` 순서가 유지되는가?
- [ ] `connect-pg-simple` 세션 테이블(`sessions`)과 스키마가 일치하는가?
- [ ] `/api/login`, `/api/callback`, `/api/logout` 플로우를 수동 확인했는가?

## 3. DB/스키마
- [ ] `shared/schema.ts` 변경 시 API 입력/출력 타입 동기화가 되었는가?
- [ ] Drizzle 변경사항을 `db:push` 전에 영향 분석했는가?
- [ ] 기존 컬럼/테이블과 하위호환(점진 마이그레이션) 계획이 있는가?

## 4. 결제
- [ ] 공급자(Paddle/Stripe) 분기 로직과 실패 처리 메시지가 유지되는가?
- [ ] 웹훅 서명 검증 실패 시 로깅과 재처리 전략이 있는가?
- [ ] 구독 취소/갱신 상태가 `users` 및 신규 구독 테이블에 일관 반영되는가?

## 5. 릴리즈 전 검증
- [ ] `npm run check` 통과 여부 확인
- [ ] 핵심 API 스모크 테스트(인증/대화/TTS/결제) 수행
- [ ] 개발(`NODE_ENV=development`)과 운영(`build/start`) 동작 모두 확인
