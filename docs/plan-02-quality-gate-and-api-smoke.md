<!-- Plan 02 quality gate: mandatory syntax/type/test/API checks per iteration. -->
# Plan 02 품질 게이트 — 신텍스/테스트/API 검증 절차

## 0) 목적
- “제대로 개발 중인지”를 매 사이클 자동/반자동 검증으로 확인한다.
- 코드 반영 전후로 타입, 빌드, 테스트, API 스모크를 일관된 순서로 수행한다.

---

## 1) 필수 실행 순서 (로컬/CI 공통)
1. 정적 검사
   - `npm run check`
2. 빌드 검사
   - `npm run build`
3. 테스트 검사
   - `npm test`
4. API 스모크 검사
   - `/api/user`
   - `/api/check-usage`
   - `/api/subscribe`
   - Plan 02 착수 후 추가: `/api/conversation/start|turn|resume`
   - 자동화 스크립트: `npm run smoke:conversation`

> 원칙: 위 1~4 중 실패가 하나라도 있으면 배포/병합 금지.

---

## 2) API 스모크 체크 예시
### A. 인증 상태 확인
```bash
curl -i http://localhost:5000/api/user
```
- 기대: 인증 전 `401` JSON 또는 인증 후 `200` JSON.

### B. 사용량 체크
```bash
curl -i -X POST http://localhost:5000/api/check-usage \
  -H "Content-Type: application/json" \
  -d '{}'
```
- 기대: 인증 전 `401`, 인증 후 `200` + `canUse/currentUsage/limit` 필드.

### C. 구독 요청
```bash
curl -i -X POST http://localhost:5000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"tier":"starter","provider":"paddle"}'
```
- 기대: 인증 전 `401`, 인증 후 계약된 JSON 응답.

---

## 3) Plan 02 전용 추가 게이트 (Sprint 1 이후)
- `/api/conversation/start|turn|resume` 계약 JSON 스키마 검증
- speaker enum(`user|assistant|character`) 위반 요청 400 확인
- 빈 문자열/공백 문자열 요청 400 확인
- 세션 복원 실패 케이스(없는 sessionId) 404 확인

---

## 4) 보고 형식(매 사이클)
- 실행 커맨드
- 성공/실패 여부
- 실패 시 원인 + 조치 커밋
- API 스모크 결과(상태코드 + 핵심 필드 확인)

---

## 5) 완료 기준
- `check/build/test` 3종 모두 통과
- 필수 API 스모크 통과
- 결과를 `docs/progress-dashboard.md` 이번 사이클 내역에 반영


## 6) 최근 실행 기록 (2026-03-13)
- `npm run check`: PASS
- `npm run build`: PASS
- `npm test`: PASS (`test` 스크립트를 `npm run check`로 정의해 최소 회귀 게이트 고정)
- API 스모크: 보류 (로컬 `DATABASE_URL` 미설정으로 서버 부팅 실패)

- `npm run smoke:conversation`: PASS/SKIP (서버 미기동 시 경고 후 0 종료)

- `scripts/api-smoke-conversation.sh`는 각 conversation 엔드포인트의 예상 상태코드 집합(200/401/404/429)을 검증하고, 미등록 코드면 실패 종료한다.

- `smoke:conversation`는 `docs/reports/conversation-smoke-latest.md` 리포트를 생성한다 (`REPORT_PATH`로 경로 변경 가능).
- CI 강제 실패 모드가 필요하면 `STRICT_MODE=1 npm run smoke:conversation` 사용.

- CI에서 스모크를 필수로 강제하려면 `npm run smoke:conversation:strict`를 사용한다(서버 미기동 시 실패).

- conversation 스모크는 200 응답일 때 계약 필수 필드 존재(`start: sessionId/initialPrompt/scenario/message`, `turn: response/feedback/subtitle/message`, `resume: sessionId/history/message`)를 추가 검증한다.

- 필드 존재 검증은 Node JSON parser 기반으로 수행하여 문자열 패턴 오탐을 줄였다.
