/**
 * Bootstrap Admin Script
 * 
 * Run this script to create the first administrator account.
 * This only works when no admin exists in the system.
 * 
 * Usage:
 *   npx ts-node scripts/bootstrap-admin.ts
 * 
 * Or call the bootstrapAdmin Cloud Function directly:
 *   curl -X POST https://<region>-<project-id>.cloudfunctions.net/bootstrapAdmin \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "data": {
 *         "email": "admin@company.com",
 *         "password": "SecurePassword123",
 *         "displayName": "Admin",
 *         "employeeId": "ADMIN001"
 *       }
 *     }'
 * 
 * After deploying Cloud Functions, you can also call from browser console:
 *   const { getFunctions, httpsCallable } = await import('firebase/functions');
 *   const functions = getFunctions();
 *   const bootstrap = httpsCallable(functions, 'bootstrapAdmin');
 *   await bootstrap({
 *     email: 'admin@company.com',
 *     password: 'SecurePassword123',
 *     displayName: 'Admin',
 *     employeeId: 'ADMIN001'
 *   });
 */

console.log(`
========================================
  WorkTime - Bootstrap Admin Guide
========================================

To create the first admin account, deploy Cloud Functions first:

  cd functions
  npm install
  npm run build
  cd ..
  firebase deploy --only functions

If the Auth user already exists, sign in as that account in the app first,
then call bootstrapAdmin without a password. The callable checks that the
signed-in UID matches the existing Auth account, then creates its Firestore
profile and ADMIN claim. For a brand new Auth account, include a password.

Then call the bootstrapAdmin function using one of these methods:

1. Using curl:
   curl -X POST https://<region>-worktime-ce28f.cloudfunctions.net/bootstrapAdmin \\
     -H "Content-Type: application/json" \\
     -d '{"data":{"email":"admin@company.com","password":"YourPassword","displayName":"Admin","employeeId":"ADMIN001"}}'

2. Using Firebase Emulator:
   firebase emulators:start
   Then open http://localhost:4000 and call the function from the console.

3. Using browser console for an already-created Auth user (after deploying):
   Sign in through the app first, then use its initialized auth/functions objects:
   const { httpsCallable } = await import('firebase/functions');
   const bootstrap = httpsCallable(functions, 'bootstrapAdmin');
   const result = await bootstrap({
     email: 'admin@company.com',
     displayName: 'Admin',
     employeeId: 'ADMIN001',
     department: 'Ban Giám Đốc'
   });
   console.log(result.data);

4. Using browser console to create a new Auth user (after deploying):
   Open your app, then in browser console:
   const { getFunctions, httpsCallable } = await import('firebase/functions');
   const fns = getFunctions();
   const bootstrap = httpsCallable(fns, 'bootstrapAdmin');
   const result = await bootstrap({
     email: 'admin@company.com',
     password: 'YourPassword',
     displayName: 'Admin',
     employeeId: 'ADMIN001'
   });
   console.log(result.data);

Note: This function only works ONCE. After the first admin is created,
all subsequent calls will be rejected.
========================================
`);
