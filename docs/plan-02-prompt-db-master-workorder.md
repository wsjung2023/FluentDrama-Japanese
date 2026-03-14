<!-- Prompt governance + DB masterization execution workorder for Replit one-shot handoff -->
# Plan 02 Prompt/DB 마스터화 작업지시서

## 목적
- Replit 운영자가 한 번에 이해할 수 있도록 프롬프트 개선과 DB 마스터화 범위를 단일 문서로 고정.
- 대화 품질 저하/회귀를 막기 위해 프롬프트를 코드 하드코딩에서 템플릿 거버넌스로 전환.
- in-memory fallback 중심 동작을 단계적으로 DB 중심 SSOT(single source of truth)로 이동.

## 이번 턴 즉시 반영 범위
1. `prompt_templates` 테이블 추가 (shared schema)
2. storage 계층에 `getPromptTemplate()` 조회 API 추가 (DB 우선, fallback 지원)
3. `conversation/start`, `conversation/turn`에서 템플릿 적용
   - `conversation_initial_prompt`
   - `conversation_system`
4. 기본 템플릿 fallback 유지(무중단)
5. Admin API 1차 반영 (`GET/PUT/PATCH/DELETE /api/admin/prompt-templates`)

## 다음 턴 연속 작업(즉시 진행 권장)
1. Prompt Admin API CRUD 완성(`GET/POST/PUT/PATCH/DELETE`) 반영 완료
2. Prompt versioning 필드 확장 반영 완료
   - `version`, `description`, `updatedBy`
   - admin upsert payload/store 매핑까지 연결
3. Prompt smoke 강화 일부 반영
   - 플레이스홀더 미치환 감지(start/turn 응답 필드) 반영 완료
   - 템플릿 미존재 시 fallback 여부 검증은 다음 단계
4. 운영 대시보드 연결 반영 완료
   - `GET /api/admin/prompt-templates/summary`로 최신 활성 템플릿 키/버전 조회 가능

## DB 마스터화 우선순위
### P1 (바로 적용)
- Prompt template SSOT: 대화 system/initial prompt를 DB에서 조회

### P2
- Scenario catalog SSOT: scenario별 난이도/목표/금칙 표현 정책 관리

### P3
- Feedback analytics SSOT: accuracy/pronunciation/suggestions를 분리 저장해 품질 분석

## 검증 커맨드
- `npm run check`
- `npm run build`
- `npm test`
- `npm run smoke:conversation`

## 운영 주의
- DB 테이블 미생성 환경에서도 fallback으로 서비스 중단 없이 동작해야 함.
- strict smoke 환경에서는 템플릿 계약 누락을 실패로 전환 예정.
