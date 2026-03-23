# Deploying IMPEasy v2 on Render

## Current setup

- **API (backend):** [IMPEasy_v2](https://dashboard.render.com/web/srv-d6rivsvfte5s73eo47ng) → https://impeasy-v2.onrender.com  
- **Web (frontend):** [IMPEasy_v2-Web](https://dashboard.render.com/web/srv-d6rjcrnfte5s73eobsu0) → https://impeasy-v2-web.onrender.com  
- **Database:** [impeasy-db](https://dashboard.render.com/d/dpg-d6rjbei4d50c73b6psn0-a) (Postgres 15, Frankfurt)

## One-time steps for the API service

1. **Set build command**  
   In [IMPEasy_v2](https://dashboard.render.com/web/srv-d6rivsvfte5s73eo47ng) → **Settings** → **Build & Deploy** → **Build Command**, set:
   ```bash
   npm install && npm run build
   ```
   (This installs deps, runs Prisma generate + migrate, seeds admin/operator users, and builds the API.)

2. **Connect the database**  
   - Open [impeasy-db](https://dashboard.render.com/d/dpg-d6rjbei4d50c73b6psn0-a) → **Connect** → copy **Internal Database URL**.  
   - In **IMPEasy_v2** → **Environment** → **Environment Variables**, add:
     - **Key:** `DATABASE_URL`  
     - **Value:** (paste the Internal Database URL)  
   - Save. A new deploy will start.

3. **Trigger a deploy**  
   After saving, use **Manual Deploy** → **Deploy latest commit** so the API builds and runs with the new build command and `DATABASE_URL`.

## Frontend (Next.js) on Render

The **IMPEasy_v2-Web** service needs a **production build** before `next start`. If you see *Could not find a production build in the '.next' directory*, the build step did not run in the same tree as the start command (wrong **Root Directory** or build command).

1. **Root Directory**  
   Leave **blank** (repository root — the folder that contains the root `package.json` and `package-lock.json`).  
   Do **not** set Root Directory to `apps/web` unless you use the alternate commands below.

2. **Build Command**
   ```bash
   npm install && npm run build:web
   ```
   (`build:web` runs `next build` for `apps/web` and creates `apps/web/.next`.)

3. **Start Command**
   ```bash
   npm run start:web
   ```

**If Root Directory is `apps/web`** (not recommended for this monorepo), use instead:
```bash
npm install && npm run build
```
and
```bash
npm run start
```

Environment (already expected):

- `NEXT_PUBLIC_API_BASE_URL=https://impeasy-v2.onrender.com`

## Summary

| Resource   | URL |
|-----------|-----|
| API       | https://impeasy-v2.onrender.com |
| Web app   | https://impeasy-v2-web.onrender.com |
| Database  | Render Postgres `impeasy-db` (link via `DATABASE_URL` on the API service) |

After the API deploy succeeds (and DB is linked), open https://impeasy-v2-web.onrender.com to use the app.

## Default login credentials

The deploy build now runs `npm run seed:admin`, so these users are available after each successful API deploy:

- `admin@impeasy.local` / `Admin123!`
- `operator@impeasy.local` / `Operator123!`
