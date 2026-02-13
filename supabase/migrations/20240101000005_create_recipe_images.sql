create table public.recipe_images (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
