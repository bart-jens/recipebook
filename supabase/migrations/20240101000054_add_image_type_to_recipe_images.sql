-- Add image_type column to recipe_images.
-- This column was defined in migration 000012 but is missing from the linked DB.
-- Uses IF NOT EXISTS so it is safe to run even if already present.

alter table public.recipe_images
  add column if not exists image_type text not null default 'source'
    check (image_type in ('source', 'user_upload'));
