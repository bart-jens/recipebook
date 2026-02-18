-- Seed admin role for platform owners
update public.user_profiles
set role = 'admin'
where id in (
  select id from auth.users
  where email in ('bwhessels@gmail.com', 'mjavaneeuwijk@gmail.com')
);
