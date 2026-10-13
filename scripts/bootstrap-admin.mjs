import { readFile } from 'node:fs/promises';

function readEnv(text) {
  return Object.fromEntries(
    text.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return separator < 0
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')];
      })
  );
}

const localEnv = readEnv(await readFile(new URL('../.env', import.meta.url), 'utf8').catch(() => ''));
const env = { ...localEnv, ...process.env };
const endpoint = env.ADMIN_BOOTSTRAP_URL || 'https://worktime-xi.vercel.app/api/bootstrap-admin';
const token = env.ADMIN_BOOTSTRAP_TOKEN;

if (!token) {
  throw new Error('Set ADMIN_BOOTSTRAP_TOKEN in .env and in the Vercel project environment.');
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: '{}',
});

const responseText = await response.text();
let result;
try {
  result = JSON.parse(responseText);
} catch {
  throw new Error(`Vercel returned a non-JSON response (HTTP ${response.status}). Check the deployed /api/bootstrap-admin function.`);
}

if (!response.ok) {
  throw new Error(result.error || `Admin bootstrap failed (HTTP ${response.status}).`);
}

console.log(result);
