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
const apiKey = env.VITE_FIREBASE_API_KEY;
const projectId = env.VITE_FIREBASE_PROJECT_ID || 'worktime-ce28f';
const email = env.ADMIN_EMAIL;
const password = env.ADMIN_PASSWORD;
const displayName = env.ADMIN_DISPLAY_NAME || 'Admin';
const employeeId = env.ADMIN_EMPLOYEE_ID || 'ADMIN001';
const department = env.ADMIN_DEPARTMENT || 'IT';

if (!apiKey || !email || !password) {
  throw new Error('Set VITE_FIREBASE_API_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD in .env before running this command.');
}

async function postJson(url, body, idToken) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Firebase returned a non-JSON response (HTTP ${response.status}). ` +
      'Check that bootstrapAdmin is deployed to us-central1 in the configured project.'
    );
  }
  if (!response.ok) {
    const message = result.error?.message || `Firebase request failed (${response.status})`;
    const error = new Error(message);
    error.code = result.error?.status || result.error?.message;
    throw error;
  }
  return result;
}

let idToken;
try {
  const signIn = await postJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    { email, password, returnSecureToken: true }
  );
  idToken = signIn.idToken;
} catch (error) {
  // Firebase may hide whether the email exists. Let the bootstrap function
  // distinguish a missing account (create it) from an existing account (which
  // still requires a matching signed-in user).
  if (!String(error.message).includes('EMAIL_NOT_FOUND') &&
      !String(error.message).includes('INVALID_LOGIN_CREDENTIALS')) throw error;
}

const result = await postJson(
  `https://us-central1-${projectId}.cloudfunctions.net/bootstrapAdmin`,
  {
    data: {
      email,
      ...(idToken ? {} : { password }),
      displayName,
      employeeId,
      department,
    },
  },
  idToken
);

console.log(result.result || result);
