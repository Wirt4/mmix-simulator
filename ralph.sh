#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

if [ -z "$RALPH_IN_SANDBOX" ]; then
  exec docker run --rm -it \
    -v "$PWD:/work" \
    -v "$HOME/.claude:/root/.claude" \
    -v "$HOME/.gitconfig:/root/.gitconfig:ro" \
    -w /work \
    -e RALPH_IN_SANDBOX=1 \
    node:22 \
    bash -c "npm i -g @anthropic-ai/claude-code >/dev/null && bash ralph.sh $1"
fi

iterations="$1"

for ((i=1; i<=iterations; i++)); do
  echo ""
  echo "****************************************"
  echo "Iteration $i of $iterations"
  echo "****************************************"

  result=$(claude --dangerously-skip-permissions -p "@CLAUDE.md @PRD.md @progress.txt \
1. Read progress.txt to see what has been completed. \
2. Find the highest-priority incomplete task from PRD.md. \
3. Write failing unit tests for that task. \
4. Implement that single task. \
5. Write unit tests for any code with logic. \
6. Verify: npm run typecheck && npm test. \
7. If tests pass, git add and commit with a conventional commit message (feat:, fix:, test:, refactor:). \
8. Mark the task complete in PRD.md (change [ ] to [x]). \
9. Append your progress to progress.txt with what you completed. \
10. If ALL tasks in PRD.md are complete, output <promise>COMPLETE</promise>. \
ONLY WORK ON ONE TASK PER ITERATION.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "✅ PRD complete after $i iterations!"
    exit 0
  fi
done

echo ""
echo "⚠️ Reached $iterations iterations. PRD may not be complete."
