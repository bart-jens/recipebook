## Context

This is a greenfield project. There is no existing codebase. We need to set up the full stack from scratch: Next.js frontend, Supabase backend (database + auth + storage), and Vercel deployment. This foundation must support all future recipe features (manual entry, URL import, photo OCR, etc.).

The app serves exactly 2 users (Bart and wife) — no public registration, no multi-tenancy complexity.

## Goals / Non-Goals

**Goals:**
- Working Next.js 14 app with TypeScript and App Router
- Complete database schema in Supabase with all recipe tables
- Email/password auth for 2 pre-created users
- Row Level Security on all tables
- Tailwind CSS configured for mobile-first styling
- Deployed to Vercel with CI working
- Minimal authenticated landing page proving end-to-end stack works

**Non-Goals:**
- Recipe CRUD (that's change #2: add-manual-recipe-entry)
- Any recipe import features (changes #3-5)
- Ratings, search, or filtering (changes #6-7)
- Public-facing pages or registration flow
- Complex CI/CD pipeline beyond basic Vercel deploy

## Decisions

### Next.js 14 with App Router
Use the App Router (not Pages Router) since it's the current standard. Server Components by default, Client Components only where interactivity is needed. This aligns with Vercel's recommended approach.

**Alternative considered**: Pages Router — more mature ecosystem but being phased out. App Router is the future.

### Supabase client strategy
Use `@supabase/ssr` for Next.js integration. Create separate clients for:
- Server Components (read-only, uses cookies)
- Server Actions / Route Handlers (read-write, uses cookies)
- Middleware (for auth session refresh)

**Alternative considered**: `@supabase/auth-helpers-nextjs` — deprecated in favor of `@supabase/ssr`.

### Database migration approach
Use Supabase SQL migrations (in `supabase/migrations/`) managed via Supabase CLI. All schema changes are version-controlled SQL files. This keeps the schema reproducible and reviewable.

**Alternative considered**: Using the Supabase dashboard UI — not version-controlled, not reproducible.

### Auth: pre-created users only
Create the 2 user accounts via Supabase dashboard or seed script. No sign-up UI. The login page is the only public page. Everything else requires authentication.

**Alternative considered**: Self-registration with invite codes — unnecessary complexity for 2 known users.

### Tailwind CSS with mobile-first defaults
Use Tailwind CSS v3 with default breakpoints. Design mobile-first (base styles = mobile), add `md:` and `lg:` for larger screens. Use `inter` or system font stack for readability.

**Alternative considered**: shadcn/ui component library — good but adds complexity for this simple app. Can add later if needed.

### Project structure
```
src/
  app/
    layout.tsx          # Root layout with font, metadata
    page.tsx            # Landing page (redirects to /recipes if authed)
    login/
      page.tsx          # Login form
    (authenticated)/
      layout.tsx        # Auth check wrapper
      recipes/
        page.tsx        # Placeholder for future recipe list
  lib/
    supabase/
      client.ts         # Browser client
      server.ts         # Server Component client
      middleware.ts      # Middleware client
  types/
    database.ts         # Generated Supabase types
middleware.ts           # Auth session refresh
supabase/
  migrations/           # SQL migration files
  config.toml           # Supabase project config
```

### RLS policy approach
Simple ownership-based policies: users can only read/write their own data. All tables with `created_by` or `user_id` get a policy checking `auth.uid() = created_by`. The `recipe_ingredients`, `recipe_tags`, and `recipe_images` tables use a join to `recipes.created_by`.

## Risks / Trade-offs

**[Risk] Supabase types drift from schema** → Generate types with `supabase gen types typescript` after each migration. Add to task checklist.

**[Risk] Auth session expires during cooking** → Supabase sessions last 1 hour by default with auto-refresh. The middleware handles token refresh on each request. Should be fine for normal use.

**[Risk] Over-engineering for 2 users** → Keep it simple. No caching layers, no complex state management, no CDN optimization. These are unnecessary at this scale.

**[Trade-off] Creating all tables upfront vs. incrementally** → Creating all tables now means future changes just add features, not schema. Slight risk of premature schema decisions, but the database design from config.yaml is well-defined.
