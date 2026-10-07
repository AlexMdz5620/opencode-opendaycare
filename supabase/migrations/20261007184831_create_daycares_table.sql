create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Av. Los Leones 1450, Providencia'),
  ('Guardería Pequeños Exploradores', 'Calle Mayor 12, Centro'),
  ('Guardería Nido Feliz', 'Av. Primavera 845, Col. Jardines'),
  ('Guardería Mundo Infantil', 'Calle Robles 23, Barrio Norte'),
  ('Guardería Arcoíris', 'Av. del Parque 670, Zona Sur');
