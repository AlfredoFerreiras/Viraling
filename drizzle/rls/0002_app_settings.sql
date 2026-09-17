-- RLS for app_settings: admin only (system reads use the service
-- context, which runs as admin).
alter table app_settings enable row level security;
alter table app_settings force row level security;

drop policy if exists app_settings_admin on app_settings;
create policy app_settings_admin on app_settings
  using (current_setting('app.current_role', true) = 'admin');
