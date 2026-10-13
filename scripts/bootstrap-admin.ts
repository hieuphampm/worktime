/**
 * Admin bootstrap is performed by the Vercel API function in api/bootstrap-admin.js.
 * Configure ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME, ADMIN_EMPLOYEE_ID,
 * ADMIN_DEPARTMENT and FIREBASE_SERVICE_ACCOUNT_JSON as Vercel secrets, plus
 * ADMIN_BOOTSTRAP_TOKEN in Vercel and local .env. Then run:
 *
 *   npm run bootstrap:admin
 *
 * Do not put Firebase Admin credentials or bootstrap tokens in VITE_ variables.
 */

console.log('Configure the Vercel bootstrap secrets, deploy, then run npm run bootstrap:admin.');
