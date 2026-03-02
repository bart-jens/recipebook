#!/bin/bash
# Blocks push when new Supabase migration files are detected,
# until the rls-auditor agent has been confirmed as run.
# Bypass: SKIP_RLS_CHECK=1 git push

NEW_MIGRATIONS=$(git diff HEAD~1 --name-only --diff-filter=A 2>/dev/null | grep "supabase/migrations/.*\.sql$")

if [ -n "$NEW_MIGRATIONS" ]; then
  echo ""
  echo "New migration files detected:"
  echo "$NEW_MIGRATIONS"
  echo ""
  echo "REQUIRED: Run the rls-auditor agent in Claude before pushing."
  echo "  In Claude Code: use the Agent tool with subagent_type=rls-auditor"
  echo ""
  echo "Already done? Bypass with: SKIP_RLS_CHECK=1 git push"
  echo ""
  if [ "$SKIP_RLS_CHECK" != "1" ]; then
    exit 1
  fi
fi
