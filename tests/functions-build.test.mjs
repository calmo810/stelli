import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * The backend functions run on Deno inside Base44 and can't be executed here.
 * This at least proves every one of them parses and that every name it imports
 * from base44/shared really exists — the mistakes that would otherwise only
 * show up after a deploy.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'base44', 'functions');

function entries(dir) {
  const found = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const here = join(dir, name.name);
    if (existsSync(join(here, 'entry.ts'))) found.push(join(here, 'entry.ts'));
    found.push(...entries(here));
  }
  return found;
}

for (const entry of entries(root)) {
  const label = entry.slice(root.length + 1);
  test(`function bundles cleanly: ${label}`, async () => {
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'neutral',
      logLevel: 'silent',
      external: ['npm:*', 'base44:*'],
    }).catch((error) => error);
    const errors = (result.errors || []).map((e) => `${e.location?.file}:${e.location?.line} ${e.text}`);
    assert.deepEqual(errors, []);
  });
}
