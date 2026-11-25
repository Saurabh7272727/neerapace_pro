import { readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

async function walk(dir, acc = []) {
  let entries = [];
  try {
    entries = await readdir(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist" || entry === "coverage") continue;
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) await walk(fullPath, acc);
    else if (fullPath.endsWith(".js") || fullPath.endsWith(".mjs")) acc.push(fullPath);
  }
  return acc;
}

const files = [
  ...(await walk("apps/api")),
  ...(await walk("packages/shared")),
  ...(await walk("scripts")),
];

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Checked ${files.length} files`);
