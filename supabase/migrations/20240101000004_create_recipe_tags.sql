create table public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag text not null,
  unique (recipe_id, tag)
);
