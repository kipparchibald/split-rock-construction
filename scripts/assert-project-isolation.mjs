#!/usr/bin/env node
/**
 * Guardrail: this repo must never be linked or treated as another Voxli product.
 * Run via `npm run check:project` (also safe in CI before deploy).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED = {
  packageName: "split-rock-construction",
  githubRepo: "kipparchibald/split-rock-construction",
  vercelProjectName: "split-rock-construction-kx9x",
  /** Known foreign projects under the same team — never allow a local link to these */
  forbiddenVercelProjectIds: [
    "prj_HeZZVc1ibtK1Qaz3e3xUeVW23zw5", // ideaspeak-app
  ],
  forbiddenVercelProjectNames: [
    "ideaspeak-app",
    "ideaspeak-platform",
    "voxli",
    "ideaspeak",
    /** Stale leftover — production is split-rock-construction-kx9x (domain already there) */
    "split-rock-construction",
  ],
  companyName: "Split Rock Construction",
};

const errors = [];

// 1) package.json name
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
if (pkg.name !== EXPECTED.packageName) {
  errors.push(
    `package.json name is "${pkg.name}" — expected "${EXPECTED.packageName}" so deploys don't collide with other Voxli apps.`,
  );
}

// 2) company identity
const companyPath = join(root, "src/lib/company.ts");
if (existsSync(companyPath)) {
  const companySrc = readFileSync(companyPath, "utf8");
  if (!companySrc.includes(EXPECTED.companyName)) {
    errors.push(`src/lib/company.ts must identify as "${EXPECTED.companyName}".`);
  }
  if (/ideaspeak/i.test(companySrc)) {
    errors.push("src/lib/company.ts must not reference IdeaSpeak.");
  }
}

// 3) Local Vercel link (.vercel/project.json) — if present, must be this product only
const vercelProjectPath = join(root, ".vercel/project.json");
if (existsSync(vercelProjectPath)) {
  try {
    const link = JSON.parse(readFileSync(vercelProjectPath, "utf8"));
    const projectId = link.projectId ?? link.project?.id;
    const projectName = link.projectName ?? link.project?.name;
    if (projectId && EXPECTED.forbiddenVercelProjectIds.includes(projectId)) {
      errors.push(
        `.vercel/project.json is linked to forbidden project id ${projectId} (another product under Voxli). Delete .vercel and run: vercel link → choose "${EXPECTED.vercelProjectName}".`,
      );
    }
    if (
      projectName &&
      EXPECTED.forbiddenVercelProjectNames.some(
        (n) => n.toLowerCase() === String(projectName).toLowerCase(),
      )
    ) {
      errors.push(
        `.vercel/project.json is linked to "${projectName}". This repo must only link to "${EXPECTED.vercelProjectName}".`,
      );
    }
    if (
      projectName &&
      String(projectName).toLowerCase() !==
        EXPECTED.vercelProjectName.toLowerCase()
    ) {
      errors.push(
        `.vercel/project.json project name is "${projectName}" — expected "${EXPECTED.vercelProjectName}".`,
      );
    }
  } catch (e) {
    errors.push(`Could not parse .vercel/project.json: ${e.message}`);
  }
}

// 4) git remote sanity (best-effort)
try {
  const { execSync } = await import("node:child_process");
  const remote = execSync("git remote get-url origin", {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (remote && !remote.includes("split-rock-construction")) {
    errors.push(
      `git origin is "${remote}" — expected a remote containing "split-rock-construction".`,
    );
  }
  if (/ideaspeak/i.test(remote)) {
    errors.push("git origin points at IdeaSpeak — wrong repo for this workspace.");
  }
} catch {
  /* not a git checkout; skip */
}

if (errors.length) {
  console.error("\n✖ Project isolation check failed (keep Voxli apps separated):\n");
  for (const e of errors) console.error("  •", e);
  console.error("\nSee PROJECT.md for the team map and setup steps.\n");
  process.exit(1);
}

console.log("✓ Project isolation OK — Split Rock only");
console.log(`  package: ${EXPECTED.packageName}`);
console.log(`  github:  ${EXPECTED.githubRepo}`);
console.log(`  vercel:  ${EXPECTED.vercelProjectName} (own project under team voxli)`);
if (!existsSync(vercelProjectPath)) {
  console.log(
    "  note: no local .vercel link yet — when you deploy, link project name exactly: split-rock-construction-kx9x (NOT stale split-rock-construction)",
  );
}
