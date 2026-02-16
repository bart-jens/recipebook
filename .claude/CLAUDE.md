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
openspec/         → Structured development workflow (specs, changes, archives)
docs/             → Product documentation
```

Both frontends share the same Supabase backend.

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
- Never use `using (true)` on update or delete policies.
- Scope writes to `auth.uid()`. Default deny — only grant what's needed.
- Use existing migration numbering convention.

### Platform Parity
- **Both platforms must stay in sync.** Every feature that exists on web must also exist on mobile, and vice versa.
- **Before committing code:** Always run a platform parity check (use the `platform-sync` agent) to verify the change is implemented on both web and mobile. Do not commit web-only or mobile-only changes unless explicitly asked.
- **After implementing a feature on one platform:** Immediately implement the equivalent on the other platform in the same change.
- **Reference parity report:** See `docs/PLATFORM-PARITY.md` for the latest feature comparison. Update it when features ship.

### Product Thinking
- Always consider free vs premium split when designing features.
- Think mobile-first: used in the kitchen with messy hands.
- Invite-first model: trusted users for now, but build policies robust for open signups.
