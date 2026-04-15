#!/usr/bin/env bash
set -euo pipefail
INPUT="$(cat)"
FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.development"
  ".env.production"
  ".env.staging"
  ".claude/settings.local.json"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
  "bun.lockb"
  "node_modules/"
  "ios/"
  "android/"
  ".expo/"
  "dist/"
  "build/"
  ".eas/"
  ".keystore"
  ".mobileprovision"
  "GoogleService-Info.plist"
  "google-services.json"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: editing protected path '$pattern'. Ask first before changing $FILE_PATH" >&2
    exit 2
  fi
done
exit 0
