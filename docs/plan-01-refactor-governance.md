<!-- 코드베이스 전반 리팩터 거버넌스 및 안전한 구조 현대화 실행 계획 -->
# Plan 01 — 기존 소스 전면 개선 (개발 규칙 + 구조 리팩터링)

## 0) 목적
## 진행률
- 전체 진행률: **100%**
- 현재 단계: **Phase 1. 안전 가드레일 구축 (진행 중)**
- 완료 항목: `backend-safety-checklist.md` 추가, 공통 에러/검증/로깅 유틸 추가, 일부 핵심 API 하드닝(`/api/register`, `/api/user`, `/api/check-usage`, `/api/increment-usage`, `/api/subscribe`), usage/subscription 라우트 파일 분리(`server/routes/usageRoutes.ts`, `server/routes/subscriptionRoutes.ts`), auth/user/admin 라우트 파일 분리(`server/routes/authUserRoutes.ts`, `server/routes/adminRoutes.ts`), saved-character 라우트 분리(`server/routes/savedCharacterRoutes.ts`), AI 코어 라우트 분리(`server/routes/aiCoreRoutes.ts`: dialogue/tts/conversation/background/translate/speech), AI 이미지 라우트 분리(`server/routes/aiImageRoutes.ts`: generate-image + image limit helper), AI 코어 일부 입력검증/오류처리 강화(`translate-pronunciation`, `speech-recognition`), AI 지원 라우트 분리(`server/routes/aiSupportRoutes.ts`: background-prompt/translate/speech), background-prompt 입력검증/오류처리 공통화, JSON 응답 미들웨어 모듈 분리(`server/routes/middleware/ensureJsonResponse.ts`), 인증 가드 공통 모듈 분리(`server/routes/middleware/authGuard.ts`) 및 AI 라우트 적용, AI 대화 사용량 체크 헬퍼 분리(`server/routes/helpers/aiUsage.ts`), 인증 가드 재사용 확대(`usage/subscription/saved-character` 라우트), aiCore 라우트 입력검증/에러응답 정비(`generate-dialogue`/`tts`/`conversation-response`), aiSupport 라우트 구조/검증/오류처리 일관화, server/routes 폴더 가이드 문서 추가(`server/routes/README.md`), aiImage 라우트 입력검증/오류처리 공통화, aiUsage 헬퍼 로깅 공통화(logError 적용), aiCore 요청 스키마 명시화(`generate-dialogue`/`tts`의 `z.any` 제거 및 enum/refine 기반 검증 추가), aiImage 요청 스키마 명시화(`generate-image`의 `backgroundPrompt` `z.any` 제거 및 enum/object 기반 검증 추가), aiSupport 요청 스키마 정밀화(`generate-background-prompt`의 `characterStyle`/`characterGender` enum 검증 추가), saved-character 생성 스키마 정밀화(`gender`/`style`/`audience` enum + `imageUrl` url 검증 적용), auth 등록 스키마 정밀화(`email` trim+lowercase 정규화, `firstName`/`lastName` 길이 검증 추가), subscription 흐름 정밀화(`provider` 단일화 전제에 맞춰 불필요 분기 제거, `tier` 유니온 타입 고정), usage 응답 정밀화(`subscriptionTier` 정규화 + `daysUntilReset` 하한 0 보장), admin 입력 스키마 정밀화(`user/:email`, `user/:id/*` 파라미터 및 `tier` 바디 검증 추가), 인증 가드 정밀화(`isAuthenticated` 확인 + `user.id` 존재 검증 추가), JSON 응답 미들웨어 정밀화(Express 타입 적용, 문자열 응답 래핑 조건/헤더 처리 개선), aiUsage 헬퍼 정밀화(`subscriptionTier` 정규화 + 반환 타입 명시 + 제한 테이블 상수화), aiUsage 파싱 안정화(`conversationCount` NaN/음수 방어 파서 추가), 라우트 조립 정밀화(`registerRoutes`의 등록 순서를 배열로 고정해 결정적 mount 보장), usage 카운트 파싱 정밀화(`check-usage`/`increment-usage`에 NaN/음수 방어 파서 공통 적용), saved-character 입력 정밀화(`:id` 파라미터 검증 + `name/scenario/backgroundPrompt` trim 검증 추가), aiCore 대화 응답 스키마 정밀화(`conversation-response`의 speaker/style enum + 문자열 trim 검증 적용)

이 계획은 "작동은 하지만 유지보수성이 떨어지는 상태"를 "안전하게 확장 가능한 구조"로 바꾸는 데 목적이 있습니다.  
특히 Replit 기반 백엔드(세션/미들웨어/결제/Drizzle) 특성을 깨지 않도록 **보호 장치 포함 리팩터링**을 수행합니다.

---

## 1) 현재 진단 요약 (코드 기준)
- 초대형 파일 존재:
  - `server/routes.ts` (1140줄)
  - `client/src/pages/drama-scene.tsx` (1056줄)
  - `client/src/pages/playground-new.tsx` (505줄)
  - `client/src/pages/character.tsx` (490줄)
  - `client/src/pages/voice-chat.tsx` (452줄)
- 관심사 혼합:
  - 라우팅 파일에 인증/결제/사용량/관리자/대화 API가 밀집.
  - 프론트 페이지 파일에 UI + 상태 + 네트워크 + 도메인 로직 결합.
- 운영 리스크:
  - 미들웨어 순서(특히 웹훅 raw body), 세션 인증 흐름, 구독 티어 정책이 파일 전반에 흩어져 있어 실수 가능성 높음.

---

