create table public.recipe_ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  notes text,
  cooked_date date,
  created_at timestamptz not null default now()
);
