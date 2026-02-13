create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity decimal,
  unit text,
  notes text,
  order_index integer not null
);
