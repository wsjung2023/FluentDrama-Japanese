<!-- Plan 02 Sprint 1 Definition of Done tracking checklist. -->
# Plan 02 Sprint 1 DoD 체크리스트 (일본어 대화 코어)

## 목적
- Sprint 1 완료 기준을 "체크 가능한 상태"로 고정한다.
- Replit 환경에서도 재현 가능한 최소 검증 기록을 남긴다.

## DoD 항목
- [x] S1-01: conversation API schema(start/turn/resume) 추가
- [x] S1-02: `/api/conversation/start` 구현
- [x] S1-03: `/api/conversation/turn` 구현
- [x] S1-04: `/api/conversation/resume` 구현
- [x] S1-05: conversation session storage 인터페이스 초안
- [x] S1-06: voice-chat 페이지 API 어댑터 반영
- [x] S1-07: 품질 게이트/스모크 절차 문서화 + 실행 스크립트(`smoke:conversation`) + 상태코드 검증 강화 + 200 응답 계약 필수 필드 검증

## 품질 게이트 실행 결과 (최근 사이클)
- `npm run check`: 통과
- `npm run build`: 통과
- `npm test`: 통과 (`test -> npm run check` 스크립트 기준)

## API 스모크 상태
- 환경 제약: `DATABASE_URL` 미설정으로 로컬 서버 기동 불가.
- 조치: DB 환경변수 준비 후 아래 순서로 스모크 재실행.
  1. `/api/conversation/start`
  2. `/api/conversation/turn`
  3. `/api/conversation/resume`
- 기록 원칙: 상태코드 + 핵심 응답 필드(sessionId/response/history) 캡처.


## 스모크 실행 커맨드
- `npm run smoke:conversation`

- 스모크 리포트 파일: `docs/reports/conversation-smoke-latest.md`
- 엄격 모드 커맨드: `npm run smoke:conversation:strict`
