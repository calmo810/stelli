#!/usr/bin/env node
/**
 * The frontend type check, as a gate that only moves one way.
 *
 * The app is plain JavaScript checked with `checkJs`, and it already had a
 * few hundred findings when this gate was added. Most are noise from that
 * setup (untyped UI components, React Router's untyped outlet context), so
 * "zero errors" isn't a realistic bar today. This one is: **no new errors**.
 *
 * Each error is keyed by file, code and message (not line number, so editing
 * a file doesn't shift every key) and counted. The check fails if any key
 * shows up more often than in ci/typecheck-baseline.json. Fixing errors never
 * fails it; run with --update to lower the baseline afterwards.
 *
 *   node scripts/typecheck-frontend.mjs           check
 *   node scripts/typecheck-frontend.mjs --update  write the current errors as the baseline
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'ci', 'typecheck-baseline.json');
const update = process.argv.includes('--update');

const tsc = spawnSync(
  process.execPath,
  [path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'jsconfig.json', '--pretty', 'false', '--noEmit'],
  { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);
if (tsc.error) {
  console.error('Could not run tsc:', tsc.error.message);
  process.exit(2);
}

const LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const current = new Map(); // key -> [locations]
for (const line of `${tsc.stdout}\n${tsc.stderr}`.split('\n')) {
  const match = LINE.exec(line.trim());
  if (!match) continue;
  const [, file, row, col, code, message] = match;
  const key = `${file.replace(/\\/g, '/')}: ${code}: ${message}`;
  if (!current.has(key)) current.set(key, []);
  current.get(key).push(`${file}:${row}:${col}`);
}
const total = [...current.values()].reduce((sum, list) => sum + list.length, 0);

if (update) {
  const out = Object.fromEntries([...current.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, list]) => [key, list.length]));
  writeFileSync(baselinePath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Baseline written: ${total} known errors in ${current.size} kinds.`);
  process.exit(0);
}

let baseline = {};
try {
  baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
} catch (error) {
  console.error(`Could not read ${path.relative(root, baselinePath)}: ${error.message}`);
  process.exit(2);
}

const added = [];
for (const [key, list] of current) {
  const allowed = Number(baseline[key] || 0);
  if (list.length > allowed) added.push({ key, list, allowed });
}
const known = Object.values(baseline).reduce((sum, n) => sum + Number(n || 0), 0);

if (added.length) {
  console.error(`New type errors (${added.reduce((n, a) => n + a.list.length - a.allowed, 0)}):\n`);
  for (const { key, list, allowed } of added) {
    console.error(`  ${key}`);
    console.error(`    seen ${list.length}, baseline ${allowed}, at: ${list.join(', ')}`);
  }
  console.error('\nFix them, or if one is a false positive of the checkJs setup, explain why in the PR and run `npm run typecheck:frontend -- --update`.');
  process.exit(1);
}

console.log(`Frontend type check: no new errors (${total} known, baseline ${known}).`);
if (total < known) console.log('Some known errors are fixed. Run `npm run typecheck:frontend -- --update` to lower the baseline.');
