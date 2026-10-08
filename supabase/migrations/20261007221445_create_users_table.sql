create type user_role as enum ('staff', 'parent', 'admin');
create type user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  role user_role not null,
  status user_status not null default 'active',
  email text not null unique,
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

insert into public.users (daycare_id, role, status, email, full_name)
select d.id, 'staff', 'active', 'alex@googl.com', 'Alex'
from public.daycares d
where d.name = 'Guardería Sala Soles';
