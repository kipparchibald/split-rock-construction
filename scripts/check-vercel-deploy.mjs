#!/usr/bin/env node
/**
 * Verify Vercel production deployment is READY and serves real HTML.
 *
 * Required env:
 *   VERCEL_TOKEN
 *
 * Project resolution (one of):
 *   VERCEL_PROJECT_ID   — prj_…
 *   VERCEL_PROJECT_NAME — default: split-rock-construction-kx9x
 *
 * Team:
 *   VERCEL_ORG_ID       — default: team_ZEZVchkfVnLrlfIFcBD32tFl (voxli)
 *
 * Optional:
 *   EXPECTED_SHA        — fail if deployment meta githubCommitSha does not match
 *   DEPLOY_URL          — smoke-test this URL instead of the deployment URL
 *   TIMEOUT_MS          — default 300000 (5 min) while waiting for READY
 *   POLL_MS             — default 10000
 *   SKIP_WAIT           — if "1"/"true", only inspect latest (no poll)
 *   REQUIRE_TEXT        — substring that must appear in HTML (default: Split Rock)
 *   ALLOW_SSO           — if "1", treat Vercel SSO login pages as soft-pass (status only)
 */

const API = "https://api.vercel.com";

const TOKEN = process.env.VERCEL_TOKEN;
const ORG_ID =
  process.env.VERCEL_ORG_ID || "team_ZEZVchkfVnLrlfIFcBD32tFl";
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "";
const PROJECT_NAME =
  process.env.VERCEL_PROJECT_NAME || "split-rock-construction-kx9x";
const EXPECTED_SHA = (process.env.EXPECTED_SHA || "").trim();
const DEPLOY_URL = (process.env.DEPLOY_URL || "").trim();
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 300_000);
const POLL_MS = Number(process.env.POLL_MS || 10_000);
const SKIP_WAIT = /^(1|true|yes)$/i.test(process.env.SKIP_WAIT || "");
const REQUIRE_TEXT = process.env.REQUIRE_TEXT ?? "Split Rock";
const ALLOW_SSO = /^(1|true|yes)$/i.test(process.env.ALLOW_SSO || "");

function fail(msg, extra) {
  console.error(`✗ ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

async function vercel(path, init = {}) {
  const url = new URL(path.startsWith("http") ? path : `${API}${path}`);
  if (ORG_ID && !url.searchParams.has("teamId")) {
    url.searchParams.set("teamId", ORG_ID);
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `Vercel API ${res.status} ${url.pathname}: ${text.slice(0, 400)}`,
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function resolveProjectId() {
  if (PROJECT_ID) return PROJECT_ID;
  const data = await vercel(
    `/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
  );
  if (!data?.id) fail(`Project not found: ${PROJECT_NAME}`);
  return data.id;
}

