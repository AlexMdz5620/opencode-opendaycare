create or replace function public.get_invitation_by_code(p_code text)
returns table (
  status invitation_status,
  expires_at timestamptz,
  full_name text,
  email text,
  child_first_name text,
  room_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    i.status,
    i.expires_at,
    i.full_name,
    i.email,
    split_part(c.full_name, ' ', 1) as child_first_name,
    r.name as room_name
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = p_code;
end;
$$;

create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_child_id uuid;
  v_daycare_id uuid;
begin
  select * into v_invitation
  from public.invitations
  where code = p_code
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  if v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    raise exception 'expired_code';
  end if;

  select r.daycare_id into v_daycare_id
  from public.children c
  join public.rooms r on r.id = c.room_id
  where c.id = v_invitation.child_id;

  insert into public.users (id, daycare_id, role, status, email, full_name)
  values (
    auth.uid(),
    v_daycare_id,
    'parent',
    'active',
    v_invitation.email,
    v_invitation.full_name
  );

  insert into public.parent_children (parent_id, child_id, relationship)
  values (auth.uid(), v_invitation.child_id, v_invitation.relationship);

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.child_id;
end;
$$;

revoke execute on function public.get_invitation_by_code(text) from public;
revoke execute on function public.accept_invitation(text) from public;
grant execute on function public.get_invitation_by_code(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to anon, authenticated;
