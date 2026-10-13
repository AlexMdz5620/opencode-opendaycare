create type relationship_type as enum ('father', 'mother', 'guardian');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship relationship_type not null,
  code text not null unique,
  status invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

create policy "invitations_select_authenticated"
  on public.invitations for select to authenticated using (true);
create policy "invitations_insert_authenticated"
  on public.invitations for insert to authenticated with check (true);
create policy "parent_children_select_authenticated"
  on public.parent_children for select to authenticated using (true);
create policy "users_select_authenticated"
  on public.users for select to authenticated using (true);
