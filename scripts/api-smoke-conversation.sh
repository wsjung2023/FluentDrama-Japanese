#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
REPORT_PATH="${REPORT_PATH:-docs/reports/conversation-smoke-latest.md}"
COOKIE_JAR="/tmp/smoke_cookies_$$.txt"
RUN_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
UNIQUE_EMAIL="smoke-$(date +%s)@fluent.jp"

mkdir -p "$(dirname "$REPORT_PATH")"
cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

PASS=0
FAIL=0
RESULTS=""

check() {
  local name="$1" ok="$2"
  if [ "$ok" = "true" ]; then
    PASS=$((PASS + 1))
    RESULTS="${RESULTS}\n| ${name} | PASS |"
    echo "  [PASS] $name"
  else
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}\n| ${name} | FAIL |"
    echo "  [FAIL] $name"
  fi
}

json_has_field() {
  echo "$1" | node -e "
    const d=require('fs').readFileSync(0,'utf8');
    try { const o=JSON.parse(d); process.exit(('$2' in o)?0:1); }
    catch { process.exit(1); }
  " 2>/dev/null
}

json_missing_field() {
  ! json_has_field "$1" "$2"
}

echo "=== FluentDrama Japanese E2E Smoke Test ==="
echo "Server: $BASE_URL"
echo "Time: $RUN_AT"
echo ""

if ! curl -sS "$BASE_URL/" >/dev/null 2>&1; then
  echo "[ERROR] Server not reachable at $BASE_URL"
  cat > "$REPORT_PATH" <<EOF
# Conversation Smoke Test Report
- **Date**: $RUN_AT
- **Result**: FAIL (server unreachable)
EOF
  exit 1
fi

echo "--- Step 1: Register ($UNIQUE_EMAIL) ---"
REG=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Test1234!\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}" 2>&1)

check "Register returns id" "$(json_has_field "$REG" "id" && echo true || echo false)"
check "Register excludes password" "$(json_missing_field "$REG" "password" && echo true || echo false)"

echo ""
echo "--- Step 2: Login ---"
LOGIN=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Test1234!\"}" 2>&1)

check "Login returns id" "$(json_has_field "$LOGIN" "id" && echo true || echo false)"
check "Login excludes password" "$(json_missing_field "$LOGIN" "password" && echo true || echo false)"

echo ""
echo "--- Step 3: GET /api/user ---"
USER=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/user" 2>&1)

check "GET /api/user returns email" "$(json_has_field "$USER" "email" && echo true || echo false)"
check "GET /api/user excludes password" "$(json_missing_field "$USER" "password" && echo true || echo false)"

echo ""
echo "--- Step 4: POST /api/conversation/start ---"
START=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/conversation/start" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"travel","difficulty":"beginner","characterId":"テスト先生","userGoal":"旅行会話"}' 2>&1)

check "conversation/start has sessionId" "$(json_has_field "$START" "sessionId" && echo true || echo false)"
check "conversation/start has initialPrompt" "$(json_has_field "$START" "initialPrompt" && echo true || echo false)"

SESSION_ID=$(echo "$START" | node -e "
  const d=require('fs').readFileSync(0,'utf8');
  try { console.log(JSON.parse(d).sessionId || ''); } catch { console.log(''); }
" 2>/dev/null || true)

echo ""
echo "--- Step 5: POST /api/conversation/turn ---"
if [ -n "$SESSION_ID" ]; then
  TURN=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/conversation/turn" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"userInput\":\"すみません、東京駅への行き方を教えてください。\",\"history\":[{\"speaker\":\"assistant\",\"text\":\"こんにちは\"},{\"speaker\":\"user\",\"text\":\"すみません、東京駅への行き方を教えてください。\"}]}" 2>&1)

  check "conversation/turn has response" "$(json_has_field "$TURN" "response" && echo true || echo false)"
  check "conversation/turn has feedback" "$(json_has_field "$TURN" "feedback" && echo true || echo false)"
  check "conversation/turn has subtitle" "$(json_has_field "$TURN" "subtitle" && echo true || echo false)"
else
  check "conversation/turn has response" "false"
  check "conversation/turn has feedback" "false"
  check "conversation/turn has subtitle" "false"
fi

echo ""
echo "--- Step 6: POST /api/logout ---"
LOGOUT=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/logout" \
  -H "Content-Type: application/json" 2>&1)
check "Logout succeeds" "$(json_has_field "$LOGOUT" "message" && echo true || echo false)"

VERDICT="PASS"
[ "$FAIL" -gt 0 ] && VERDICT="FAIL"

cat > "$REPORT_PATH" <<EOF
# Conversation Smoke Test Report

- **Date**: $RUN_AT
- **Result**: $VERDICT ($PASS passed, $FAIL failed)
- **Server**: $BASE_URL
- **Test Account**: $UNIQUE_EMAIL

| Test | Result |
|------|--------|$(echo -e "$RESULTS")

## Test Flow
1. Register new account → verify id present, password excluded
2. Login → verify id present, password excluded
3. GET /api/user → verify email present, password excluded
4. POST /api/conversation/start → verify sessionId, initialPrompt
5. POST /api/conversation/turn → verify response, feedback, subtitle
6. POST /api/logout → verify success message
EOF

echo ""
echo "=== Result: $VERDICT ($PASS passed, $FAIL failed) ==="
echo "Report: $REPORT_PATH"

[ "$FAIL" -gt 0 ] && exit 1
exit 0
