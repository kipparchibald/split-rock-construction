# Vercel link (local only)

`.vercel/project.json` is **gitignored**. Create it by linking this repo to the
**Split Rock** production project only:

```bash
# From this repo root, under team voxli:
npx vercel link
# Project name must be: split-rock-construction-kx9x
# Never select: ideaspeak-app, Archibald-Bagley, stale split-rock-construction, or any non–Split-Rock project
```

Production domain **`splitrockconst.com`** is already on **`split-rock-construction-kx9x`** — do **not** link to or move the domain onto the stale project named `split-rock-construction` (no `-kx9x`).

Then verify:

```bash
npm run check:project
```

If you accidentally linked IdeaSpeak, Archibald-Bagley, stale `split-rock-construction`, or another app, delete this folder and re-link to **`split-rock-construction-kx9x`**.

See `/PROJECT.md` for the full multi-project map under the Voxli team.
