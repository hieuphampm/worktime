import crypto from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function send(response, status, body) {
  response.status(status).json(body);
}

function isAuthorized(request) {
  const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!expected || !supplied) return false;

  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length &&
    crypto.timingSafeEqual(expectedBytes, suppliedBytes);
}

function getFirebaseAdmin() {
  const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountValue) throw new Error('Missing Firebase Admin credentials.');

  const serviceAccount = JSON.parse(serviceAccountValue);
  const expectedProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (expectedProjectId && serviceAccount.project_id !== expectedProjectId) {
    throw new Error('Firebase Admin credentials belong to a different project.');
  }
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  return { auth: getAuth(app), db: getFirestore(app) };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { error: 'Method not allowed.' });
  }

  if (!isAuthorized(request)) return send(response, 401, { error: 'Unauthorized.' });

  const { email, password, displayName, employeeId, department } = process.env;
  if (!email || !password || !displayName || !employeeId) {
    return send(response, 503, { error: 'Admin account settings are incomplete.' });
  }

  try {
    const { auth, db } = getFirebaseAdmin();
    const users = db.collection('users');
    const existingAdmins = await users.where('role', '==', 'ADMIN').limit(1).get();
    if (!existingAdmins.empty) {
      return send(response, 409, { error: 'An admin profile already exists; bootstrap is one-time only.' });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      const profile = await users.doc(userRecord.uid).get();
      if (profile.exists) {
        return send(response, 409, { error: 'A profile already exists for this Auth user.' });
      }
      userRecord = await auth.updateUser(userRecord.uid, { password, displayName, disabled: false });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
      userRecord = await auth.createUser({ email, password, displayName });
    }

    await auth.setCustomUserClaims(userRecord.uid, { role: 'ADMIN' });
    const now = FieldValue.serverTimestamp();
    await users.doc(userRecord.uid).create({
      uid: userRecord.uid,
      email,
      displayName,
      employeeId,
      role: 'ADMIN',
      department: department || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return send(response, 201, { uid: userRecord.uid, message: 'Admin account created.' });
  } catch (error) {
    console.error('Admin bootstrap failed:', error.code || error.message);
    return send(response, 500, { error: 'Admin bootstrap failed. Check the Vercel function logs.' });
  }
}
