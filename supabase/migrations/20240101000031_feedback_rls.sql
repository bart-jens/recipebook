-- RLS policies for feedback table

-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());

-- Admins can read all feedback
create policy "Admins can read all feedback"
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update feedback status
create policy "Admins can update feedback"
  on public.feedback for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
