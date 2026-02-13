## Why

This is the first step in building the digital recipe book. Before any recipe features can be built, we need the foundational project infrastructure: a working Next.js app with Supabase for auth and database, deployed to Vercel, with the complete database schema in place. Everything in the build sequence depends on this.

## What Changes

- Initialize Next.js 14 project with TypeScript and App Router
- Set up Supabase project with PostgreSQL database
- Create all database tables and relationships (recipes, ingredients, ratings, tags, images)
- Configure Supabase Auth with email/password for 2 pre-created users
- Set up Row Level Security policies so each user can only access their own data
- Configure Tailwind CSS for mobile-first styling
- Deploy to Vercel with environment variables
- Create a minimal authenticated landing page (proves the full stack works end-to-end)

## Capabilities

### New Capabilities
- `project-setup`: Next.js project initialization, Tailwind config, project structure conventions
- `database-schema`: Supabase PostgreSQL schema for all recipe-related tables with RLS policies
- `auth`: Email/password authentication for 2 users, session management, protected routes

### Modified Capabilities
<!-- None - this is the first change -->

## Impact

- Creates the entire project from scratch (new repo contents)
- External dependencies: Supabase project, Vercel project, environment variables for both
- All subsequent changes in the build sequence depend on this foundation
