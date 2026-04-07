-- Schema per l'app "Spese di Casa"
-- Eseguire questo script nello SQL Editor di Supabase.

create extension if not exists "pgcrypto";

-- Conti (es: carta, contante, conto corrente)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#4f46e5',
  created_at timestamptz default now()
);

-- Spese effettive (caricate da CSV o inserite manualmente)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(12,2) not null,
  currency text default 'EUR',
  category text,
  note text,
  account_id uuid references accounts(id) on delete set null,
  account_name text,
  source text default 'manual', -- 'manual' | 'wallet_csv'
  external_id text,             -- per dedup CSV
  created_at timestamptz default now(),
  unique (external_id)
);

create index if not exists expenses_date_idx on expenses(date);
create index if not exists expenses_account_idx on expenses(account_id);

-- Spese ricorrenti (pianificate)
-- frequency: 'monthly' | 'weekly' | 'yearly'
-- holiday_adjust: 'none' | 'previous' | 'next'
create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount numeric(12,2) not null,
  category text,
  account_id uuid references accounts(id) on delete set null,
  frequency text not null default 'monthly',
  day_of_month int,             -- per monthly (1-31)
  day_of_week int,              -- per weekly (0=Dom .. 6=Sab)
  month_of_year int,            -- per yearly (1-12)
  holiday_adjust text not null default 'none',
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- RLS: lasciato disattivato in questo MVP (single-user).
-- Per multi-utente abilitare RLS e aggiungere policy per auth.uid().
alter table accounts disable row level security;
alter table expenses disable row level security;
alter table recurring_expenses disable row level security;
