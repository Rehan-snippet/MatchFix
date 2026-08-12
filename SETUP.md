# MatchFix — Setup Guide (for teammates)

This project is a PERN stack app (PostgreSQL, Express, React, Node). Follow
this once when you first clone the repo, or whenever the schema/dependencies
change.

```
MatchFix/
├── database/     # SQL schema + seed data
├── server/       # Express API
├── client/       # React (Vite) frontend
└── README.md     # project overview + ERD-to-code mapping
```

## 0. Prerequisites

- **Node.js 18+** — check with `node -v`
- **PostgreSQL 14+** running locally — check with `psql --version`
- A GitHub account with access to this repo

## 1. Get the code

If you don't have it yet:
```powershell
git clone https://github.com/Rehan-snippet/MatchFix.git
cd MatchFix
```

If you already have an **older** local copy (from before the rewrite),
sync it instead of merging by hand:
```powershell
cd MatchFix
git fetch origin
git reset --hard origin/main
git clean -fd
```
⚠️ This discards any uncommitted local changes — `git stash` first if you
have work in progress you don't want to lose.

## 2. Install dependencies

```powershell
cd server
npm install
cd ..\client
npm install
```

## 3. Set up environment files

These are gitignored on purpose (they hold secrets/local config), so
everyone creates their own:

```powershell
cd ..\server
Copy-Item .env.example .env
cd ..\client
Copy-Item .env.example .env
```

Open **`server\.env`** and fill in:
- `DATABASE_URL` — **your own** local Postgres connection string, e.g.
  `postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchfix`
  (use your own Postgres password here, not a teammate's)
- `JWT_SECRET` — any long random string; doesn't need to match anyone
  else's, each person's local server issues its own tokens

`client\.env` usually needs no changes for local dev — it only matters if
you're pointing the frontend at a non-default API URL.

## 4. Set up the database

```powershell
cd server
npm run db:create    # creates the "matchfix" database if missing
npm run db:migrate    # applies database/schema.sql
npm run db:seed        # optional — loads sample data from database/seed.sql
```

If you already have a database called `matchfix` from an older version of
this project and want a clean slate:
```powershell
dropdb matchfix
npm run db:create
npm run db:migrate
npm run db:seed
```

## 5. Run it

Two terminals, both need to stay open while you work:

**Terminal 1 — backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 — frontend:**
```powershell
cd client
npm run dev
```

Open **http://localhost:5173** — that's the app. (`localhost:5000` is the
API only; it has no homepage, `GET /` there is expected to 404.)

## Quick health checks

| URL | Should show |
|---|---|
| `http://localhost:5000/health` | `{"status":"ok",...}` |
| `http://localhost:5000/api/areas` | JSON list of seeded areas |
| `http://localhost:5173` | The actual MatchFix UI |

If `/health` works but `/api/areas` doesn't, the problem is your DB
connection (`server\.env` → `DATABASE_URL`), not the app itself.

## Everyday workflow (after first-time setup)

You don't need to repeat steps 2–4 every time. Just:
```powershell
cd server && npm run dev
```
```powershell
cd client && npm run dev
```

Only re-run the `db:*` scripts if the schema changes (`database/schema.sql`
gets edited) or you want to reset your local data.

## Common issues

**`password authentication failed for user "postgres"`**
Your `DATABASE_URL` in `server\.env` has the wrong password. Update it to
your actual local Postgres password.

**`git push` rejected / merge conflicts**
Don't try to manually merge the old prototype structure with the new one —
use `git reset --hard origin/main` (step 1) to sync cleanly instead.

**Nothing at `localhost:5000/`**
Expected — the API has no root page. Use `localhost:5173` for the app, or
`localhost:5000/health` / `localhost:5000/api/...` to check the API
directly.

## Where things live (ERD mapping)

See the main [`README.md`](./README.md) for the full table mapping each ER
diagram entity/relationship to its table and controller.
