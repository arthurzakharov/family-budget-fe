# familly-budget-fe

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun dev
```

Run for production:

```bash
bun start
```

## Backend

All data lives in family-budget-be. The Bun server forwards every `/api/*` request to `API_URL`, with the `/api` prefix removed (`/api/auth/login` → `<API_URL>/auth/login`); it refuses to start without `API_URL`. The browser only talks to this server, so the backend's session cookie is first-party and survives browsers that block third-party cookies. The backend's `ALLOWED_ORIGINS` must include this server's URL, since requests keep the browser's `Origin` header.

```bash
# .env (git-ignored) — both servers default to port 3000 locally
API_URL=http://localhost:3000
PORT=3001
```

The browser calls the backend through its typed client, `@arthurzakharov/family-budget-be-client` (`src/client/api.ts`). Until the client is published, `package.json` installs it from the backend's local build (`file:../familly-budget-be/dist-client`; run `bun run client:build` there first). Once it is published, switch to the registry version: add `@arthurzakharov:registry=https://npm.pkg.github.com` with a `read:packages` token to `bunfig.toml`/`.npmrc`, then `bun add @arthurzakharov/family-budget-be-client`.

Deposit and expense money comes from the backend in whole cents (`amountCents`); forms take euros and send cents (`toCents`), tables show euros (`formatCents`). Crypto amounts and prices are plain euros.

## Folder structure

Imports use the aliases `@client/…`, `@server/…` and `@shared/…` (set in `tsconfig.json` under `paths`) instead of relative paths. `shared/` must not import from `server/` or `client/`.

```
src/
  server/        Bun server (runs only on the server)
    index.ts     entry point: serves the app and proxies /api/* to API_URL
    proxy.ts     forwards /api/* to family-budget-be
  shared/        calculations over the backend's data (no React, tested with bun test)
    roles.ts     roles and what each may do
    interest.ts  narrows the backend's interest summary to some groups
    crypto.ts, expenses.ts, transactions.ts  sums and signs of records
    validation.ts  the backend's password rule, for form hints
  client/        the React app
    api.ts       the typed backend client, call()/load() and form helpers
    index.html, frontend.tsx, App.tsx, index.css
    router.tsx   routes and their guards (TanStack Router)
    context/     providers: auth, i18n, theme, and the data shared by the tabs of deposit, crypto and expenses
    translations/ en.ts and ru.ts
    pages/       one component per route; deposit/, crypto/ and expenses/ hold each page and its tabs
    components/  pieces used by pages, grouped by page (deposit/, crypto/, expenses/, users/) plus the Layout
    utils/       formatting helpers, access.ts (which group tabs a user may open)
```
