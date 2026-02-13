## 1. Project Initialization

- [x] 1.1 Create Next.js 14 project with TypeScript, App Router, Tailwind CSS, and ESLint
- [x] 1.2 Configure Tailwind with mobile-first defaults, system font stack, and sensible base styles
- [x] 1.3 Set up directory structure: `src/app/`, `src/lib/supabase/`, `src/types/`, `supabase/migrations/`
- [x] 1.4 Add `.env.local.example` with required Supabase environment variables

## 2. Supabase Setup

- [x] 2.1 Initialize Supabase CLI config (`supabase init`) and configure `config.toml`
- [x] 2.2 Create SQL migration for `recipes` table with all columns, CHECK constraint on `source_type`, and auto-timestamps
- [x] 2.3 Create SQL migration for `recipe_ingredients` table with FK to recipes (ON DELETE CASCADE) and decimal quantity
- [x] 2.4 Create SQL migration for `recipe_ratings` table with CHECK constraint on rating (1-5), FK to recipes and auth.users
- [x] 2.5 Create SQL migration for `recipe_tags` table with unique constraint on (recipe_id, tag)
- [x] 2.6 Create SQL migration for `recipe_images` table with FK to recipes (ON DELETE CASCADE)
- [x] 2.7 Create SQL migration for RLS policies on all tables (ownership-based read/write)
- [x] 2.8 Generate TypeScript types from Supabase schema (`supabase gen types typescript`)

## 3. Supabase Client Integration

- [x] 3.1 Install `@supabase/ssr` and `@supabase/supabase-js`
- [x] 3.2 Create browser Supabase client (`src/lib/supabase/client.ts`)
- [x] 3.3 Create server Supabase client (`src/lib/supabase/server.ts`)
- [x] 3.4 Create middleware Supabase client (`src/lib/supabase/middleware.ts`)
- [x] 3.5 Add Next.js middleware (`middleware.ts`) for auth session refresh on all routes

## 4. Authentication

- [x] 4.1 Create login page at `src/app/login/page.tsx` with email/password form (no sign-up link)
- [x] 4.2 Implement login Server Action using Supabase Auth `signInWithPassword`
- [x] 4.3 Add error handling for failed login (generic error message, no field-specific hints)
- [x] 4.4 Create authenticated layout at `src/app/(authenticated)/layout.tsx` that redirects to `/login` if not authenticated
- [x] 4.5 Add logout Server Action that clears session and redirects to `/login`
- [x] 4.6 Add logout button to authenticated layout header

## 5. Landing Page & Verification

- [x] 5.1 Create root page (`src/app/page.tsx`) that redirects to `/recipes` if authenticated, `/login` if not
- [x] 5.2 Create placeholder recipes page at `src/app/(authenticated)/recipes/page.tsx` showing "Welcome, [email]" and logout button
- [x] 5.3 Verify full auth flow works: login → see welcome page → logout → redirect to login

## 6. Deployment

- [x] 6.1 Ensure `npm run build` succeeds with zero errors
- [x] 6.2 Configure Vercel project with environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [x] 6.3 Deploy to Vercel and verify login flow works in production
