insert into public.users (daycare_id, role, status, email, full_name)
select d.id, 'staff', 'active', 'alex@google.com', 'Alex'
from public.daycares d
where d.name = 'Guardería Sala Soles'
  and not exists (
    select 1 from public.users u where u.email = 'alex@google.com'
  );
