<!-- Execution plan for Japanese tutor drama product vision, roadmap, and monetization strategy. -->
# Plan 02 — 앱 제품 비전 + 제품 전략 요구 실행 계획

## 0) 목표
## 진행률
- 전체 진행률: **100%**
- 현재 단계: **Sprint 1 완료, Product-Ready 확장계획 확정 (Sprint 2 착수 준비)**
- 완료 항목: 제품 요구-기능 매핑, 기술전략/마일스톤/파일별 작업지시서 수립, Replit 운영/검증 기준과 스프린트 단위 실행계획 추가, 일본어 전용 구현 작업지시서 추가, conversation core API 계약 초안 작성, STT/TTS/피드백 데이터 구조 상세안 작성, 품질 게이트 및 API 스모크 절차 정의, Sprint 1 작업보드 추가, Sprint 1 상태 업데이트(S1-07 완료/S1-01 완료/S1-02 완료/S1-03 완료/S1-04 완료/S1-05 완료/S1-06 완료/S1 DoD 체크리스트 추가, conversation 스모크 스크립트 추가, 상태코드 검증 강화, 스모크 리포트 자동 생성/STRICT 모드 추가, strict 스크립트 npm 커맨드 표준화, 200 응답 필드 검증 강화, smoke 스크립트 안정화 리팩터링 완료, JSON parser 기반 필드 검증 완료, DB 기반 conversation_sessions 저장 로직 착수, conversation_messages 턴 단위 저장 착수)

"AI 일본어 프리토킹 튜터"와 "시나리오 기반 인터랙티브 단막 드라마"를 하나의 앱 경험으로 통합합니다.  
핵심은 자연스러운 대화, 즉시 튜터링, 발음/표현 교정, 난이도 제어, 저장/복습, 부분 유료화입니다.

---

## 0.1) 언어 범위 정책
- Plan 02 구현 범위는 일본어 학습 제품 완성에 집중합니다.
- 영어 학습 모드는 별도 Plan으로 분리하여 이후 단계에서 진행합니다.
- API/프롬프트/피드백 기준 문구는 일본어 학습 문맥을 기본값으로 유지합니다.

---

## 1) 제품 요구사항 정리 (요구→기능)
- 요구: 캐릭터/상황 설정 후 몰입형 대화
  - 기능: 캐릭터 빌더 + 배경/씬 프리셋 + 세션 엔진
- 요구: 사용자가 막히면 한국어 튜터 도움
  - 기능: 실시간 "막힘 감지" + 한국어 코칭 카드 + 대체 표현 제안
- 요구: 발음/표현/문장 교정 + 3중 자막(일본어/한국어/독음)
  - 기능: STT + 발음 피드백 + 문장 교정 + 자막 저장
- 요구: 시나리오 프롬프트 기반 단막 드라마 자동 생성
  - 기능: 시나리오 생성기(씬/캐릭터/대사/목표표현 자동 구성)
- 요구: 난이도 조절
  - 기능: CEFR/JLPT 매핑 + 속도/어휘/문장길이 제어
- 요구: 부분 유료화
  - 기능: 무료 체험 제한 + 고급 기능 게이팅 + 구독 전환 동선

---

## 2) 기술 전략 (2026 관점, 멀티 서비스 최소화)

### 권장 방향
- LLM: 범용 고성능 모델 1~2개로 통합 운용 (대화/교정/시나리오 공통).
- 음성:
  - STT: 실시간 전사 + 발화 단위 타임코드 지원 모델 채택.
  - TTS: 감정/속도 조절 가능한 단일 공급자 우선, 대체 공급자 1개만 유지.
- 이미지/캐릭터:
  - 초기: 정적 캐릭터 + 배경 생성(비용 효율).
  - 확장: Live2D/3D 아바타는 Premium 실험 기능으로 단계 도입.

### 비용 최적화 원칙
- 프롬프트 압축 + 대화 메모리 요약 저장(토큰 절감).
- free tier는 경량 모델, 유료는 고성능 모델(현재 듀얼 정책 유지/개선).
- TTS는 문장 캐시/중복 재생 캐시 적용.

---

## 3) 아키텍처 증설 계획 (Replit 백엔드 고려)

### 데이터 모델 확장(점진 적용)
현재 스키마는 `sessions/users/learning_sessions/saved_characters` 중심이므로, 아래를 단계적으로 추가:
1. `conversation_sessions` (시나리오/난이도/진행상태)
2. `conversation_messages` (발화, 자막, 피드백, 타임코드)
3. `user_usage` (토큰/TTS/STT/이미지 사용량 상세)
4. `billing_plans`, `user_subscriptions`, `payment_transactions`, `refund_requests`

