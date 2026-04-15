#!/usr/bin/env bash
set -euo pipefail
INPUT="$(cat)"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

case "$FILE_PATH" in
  *src/features/*|*app/*)
    echo "Reminder: you touched a feature or route file."
    echo "  - Run /verify-states for any screen you changed"
    echo "  - Run: npm run typecheck && npm run lint && npm run test"
    ;;
  *src/services/*)
    echo "Reminder: service file changed — confirm query keys match .claude/rules/11-queries.md and add/update a unit test."
    ;;
  *src/design/tokens.ts)
    echo "Reminder: design tokens changed — verify every consumer still renders correctly on iPhone SE + 15 Pro + Pixel 7."
    ;;
esac

exit 0
