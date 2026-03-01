# EefEats — Project Instructions

## What This Is

Social recipe platform ("Goodreads for recipes"). Started as a personal recipe book, evolving into a social platform with creators, forking, and subscriptions.

See `openspec/config.yaml` for full project context, tech stack, and build sequence.
See `docs/PRODUCT.md` for current features, product ideas, and roadmap.

## Project Structure

```
src/              → Next.js 14 web app (App Router, Tailwind CSS)
mobile/           → React Native / Expo mobile app (Expo Router)
supabase/         → Database migrations (PostgreSQL + RLS)
openspec/         → ALL planning, specs, and change history (single source of truth)
  specs/          → Permanent per-domain requirements (GIVEN/WHEN/THEN)
  changes/        → Active changes (proposal + design + tasks)
  changes/archive/→ Completed changes
docs/             → PRODUCT.md roadmap and high-level design docs only
```

Both frontends share the same Supabase backend.

## Development Workflow

**Always use the opsx skills for planning and implementation. Never use `docs/plans/`.**

| When you want to... | Use this skill |
|---|---|
| Explore/think through a problem | `opsx:explore` |
| Start a new feature or fix | `opsx:new` |
| Create all artifacts at once | `opsx:ff` (fast-forward) |
| Implement tasks from a change | `opsx:apply` |
| Verify before merging | `opsx:verify` |
| Archive a completed change | `opsx:archive` |
| Continue an in-progress change | `opsx:continue` |

`docs/plans/` is **retired**. Existing files there are historical logs only — do not create new ones.

## Critical Rules

### UI Standards
- **NO emojis** in the app UI. Not in labels, placeholders, headings, buttons, or user-visible strings. Never.
- **Use the shared design system.** Mobile: `mobile/lib/theme.ts`. Web: Tailwind classes.
- **No hardcoded colors** in component files. All colors come from theme tokens or Tailwind config.
- **Mobile-first design.** Big tap targets (44x44pt minimum), high contrast, readable fonts.
- **Professional quality.** Every screen should look polished, not like a developer demo.
- After any UI change, review all affected screens for visual consistency.

### Code Quality
- Keep changes minimal and focused. Don't refactor surrounding code unless asked.
- Don't add features, comments, or error handling beyond what's requested.
- All recipe import paths must produce the same structured data format.
- Recipe extraction: ONLY recipe data. Never life stories, SEO filler, ads, engagement bait.

### Database
- Every new table gets RLS enabled with explicit policies.
- **Never use `using (true)` on ANY policy** — not select, update, or delete. Even read-only exposure of the social graph is a privacy violation.
- Scope writes to `auth.uid()`. Default deny — only grant what's needed.
- Use existing migration numbering convention.
- **Run `rls-auditor` agent on every new migration before committing.** No exceptions.

### Workflow Enforcement Rules (from 2026-02-28 audit — non-negotiable)

1. **Scope every task to a platform explicitly.** Every prompt must say "web only", "mobile only", or "both platforms with parity." Ambiguous scope = incomplete implementation.

2. **Provide the query/RPC signature when asking about data.** When asking to fix or build anything data-related, paste the Supabase query or RPC call. Without it, the implementation guesses and produces type assertion workarounds.

3. **Run `rls-auditor` agent before pushing any migration.** The pre-push hook will block if new `.sql` files are detected. Set `SKIP_RLS_CHECK=1` only after auditor has confirmed the migration is safe.

4. **Every async operation requires three UI states: loading, success, error.** A feature spec is incomplete without specifying what the user sees when the fetch fails. If not specified, Claude will omit the error state.

5. **Write the failing test before writing the fix.** A test written after a crash is a regression test. A test written before the fix is a specification. Only the latter prevents the next bug.

### Platform Parity
- **Both platforms must stay in sync.** Every feature that exists on web must also exist on mobile, and vice versa.
- **Before committing code:** Always run a platform parity check (use the `platform-sync` agent) to verify the change is implemented on both web and mobile. Do not commit web-only or mobile-only changes unless explicitly asked.
- **After implementing a feature on one platform:** Immediately implement the equivalent on the other platform in the same change.
- **Reference parity report:** See `docs/PLATFORM-PARITY.md` for the latest feature comparison. Update it when features ship.

### Product Thinking
- Always consider free vs premium split when designing features.
- Think mobile-first: used in the kitchen with messy hands.
- Invite-first model: trusted users for now, but build policies robust for open signups.
