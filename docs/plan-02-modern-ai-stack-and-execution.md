<!-- Plan 02: production-grade modern AI stack plan for Japanese-first tutor app -->
# Plan 02 확장 실행계획 — 최신 AI 스택 기반 일본어 학습 앱 완성안

## 0. 목적 (문제 재정의)
- 목표는 "동작하는 데모"가 아니라, **상용 수준의 일본어 시나리오 학습 앱** 완성이다.
- 핵심은 아래 4가지를 동시에 만족하는 것:
  1. 일본어 대화 품질(문맥/교정/난이도 제어)
  2. 실시간 음성 UX(STT/TTS 레이턴시)
  3. 멀티모달 확장(이미지/영상 생성)
  4. 운영 안정성(관측/품질게이트/비용통제)

---

## 1. 최신 기술 스택(2026 기준) — 채택안

### 1.1 LLM 대화/튜터링
- Primary: 최신 고성능 멀티모달 LLM(대화/교정/코치/요약 통합)
- Fallback: 경량 모델(무료 플랜/장애 시)
- 설계 원칙:
  - 응답 포맷은 JSON schema 강제
  - 대화 메모리는 "요약 + 최근 N턴" 이중 구조
  - 일본어 교정 출력은 `원문/교정문/이유/대체표현` 고정

### 1.2 STT(음성 인식)
- 실시간 스트리밍 STT 우선(문장 경계 이벤트 지원)
- 일본어 특화 후처리:
  - 불필요 filler 제거
  - 구두점 복원
  - 발화 confidence 저장

### 1.3 TTS(음성 합성)
- 감정/속도 제어 가능한 Neural TTS
- 캐시 전략:
  - 동일 문장/동일 voice 파라미터 캐시
  - 자주 쓰는 튜터 안내문 사전 생성

### 1.4 이미지/영상 생성
- 이미지: 캐릭터 시트/배경 생성 파이프라인 분리
- 영상: Scene-to-clip 방식(짧은 학습 클립 생성)
- 운영 원칙:
  - 생성 요청은 비동기 큐(Job)로 처리
  - 상태 조회 API와 재시도 정책 표준화


### 1.5 2026 멀티모달 공급자 전략 (요청 반영)
- 목표: "리얼 버라이어티 스타일" 일본어 버추얼 캐릭터 앱을 위해 대화/음성/영상 스택을 분리 최적화한다.
- Video 후보군(벤치 운영):
  - Google Gemini Flow 계열(초기 프리비즈/씬 생성 속도 우수 케이스 평가)
  - OpenAI 영상 생성 계열(캐릭터 일관성/지시 추종 성능 평가)
  - xAI Grok 계열(스타일 변주/실험용 백업 트랙)
  - 사용자 요청 툴(예: 나노바나나)도 실험 트랙으로 A/B 비교
- Image 후보군:
  - 캐릭터 시트 고정용 고일관성 이미지 모델
  - 배경/소품 생성용 고속 이미지 모델
- Orchestrator 원칙:
  - "한 공급자 종속" 금지, 기능별 best-of-breed 라우팅
  - 실패 시 fallback provider 자동 전환
  - 장면별 비용 상한(원가 보호) + 품질 하한(학습 경험 보호)

---

## 2. 제품 기능 완성 로드맵 (현실적 순서)

### Milestone A — Conversation v2 (P0)
- /conversation start/turn/resume를 DB 영속화 세션으로 전환
- 일본어 피드백 구조 고정:
  - 문법 교정
  - 자연스러운 대체 표현
  - 발음 포인트
  - 3중 자막(ja/ko/yomigana)
- 성공기준:
  - 세션 복원 정확도 100%
  - 턴당 응답 오류율 < 1%

### Milestone B — Real-time Voice (P0)
- 스트리밍 STT + 저지연 TTS 연결
- "말하기 끊김 감지" + 즉시 코치 카드
- 성공기준:
  - 음성->텍스트 지연 p95 < 1.5s
  - 텍스트->음성 재생 시작 p95 < 1.2s

### Milestone C — Scenario Engine + Image (P1)
- 시나리오 빌더(목표표현/상황/난이도)
- 캐릭터/배경 이미지 생성 워크플로우
- 성공기준:
  - 시나리오 생성 성공률 > 99%
  - 이미지 생성 실패율 < 3%

### Milestone D — Video Micro-Scene (P1)
- 시나리오 핵심턴을 5~15초 영상으로 생성
- 복습용 짧은 클립 자동 저장
- "버추얼 AI 캐릭터 일관성" 체크(헤어/의상/보이스/말투) 자동 점검
- 공급자 라우팅 A/B:
  - Flow 트랙(빠른 씬 제작)
  - OpenAI 트랙(지시 추종/캐릭터 일관성)
  - Grok/기타 실험 트랙(스타일 다양성)
- 성공기준:
  - 작업큐 성공률 > 97%
  - 평균 대기시간 SLA 정의/준수
  - 캐릭터 일관성 자동점수 기준치 이상

### Milestone E — 운영/수익화 (P0)
- 플랜별 기능 게이팅(대화 길이/음성 품질/멀티모달)
- 비용 대시보드(모델/STT/TTS/이미지/영상)
- 성공기준:
  - 사용자당 원가 모니터링 가능
  - 티어별 마진 추적 가능

---

## 3. 백엔드 구조 전환 지시 (필수)
- 현재 in-memory conversation session은 운영용이 아님.
- 전환 필수 항목:
  1. `conversation_sessions` 테이블
  2. `conversation_messages` 테이블
  3. `media_jobs` 테이블(이미지/영상)
  4. `usage_events` 테이블
- 모든 AI 호출은 request-id 기반 추적 로그 남김.

---

## 4. 품질 게이트(강화)
- 기존: check/build/test/smoke
- 추가:
  - Contract test: start/turn/resume 스키마 자동 검증
  - Load test: 동시 대화 세션 p95 지연
  - Cost test: 턴당 토큰/음성 비용 상한
  - Regression set: 일본어 시나리오 50개 고정 벤치

---

## 5. 즉시 실행 작업지시 (다음 2주)
1. Sprint 2 kickoff 문서 확정
2. DB 영속 세션 스키마 + 마이그레이션
3. conversation API를 storage DB 버전으로 교체
4. voice-chat 실시간 STT 어댑터 1차 반영
5. 이미지/영상 job queue + provider routing 초안 추가
6. 버추얼 캐릭터 일관성 점검기(자동 스코어) 추가
7. strict smoke + contract test를 CI required로 승격

---

## 6. 완료 정의(Definition of Product-Ready)
- 일본어 학습 세션이 재시작/복원/복습까지 안정 동작
- 음성 대화 UX가 실시간 체감 수준 도달
- 이미지/영상 생성이 비동기 job으로 운영 가능
- 비용/장애/품질 지표가 대시보드에서 관측 가능
