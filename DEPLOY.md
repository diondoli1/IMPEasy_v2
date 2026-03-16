# Deploying IMPEasy v2 on Render

## Current setup

- **API (backend):** [IMPEasy_v2](https://dashboard.render.com/web/srv-d6rivsvfte5s73eo47ng) → https://impeasy-v2.onrender.com  
- **Web (frontend):** [IMPEasy_v2-Web](https://dashboard.render.com/web/srv-d6rjcrnfte5s73eobsu0) → https://impeasy-v2-web.onrender.com  
- **Database:** [impeasy-db](https://dashboard.render.com/d/dpg-d6rjbei4d50c73b6psn0-a) (Postgres 15, Frankfurt)

## One-time steps for the API service

1. **Set build command**  
   In [IMPEasy_v2](https://dashboard.render.com/web/srv-d6rivsvfte5s73eo47ng) → **Settings** → **Build & Deploy** → **Build Command**, set:
   ```bash
   yarn && yarn build
   ```
   (This installs deps, runs Prisma generate + migrate, and builds the API.)

2. **Connect the database**  
   - Open [impeasy-db](https://dashboard.render.com/d/dpg-d6rjbei4d50c73b6psn0-a) → **Connect** → copy **Internal Database URL**.  
   - In **IMPEasy_v2** → **Environment** → **Environment Variables**, add:
     - **Key:** `DATABASE_URL`  
     - **Value:** (paste the Internal Database URL)  
   - Save. A new deploy will start.

3. **Trigger a deploy**  
   After saving, use **Manual Deploy** → **Deploy latest commit** so the API builds and runs with the new build command and `DATABASE_URL`.

## Frontend

The **IMPEasy_v2-Web** service is already configured with:

- `NEXT_PUBLIC_API_BASE_URL=https://impeasy-v2.onrender.com`

So the app talks to the API at that URL. No extra steps unless you change the API URL.

## Summary

| Resource   | URL |
|-----------|-----|
| API       | https://impeasy-v2.onrender.com |
| Web app   | https://impeasy-v2-web.onrender.com |
| Database  | Render Postgres `impeasy-db` (link via `DATABASE_URL` on the API service) |

After the API deploy succeeds (and DB is linked), open https://impeasy-v2-web.onrender.com to use the app.
