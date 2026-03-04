-- Make invites.email nullable to support link-generated invites,
-- which produce a code without an associated email address.
alter table public.invites alter column email drop not null;
