-- Add language column to recipes table
-- Stores ISO 639-1 language code (en, nl, fr, es, ja, etc.)
-- Nullable: existing recipes and manual entries without detection get null

alter table public.recipes
  add column language text;

-- Index for language filtering on discover page
create index recipes_language_idx on public.recipes(language) where language is not null;
