# React + TypeScript + Vite

## Bootstrap the first admin

The first admin account is provisioned by the Vercel server function at
`/api/bootstrap-admin`, which uses Firebase Admin SDK credentials to create the
Firebase Authentication user, custom claim, and matching Firestore profile.
The endpoint requires a one-time bearer token and refuses to run once an admin
profile exists.

Configure these as **sensitive server-side environment variables** in the
Vercel project:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the Firebase service account JSON for this project.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`, `ADMIN_EMPLOYEE_ID`,
  and `ADMIN_DEPARTMENT`: the first administrator profile values.
- `ADMIN_BOOTSTRAP_TOKEN`: a long random secret.

Set `ADMIN_BOOTSTRAP_URL` and the same `ADMIN_BOOTSTRAP_TOKEN` in the local,
Git-ignored `.env` file. Do not use a `VITE_` prefix for any of these secrets.
Deploy the Vercel project, then run `npm run bootstrap:admin` once. Normal
`npm run dev` and `npm run build` do not write to Firebase.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
