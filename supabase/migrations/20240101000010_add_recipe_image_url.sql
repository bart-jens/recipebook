-- Add image_url column to recipes for quick access to primary image
alter table public.recipes
  add column image_url text;

-- Create storage bucket for recipe images (public read)
insert into storage.buckets (id, name, public)
  values ('recipe-images', 'recipe-images', true)
  on conflict (id) do nothing;

-- Storage policy: authenticated users can upload to their own prefix
create policy "Users can upload recipe images"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: authenticated users can update their own images
create policy "Users can update own recipe images"
  on storage.objects for update
  using (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: authenticated users can delete their own images
create policy "Users can delete own recipe images"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: public read access for all recipe images
create policy "Public read access for recipe images"
  on storage.objects for select
  using (bucket_id = 'recipe-images');
