# Database Setup for IMPeasy

## Recommended: Apply All Migrations

If starting fresh or the database schema is out of date, run:

```bash
npx prisma migrate deploy
```

If the database already has tables but migrations were not tracked (e.g. baseline), apply missing migrations manually.

## Procurement Tables (Vendors, Purchase Orders, Incoming Invoices)

If Procurement → Vendors shows "Unable to load vendors" or Procurement → Invoices shows "Unable to load incoming invoices", ensure these tables exist:

```bash
# Add paymentTerm to suppliers (if column missing)
PGPASSWORD=postgres psql -h localhost -U postgres -d impeasy -f prisma/migrations/20260317000000_add_supplier_payment_term/migration.sql

# Create vendor_invoices table (incoming invoices)
PGPASSWORD=postgres psql -h localhost -U postgres -d impeasy -f prisma/migrations/20260318000001_add_vendor_invoices/migration.sql
```

- **suppliers** - Vendors table (from `20260310002600_add_suppliers`)
- **vendor_invoices** - Required for Procurement → Invoices (incoming)

## Other Schema Fixes

If the API returns 500 errors due to missing tables or schema mismatches:

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
6. **customers** - Add status/CRM fields: `psql ... -f prisma/migrations/20260319000000_add_customer_status_fields/migration.sql`
7. **invoices** - Add customerId, issueDate, paidAt, invoice_lines: `psql ... -f prisma/migrations/20260322000000_fix_invoices_schema/migration.sql`
8. **Manufacturing Orders** - work_orders, work_order_histories, work_order_operations, routing_operations, material_bookings, workstation_groups, workstations, stock_lots (sourceType, sourceReference, receivedAt, status), items (defaultPrice null fix): `psql ... -f prisma/migrations/20260323000000_fix_work_orders_schema/migration.sql`

## Environment

Create `.env` in the project root with:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impeasy"
```

The API loads this via dotenv. Without it, Prisma will fail to connect.
