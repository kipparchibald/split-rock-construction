#!/usr/bin/env node
/**
 * Generate src/routeTree.gen.ts for typecheck/CI.
 * Vite/tanstackStart also generates this on dev/build; this script keeps
 * `npm run typecheck` working on a fresh checkout without a full build.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Generator, getConfig } from "@tanstack/router-generator";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src/routeTree.gen.ts");

const config = getConfig(
  {
    target: "react",
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
    disableLogging: true,
  },
  root,
);

const generator = new Generator({ config, root });
await generator.run({ type: "rerun" });

if (!existsSync(outPath)) {
  console.error("✗ Route tree generation failed — src/routeTree.gen.ts missing");
  process.exit(1);
}

console.log("✓ Generated src/routeTree.gen.ts");
