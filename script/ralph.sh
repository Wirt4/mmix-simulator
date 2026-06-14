#!/bin/bash
set -eo pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

dir="$(cd "$(dirname "$0")" && pwd)"
llm_cmd="$(cat "$dir/llm-config.txt")"

"$dir/llm-loop.sh" "$llm_cmd" "$1"
