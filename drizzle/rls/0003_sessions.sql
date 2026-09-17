-- ---------- SESSIONS ----------
-- Only the service context (app.current_role = 'admin') reads and writes
-- sessions. No end user touches them directly.
alter table sessions enable row level security;
alter table sessions force row level security;

drop policy if exists sessions_service on sessions;
create policy sessions_service on sessions
  using (current_setting('app.current_role', true) = 'admin');
