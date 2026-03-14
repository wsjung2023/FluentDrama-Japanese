<!-- 일본어 학습 전용 시나리오 기반 반응형 AI 대화앱 구현을 위한 실행 작업지시서. -->
# Plan 02 실행 작업지시서 — 일본어 학습 시나리오 기반 반응형 AI 대화앱

## 0) 범위 고정 (중요)
- 본 단계의 제품 범위는 **일본어 학습 전용**입니다.
- 영어 학습 기능은 본 작업지시서 범위에서 제외합니다.
- 모든 설계/프롬프트/피드백/자막 기본 언어는 일본어 학습 맥락을 기준으로 합니다.

---

## 1) 목표 정의 (한방에 실패 줄이는 방식)
- 목표: “시나리오 기반 반응형 일본어 대화 + 실시간 튜터링 + 복습”이 하나의 세션 루프로 안정 동작.
- 원칙:
  1. 기능 추가보다 **대화 세션 안정성** 우선.
  2. 프롬프트 품질보다 **API 계약/검증 스키마** 우선.
  3. 신규 기능은 반드시 **Fallback + 운영 체크리스트** 포함.

### 핵심 성공 기준 (출시 전 필수)
- `/api/conversation/start|turn|resume` 3개 엔드포인트 연속 10턴 성공률 99% 이상.
- 대화 응답 평균 지연 2.5초 이하(피크 제외), P95 5초 이하.
- STT 결과 누락/파싱 오류율 1% 이하.
- 세션 저장/복원 실패율 0.5% 이하.

---

## 2) 구현 우선순위 (효율 중심)

### P0 — 대화 코어 안정화 (필수 선행)
1. API 계약 확정
   - `POST /api/conversation/start`
   - `POST /api/conversation/turn`
   - `POST /api/conversation/resume`
2. 공통 스키마 확정
   - 세션 상태, 턴 메시지, 시나리오 메타, 피드백 구조
3. 서버 처리 파이프라인 고정
   - validate → execute → fallback → persist → respond
4. 실패 복구
   - 모델 실패 시 경량 모델 fallback
   - 저장 실패 시 사용자 응답 우선 후 지연 저장 재시도

### P1 — 튜터링 품질 강화
1. 막힘 감지 규칙
   - 침묵 시간, 짧은 반복 응답, 한국어 의존도
2. 즉시 코칭 카드
   - 힌트, 대체 표현, 문장 교정
3. 피드백 저장
   - 정확도/자연스러움/발음 난이도 태그

### P2 — 복습/시나리오 확장
1. 3중 자막(일본어/한국어/독음) 저장
2. 시나리오 생성(씬/캐릭터/목표표현)
3. 세션 복습 화면(오답/교정 문장 재학습)

### P3 — 수익화/운영
1. 플랜별 기능 게이팅(세션 길이, 고급 피드백, 저장 개수)
2. 운영 대시보드(응답 지연, 실패율, 결제/환불 상태)
3. 장애 대응 Runbook 자동화

---

## 3) 파일별 작업지시 (실제 수정 단위)
- `shared/schema.ts`
  - conversation/session/message/feedback 자원 스키마 추가
  - 모든 요청/응답 DTO에 zod 스키마 우선 작성
- `server/routes/aiCoreRoutes.ts`
  - conversation start/turn/resume 계약 분리 및 검증 강화
  - 시나리오/히스토리/speaker enum 강제
- `server/services/openai.ts`
  - 일본어 전용 프롬프트 템플릿 분리
  - conversation/coaching/correction 경로 분리
- `server/services/speech-recognition.ts`
  - STT 표준 응답(text/confidence/segments) 고정
- `client/src/pages/voice-chat.tsx`
  - 상태머신 훅(`useVoiceConversation`) 분리
  - 막힘 감지 UI + 코칭 카드 렌더 분리
- `client/src/pages/drama-scene.tsx`
  - 시나리오 진행/씬 전환 UI 모듈화
- `server/routes/subscriptionRoutes.ts`
  - 일본어 학습 가치 중심 게이팅 규칙 반영

---

## 4) Replit 운영 검증 (매 배포 필수)
1. 인증/세션
   - 로그인, 세션 유지, 로그아웃 확인
2. API 스모크
   - `/api/user`, `/api/conversation/start`, `/api/conversation/turn`
3. 웹훅/결제
   - raw body 순서, 이벤트 수신, 실패 복구
4. 성능
   - 응답 지연(P50/P95), 실패율, fallback 빈도
5. 롤백
   - 롤백 커밋/명령/담당자 즉시 확인 가능 상태 유지

---

## 5) Definition of Done (완료 기준)
- 기능 DoD
  - 핵심 3개 대화 API 계약/검증/저장이 모두 통합 테스트 통과.
- 품질 DoD
  - 지연/실패율이 목표치 내.
- 운영 DoD
  - Replit 점검표(인증/웹훅/결제/롤백) 최신화.
- 문서 DoD
  - 변경 API 계약서와 시나리오 샘플 요청/응답 문서 갱신.
