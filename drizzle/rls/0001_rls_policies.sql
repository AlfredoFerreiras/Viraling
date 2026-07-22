-- =============================================================
-- RLS · Fase 1 (sección 6 de CLAUDE.md)
--
-- Patrón: la app setea app.current_user_id y app.current_role por
-- transacción (ver src/db/context.ts) y las policies filtran por eso.
--
-- Notas de implementación:
--  * FORCE ROW LEVEL SECURITY es obligatorio: la app se conecta a Neon
--    como rol dueño de las tablas y Postgres exime al dueño de RLS
--    salvo que se fuerce.
--  * current_setting(..., true) devuelve NULL si la variable no está
--    seteada (en vez de error), y nullif(...,'') evita el error de
--    castear '' a uuid. Sin contexto seteado, ninguna policy pasa.
--  * Idempotente: drop policy if exists antes de cada create.
-- =============================================================

-- ---------- USERS ----------
alter table users enable row level security;
alter table users force row level security;

drop policy if exists users_self on users;
create policy users_self on users
  using (id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists users_admin on users;
create policy users_admin on users
  using (current_setting('app.current_role', true) = 'admin');

-- ---------- NICHES ----------
alter table niches enable row level security;
alter table niches force row level security;

drop policy if exists niches_owner on niches;
create policy niches_owner on niches
  using (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists niches_admin on niches;
create policy niches_admin on niches
  using (current_setting('app.current_role', true) = 'admin');

-- ---------- FORMATS ----------
alter table formats enable row level security;
alter table formats force row level security;

-- lectura: globales + propios + admin
drop policy if exists formats_read on formats;
create policy formats_read on formats for select
  using (owner_scope = 'global'
     or user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
     or current_setting('app.current_role', true) = 'admin');

-- escritura: solo los propios (o admin, que escribe los globales)
drop policy if exists formats_owner_write on formats;
create policy formats_owner_write on formats
  using (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists formats_admin on formats;
create policy formats_admin on formats
  using (current_setting('app.current_role', true) = 'admin');

-- ---------- SCRIPTS ----------
alter table scripts enable row level security;
alter table scripts force row level security;

drop policy if exists scripts_owner on scripts;
create policy scripts_owner on scripts
  using (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists scripts_admin on scripts;
create policy scripts_admin on scripts
  using (current_setting('app.current_role', true) = 'admin');

-- ---------- TOKEN_TRANSACTIONS ----------
-- El user solo LEE su ledger. El insert de sus propios movimientos lo
-- hacen consumeTokens/grantTokens dentro de su transacción, por eso hay
-- policy de insert restringida a su propio user_id. Update/delete: nadie
-- salvo admin (un ledger no se edita).
alter table token_transactions enable row level security;
alter table token_transactions force row level security;

drop policy if exists token_tx_owner_read on token_transactions;
create policy token_tx_owner_read on token_transactions for select
  using (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists token_tx_owner_insert on token_transactions;
create policy token_tx_owner_insert on token_transactions for insert
  with check (user_id = nullif(current_setting('app.current_user_id', true), '')::uuid);

drop policy if exists token_tx_admin on token_transactions;
create policy token_tx_admin on token_transactions
  using (current_setting('app.current_role', true) = 'admin');
