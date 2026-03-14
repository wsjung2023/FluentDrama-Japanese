# Conversation Smoke Test Report

- **Date**: 2026-03-14T20:07:08Z
- **Result**: PASS (12 passed, 0 failed)
- **Server**: http://localhost:5000
- **Test Account**: smoke-1773518828@fluent.jp

| Test | Result |
|------|--------|
| Register returns id | PASS |
| Register excludes password | PASS |
| Login returns id | PASS |
| Login excludes password | PASS |
| GET /api/user returns email | PASS |
| GET /api/user excludes password | PASS |
| conversation/start has sessionId | PASS |
| conversation/start has initialPrompt | PASS |
| conversation/turn has response | PASS |
| conversation/turn has feedback | PASS |
| conversation/turn has subtitle | PASS |
| Logout succeeds | PASS |

## Test Flow
1. Register new account → verify id present, password excluded
2. Login → verify id present, password excluded
3. GET /api/user → verify email present, password excluded
4. POST /api/conversation/start → verify sessionId, initialPrompt
5. POST /api/conversation/turn → verify response, feedback, subtitle
6. POST /api/logout → verify success message
