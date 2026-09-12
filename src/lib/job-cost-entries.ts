import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isCrmServerPersistenceEnabled } from "@/lib/crm/capabilities.server";

const entrySchema = z.object({
  lineId: z.string().min(1),
  amount: z.number().nonnegative(),
  entryDate: z.string().optional(),
  vendor: z.string().optional(),
  description: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Append a single invoice / receipt against a budgeted job-cost line.
 * Actuals roll up automatically through the job_cost_line_summary view.
 * Falls back to a no-op when server persistence is off (demo mode).
 */
export const addJobCostEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(entrySchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) {
      return { ok: true as const, persisted: false as const };
    }

    const sql = await getSql();
    const id = `jce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entryDate = data.entryDate ?? new Date().toISOString().slice(0, 10);

    await sql`
      insert into job_cost_entries (
        id, user_id, line_id, amount, entry_date, vendor, description, receipt_url, entered_by
      ) values (
        ${id},
        ${context.userId},
        ${data.lineId},
        ${data.amount},
        ${entryDate},
        ${data.vendor ?? ""},
        ${data.description ?? ""},
        ${data.receiptUrl && data.receiptUrl.length > 0 ? data.receiptUrl : null},
        ${context.userId}
      )
    `;

    return { ok: true as const, persisted: true as const, id };
  });

/** Delete an entry (e.g. duplicate or voided invoice). */
export const removeJobCostEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) {
      return { ok: true as const, persisted: false as const };
    }
    const sql = await getSql();
    await sql`
      delete from job_cost_entries
      where user_id = ${context.userId} and id = ${data.id}
    `;
    return { ok: true as const, persisted: true as const };
  });
