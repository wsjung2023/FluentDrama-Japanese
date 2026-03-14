<!-- Master config + code standards DB masterization workorder for one-shot Replit execution -->
# Plan 02 Master/코드표준 DB화 작업지시서

## 목표
- 런타임 정책과 코드 표준을 코드 하드코딩/문서 분산 상태에서 DB 기반 SSOT로 전환.
- Replit 운영자가 한 번에 실행/검증할 수 있도록 범위와 순서를 고정.

## 이번 턴 즉시 반영
1. `master_configs` 테이블 추가 (`config_key`, `config_value`, `is_active`)
2. `code_standards` 테이블 추가 (`standard_key`, `category`, `title`, `body`, `severity`, `is_active`)
3. storage 계층 조회 API 추가
   - `getMasterConfig(configKey)`
   - `getCodeStandards(category?)`
4. `conversation/turn`에서 마스터 정책(`conversation.runtime.policy.maxPromptHistoryItems`) 조회/적용
5. Admin API 1차 반영 (`GET/PUT/PATCH/DELETE /api/admin/master-config/:key`, `GET/PUT/PATCH/DELETE /api/admin/code-standards`)

## 적용 가이드
- 기본 동작은 기존 상수 fallback 유지(무중단).
- DB 정책값이 정수/양수일 때만 runtime prompt history limit에 반영.
- 코드표준은 우선 조회 API까지 반영하고, 후속으로 admin CRUD + lint 연계.

## 후속 작업
1. Admin API CRUD 완성(`GET/POST/PUT/PATCH/DELETE`) 반영 완료, 다음은 운영 정책 고도화
2. CI lint gate 연결 (required severity 위반 시 fail)
3. Replit 운영 대시보드에 활성 정책/표준 버전 노출

## 검증
- `npm run check`
- `npm run build`
- `npm test`
- `npm run smoke:conversation`
