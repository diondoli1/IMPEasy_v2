# IMPEasy — Full Test Audit & UX Spec Compliance Tickets

**Date:** 2026-03-14  
**Scope:** Automated tests + UX spec compliance for MRP/ERP functionality

---

## Test Results Summary

| Suite | Passed | Failed | Status |
|-------|--------|--------|--------|
| Web (Vitest) | 127 | 0 | ✅ Pass |
| API (Jest e2e) | 69 | 0 | ✅ Pass |
| Web Build | — | 0 | ✅ Pass |

**TICKET-A1, A2 applied:** All tests now pass.

---

## Phase A: Fix Failing API Tests (Blocking)

### TICKET-A1: API E2E — Align Numbering Format Expectations ✅ DONE
**Priority:** P0 (blocking)  
**Cause:** TICKET-038 changed numbering to compact format (no separator). E2E tests still expect old format.  
**Failures:**
- `purchase-orders.e2e-spec.ts`: expects `PO-00001`, receives `PO00001`
- `shipments.e2e-spec.ts`: expects `SHP-00801`, receives `S00801`
- `invoices.e2e-spec.ts`: expects `INV-00702`, `SHP-00803` — needs new format

**Tasks:**
- Update purchase-orders e2e: `PO-00001` → `PO00001`
- Update shipments e2e: `SHP-00801` → `S00801` (or `S00001` per numbering)
- Update invoices e2e: `INV-00702` → `I00702`, `SHP-00803` → `S00803`

**Acceptance:** All API e2e tests pass

---

### TICKET-A2: API E2E — Add `invoice.findFirst` to PrismaServiceMock ✅ DONE
**Priority:** P0 (blocking)  
**Cause:** `InvoicingService.findInvoiceRecordByShipmentId` uses `prisma.invoice.findFirst`. Invoices e2e PrismaServiceMock lacks this method.  
**Error:** `TypeError: this.prisma.invoice.findFirst is not a function`

**Tasks:**
- Add `findFirst` to `PrismaServiceMock.invoice` in `invoices.e2e-spec.ts`
- Implement: `findFirst({ where })` → delegate to same logic as `findUnique` for `where.shipmentId`

**Acceptance:** Invoices e2e tests pass

---

## Phase B: UX Spec Compliance — Critical Gaps

### TICKET-B1: Create Purchase Order — Full Header + Line Items ✅ DONE
**Priority:** P1 (High)  
**UX Spec:** +Create = Vendor, Expected date, Order Date, Due date, Arrival date + line items table (Product group, Item, Vendor Part no, Ordered quantity, Price, Subtotal, Expected quantity, Expected date)  
**Current:** PurchaseOrderForm has Vendor and Notes only; no date fields, no line items  
**Tasks:**
- Add Expected date, Order Date, Due date, Arrival date to create form
- Add line items table with Product group, Item, Vendor Part no, Ordered quantity, Price, Subtotal, Expected quantity, Expected date
- Wire to API; Save → details conversion

**Acceptance:** Create PO matches spec; full MRP/ERP flow

---

### TICKET-B2: Create Manufacturing Order — Direct Create with BOM/Routing
**Priority:** P1 (High)  
**UX Spec:** +Create = Product group, Product, Quantity, Due Date, Start, Finish + BOM table (editable) + Routing table (editable)  
**Current:** MOs generated from released Customer Order only; no direct create; no BOM/Routing editing in form  
**Tasks:**
- Add direct MO create path (in addition to generate-from-order)
- Form: Product group, Product (dropdown + add new), Quantity, Due Date, Start, Finish
- BOM table: editable; can add/edit BOM for product
- Routing table: editable; can add/edit routing
- Inline add/edit BOM and Routing

**Acceptance:** Create MO with BOM and routing per spec

---

### TICKET-B3: Stock Items — Create Item (not Track Inventory) ✅ DONE
**Priority:** P1 (High)  
**UX Spec:** +Create = Part No, Part Desc, Product group, Unit of measurement, This is a procured item, Selling Price. Save → Item details page.  
**Current:** Stock Items +Create links to `/inventory/items/new` (Track Inventory Item), not item creation  
**Tasks:**
- Stock Items tab: +Create → Create Item form (Part No, Part Desc, Product group, UoM, This is a procured item, Selling Price)
- Save → converts to Item details page
- Align with `/items/new` or `/inventory/items/new` as appropriate

**Acceptance:** Stock Items create flow matches spec

---

### TICKET-B4: Incoming Invoices — Full Implementation ✅ DONE
**Priority:** P1 (High)  
**UX Spec:** Table: Number, Invoice ID, Invoice date, Vendor Number, Purchase order, Total, Tax, Paid sum  
**Current:** Placeholder only; "API support for vendor invoices is pending"  
**Tasks:**
- Backend: Add vendor invoice model/API (or extend existing)
- Frontend: Full table with real data
- CRUD if needed

**Acceptance:** Incoming invoices table displays real data

---

### TICKET-B5: Create Vendor — Add Payment Period ✅ DONE
**Priority:** P2 (Medium)  
**UX Spec:** +Create = Name, Phone, Email, Payment Period  
**Current:** SupplierForm has Name, Email, Phone, Active; no Payment Period  
**Tasks:**
- Add Payment Period field to vendor/supplier create form
- Wire to API if supported

