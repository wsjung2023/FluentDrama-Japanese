<!-- Route module guide for keeping API composition modular and Replit-safe. -->
# Server Routes Guide

## 목적
`server/routes.ts`는 **조립(composition) 전용 엔트리**로 유지하고,
도메인별 라우트 구현은 `server/routes/*` 모듈로 분리합니다.

## 모듈 구성 원칙
- `authUserRoutes.ts`: 회원가입/로그인/로그아웃/현재유저
- `usageRoutes.ts`: 사용량 조회/증가
- `subscriptionRoutes.ts`: 구독/결제
- `adminRoutes.ts`: 관리자 기능
- `savedCharacterRoutes.ts`: 저장 캐릭터 CRUD
- `aiImageRoutes.ts`: 이미지 생성
- `aiCoreRoutes.ts`: 대화/음성 코어
- `aiSupportRoutes.ts`: 번역/발음/음성인식/보조 생성

## 공통 규칙
- 인증 필요 라우트는 `middleware/authGuard.ts`의 `requireAuthenticated` 사용.
- 입력 검증은 `parseOrThrow` + Zod 스키마로 처리.
- 오류 처리/로그는 `getErrorStatus`, `getErrorMessage`, `logError`를 우선 사용.
- API 응답 포맷은 `middleware/ensureJsonResponse.ts`와 충돌하지 않게 JSON 기반 유지.

## Replit 안전 주의
- `setupAuth` 및 세션 관련 초기화 순서를 변경하지 말 것.
- Stripe/Paddle/웹훅/세션 관련 라우트는 미들웨어 순서 영향 범위를 먼저 검토할 것.