async function latestProductionDeployment(projectId) {
  const data = await vercel(
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=production&limit=8`,
  );
  const list = data?.deployments || [];
  if (!list.length) fail("No production deployments found for project");
  // Prefer newest by created
  return list[0];
}

async function getDeployment(idOrUrl) {
  return vercel(
    `/v13/deployments/${encodeURIComponent(idOrUrl.replace(/^https?:\/\//, ""))}`,
  );
}

function isTerminalReady(state, readyState) {
  const s = (readyState || state || "").toUpperCase();
  return s === "READY";
}

function isTerminalFail(state, readyState) {
  const s = (readyState || state || "").toUpperCase();
  return ["ERROR", "CANCELED", "CANCELLED"].includes(s);
}

function isPending(state, readyState) {
  const s = (readyState || state || "").toUpperCase();
  return [
    "BUILDING",
    "QUEUED",
    "INITIALIZING",
    "ANALYZING",
    "UPLOADING",
    "DEPLOYING",
    "WAITING",
  ].includes(s);
}

async function waitUntilReady(uid) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < TIMEOUT_MS) {
    last = await getDeployment(uid);
    const state = last.readyState || last.state;
    console.log(`  … ${uid} → ${state} (${Math.round((Date.now() - start) / 1000)}s)`);
    if (isTerminalReady(last.state, last.readyState)) return last;
    if (isTerminalFail(last.state, last.readyState)) {
      fail(`Deployment failed: ${state}`, JSON.stringify({
        uid: last.uid || last.id,
        errorCode: last.errorCode,
        errorMessage: last.errorMessage,
        inspectorUrl: last.inspectorUrl,
      }, null, 2));
    }
    if (SKIP_WAIT) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  if (last && isTerminalReady(last.state, last.readyState)) return last;
  fail(
    `Timed out after ${TIMEOUT_MS}ms waiting for READY`,
    last
      ? `Last state: ${last.readyState || last.state}`
      : "No deployment payload",
  );
}

function commitShaFrom(dep) {
  return (
    dep.meta?.githubCommitSha ||
    dep.meta?.gitCommitSha ||
    dep.meta?.commitSha ||
    ""
  );
}

async function smokeTest(url) {
  const target = url.startsWith("http") ? url : `https://${url}`;
  console.log(`  smoke → ${target}`);
  const res = await fetch(target, {
    redirect: "follow",
    headers: {
      "User-Agent": "split-rock-deploy-check/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  const ct = res.headers.get("content-type") || "";
  const body = await res.text();

  if (res.status === 401 || res.status === 403) {
    if (ALLOW_SSO) {
      ok(`HTTP ${res.status} (SSO/auth protected — ALLOW_SSO)`);
      return { status: res.status, protected: true };
    }
    // Vercel Authentication often returns HTML login
    if (
      body.includes("Authentication Required") ||
      body.includes("vercel.com/login") ||
      body.includes("_vercel_sso")
    ) {
      fail(
        `Deployment is SSO-protected (HTTP ${res.status}). Set ALLOW_SSO=1 for soft-pass, or use an unprotected prod domain.`,
      );
    }
  }

  if (res.status < 200 || res.status >= 400) {
    fail(`HTTP ${res.status} from ${target}`, body.slice(0, 300));
  }

  if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
    fail(`Expected HTML content-type, got: ${ct || "(empty)"}`);
  }

  if (body.length < 200) {
    fail(`HTML body too short (${body.length} chars) — possible blank deploy`);
  }

  // Classic Vercel/MIME failure fingerprint when assets 404 → HTML fallback
  if (
    body.includes("Failed to load module script") ||
    body.includes('MIME type "text/html"')
  ) {
    fail("Page contains module MIME / asset load failure fingerprint");
  }

  // Bad deploy that shipped literal "placeholder" package.json often surfaces as build error pages
  if (
    body.includes('"placeholder" is not valid JSON') ||
    body.includes("Unexpected token 'p'")
  ) {
    fail("Page looks like the invalid package.json placeholder deploy error");
  }

  if (REQUIRE_TEXT && !body.includes(REQUIRE_TEXT)) {
    fail(
      `HTML missing expected text ${JSON.stringify(REQUIRE_TEXT)}`,
      `First 200 chars: ${body.slice(0, 200).replace(/\s+/g, " ")}`,
    );
  }

  ok(`HTTP ${res.status}, ${body.length} bytes, contains ${JSON.stringify(REQUIRE_TEXT)}`);
  return { status: res.status, bytes: body.length };
}

async function main() {
  if (!TOKEN) {
    fail(
      "VERCEL_TOKEN is required. Create at https://vercel.com/account/tokens and set as a GitHub Actions secret.",
    );
  }

  console.log("Vercel deployment check");
  console.log(`  team:    ${ORG_ID}`);
  console.log(`  project: ${PROJECT_ID || PROJECT_NAME}`);
  if (EXPECTED_SHA) console.log(`  expect:  ${EXPECTED_SHA.slice(0, 12)}…`);

  const projectId = await resolveProjectId();
  ok(`project id ${projectId}`);

  let dep = await latestProductionDeployment(projectId);
  const uid = dep.uid || dep.id;
  console.log(
    `  latest:  ${uid} state=${dep.readyState || dep.state} created=${dep.created ? new Date(dep.created).toISOString() : "?"}`,
  );

  if (!SKIP_WAIT && isPending(dep.state, dep.readyState)) {
    dep = await waitUntilReady(uid);
  } else if (!SKIP_WAIT && !isTerminalReady(dep.state, dep.readyState)) {
    // Fetch full object and wait if needed
    dep = await waitUntilReady(uid);
  } else if (isTerminalFail(dep.state, dep.readyState)) {
    fail(`Latest production deployment is ${dep.readyState || dep.state}`);
  } else {
    // READY or SKIP_WAIT — refresh full deployment for meta/url
    dep = await getDeployment(uid);
  }

  const state = dep.readyState || dep.state;
  if (!isTerminalReady(dep.state, dep.readyState) && SKIP_WAIT) {
    fail(`Latest deployment not READY (state=${state})`);
  }
  ok(`deployment READY (${uid})`);

  const sha = commitShaFrom(dep);
  if (sha) console.log(`  commit:  ${sha}`);
  if (EXPECTED_SHA) {
    if (!sha) {
      fail("EXPECTED_SHA set but deployment has no githubCommitSha in meta");
    }
    if (
      !sha.startsWith(EXPECTED_SHA) &&
      !EXPECTED_SHA.startsWith(sha) &&
      sha !== EXPECTED_SHA
    ) {
      fail(
        `Commit mismatch: deployment ${sha.slice(0, 12)} ≠ expected ${EXPECTED_SHA.slice(0, 12)}`,
      );
    }
    ok("commit sha matches EXPECTED_SHA");
  }

  const url =
    DEPLOY_URL ||
    (dep.url ? `https://${dep.url.replace(/^https?:\/\//, "")}` : "") ||
    (dep.alias?.[0] ? `https://${dep.alias[0]}` : "");

  if (!url) fail("No deployment URL available to smoke-test");

  await smokeTest(url);

  console.log("");
  console.log("All deployment checks passed.");
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId,
        deploymentId: uid,
        state,
        url,
        sha: sha || null,
        inspectorUrl: dep.inspectorUrl || null,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  fail(err.message || String(err));
});
