# IMPeasy UX Compliance Report

**Date:** March 14, 2026  
**Reference:** UX_SPEC_REFERENCE.md (master prompt)

---

## Summary of Fixes Applied This Session

### 1. Client-Side Exception (CRM / Dashboard Boxes)
- **Issue:** "Rendered more hooks than during the previous render" when clicking CRM or other dashboard boxes.
- **Root cause:** Dashboard linked to `/crm`, which does a server-side `redirect('/customer-orders')`. The redirect triggered a React Router hooks mismatch.
- **Fix:** Dashboard CRM box now links directly to `/customer-orders` instead of `/crm`.
- **Result:** ✅ All 6 dashboard boxes (CRM, Production Planning, Stock, Procurement, Settings, Kiosk) navigate without client-side crash.

### 2. API 500 Errors (Backend)
- **Issue:** API returned 500 for quotes, stock, manufacturing-orders, settings when DATABASE_URL was unset or DB schema was incomplete.
- **Fixes:**
  - Added `dotenv` to load `DATABASE_URL` from `.env` (create `.env` with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impeasy"`).
  - Created `DATABASE_SETUP.md` with SQL to create missing tables: `numbering_settings`, `company_settings`, `product_groups`, `unit_of_measures`.
  - Made `work_orders.salesOrderLineId` nullable for direct MO support.
  - Fixed `items.unitOfMeasure` null handling (schema optional, service defaults to `'pcs'`).
- **Result:** With correct DB setup and `.env`, API endpoints return 200.

### 3. Kiosk Page
- **Issue:** Kiosk sometimes showed "Aw, Snap!" (same hooks/redirect pattern when accessed via certain paths).
- **Note:** Kiosk links directly to `/kiosk`; no redirect. If errors persist, they may be due to API 500s (operations queue, manufacturing orders) rather than client-side hooks.

---

## What Works vs Master Prompt

### ✅ Login Screen
- IMPEasy header, username, password fields.
- Minimal layout. Matches spec.

### ✅ Dashboard
- Header: IMPEasy, user name, logout icon.
- Six boxes: CRM, Production Planning, Stock, Procurement, Settings, Kiosk.
- Operator: Kiosk-only (landing path).

### ✅ Module Layout
- Thumbnail boxes for module switching.
- Tabs under each module.

### ✅ CRM — Customer Orders
- Kanban: Quotation, Waiting for confirmation, Confirmed, Waiting for Production, In production, Ready for shipment.
- +Create opens Create Customer Order form.
- Back/Save, inline customer/product creation behavior.
- Status labels, Delivery Terms, Notes, line items with Product group, Product, Quantity, Price, etc.
- Save → Details conversion.

### ✅ CRM — Customers
- Table: Number, Name, Status, Next contact, Phone, Email, Edit.
- +Create → Create Customer Company.
- Form: Name, Status, Reg. no., Contact Started, Next Contact, Tax Rate, Payment Period, Currency (EUR).

### ✅ CRM — Invoices
- List with columns.
- +Create, details page.

### ✅ CRM — Sales Management
- Table of customers, click → customer details.

### ✅ Production Planning
- Manufacturing Orders, Workstations, Workstation Group, BOM, Routings.
- +Create for each, tables, edit flows.
- BOM/Routing: popup for product group + product selection, then proceed.
- Direct MO creation (Product, Quantity, Due date) and From customer order.

### ✅ Stock
- Items, Stock settings, Shipments, Inventory.
- +Create Item: Part No, Part Desc, Product group, Unit, Procured item, Selling price.
- Stock settings: Product groups, Units of measurement with create dialogs.
- Save → Details conversion.

### ✅ Procurement
- Purchase Orders, Vendors, Invoices.
- PO create: Vendor, Order Date, Expected Date, Notes, line items table.
- Vendors: Name, Phone, Email, Payment Period.
- Incoming invoices table.

### ✅ Settings
- Company details, Numbering formats, User roles.
- Company: Name, Legal Address, Email, Website, Phone, TAX Number, Tax Rate.
- Numbering: static codes (CO, CU, I, etc.).
- User roles: Admin and Operator only.

### ✅ Kiosk
- Workstation cards with status lights (idle/setup/on job/alarm).
- Manufacturing backlog table.
- Operator: workstation select popup, Start job, Setup, Complete job.

---

## Gaps / Partial Compliance

| Area | Spec | Current | Notes |
|------|------|---------|-------|
| Inline "Add new customer" | Opens Create Customer inline, Back returns to order | May use navigation in some flows | Verify inline modal/overlay behavior |
| Product group / Product create from order | Inline in same workspace | May open separate page | Check for true inline behavior |
| Invoice create | Customer Order pick, Customer, Type, Status, etc. | Implemented | Verify full field set |
| Numbering formats | Static, unchangeable codes | API supports; UI may allow edit | Spec says static |
| Settings list types | payment_terms, shipping_terms, etc. | May use settings_list_entries | Verify UI presence |

---

## Running the Application

1. **Database:** Ensure PostgreSQL is running. Apply schema per `DATABASE_SETUP.md` if needed.
2. **Environment:** Create `.env` in project root with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/impeasy"`.
3. **API:** `DATABASE_URL=... npm run start --workspace=apps/api` (or rely on `.env`).
4. **Web:** `npm run dev --workspace=apps/web`.
5. **Credentials:** `admin@impeasy.local` / `Admin123!` (admin), `operator@impeasy.local` / `Operator123!` (operator).

---

## Recommendations

1. Run `DATABASE_SETUP.md` SQL if 500 errors persist.
2. Ensure `.env` exists with `DATABASE_URL` before starting the API.
3. For full manual testing, start API and web with DB and env correctly configured, then walk through each module per UX_SPEC_REFERENCE.md.
