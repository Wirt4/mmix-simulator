#!/bin/bash
set -eo pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

iterations="$1"

for ((i=1; i<=iterations; i++)); do
  echo ""
  echo "****************************************"
  echo "Iteration $i of $iterations"
  echo "****************************************"

  log_file=$(mktemp)
  claude --dangerously-skip-permissions -p "@CLAUDE.md @prd.md @progress.txt \
1. Read progress.txt to see what has been completed. \
2. Find the highest-priority incomplete task from prd.md. \
3. Write failing unit tests for that task. \
4. Implement that single task. \
5. Write unit tests for any code with logic. \
6. Verify: npm run typecheck && npm test. \
7. If tests pass, git add and commit with a conventional commit message (feat:, fix:, test:, refactor:). \
8. Mark the task complete in prd.md (change [ ] to [x]). \
9. Append your progress to progress.txt with what you completed. \
10. If ALL tasks in prd.md are complete, output <promise>COMPLETE</promise>. \
ONLY WORK ON ONE TASK PER ITERATION." | tee "$log_file"

  if grep -q "<promise>COMPLETE</promise>" "$log_file"; then
    rm -f "$log_file"
    echo ""
    echo "✅ PRD complete after $i iterations!"
    exit 0
  fi
  rm -f "$log_file"
done

echo ""
echo "⚠️ Reached $iterations iterations. PRD may not be complete."
