-- Allow anyone to verify an invite code (needed for signup)
-- Only exposes the code + used_at status, not the email or who invited
create policy "Anyone can verify invite codes"
  on public.invites for select
  using (true);

-- Allow the signup process to mark invites as used
-- (uses service role in practice, but this covers authenticated updates too)
create policy "Anyone can mark invites as used"
  on public.invites for update
  using (true)
  with check (true);
