-- External lead ingest idempotency keys for crm_prospects.
-- Scoped per operator (user_id) so Rigby Lots and other sources can push
-- without duplicating prospects when externalId is provided.

alter table crm_prospects
  add column if not exists ingest_source text,
  add column if not exists ingest_external_id text;

create unique index if not exists crm_prospects_ingest_key_idx
  on crm_prospects (user_id, ingest_source, ingest_external_id)
  where ingest_source is not null and ingest_external_id is not null;
