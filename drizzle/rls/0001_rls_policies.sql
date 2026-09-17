-- =============================================================
-- RLS - Phase 1 (section 6 of CLAUDE.md)
--
-- Pattern: the app sets app.current_user_id and app.current_role per
-- transaction (see src/db/context.ts) and the policies filter on that.
--
-- Implementation notes:
--  * FORCE ROW LEVEL SECURITY is mandatory: the app connects to Neon
--    as the role that owns the tables, and Postgres exempts the owner
--    from RLS unless it is forced.
--  * current_setting(..., true) returns NULL when the variable is not
--    set (instead of erroring), and nullif(...,'') avoids the error of
--    casting '' to uuid. With no context set, no policy passes.
--  * Idempotent: drop policy if exists before each create.
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

-- read: global + own + admin
drop policy if exists formats_read on formats;
create policy formats_read on formats for select
  using (owner_scope = 'global'
     or user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
     or current_setting('app.current_role', true) = 'admin');

-- write: own only (or admin, who writes the global ones)
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
-- The user only READS their ledger. Inserts of their own movements are
-- made by consumeTokens/grantTokens inside their transaction, which is why
-- there is an insert policy restricted to their own user_id. Update/delete:
-- nobody but admin (a ledger is never edited).
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
