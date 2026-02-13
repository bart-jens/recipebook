create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  source_url text,
  source_type text not null default 'manual' check (source_type in ('manual', 'url', 'photo', 'telegram')),
  source_image_path text,
  instructions text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.update_updated_at();
