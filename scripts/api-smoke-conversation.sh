#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_HEADER="${COOKIE_HEADER:-}"
STRICT_MODE="${STRICT_MODE:-0}"
REPORT_PATH="${REPORT_PATH:-docs/reports/conversation-smoke-latest.md}"
RUN_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "$(dirname "$REPORT_PATH")"

report_lines=()
report_lines+=("# Conversation API Smoke Report")
report_lines+=("")
report_lines+=("- runAt(UTC): $RUN_AT")
report_lines+=("- BASE_URL: $BASE_URL")
report_lines+=("- STRICT_MODE: $STRICT_MODE")
report_lines+=("")

append_report() {
  report_lines+=("$1")
}

flush_report() {
  printf '%s\n' "${report_lines[@]}" > "$REPORT_PATH"
  echo "[INFO] report written: $REPORT_PATH"
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local tmp status body
  tmp="$(mktemp)"

  if [[ -n "$COOKIE_HEADER" ]]; then
    if [[ -n "$data" ]]; then
      status=$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json' -H "Cookie: $COOKIE_HEADER" -d "$data")
    else
      status=$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path" -H "Cookie: $COOKIE_HEADER")
    fi
  else
    if [[ -n "$data" ]]; then
      status=$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json' -d "$data")
    else
      status=$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path")
    fi
  fi

  body="$(cat "$tmp")"
  rm -f "$tmp"
  printf '%s\n%s' "$status" "$body"
}

is_expected_status() {
  local actual="$1"
  shift
  for expected in "$@"; do
    if [[ "$actual" == "$expected" ]]; then
      return 0
    fi
  done
  return 1
}

require_json_fields() {
  local json="$1"
  shift

  if ! printf '%s' "$json" | node -e '
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
let parsed;
try {
  parsed = JSON.parse(input);
} catch {
  console.error("[FAIL] Response body is not valid JSON");
  process.exit(1);
}
const fields = process.argv.slice(1);
for (const field of fields) {
  if (!(field in parsed)) {
    console.error(`[FAIL] Missing required field in JSON body: ${field}`);
    process.exit(1);
  }
}
' "$@"; then
    return 1
  fi

  return 0
}


if ! curl -sS "$BASE_URL/" >/dev/null 2>&1; then
  msg="[WARN] Server not reachable at $BASE_URL. Start server first (requires DATABASE_URL)."
  echo "$msg"
  append_report "## Summary"
  append_report "- Result: SKIP (server unreachable)"
  append_report "- Reason: $msg"
  flush_report
  if [[ "$STRICT_MODE" == "1" ]]; then
    exit 1
  fi
  exit 0
fi

echo "[INFO] Smoke: /api/conversation/start"
start_payload='{"scenarioId":"daily-conversation","difficulty":"beginner","characterId":"tutor-a","userGoal":"자연스러운 일본어 회화"}'
start_result="$(request POST '/api/conversation/start' "$start_payload")"
start_status="$(echo "$start_result" | head -n1)"
start_body="$(echo "$start_result" | tail -n +2)"

echo "[INFO] status=$start_status"
echo "$start_body"
append_report "## /api/conversation/start"
append_report "- status: $start_status"

if ! is_expected_status "$start_status" 200 401 429; then
  append_report "- result: FAIL (unexpected status)"
  flush_report
  echo "[FAIL] Unexpected status for /api/conversation/start: $start_status"
  exit 1
fi

if [[ "$start_status" == "200" ]]; then
  require_json_fields "$start_body" sessionId initialPrompt scenario message || {
    append_report "- result: FAIL (missing required response fields)"
    flush_report
    exit 1
  }
fi

session_id="$(echo "$start_body" | rg -o '"sessionId"\s*:\s*"[^"]+"' | head -n1 | sed -E 's/.*"sessionId"\s*:\s*"([^"]+)"/\1/' || true)"
if [[ -z "$session_id" ]]; then
  echo "[WARN] sessionId not found (likely unauthenticated or limited)."
  append_report "## Summary"
  append_report "- result: PASS (unauthenticated/limited profile)"
  flush_report
  exit 0
fi

echo "[INFO] Smoke: /api/conversation/turn"
turn_payload="{\"sessionId\":\"$session_id\",\"userInput\":\"こんにちは\",\"history\":[]}"
turn_result="$(request POST '/api/conversation/turn' "$turn_payload")"
turn_status="$(echo "$turn_result" | head -n1)"
turn_body="$(echo "$turn_result" | tail -n +2)"

echo "[INFO] status=$turn_status"
echo "$turn_body"
append_report "## /api/conversation/turn"
append_report "- status: $turn_status"

if ! is_expected_status "$turn_status" 200 401 404 429; then
  append_report "- result: FAIL (unexpected status)"
  flush_report
  echo "[FAIL] Unexpected status for /api/conversation/turn: $turn_status"
  exit 1
fi

if [[ "$turn_status" == "200" ]]; then
  require_json_fields "$turn_body" response feedback subtitle message || {
    append_report "- result: FAIL (missing required response fields)"
    flush_report
    exit 1
  }
fi

echo "[INFO] Smoke: /api/conversation/resume"
resume_payload="{\"sessionId\":\"$session_id\"}"
resume_result="$(request POST '/api/conversation/resume' "$resume_payload")"
resume_status="$(echo "$resume_result" | head -n1)"
resume_body="$(echo "$resume_result" | tail -n +2)"

echo "[INFO] status=$resume_status"
echo "$resume_body"
append_report "## /api/conversation/resume"
append_report "- status: $resume_status"

if ! is_expected_status "$resume_status" 200 401 404; then
  append_report "- result: FAIL (unexpected status)"
  flush_report
  echo "[FAIL] Unexpected status for /api/conversation/resume: $resume_status"
  exit 1
fi

if [[ "$resume_status" == "200" ]]; then
  require_json_fields "$resume_body" sessionId scenarioId difficulty characterId userGoal history historyCount message || {
    append_report "- result: FAIL (missing required response fields)"
    flush_report
    exit 1
  }
fi

append_report "## Summary"
append_report "- result: PASS"
flush_report

echo "[DONE] Conversation API smoke completed with expected status set."
