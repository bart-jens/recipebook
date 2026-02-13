-- Enable RLS on all tables
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_ratings enable row level security;
alter table public.recipe_tags enable row level security;
alter table public.recipe_images enable row level security;

-- Recipes: owner can read/write own recipes
create policy "Users can view own recipes"
  on public.recipes for select
  using (auth.uid() = created_by);

create policy "Users can insert own recipes"
  on public.recipes for insert
  with check (auth.uid() = created_by);

create policy "Users can update own recipes"
  on public.recipes for update
  using (auth.uid() = created_by);

create policy "Users can delete own recipes"
  on public.recipes for delete
  using (auth.uid() = created_by);

-- Recipe ingredients: access via recipe ownership
create policy "Users can view own recipe ingredients"
  on public.recipe_ingredients for select
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can insert own recipe ingredients"
  on public.recipe_ingredients for insert
  with check (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can update own recipe ingredients"
  on public.recipe_ingredients for update
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can delete own recipe ingredients"
  on public.recipe_ingredients for delete
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

-- Recipe ratings: access via recipe ownership
create policy "Users can view own recipe ratings"
  on public.recipe_ratings for select
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can insert own recipe ratings"
  on public.recipe_ratings for insert
  with check (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can update own recipe ratings"
  on public.recipe_ratings for update
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can delete own recipe ratings"
  on public.recipe_ratings for delete
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

-- Recipe tags: access via recipe ownership
create policy "Users can view own recipe tags"
  on public.recipe_tags for select
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can insert own recipe tags"
  on public.recipe_tags for insert
  with check (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can update own recipe tags"
  on public.recipe_tags for update
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can delete own recipe tags"
  on public.recipe_tags for delete
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

-- Recipe images: access via recipe ownership
create policy "Users can view own recipe images"
  on public.recipe_images for select
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can insert own recipe images"
  on public.recipe_images for insert
  with check (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can update own recipe images"
  on public.recipe_images for update
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));

create policy "Users can delete own recipe images"
  on public.recipe_images for delete
  using (exists (
    select 1 from public.recipes where id = recipe_id and created_by = auth.uid()
  ));