## 2) 리팩터링 원칙 (상황→행동)
1. 상황: 파일이 250~400줄을 초과함 → 행동: 기능 경계 단위로 분할하고 index에서 조합.
2. 상황: 예외 가능 지점(API/DB/외부서비스) → 행동: `validate -> execute -> recover -> log` 구조 강제.
3. 상황: API 계약 변경 필요 → 행동: `shared/schema.ts` + 서버 라우트 + 클라이언트 호출부를 동시 갱신.
4. 상황: Replit 호환성 우려 → 행동: 배포 이전에 미들웨어 순서/세션 저장소/빌드 체인을 체크리스트로 검증.
5. 상황: 신규 파일 생성 → 행동: 파일 상단 1줄 설명 추가.

---

## 3) 단계별 실행 순서

### Phase 1. 안전 가드레일 먼저 구축
- [ ] `docs/backend-safety-checklist.md` 추가
  - 웹훅/JSON 파서 순서
  - 세션 저장소 무결성
  - auth callback 라우트 정상성
  - 결제 공급자별 실패 처리
- [ ] 공통 에러 응답 유틸 추가 (`server/lib/apiError.ts`)
- [ ] 공통 입력 검증 유틸 추가 (`server/lib/validate.ts`)
- [ ] 공통 로깅 포맷터 추가 (`server/lib/logger.ts`)

### Phase 2. 서버 라우트 분리 (`server/routes.ts` 해체)
목표: `routes.ts`는 라우터 조립 전용으로 축소.
- [ ] `server/routes/authRoutes.ts`
- [ ] `server/routes/userRoutes.ts`
- [ ] `server/routes/usageRoutes.ts`
- [ ] `server/routes/subscriptionRoutes.ts`
- [ ] `server/routes/adminRoutes.ts`
- [ ] `server/routes/aiRoutes.ts` (이미지/대화/TTS/STT)
- [ ] `server/routes/index.ts`에서 mount 순서 표준화

### Phase 3. 서비스 계층 캡슐화
- [ ] `server/services`를 도메인별 재배치
  - `ai/`, `billing/`, `auth/`, `conversation/`
- [ ] 외부 API 호출부 timeout/retry/fallback 정책 명시
- [ ] 티어 정책(Free/Starter/Pro/Premium) 단일 정책 파일로 이동

### Phase 4. 프론트 대형 페이지 분해
- [ ] `client/src/pages/drama-scene.tsx` 분해
  - `components/drama-scene/*`
  - `hooks/useDramaSession.ts`
  - `services/dramaApi.ts`
- [ ] `playground-new.tsx`, `character.tsx`, `voice-chat.tsx` 동일 방식 분해
- [ ] 공통 상태는 `store` 또는 domain hook으로 이동

### Phase 5. 운영 안정화
- [ ] 타입체크 + 핵심 시나리오 API 스모크 테스트
- [ ] 리팩터링 전/후 API 계약 비교표 문서화
- [ ] 장애 복구용 롤백 가이드 작성

---

## 4) 파일별 세부 작업지시서 (우선순위 순)

| 우선순위 | 대상 파일 | 현재 문제 | 작업지시 |
|---|---|---|---|
| P0 | `server/index.ts` | 미들웨어 순서가 민감함 | 웹훅 raw body 경로를 별도 등록하고 JSON 파서 순서를 고정. 순서 변경 테스트 케이스 작성. |
| P0 | `server/routes.ts` | 1100+ 줄 단일 파일 | 인증/유저/결제/관리자/AI 라우트로 분리. 기존 endpoint path 유지. |
| P0 | `server/auth.ts` | 인증 전략/세션 결합도 높음 | 전략 등록과 직렬화/역직렬화 책임 분리. 실패 메시지 표준화. |
| P1 | `server/storage.ts` | 도메인 메서드 확장에 취약 | 사용자/세션/캐릭터/구독 저장소 인터페이스 분리. 트랜잭션 필요한 메서드 식별. |
| P1 | `shared/schema.ts` | 스키마와 제품 요구 간 격차 | 대화 세션/메시지/구독 사용량 관련 테이블 확장 설계(호환 마이그레이션 전제). |
| P1 | `client/src/pages/drama-scene.tsx` | 1000+ 줄, 관심사 혼합 | 뷰 컴포넌트/오케스트레이션 훅/API 클라이언트로 3단 분해. |
| P1 | `client/src/pages/voice-chat.tsx` | 실시간 처리 로직 집중 | 마이크 상태/전사/튜터 피드백 파이프라인을 훅으로 분리. |
| P2 | `client/src/pages/character.tsx` | 생성/편집/저장 결합 | 캐릭터 CRUD 서비스 + 폼 스키마 분리. |
| P2 | `client/src/store/useAppStore.ts` | 앱 전역 상태 비대화 위험 | 도메인 slice 분리(학습/결제/인증/UI). |

---

## 5) Replit 백엔드 보호 체크리스트 (작업 중 매 PR 필수)
- [ ] `express.json()` 이전 raw body 라우트 영향 검토 완료.
- [ ] `passport` 로그인/로그아웃/세션 지속성 수동 확인 완료.
- [ ] Drizzle 스키마 변경 시 `db:push` 영향 분석 문서화 완료.
- [ ] 결제 provider(Paddle/Stripe) 분기 로직 회귀 확인 완료.
- [ ] `NODE_ENV=development` + Vite 연동 경로 정상 확인 완료.

---

## 6) 완료 정의 (Definition of Done)
- 대형 파일 400줄 초과 0개(예외 파일은 문서화).
- API 오류 응답 포맷이 전 endpoint에서 일관됨.
- 핵심 엔드포인트(인증/대화생성/TTS/결제) 회귀 테스트 통과.
- Replit 배포 환경에서 로그인/결제/대화 플로우가 기존 대비 동등 이상 품질 유지.