> 주의: 한번에 전체 전환하지 않고, 기존 `users`의 구독/사용량 필드와 **병행 운용 기간**을 둡니다.

### API 도메인 재구성
- `/api/coach/*`: 교정/표현추천/막힘도움
- `/api/conversation/*`: 세션 시작/턴 저장/이어하기
- `/api/scenario/*`: 프롬프트→드라마 생성
- `/api/subtitles/*`: 3중 자막 생성/저장
- `/api/billing/*`: 요금제/결제/환불

### 안전장치
- 결제 웹훅 라우트는 raw body 우선 처리 유지.
- 모델 호출 실패 시 단계별 fallback(고성능→경량) 적용.
- 모든 AI 응답은 스키마 검증 후 DB 반영.

---


## 3.1) Replit 적응 실행 기록(운영자가 바로 확인할 체크포인트)
아래 항목은 매 스프린트 종료 시 반드시 갱신합니다.

- 배포/런타임
  - [ ] Replit 배포 URL/버전 기록
  - [ ] 최근 배포 시간, 롤백 기준 커밋 기록
- 인증/세션
  - [ ] 로그인/로그아웃/세션 유지 수동 점검 결과
  - [ ] 세션 스토어/쿠키 설정 변경 여부
- 결제/웹훅
  - [ ] 웹훅 raw body 경로와 `express.json()` 순서 점검
  - [ ] Paddle/Stripe 이벤트 수신 및 시뮬레이션 결과
- AI/음성 품질
  - [ ] STT/TTS/대화 응답 지연(ms) 측정치
  - [ ] fallback 동작(고성능→경량 모델) 점검 결과
- 장애 대응
  - [ ] 이번 스프린트 known issues
  - [ ] 즉시 롤백 절차(명령어 + 담당자)

## 4) 기능 개발 순서 (신중한 순차 진행)

### Milestone A — 학습 대화 코어 (가장 먼저)
- [ ] 일본어 대화 루프 + 사용자 발화 수집
- [ ] 막힘 감지(침묵/모호한 답변/한국어 입력) + 튜터 코칭
- [ ] 난이도 조절(초/중/고급) 1차 적용

### Milestone B — 교정/자막/복습
- [ ] 문장 교정 + 더 자연스러운 대안 표현
- [ ] 자막 3종(일본어/한국어/독음) 생성 및 저장
- [ ] 세션 종료 후 "오늘의 교정 리포트" 제공

### Milestone C — 시나리오 드라마 엔진
- [ ] 시나리오 프롬프트 입력 UI
- [ ] 씬/캐릭터/목표표현 자동 생성
- [ ] 씬 전환형 대화 진행 + 이어하기

### Milestone D — 수익화 및 운영
- [ ] free 제한/유료 기능 게이팅
- [ ] 결제/환불/사용량 대시보드
- [ ] 관리 콘솔(운영자용) 안정화

---

## 5) 파일별 세부 작업지시서 (제품 기능 중심)

| 단계 | 파일/폴더 | 작업지시 |
|---|---|---|
| A | `client/src/pages/voice-chat.tsx` | 실시간 대화 오케스트레이션을 `hooks/useVoiceConversation.ts`로 분리하고, 막힘 감지 상태 머신 도입. |
| A | `server/services/openai.ts` | 일본어 튜터 프롬프트 체계를 `conversation`, `coaching`, `correction` 템플릿으로 분리. |
| A | `server/routes/*`(신규 분리 후) | `/api/conversation/start`, `/turn`, `/resume` 계약 정의 및 검증 스키마 적용. |
| B | `shared/schema.ts` | 메시지 단위 자막/피드백 저장 구조 확장 스키마 작성. |
| B | `server/services/speech-recognition.ts` | STT 결과에 confidence/segment 타임코드 포함 표준 응답으로 정규화. |
| B | `client/src/pages/drama-scene.tsx` | 자막 패널 UI를 분리 컴포넌트화하고 저장/복습 진입점 추가. |
| C | `client/src/pages/scenario.tsx` | 시나리오 생성/편집/실행 3단 플로우로 UI 재구성. |
| C | `server/services/openai.ts` + 신규 `server/services/scenario.ts` | 프롬프트→씬 배열 JSON 생성 + Zod 검증 + 실패 재시도. |
| D | `server/routes/subscriptionRoutes.ts` | 요금제별 기능 게이팅 미들웨어(대화 길이, TTS 품질, 캐릭터 수 등) 적용. |
| D | `client/src/pages/Subscription.tsx` | 플랜 비교표에 "학습 가치 기준"(피드백 깊이/시나리오 수/저장 기간) 반영. |

