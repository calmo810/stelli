#!/usr/bin/env node
/**
 * `npm run dev:mock`: the mock backend and Vite, started together, with Vite
 * pointed at the mock. Stop it with Ctrl+C and both go down.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const mockPort = process.env.MOCK_PORT || '8787';
const children = [];

function start(name, command, args, env = {}) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  child.on('exit', (code) => {
    console.log(`[dev:mock] ${name} stopped${code ? ` (exit ${code})` : ''}.`);
    stop();
  });
  children.push(child);
}

function stop() {
  for (const child of children) if (!child.killed) child.kill();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start('mock backend', process.execPath, ['--import', './tests/helpers/register.mjs', 'tests/e2e/mock-backend.mjs'], { MOCK_PORT: mockPort });
start('vite', process.execPath, [path.join('node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)], {
  // A made-up app ID: the mock answers for any ID, and no real app is touched.
  VITE_BASE44_APP_ID: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  VITE_BASE44_APP_BASE_URL: `http://localhost:${mockPort}`,
});
