-- Seed Holwege job-cost lines from the verified Exhibit B stack.
-- Idempotent: safe to re-run. Uses fixed IDs so repeated applies upsert.
-- user_id 'demo' matches the demo/operator seed used elsewhere in the app.

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
