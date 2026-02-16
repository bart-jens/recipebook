-- Add 'fork' to the source_type CHECK constraint on recipes table
-- Forked recipes are derivative works that can be published (not blocked by import restriction)

alter table public.recipes drop constraint if exists recipes_source_type_check;

alter table public.recipes
  add constraint recipes_source_type_check
    check (source_type in ('manual', 'url', 'photo', 'telegram', 'instagram', 'fork'));
