---
paths:
  - "supabase/**/*.sql"
---

# Supabase / Database Conventions

## Migration Files
- Location: `supabase/migrations/`
- Naming: `YYYYMMDD00000N_descriptive_name.sql` — increment from last existing file
- Use `create table if not exists` for safety
- Use `timestamptz` for all timestamps, default `now()`
- Use `uuid` for all IDs, default `gen_random_uuid()`
- Add indexes on foreign key columns and columns used in WHERE/JOIN clauses

## Row Level Security (RLS)
- Every new table MUST have `alter table ... enable row level security`
- Create explicit policies for every operation the app needs (select, insert, update, delete)
- Default deny: only grant access that's explicitly needed
- Scope all writes to `auth.uid()` — users can only modify their own data
- NEVER use `using (true)` on update or delete policies
- NEVER use `with check (true)` without scoping — allows arbitrary data writes
- For public read access, use explicit `visibility` or `is_public` columns
- Comment every policy explaining its purpose

## Auth
- Uses Supabase Auth — reference current user with `auth.uid()`
- User profiles auto-created via trigger (`20240101000008_auto_create_profile.sql`)
- Invite-first model: invites table controls signups

## Existing Schema
Key tables: `recipes`, `recipe_ingredients`, `recipe_ratings`, `recipe_tags`, `recipe_images`, `user_profiles`, `invites`

Read all existing migrations before writing new ones to understand the current schema.
