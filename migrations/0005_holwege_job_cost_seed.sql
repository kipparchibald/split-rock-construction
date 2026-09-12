-- Seed Holwege job-cost lines from the verified Exhibit B stack.
-- Idempotent: safe to re-run. Uses fixed IDs so repeated applies upsert.
-- user_id 'demo' matches the demo/operator seed used elsewhere in the app.
--
-- job_cost_lines FK → crm_projects (user_id, id). Build-time migrate on Neon
-- has no Holwege CRM row yet, so ensure the parent project exists first
-- (contract dollars CONFIRMED: $689,299.65; land excluded).

insert into crm_clients (
  id, user_id, name, email, type, address, notes
) values (
  'c-holwege',
  'demo',
  'Lauren & Cindy Holwege',
  'holwegefam@comcast.net',
  'homeowner',
  'Lot 16 Block 8, Teton Heights Div 6, Jefferson County, ID',
  'Land $98,000 closed separately (Alliance 1100920) — NOT in construction budget.'
)
on conflict (user_id, id) do update set
  name = excluded.name,
  email = excluded.email,
  address = excluded.address,
  notes = excluded.notes,
  updated_at = now();

insert into crm_projects (
  id, user_id, client_id, name, address, type, status, phase,
  progress, budget, spent, start_date, end_date, superintendent,
  sqft, beds, baths, description
) values (
  'p-holwege',
  'demo',
  'c-holwege',
  'Holwege Residence — Lot 16',
  'Lot 16 Block 8, Teton Heights Div 6, Rigby ID',
  'residential',
  'planning',
  'Site Work',
  0,
  689299.65,
  0,
  '2026-09-15',
  '2027-06-30',
  'Kyle Christensen',
  2602,
  3,
  2,
  'Custom ADA one-level. Contract $689,299.65. Land $98k excluded.'
)
on conflict (user_id, id) do update set
  client_id = excluded.client_id,
  name = excluded.name,
  address = excluded.address,
  budget = excluded.budget,
  superintendent = excluded.superintendent,
  description = excluded.description,
  updated_at = now();

insert into job_cost_lines (
  id, user_id, project_id, line_label, line_type, budgeted, sort_order, notes
) values
  ('jcl-holwege-cow', 'demo', 'p-holwege', 'Cost of work', 'estimate', 599391.00, 10,
   'Sub bids + materials. Shared-savings applies to underage here.'),
  ('jcl-holwege-kyle', 'demo', 'p-holwege', 'Kyle supervision / travel / gas', 'estimate', 32000.00, 20,
   'Fixed overhead for this job only. Not subject to shared-savings.'),
  ('jcl-holwege-cont', 'demo', 'p-holwege', 'Owner contingency (5%)', 'estimate', 29969.55, 30,
   'Site/weather/code unknowns. Not profit, not Kyle, not upgrades.'),
  ('jcl-holwege-po', 'demo', 'p-holwege', 'Split Rock P&O (10% of cost of work)', 'estimate', 59939.10, 40,
   'Fee on cost of work. Calculated on estimate; shrinks with buyout savings.')
on conflict (user_id, id) do update set
  project_id = excluded.project_id,
  line_label = excluded.line_label,
  line_type = excluded.line_type,
  budgeted = excluded.budgeted,
  sort_order = excluded.sort_order,
  notes = excluded.notes,
  updated_at = now();
