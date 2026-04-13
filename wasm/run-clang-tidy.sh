#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <file> [file ...]"
  exit 1
fi

FILES=("$@")

CHECKS='-*,clang-analyzer-*,bugprone-*,performance-*'
HEADER_FILTER='^(src|test)/(?!unit/mocks/).*'

# Detect macOS SDK (safe even if not macOS)
SDK_PATH=""
if command -v xcrun >/dev/null 2>&1; then
  SDK_PATH="$(xcrun --show-sdk-path 2>/dev/null || true)"
fi

EXTRA_ARGS=()

if [ -n "$SDK_PATH" ]; then
  EXTRA_ARGS+=(
    --extra-arg-before=--driver-mode=gcc
    --extra-arg-before=-isysroot
    --extra-arg-before="$SDK_PATH"
  )
fi

# If compile_commands.json exists, use it
if [ -f compile_commands.json ]; then
  clang-tidy "${FILES[@]}" \
    -p . \
    --checks="$CHECKS" \
    --header-filter="$HEADER_FILTER" \
    "${EXTRA_ARGS[@]}"
else
  echo "⚠️  No compile_commands.json found, falling back to manual flags"

  clang-tidy "${FILES[@]}" \
    --checks="$CHECKS" \
    --header-filter="$HEADER_FILTER" \
    -- \
    -Isrc/ \
    -Ibuild/mmixlib \
    -Ivendor/unity/src \
    -Ivendor/cmock/src \
    -Itest/unit/mocks \
    ${SDK_PATH:+-isysroot "$SDK_PATH"}
fi
