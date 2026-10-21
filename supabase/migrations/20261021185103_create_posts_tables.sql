create type post_type as enum
  ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  room_id uuid references public.rooms(id),
  type post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, child_id)
);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  width integer,
  height integer,
  position integer not null,
  created_at timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_daycare_id_idx on public.posts (daycare_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);
create index post_children_child_id_idx on public.post_children (child_id);
create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;

create policy "posts_insert_staff_admin"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('staff', 'admin')
        and u.daycare_id = posts.daycare_id
    )
  );

create policy "posts_select_staff_parent"
  on public.posts for select to authenticated
  using (
    exists (
      select 1 from public.users me
      where me.id = auth.uid()
        and me.role in ('staff', 'admin')
        and me.daycare_id = posts.daycare_id
    )
    or exists (
      select 1
      from public.post_children pc
      join public.parent_children par on par.child_id = pc.child_id
      where pc.post_id = posts.id
        and par.parent_id = auth.uid()
    )
    or (
      posts.room_id is not null
      and exists (
        select 1
        from public.children c
        join public.parent_children par on par.child_id = c.id
        where c.room_id = posts.room_id
          and par.parent_id = auth.uid()
      )
    )
  );

create policy "post_children_select_authenticated"
  on public.post_children for select to authenticated using (true);
create policy "post_children_insert_staff_admin"
  on public.post_children for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );

create policy "post_photos_select_authenticated"
  on public.post_photos for select to authenticated using (true);
create policy "post_photos_insert_staff_admin"
  on public.post_photos for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );
