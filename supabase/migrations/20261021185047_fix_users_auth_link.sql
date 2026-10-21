begin;
  alter table public.invitations drop constraint invitations_invited_by_fkey;
  alter table public.parent_children drop constraint parent_children_parent_id_fkey;

  create temp table _id_remap on commit drop as
    select u.id as old_id, au.id as new_id
    from public.users u
    join auth.users au on au.email = u.email
    where u.id <> au.id;

  update public.invitations i
  set invited_by = r.new_id
  from _id_remap r
  where i.invited_by = r.old_id;

  update public.parent_children pc
  set parent_id = r.new_id
  from _id_remap r
  where pc.parent_id = r.old_id;

  update public.users u
  set id = r.new_id
  from _id_remap r
  where u.id = r.old_id;

  alter table public.invitations
    add constraint invitations_invited_by_fkey
    foreign key (invited_by) references public.users(id);

  alter table public.parent_children
    add constraint parent_children_parent_id_fkey
    foreign key (parent_id) references public.users(id) on delete cascade;
commit;
