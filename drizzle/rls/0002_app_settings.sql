-- RLS de app_settings: solo admin (los reads de sistema usan contexto
-- de servicio, que corre como admin).
alter table app_settings enable row level security;
alter table app_settings force row level security;

drop policy if exists app_settings_admin on app_settings;
create policy app_settings_admin on app_settings
  using (current_setting('app.current_role', true) = 'admin');
