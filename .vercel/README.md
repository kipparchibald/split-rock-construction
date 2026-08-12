# Vercel link (local only)

`.vercel/project.json` is **gitignored**. Create it by linking this repo to the
**Split Rock** project only:

```bash
# From this repo root, under team voxli:
npx vercel link
# Project name must be: split-rock-construction
# Never select: ideaspeak-app, Archibald-Bagley, or any non–Split-Rock project
```

Then verify:

```bash
npm run check:project
```

If you accidentally linked IdeaSpeak, Archibald-Bagley, or another app, delete this folder and re-link.

See `/PROJECT.md` for the full multi-project map under the Voxli team.
