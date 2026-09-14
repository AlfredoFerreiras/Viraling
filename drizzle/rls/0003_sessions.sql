-- ---------- SESSIONS ----------
-- Solo el contexto de servicio (app.current_role = 'admin') lee y escribe
-- sesiones. Ningún usuario final las toca directamente.
alter table sessions enable row level security;
alter table sessions force row level security;

drop policy if exists sessions_service on sessions;
create policy sessions_service on sessions
  using (current_setting('app.current_role', true) = 'admin');
