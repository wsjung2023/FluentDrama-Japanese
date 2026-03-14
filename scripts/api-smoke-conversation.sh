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
if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
  console.error("[FAIL] Response body must be a JSON object");
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


validate_no_unresolved_placeholders() {
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
const hasPlaceholder = (value) => {
  if (typeof value !== "string") return false;
  return /\{\{\s*[^{}]+\s*\}\}/.test(value);
};
const getPathValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    if (key === "*") {
      return Array.isArray(acc) ? acc : undefined;
    }
    return acc[key];
  }, obj);
};
const fields = process.argv.slice(1);
for (const field of fields) {
  const value = getPathValue(parsed, field);
  if (Array.isArray(value)) {
    for (const [idx, item] of value.entries()) {
      if (hasPlaceholder(item)) {
        console.error(`[FAIL] Unresolved placeholder found in ${field}[${idx}]`);
        process.exit(1);
      }
    }
  } else if (hasPlaceholder(value)) {
    console.error(`[FAIL] Unresolved placeholder found in ${field}`);
    process.exit(1);
  }
}
' "$@"; then
    return 1
  fi

  return 0
}

validate_resume_history_count() {
  local json="$1"
  local expected_session_id="${2:-}"
  local expected_scenario_id="${3:-}"
  local expected_character_id="${4:-}"
  local expected_difficulty="${5:-}"
  local expected_user_goal="${6:-}"

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
if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
  console.error("[FAIL] resume response body must be a JSON object");
  process.exit(1);
}
const normalize = (value) => typeof value === "string" ? value.trim() : "";
const expectedSessionId = normalize(process.argv[1] || "");
if (expectedSessionId && normalize(parsed.sessionId) !== expectedSessionId) {
  console.error(`[FAIL] resume.sessionId mismatch: expected ${expectedSessionId}, got ${parsed.sessionId}`);
  process.exit(1);
}
const expectedScenarioId = normalize(process.argv[2] || "");
if (expectedScenarioId && normalize(parsed.scenarioId) !== expectedScenarioId) {
  console.error(`[FAIL] resume.scenarioId mismatch: expected ${expectedScenarioId}, got ${parsed.scenarioId}`);
  process.exit(1);
}
const expectedCharacterId = normalize(process.argv[3] || "");
if (expectedCharacterId && normalize(parsed.characterId) !== expectedCharacterId) {
  console.error(`[FAIL] resume.characterId mismatch: expected ${expectedCharacterId}, got ${parsed.characterId}`);
  process.exit(1);
}
const expectedDifficulty = normalize(process.argv[4] || "");
if (expectedDifficulty && normalize(parsed.difficulty) !== expectedDifficulty) {
  console.error(`[FAIL] resume.difficulty mismatch: expected ${expectedDifficulty}, got ${parsed.difficulty}`);
  process.exit(1);
}
const expectedUserGoal = normalize(process.argv[5] || "");
if (expectedUserGoal && normalize(parsed.userGoal) !== expectedUserGoal) {
  console.error(`[FAIL] resume.userGoal mismatch: expected ${expectedUserGoal}, got ${parsed.userGoal}`);
  process.exit(1);
}
if (!Array.isArray(parsed.history)) {
  console.error("[FAIL] resume.history must be an array");
  process.exit(1);
}
if (typeof parsed.sessionId !== "string" || parsed.sessionId.trim().length === 0) {
  console.error("[FAIL] resume.sessionId must be a non-empty string");
  process.exit(1);
}
if (typeof parsed.scenarioId !== "string" || parsed.scenarioId.trim().length === 0) {
  console.error("[FAIL] resume.scenarioId must be a non-empty string");
  process.exit(1);
}
if (!["beginner", "intermediate", "advanced"].includes(parsed.difficulty)) {
  console.error(`[FAIL] resume.difficulty invalid: ${parsed.difficulty}`);
  process.exit(1);
}
if (typeof parsed.characterId !== "string" || parsed.characterId.trim().length === 0) {
  console.error("[FAIL] resume.characterId must be a non-empty string");
  process.exit(1);
}
if (typeof parsed.userGoal !== "string" || parsed.userGoal.trim().length === 0) {
  console.error("[FAIL] resume.userGoal must be a non-empty string");
  process.exit(1);
}
if (typeof parsed.message !== "string" || parsed.message.trim().length === 0) {
  console.error("[FAIL] resume.message must be a non-empty string");
  process.exit(1);
}
if (!Number.isInteger(parsed.history.length)) {
  console.error("[FAIL] resume.history length is invalid");
  process.exit(1);
}
if (typeof parsed.historyCount !== "number") {
  console.error("[FAIL] resume.historyCount must be a number");
  process.exit(1);
}
if (!Number.isInteger(parsed.historyCount) || parsed.historyCount < 0) {
  console.error(`[FAIL] resume.historyCount must be a non-negative integer, got ${parsed.historyCount}`);
  process.exit(1);
}
if (parsed.history.length !== parsed.historyCount) {
  console.error(`[FAIL] resume.historyCount mismatch: expected ${parsed.history.length}, got ${parsed.historyCount}`);
  process.exit(1);
}
if (parsed.historyCount > 120) {
  console.error(`[FAIL] resume.historyCount exceeds cap(120): ${parsed.historyCount}`);
  process.exit(1);
}
if (parsed.historyCount === 0 && parsed.restoredFrom === "messages") {
  console.error("[FAIL] resume.historyCount=0 is not allowed when restoredFrom=messages");
  process.exit(1);
}
let previousTimestamp = 0;
let maxHistoryTimestamp = 0;
for (const [index, item] of parsed.history.entries()) {
  if (!item || typeof item !== "object") {
    console.error(`[FAIL] resume.history[${index}] must be an object`);
    process.exit(1);
  }
  if (!["user", "assistant", "character"].includes(item.speaker)) {
    console.error(`[FAIL] resume.history[${index}].speaker invalid: ${item.speaker}`);
    process.exit(1);
  }
  if (typeof item.text !== "string" || item.text.trim().length === 0) {
    console.error(`[FAIL] resume.history[${index}].text must be a non-empty string`);
    process.exit(1);
  }
  if (typeof item.timestamp !== "number" || !Number.isFinite(item.timestamp) || item.timestamp <= 0) {
    console.error(`[FAIL] resume.history[${index}].timestamp must be a positive number`);
    process.exit(1);
  }
  if (!Number.isInteger(item.timestamp)) {
    console.error(`[FAIL] resume.history[${index}].timestamp must be an integer epoch ms value`);
    process.exit(1);
  }
  if (item.timestamp < 1000000000000) {
    console.error(`[FAIL] resume.history[${index}].timestamp appears to be non-ms epoch: ${item.timestamp}`);
    process.exit(1);
  }
  if (item.timestamp < previousTimestamp) {
    console.error(`[FAIL] resume.history timestamp order is not non-decreasing at index ${index}`);
    process.exit(1);
  }
  previousTimestamp = item.timestamp;
  if (item.timestamp > maxHistoryTimestamp) {
    maxHistoryTimestamp = item.timestamp;
  }
  const now = Date.now();
  if (item.timestamp > now + 5 * 60 * 1000) {
    console.error(`[FAIL] resume.history[${index}].timestamp is too far in the future: ${item.timestamp} > ${now}`);
    process.exit(1);
  }
}
if (!["messages", "session"].includes(parsed.restoredFrom)) {
  console.error(`[FAIL] resume.restoredFrom must be one of messages/session, got ${parsed.restoredFrom}`);
  process.exit(1);
}
if (parsed.restoredFrom === "messages" && parsed.historyCount === 0) {
  console.error("[FAIL] resume.restoredFrom=messages requires non-empty historyCount");
  process.exit(1);
}
if (parsed.restoredFrom === "session" && parsed.historyCount > 0 && parsed.history[0]?.timestamp <= 0) {
  console.error("[FAIL] resume.restoredFrom=session has invalid first history timestamp");
  process.exit(1);
}
if (typeof parsed.restoredAt !== "number" || !Number.isFinite(parsed.restoredAt) || parsed.restoredAt <= 0) {
  console.error(`[FAIL] resume.restoredAt must be a positive number, got ${parsed.restoredAt}`);
  process.exit(1);
}
if (!Number.isInteger(parsed.restoredAt)) {
  console.error(`[FAIL] resume.restoredAt must be an integer epoch ms value, got ${parsed.restoredAt}`);
  process.exit(1);
}
if (parsed.restoredAt < 1000000000000) {
  console.error(`[FAIL] resume.restoredAt appears to be non-ms epoch: ${parsed.restoredAt}`);
  process.exit(1);
}
if (maxHistoryTimestamp > 0 && parsed.restoredAt < maxHistoryTimestamp) {
  console.error(`[FAIL] resume.restoredAt must be >= latest history timestamp: ${parsed.restoredAt} < ${maxHistoryTimestamp}`);
  process.exit(1);
}
const now = Date.now();
if (parsed.restoredAt > now + 5 * 60 * 1000) {
  console.error(`[FAIL] resume.restoredAt is too far in the future: ${parsed.restoredAt} > ${now}`);
  process.exit(1);
}
' "$expected_session_id" "$expected_scenario_id" "$expected_character_id" "$expected_difficulty" "$expected_user_goal"; then
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

  validate_no_unresolved_placeholders "$start_body" initialPrompt message || {
    append_report "- result: FAIL (unresolved placeholder in start payload)"
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

  validate_no_unresolved_placeholders "$turn_body" response subtitle message feedback.suggestions || {
    append_report "- result: FAIL (unresolved placeholder in turn payload)"
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
  require_json_fields "$resume_body" sessionId scenarioId difficulty characterId userGoal history historyCount restoredFrom restoredAt message || {
    append_report "- result: FAIL (missing required response fields)"
    flush_report
    exit 1
  }

  validate_resume_history_count "$resume_body" "$session_id" "daily-conversation" "tutor-a" "beginner" "자연스러운 일본어 회화" || {
    append_report "- result: FAIL (resume payload invariant violation)"
    flush_report
    exit 1
  }
fi

append_report "## Summary"
append_report "- result: PASS"
flush_report

echo "[DONE] Conversation API smoke completed with expected status set."
