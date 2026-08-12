-- Split Rock CRM core entities (operator-scoped by user_id).
-- JSONB columns hold nested structures that match src/data/types.ts.

create table if not exists crm_clients (
  id text not null,
  user_id text not null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  type text not null default 'homeowner',
  address text not null default '',
  notes text not null default '',
  portal_token text,
  portal_status text not null default 'none',
  portal_invited_at text,
  portal_last_login_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_clients_user_idx on crm_clients (user_id);

create table if not exists crm_prospects (
  id text not null,
  user_id text not null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  lead_type text not null default 'lot_only',
  stage text not null default 'new',
  source text not null default 'website',
  budget_band text not null default 'unknown',
  timeline text not null default 'browsing',
  interest text not null default '',
  notes text not null default '',
  dual_role_flag boolean not null default false,
  dual_role_acknowledged boolean not null default false,
  score integer not null default 0,
  lot_id text,
  package_id text,
  assigned_to text not null default '',
  created_at text not null,
  last_contact_at text,
  lost_reason text,
  referral_agent text,
  referral_brokerage text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_prospects_user_idx on crm_prospects (user_id);
create index if not exists crm_prospects_stage_idx on crm_prospects (user_id, stage);

create table if not exists crm_projects (
  id text not null,
  user_id text not null,
  client_id text not null,
  name text not null,
  address text not null default '',
  type text not null default 'residential',
  status text not null default 'planning',
  phase text not null default 'Site Work',
  progress integer not null default 0,
  budget numeric not null default 0,
  spent numeric not null default 0,
  start_date text not null default '',
  end_date text not null default '',
  superintendent text not null default '',
  sqft integer not null default 0,
  beds integer,
  baths numeric,
  description text not null default '',
  milestones jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  plan_id text,
  matterport_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_projects_user_idx on crm_projects (user_id);
create index if not exists crm_projects_client_idx on crm_projects (user_id, client_id);

create table if not exists crm_bids (
  id text not null,
  user_id text not null,
  client_id text not null,
  title text not null,
  type text not null default 'residential',
  status text not null default 'draft',
  amount numeric not null default 0,
  submitted_at text,
  due_date text not null default '',
  notes text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_bids_user_idx on crm_bids (user_id);
create index if not exists crm_bids_client_idx on crm_bids (user_id, client_id);

create table if not exists crm_tours (
  id text not null,
  user_id text not null,
  prospect_id text not null,
  kind text not null default 'model_home',
  at text not null,
  location text not null default '',
  status text not null default 'scheduled',
  notes text not null default '',
  host text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_tours_user_idx on crm_tours (user_id);
create index if not exists crm_tours_prospect_idx on crm_tours (user_id, prospect_id);

create table if not exists crm_proposals (
  id text not null,
  user_id text not null,
  prospect_id text not null,
  lot_id text,
  package_id text,
  lot_price numeric not null default 0,
  build_price numeric not null default 0,
  soft_costs numeric not null default 0,
  extras numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'draft',
  created_at text not null,
  valid_until text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists crm_proposals_user_idx on crm_proposals (user_id);
create index if not exists crm_proposals_prospect_idx on crm_proposals (user_id, prospect_id);
