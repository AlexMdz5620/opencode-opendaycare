update auth.users
set email_change = ''
where email = 'alex@google.com'
  and email_change is null;