**Acceptance:** Vendor create includes Payment Period

---

### TICKET-B6: Create Customer Order — Status & Field Alignment ✅ DONE
**Priority:** P2 (Medium)  
**UX Spec:** Status = Quotation, Waiting for confirmation, Confirmed. Fields: Delivery Terms, Shipping Address. Product group/Product dropdowns with create new.  
**Current:** Status uses draft/sent/approved; different field set (payment term, shipping term, tax mode, etc.)  
**Tasks:**
- Align Status dropdown: Quotation, Waiting for confirmation, Confirmed
- Add Delivery Terms, ensure Shipping Address prominent
- Product group / Product with "create new" inline (already partially done)

**Acceptance:** Customer Order form matches spec

---

### TICKET-B7: Customers — Status & Form Fields
**Priority:** P2 (Medium)  
**UX Spec:** Status = No contact, No Interest, Interested, Permanent Buyer. Form: Reg. no., TAX Number, Contact Started, Next Contact, Tax Rate, Payment Period, Currency (locked EUR). Table: Next contact column.  
**Current:** Status = Active/Inactive; different form structure; Next contact shows "-"  
**Tasks:**
- Customer Status: No contact, No Interest, Interested, Permanent Buyer
- Form: Reg. no., TAX Number, Contact Started, Next Contact, Tax Rate, Payment Period, Currency (locked EUR)
- Table: Next contact column with real data

**Acceptance:** Customers tab matches spec

---

### TICKET-B8: Company Settings — Add Tax Rate ✅ DONE
**Priority:** P3 (Low)  
**UX Spec:** Company details = Company Name, Legal Address, Email, Website, Phone, TAX Number, Tax Rate  
**Current:** No Tax Rate field  
**Tasks:**
- Add Tax Rate to Company details form
- Wire to settings API

**Acceptance:** Company details includes Tax Rate

---

### TICKET-B9: Stock Settings — Create Product Group & Unit
**Priority:** P2 (Medium)  
**UX Spec:** Product Groups: Create product group button. Units: Create button → Name, Unit conversion (1 blank = Rate blank)  
**Current:** "Product groups are derived from items. Create product group requires API support."  
**Tasks:**
- Backend: API for product groups and units of measurement (if missing)
- Frontend: Create product group; Create unit with conversion

**Acceptance:** Stock settings supports create product group and create unit

---

### TICKET-B10: Roles — Admin & Operator Only
**Priority:** P2 (Medium)  
**UX Spec:** User roles: Admin or Operator only  
**Current:** 4 roles: admin, office, planner, operator  
**Tasks:**
- Restrict UI to Admin and Operator only
- Map office/planner to Admin for backward compatibility if needed
- Update navigation and permissions

**Acceptance:** User roles dropdown shows only Admin, Operator

---

### TICKET-B11: Kiosk — Separate Module & Status Light Prominence
**Priority:** P3 (Low)  
**UX Spec:** Kiosk as own module; big boxes with workstation name + indicative light (idle=grey, on job=green, setup=yellow, alarm=red)  
**Current:** Kiosk as Production tab; status lights small (16×16)  
**Tasks:**
- Move Kiosk to separate module (not under Production)
- Enlarge status lights; make more prominent

**Acceptance:** Kiosk matches spec layout

---

### TICKET-B12: BOM & Routing — Popup Create Flow
**Priority:** P3 (Low)  
**UX Spec:** +Create → Popup: Product group, Product (no create in popup) → Proceed. Then form with BOM/routing tables.  
**Current:** Different flow; no popup  
**Tasks:**
- BOM create: Popup to choose Product group, Product → Proceed → BOM form
- Routing create: Popup → Proceed → Routing form with connected BOM
- Form shows if routing exists; can add routing

**Acceptance:** BOM and Routing create use popup flow

---

## Phase C: Workflow & MRP/ERP Verification

### TICKET-C1: End-to-End MRP Flow Test
**Priority:** P1  
**Scope:** Automated test covering: Customer Order → Quote → Sales Order → Manufacturing Order → Work Order → Kiosk operation → Shipment → Invoice  
**Tasks:**
- Create E2E or integration test for full MRP flow
- Verify each step produces correct data for next step

**Acceptance:** Full MRP flow passes automated test

---

### TICKET-C2: End-to-End Procurement Flow Test
**Priority:** P1  
**Scope:** Automated test: Purchase Order (with lines) → Receive → Stock/Lot → Inventory  
**Tasks:**
- E2E test for PO create with lines, receive, stock update

**Acceptance:** Procurement flow passes

---

## Execution Order

1. **TICKET-A1, TICKET-A2** — Fix failing tests (immediate)
2. **TICKET-B1, TICKET-B2, TICKET-B3, TICKET-B4** — Critical UX gaps
3. **TICKET-B5–B12** — Medium/low UX alignment
4. **TICKET-C1, TICKET-C2** — E2E flow tests

---

## Notes

- Web tests (127) all pass; no changes needed for unit/component tests.
- API e2e failures are due to numbering format change and missing mock method.
- UX gaps are ordered by severity; TICKET-B1–B4 are essential for MRP/ERP functionality.
