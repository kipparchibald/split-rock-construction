-- Job-cost tracking for transparent cost-plus builds (Holwege-style).
-- Two tables: budgeted lines (from the cost breakdown) and actual entries
-- (each sub invoice / material receipt). Actuals roll up to the line, then
-- to the project. Owners see budgeted vs actual + variance; the 50/50
-- shared-savings math is derived from the totals.
--
-- Scope: every table carries user_id (operator) so RLS can isolate by owner.
-- Line items are seeded from the contract cost breakdown; entries are added
-- as invoices land. No bookkeeper required.

create table if not exists job_cost_lines (
  id text not null,
  user_id text not null,
  project_id text not null,
  line_label text not null,
  line_type text not null default 'estimate',  -- bid | allowance | estimate | paid | excluded
  budgeted numeric not null default 0,
  sort_order integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, project_id) references crm_projects (user_id, id) on delete cascade
);

create index if not exists job_cost_lines_project_idx
  on job_cost_lines (user_id, project_id);

create table if not exists job_cost_entries (
  id text not null,
  user_id text not null,
  line_id text not null,
  amount numeric not null default 0,
  entry_date date not null default current_date,
  vendor text not null default '',
  description text not null default '',
  receipt_url text,
  entered_by text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, line_id) references job_cost_lines (user_id, id) on delete cascade
);

create index if not exists job_cost_entries_line_idx
  on job_cost_entries (user_id, line_id);

-- Roll-up view: one row per line with actuals summed and variance computed.
create or replace view job_cost_line_summary as
select
  l.user_id,
  l.project_id,
  l.id as line_id,
  l.line_label,
  l.line_type,
  l.budgeted,
  coalesce(sum(e.amount), 0) as actual,
  l.budgeted - coalesce(sum(e.amount), 0) as variance,
  case
    when l.budgeted > 0
      then round((l.budgeted - coalesce(sum(e.amount), 0)) / l.budgeted * 100, 1)
    else null
  end as variance_pct,
  l.sort_order
from job_cost_lines l
left join job_cost_entries e
  on e.user_id = l.user_id and e.line_id = l.id
group by l.user_id, l.project_id, l.id, l.line_label, l.line_type, l.budgeted, l.sort_order;

-- Project-level roll-up: budgeted, actual, variance, and the 50/50 savings split.
create or replace view job_cost_project_summary as
select
  s.user_id,
  s.project_id,
  sum(s.budgeted) as total_budgeted,
  sum(s.actual) as total_actual,
  sum(s.variance) as total_variance,
  greatest(sum(s.variance), 0) * 0.5 as contractor_savings_share,
  greatest(sum(s.variance), 0) * 0.5 as owner_savings_credit,
  case
    when sum(s.budgeted) > 0
      then round(sum(s.variance) / sum(s.budgeted) * 100, 1)
    else null
  end as variance_pct
from job_cost_line_summary s
group by s.user_id, s.project_id;
