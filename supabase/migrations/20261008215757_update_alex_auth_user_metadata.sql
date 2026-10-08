update auth.users
set raw_user_meta_data = raw_user_meta_data
  || '{"full_name": "Alex", "role": "Staff", "room": "Soles"}'::jsonb,
    updated_at = now()
where email = 'alex@google.com';