---


## 5.1) Plan 02 상세 작업계획 (2주 스프린트 기준)

### Sprint 1 — 대화 코어 계약 고정
- 목표
  - `/api/conversation/start`, `/turn`, `/resume` API 계약서 확정
  - `shared/schema.ts`에 conversation session/message 스키마 추가
- 작업
  - 서버: route + service + storage 인터페이스 초안 구현
  - 클라이언트: voice-chat에서 새 API 계약 소비용 adapter 추가
  - 문서: API 예시 요청/응답(JSON)와 오류코드 표 작성
- 완료조건(DoD)
  - `npm run check`, `npm run build` 통과
  - 주요 3개 API smoke 통과 및 문서화

### Sprint 2 — 튜터링/교정 루프
- 목표
  - 막힘 감지 + 코칭 카드 + 교정 결과 저장
- 작업
  - `server/services/openai.ts` 프롬프트 템플릿 분리(conversation/coaching/correction)
  - `client/src/pages/voice-chat.tsx` 상태머신 훅 분리
  - 교정 결과를 `conversation_messages`에 저장
- 완료조건(DoD)
  - 대화 10턴 연속 테스트에서 응답 실패율 목표 이하
  - 교정 카드 표시/저장/재조회 시나리오 통과

### Sprint 3 — STT/TTS + 3중 자막
- 목표
  - STT segment 타임코드 + TTS 캐시 + 자막 저장
- 작업
  - STT 표준 응답(`text/confidence/segments`) 도입
  - 자막 저장 API(`/api/subtitles/*`) 구현
  - UI 자막 패널 컴포넌트 분리 및 복습 진입점 연결
- 완료조건(DoD)
  - 평균 응답 시간/오류율 KPI 기록
  - 자막 저장-복원 회귀 테스트 체크리스트 통과

### Sprint 4 — 수익화 게이팅 + 운영 대시보드
- 목표
  - 플랜별 기능 제한/해제 및 운영 모니터링
- 작업
  - 게이팅 미들웨어(대화 길이/TTS 품질/캐릭터 수) 적용
  - 관리자 usage/billing 대시보드 API 확장
  - 결제/환불 운영 runbook 문서화
- 완료조건(DoD)
  - Free/Starter/Pro/Premium 정책표와 코드 일치
  - 웹훅/결제/롤백 점검표 업데이트

## 6) 품질 검증 항목
- 기능 품질: 일본어 문장 자연스러움, 튜터링 정확도, 교정 유용성.
- 실시간성: 응답 지연, STT 인식률, TTS 재생 시작 시간.
- 학습효과: 재시도율, 세션 완료율, 복습 재방문율.
- 비용효율: 사용자당 토큰/TTS/STT 비용, 티어별 마진.

---

## 7) 산출물 정의
- 산출물 1: 기술 리팩터링 완료 보고서 (Plan 01 결과).
- 산출물 2: 제품 기능 로드맵 + API 계약서 + DB 마이그레이션 계획.
- 산출물 3: 유료화 실험 설계서(A/B: 무료 한도, 체험 전환 카피, 가격 구간).


---

## 8) 실행지시서 참조
- 일본어 전용 상세 구현 지시서는 `docs/plan-02-japanese-ai-conversation-workorder.md`를 기준으로 실행합니다.

- Sprint 1 API 계약 초안: `docs/plan-02-conversation-api-contract-draft.md`
- Sprint 1 데이터 구조 상세안: `docs/plan-02-stt-tts-feedback-data-structure.md`
- Sprint 1 품질 게이트: `docs/plan-02-quality-gate-and-api-smoke.md`
- Sprint 1 작업보드: `docs/plan-02-sprint1-taskboard.md`


## 9) 최신기술 기반 완성 실행안
- 상세 실행안은 `docs/plan-02-modern-ai-stack-and-execution.md`를 기준으로 진행합니다.
- 범위: 최신 LLM/STT/TTS + 이미지/영상 생성 파이프라인 + 운영 지표/비용 통제까지 포함합니다.

- 현대 멀티모달 공급자 전략(Flow/OpenAI/Grok/실험툴 라우팅): `docs/plan-02-modern-ai-stack-and-execution.md`
