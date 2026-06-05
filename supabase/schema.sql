-- ════════════════════════════════════════════════════════════════════
-- VSK Gujarat KPI Scorecard — Supabase / Postgres schema
-- KPIs are stored in LONG / metadata-driven form: adding a KPI is an
-- INSERT into kpi_definitions (+ kpi_values), never a schema/UI change.
-- The MockProvider in src/data/provider mirrors these tables 1:1, so the
-- swap to live data is a data-source change, not a refactor.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── org hierarchy (powers cascading + section-level) ────────────────
create table if not exists entities (
  id          text primary key,
  name        text not null,
  name_gu     text,
  level       text not null check (level in ('state','district','block','cluster','school','grade','section')),
  parent_id   text references entities(id) on delete cascade,
  meta        jsonb not null default '{}'::jsonb
);
create index if not exists entities_parent_idx on entities(parent_id);
create index if not exists entities_level_idx  on entities(level);

-- ── login + scope resolution ────────────────────────────────────────
create table if not exists app_users (
  id          text primary key,
  login_id    text not null unique,
  name        text not null,
  name_gu     text,
  role        text not null check (role in ('teacher','principal','crc','brc','deo','state')),
  designation text,
  entity_id   text references entities(id),
  school_id   text,                 -- for teacher / principal login
  passcode    text,                 -- for officer roles; admin-editable only
  active      boolean not null default true
);
create index if not exists app_users_login_idx on app_users(login_id);

-- ── framework config (swap GSQAC / SQAF / 6A by changing rows) ──────
create table if not exists domains (
  id           text primary key,
  framework    text not null,
  name         text not null,
  name_gu      text,
  weightage    numeric not null default 0,   -- 0..1 fraction of overall
  sort_order   int not null default 0,
  icon         text,
  accent       text,
  rating_bands jsonb                          -- [{grade,min,group}] optional override
);
create index if not exists domains_framework_idx on domains(framework);

create table if not exists kpi_definitions (
  id                   text primary key,
  domain_id            text not null references domains(id) on delete cascade,
  name                 text not null,
  name_gu              text,
  unit                 text not null check (unit in ('%','count','score','hours','days')),
  direction            text not null check (direction in ('higher','lower')),
  data_source          text,
  target               text,
  level_representation jsonb not null,         -- {section,grade,school,cluster,block,district,state}
  weight               numeric,
  rag                  jsonb,                  -- {green,amber} override (0..100)
  sort_order           int not null default 0
);
create index if not exists kpi_def_domain_idx on kpi_definitions(domain_id);

-- ── the facts: one row per entity × kpi × period (adding a KPI = insert) ─
create table if not exists kpi_values (
  id          uuid primary key default gen_random_uuid(),
  entity_id   text not null references entities(id) on delete cascade,
  kpi_id      text not null references kpi_definitions(id) on delete cascade,
  period      text not null,                   -- '2026-W23' or '2026-06'
  value       numeric,
  benchmark   numeric,
  prev_week   numeric,
  prev_month  numeric,
  status      text check (status in ('green','amber','red','na')),
  unique (entity_id, kpi_id, period)
);
create index if not exists kpi_values_entity_idx on kpi_values(entity_id);
create index if not exists kpi_values_kpi_idx    on kpi_values(kpi_id);
create index if not exists kpi_values_period_idx on kpi_values(period);

-- Derive in the app (not stored): Δ WoW, Δ MoM, trend, RAG, domain score,
-- and overall score = Σ(domain weightage × domain %) → letter grade.
-- Cascading rollups walk entities.parent_id.

-- Optional: a convenience view for the current-period leaderboard rollup
-- can be added later; the prototype derives it client-side via the engine.
