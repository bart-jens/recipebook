-- Add ON DELETE CASCADE to recipes.created_by
-- Required for account deletion: when auth user is deleted, their recipes are too.
-- All other user-referencing tables already cascade.

alter table public.recipes
  drop constraint recipes_created_by_fkey,
  add constraint recipes_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete cascade;
