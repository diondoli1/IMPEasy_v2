# Database Setup for IMPeasy

If the API returns 500 errors due to missing tables or schema mismatches, run these SQL commands against your PostgreSQL database:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d impeasy -f prisma/migrations/20260311223000_mvp_050_settings_permissions_dashboards/migration.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d impeasy -f prisma/migrations/20260320000000_add_product_groups_and_units/migration.sql
```

Or apply manually:

1. **numbering_settings** - Create if missing (see `prisma/migrations/20260311223000_*`)
2. **company_settings** - Create if missing
3. **product_groups**, **unit_of_measures** - Create if missing (see `prisma/migrations/20260320000000_*`)
4. **work_orders.salesOrderLineId** - Make nullable: `ALTER TABLE work_orders ALTER COLUMN "salesOrderLineId" DROP NOT NULL;`
5. **items.unitOfMeasure** - Fix nulls: `UPDATE items SET "unitOfMeasure" = 'pcs' WHERE "unitOfMeasure" IS NULL;`

## Environment

Create `.env` in the project root with:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impeasy"
```

The API loads this via dotenv. Without it, Prisma will fail to connect.
