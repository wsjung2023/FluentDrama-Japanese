<!-- Plan 02 Sprint 1 execution taskboard with owner/check/status fields. -->
# Plan 02 Sprint 1 작업보드 — 일본어 대화 코어 구현

## 목적
- Sprint 1 범위를 실제 개발 단위로 쪼개고, 완료/검증 상태를 빠르게 추적한다.

## 작업보드
| ID | 작업 | 대상 파일 | 검증 커맨드 | 상태 |
|---|---|---|---|---|
| S1-01 | conversation API 스키마 추가(start/turn/resume) | `shared/schema.ts` | `npm run check` | DONE |
| S1-02 | `/api/conversation/start` 라우트 추가 | `server/routes/aiCoreRoutes.ts` | `npm run check && npm run build` | DONE |
| S1-03 | `/api/conversation/turn` 라우트 계약 반영 | `server/routes/aiCoreRoutes.ts` | `npm run check && npm run build` | DONE |
| S1-04 | `/api/conversation/resume` 라우트 계약 반영 | `server/routes/aiCoreRoutes.ts` | `npm run check && npm run build` | DONE |
| S1-05 | 대화 저장소 인터페이스 초안 추가 | `server/storage.ts` | `npm run check` | DONE |
| S1-06 | 음성채팅 페이지 API 어댑터 추가 | `client/src/pages/voice-chat.tsx` | `npm run build` | DONE |
| S1-07 | API 스모크 스크립트 초안 작성 | `docs/plan-02-quality-gate-and-api-smoke.md` | 수동 curl 확인 | DONE |

---

## Sprint 1 완료 기준 (재확인)
- `S1-01` ~ `S1-07` 중 필수(P0) 항목 100% 완료.
- `npm run check`, `npm run build` 통과.
- `/api/conversation/start|turn|resume` 스모크 결과 문서화.

## 운영 기록
- 시작일: 2026-03-13
- 종료일: 2026-03-13
- 담당자: Codex
- 주요 리스크: 로컬 DATABASE_URL 미설정으로 실서버 smoke는 SKIP 경로 중심 검증
- 롤백 커밋: 필요 시 `git revert 815dd62`부터 역순 적용


## 진행 메모
- DoD 체크리스트: `docs/plan-02-sprint1-dod-checklist.md`
- 최신 업데이트: S1-07 완료(품질 게이트 문서 반영), S1-01 완료, S1-02 완료, S1-03 완료, S1-04 완료, S1-05 완료, S1-06 완료
- 다음 액션: Sprint 2(실시간 STT/TTS 품질 고도화) 작업계획 확정 및 DB 환경에서 smoke strict 실제 PASS 확보
