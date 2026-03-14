# IMPEasy Application Experience - Ticket System

This document breaks down the full UI/UX transformation into logical, testable tickets.

## How to Use This Ticket System

1. **Work one ticket at a time** — Complete implementation, run tests, then commit before moving on.
2. **Test after each ticket** — Run `npm run test` (from repo root or apps/web) and manually verify the changed behavior.
3. **Track progress** — Update the status in `TICKET_STATUS.md` when a ticket is done (Pending → In Progress → Done).
4. **Respect dependencies** — Follow the Execution Order section; don't skip prerequisites.
5. **Commit per ticket** — Prefer small commits: `git commit -m "TICKET-002: Login screen redesign"`. Each ticket should be implemented and tested before moving to the next. Tickets are ordered by dependency.

**Key principles:**
- Use **MUI (Material-UI) exclusively** — no other form/UI libraries
- **Inline form behavior**: When a form requires data from another entity (e.g., "add new customer" from customer order form), open the nested form in the same workspace with a Back button — never navigate away
- **Save converts Create to Details**: After saving a create form, the page becomes the entity's details page (with auto-generated number, delete button, etc.)
- **Operator role**: Only sees Kiosk; admin sees all modules

---

## Phase 0: Foundation

### TICKET-001: MUI Setup & Theme
**Scope:** Add MUI dependencies and configure theme. Replace IBM Plex with MUI typography or keep as custom theme.
**Tasks:**
- Add `@mui/material`, `@emotion/react`, `@emotion/styled` to apps/web
- Create MUI theme provider wrapping the app
- Configure theme (colors, typography) to align with IMPEasy branding
- Update layout.tsx to use ThemeProvider
**Acceptance:** App renders with MUI theme; no visual regression on existing pages
**Test:** `npm run test` passes; manual visual check

---

### TICKET-002: Login Screen Redesign
**Scope:** Minimal login screen per spec.
**Requirements:**
- IMPEasy header text only
- Username field (note: API may use email — verify and adapt)
- Password field
- No extra panels, descriptions, or MVP user hints
**Tasks:**
- Rebuild login page with MUI TextField, Button
- Remove "Sign in" panel title, "MVP-010 review users" panel
- Clean, minimal layout
**Acceptance:** Login screen shows only IMPEasy, username, password; admin can log in
**Test:** Login flow works; redirect to dashboard

---

### TICKET-003: Dashboard Layout & Navigation
**Scope:** New dashboard as landing page for admin; big clickable boxes.
**Requirements:**
- Header: IMPEasy, user name, logout icon (right)
- Six big clickable boxes: CRM, Production Planning, Stock, Procurement, Settings, Kiosk
- Operator role: only Kiosk box visible
**Tasks:**
- Create `/dashboard` route as admin landing
- Update `getLandingPath` — admin → `/dashboard`, operator → `/kiosk`
- Build dashboard page with 6 MUI Card/Box components (or similar) as clickable areas
- Update AppShell: header shows IMPEasy + user name + logout icon; remove top nav when on dashboard
- Role-based visibility: operator sees only Kiosk
**Acceptance:** Admin lands on dashboard with 6 boxes; operator lands on Kiosk; logout works
**Test:** Role-based routing; box clicks navigate correctly

---

### TICKET-004: Module Layout with Thumbnail Boxes
**Scope:** Shared layout for all module screens (CRM, Production, Stock, Procurement).
**Requirements:**
- Under header: thumbnail square boxes with logos for CRM, Production Planning, Stock, Procurement, Settings, Kiosk
- These act as quick navigation to switch modules
- Consistent across all module pages
**Tasks:**
- Create `ModuleLayout` component with thumbnail navigation
- Each thumbnail links to its module's main view
- Apply to CRM, Production, Stock, Procurement routes
**Acceptance:** Every module screen shows thumbnail boxes for quick module switching
**Test:** Thumbnail navigation works from any module

---

## Phase 1: CRM Module

### TICKET-005: CRM Shell & Tabs
**Scope:** CRM module structure with tabs.
**Requirements:**
- Route: `/crm` or similar
- Tabs: Customer Orders, Customers, Invoices, Sales Management
- Tab content area below thumbnails
**Tasks:**
- Create CRM layout with MUI Tabs
- Tab routes: Customer Orders, Customers, Invoices, Sales Management
- Wire dashboard CRM box to CRM Customer Orders tab
**Acceptance:** CRM shows 4 tabs; switching tabs works
**Test:** Tab navigation

---

### TICKET-006: Customer Orders — Kanban Board
**Scope:** Customer Orders tab main view.
**Requirements:**
- 5 vertical columns (max 6 items each): Quotation, Waiting for confirmation, Confirmed, Waiting for Production, In production, Ready for shipment
- Show 6 most recent items per column
- +Create button (top right)
**Tasks:**
- Build kanban-style board with MUI
- Fetch orders by status; display in columns
- +Create opens create form in workspace (inline)
**Acceptance:** Board shows orders by status; +Create opens form
**Test:** Board renders; create opens

---

### TICKET-007: Customer Order Create Form (Inline)
**Scope:** Create customer order form with inline nested forms.
**Requirements:**
- Title: "Create a new customer order"
- Back button → returns to Customer Orders workspace (no navigation)
- Save button
- Fields: Customer (dropdown + "Add new customer" option), Status (Quotation, Waiting for confirmation, Confirmed), Delivery date, Delivery Terms, Shipping Address, Notes
- Line items table: Product group (dropdown + create new), Product (dropdown + create new), Quantity, Price, Discount %, Subtotal, Delivery Date, delete icon
- New line appears when row is filled; pricing by kg/pieces/production hour per product format
- "Add new customer" opens Create Customer Company form inline with Back → back to Create Order
- "Create product group" / "Create product" open inline with Back
**Tasks:**
- Build Create Customer Order form with MUI
- Implement inline overlay/panel for nested forms (Customer, Product Group, Product)
- Back button closes nested form, returns to parent
- Line items with add/delete
**Acceptance:** Full create flow with inline nested forms; Back preserves parent state
**Test:** Create order with new customer; create with new product group

---

### TICKET-008: Customer Order Details Page
**Scope:** After save, create form becomes details page.
**Requirements:**
- Title: "Customer Order {number}"
- Same fields as create, editable
- Status dropdown: Quotation, Waiting for confirmation, Confirmed (+ auto status for In production, Ready for shipment)
- Delete button
- Line items editable
**Tasks:**
- Convert create form to details view on save
- Add order number display, delete button
- Status updates; auto-status when in production/shipment
**Acceptance:** Save converts to details; edit and delete work
**Test:** Create → Save → details page; status changes

---

### TICKET-009: Customers Tab — Table & Create
**Scope:** Customers tab.
**Requirements:**
- Table columns: Number, Name, Status, Next contact, Phone, Email, Edit icon
- +Create → Create Customer Company form (inline, Back/Save)
- Form fields: Name, Status (No contact, No Interest, Interested, Permanent Buyer), Reg. no., TAX Number, Phone, Email, Contact Started, Next Contact, Tax Rate, Payment Period, Currency (locked EUR)
**Tasks:**
- Customers table with MUI Table
- Create customer form inline
- Edit opens customer details/edit
**Acceptance:** Table lists customers; create and edit work
**Test:** CRUD for customers

---

### TICKET-010: Invoices Tab — List & Details
**Scope:** Invoices tab.
**Requirements:**
- Table: Number, Customer Number, Customer name, Status (Paid, Unpaid), Total including tax, Paid sum, Created, Due date, Edit icon
- Edit → Invoice details page
- Details: Number (auto, unchangeable), Customer order number, Customer, Status (Paid, Unpaid), Created, Due Date, Billing Address, Notes
- Line items table: Order, Product Group, Product (read-only), Quantity, Price per UoM, Discount, Subtotal, Delivery date
- Can add more lines
**Tasks:**
- Invoices table
- Invoice details page with form and line items
**Acceptance:** List and details work; line items editable
**Test:** Invoice CRUD

---

### TICKET-011: Invoices — Create Invoice
**Scope:** Create invoice form.
**Requirements:**
- +Create → Create Invoice
- Fields: Customer Order (pick or create new → redirects to create order inline), Customer (pick or create), Type (Quotation, Invoice, Proforma Invoice), Status (Unpaid, Dummy, Paid), Created, Due Date, Billing Address, Notes
- Selecting customer order/customer autofills
- Line items table: Order, Product Group, Product, Quantity, Price, UoM, Discount, Subtotal, Delivery Date
**Tasks:**
- Create invoice form with autofill
- Inline create customer order when needed
**Acceptance:** Create invoice with autofill; nested create order works
**Test:** Create invoice from order; autofill

---

### TICKET-012: Sales Management Tab
**Scope:** Sales Management tab.
**Requirements:**
- Big table of customers
- Click row → Customer information page/form
**Tasks:**
- Sales Management table
- Row click → customer details
**Acceptance:** Table and navigation to customer
**Test:** Click customer → details

---

## Phase 2: Production Planning Module

### TICKET-013: Production Planning Shell & Tabs
**Scope:** Production Planning module structure.
**Requirements:**
- Tabs: Manufacturing Orders, Workstations, Workstation Group, BOM, Routings
- Thumbnail boxes above tabs
**Tasks:**
- Production layout with tabs
- Route structure for all 5 tabs
**Acceptance:** All 5 tabs visible and navigable
**Test:** Tab navigation

---

### TICKET-014: Manufacturing Orders — Create Form
**Scope:** Create manufacturing order.
**Requirements:**
- Fields: Product group, Product (dropdown + add new), Quantity, Due Date, Start, Finish
- BOM table (editable; can add/edit BOM for product)
- Routing table (editable; can add/edit routing)
**Tasks:**
- Create MO form with BOM and Routing tables
- Inline add/edit BOM and Routing
**Acceptance:** Create MO with BOM and routing
**Test:** Create MO; edit BOM/routing inline

---

### TICKET-015: Manufacturing Orders — Table
**Scope:** Manufacturing orders list.
**Requirements:**
- Columns: Number, Group Name, Part No, Part desc, Quantity, Status, Part Status, Due Date, Start, Finish, Edit icon
- +Create button
**Tasks:**
- MO table
- Edit → MO details
**Acceptance:** Table and edit work
**Test:** List and edit MO

---

### TICKET-016: Workstations Tab
**Scope:** Workstations.
**Requirements:**
- Table: Number, Name, Type, Hourly Rate, Edit
- +Create → Create Workstation: Name, Type, Hourly Rate
**Tasks:**
- Workstations table and create form
**Acceptance:** Workstations CRUD
**Test:** Create, list, edit workstation

---

### TICKET-017: Workstation Group Tab
**Scope:** Workstation groups.
**Requirements:**
- Table: Number, Name, Type, Number of instances, Edit
- +Create: Name, Number of instances, Hourly rate
**Tasks:**
- Workstation groups table and create form
**Acceptance:** Workstation groups CRUD
**Test:** CRUD for workstation groups

---

### TICKET-018: BOM Tab — Create & Table
**Scope:** BOM management.
**Requirements:**
- Table: Number, Name, Part No, Part description, Group number, Group Name, Approximate Cost
- +Create → Popup: choose Product group, Product (no create in popup) → Proceed
- Form: Shows if routing exists; can add routing
- BOM table: Product group, Part, Notes, UoM, Quantity, Delete
**Tasks:**
- BOM list and create flow with product picker popup
- BOM line items table
**Acceptance:** Create BOM; edit lines
**Test:** BOM CRUD

---

### TICKET-019: Routings Tab — Create & Table
**Scope:** Routings.
**Requirements:**
- Table: Number, Name, Part No, Part Description, Group number, Group name, Duration, Cost, Edit (per line)
- +Create → Popup: Product group, Product → Proceed
- Connected BOM (show or create)
- Table: Workstation group, Operation description, Setup time, Cycle Time, Edit
**Tasks:**
- Routings table and create with product picker
- Routing operations table
**Acceptance:** Create routing; edit operations
**Test:** Routing CRUD

---

## Phase 3: Stock Module

### TICKET-020: Stock Shell & Tabs
**Scope:** Stock module structure.
**Requirements:**
- Tabs: Items, Stock settings, Shipments, Inventory
**Tasks:**
- Stock layout with 4 tabs
**Acceptance:** All tabs visible
**Test:** Tab navigation

---

### TICKET-021: Stock Items Tab
**Scope:** Items tab.
**Requirements:**
- Table: Part No, Part Description, Group number, Group Name, In stock, Available, Booked, UoM, Cost, Edit
- +Create: Part No, Part Desc, Product group, Unit of measurement, This is a procured item, Selling Price
- Save → converts to Item details page
**Tasks:**
- Items table and create form
- Save converts to details
**Acceptance:** Items CRUD; save → details
**Test:** Create item → details

---

### TICKET-022: Stock Settings Tab
**Scope:** Product groups and units of measurement.
**Requirements:**
- Product Groups: table (Number, Name), Create product group button
- Units of measurement: table, Create button → Name, Unit conversion (1 blank = Rate blank)
**Tasks:**
- Stock settings with two sub-sections
- Create product group; create UoM
**Acceptance:** Product groups and UoM management
**Test:** Create product group, UoM

---

### TICKET-023: Shipments Tab
**Scope:** Shipments.
**Requirements:**
- Table: Number, Created, Delivery Date, Status, Order, Customer number, Customer name, Edit
- +Create: Delivery Date, Status (Ready for shipment, Shipment), Customer Order, Shipping address
**Tasks:**
- Shipments table and create form
**Acceptance:** Shipments CRUD
**Test:** Create shipment

---

### TICKET-024: Inventory Tab
**Scope:** Inventory.
**Requirements:**
- Table: Part No, Group number, Group name, Quantity, Cost, Part description, Physical quantity (editable with Save button per line)
**Tasks:**
- Inventory table with inline edit for Physical quantity
- Per-row Save for physical quantity
**Acceptance:** Inventory view; physical quantity edit and save
**Test:** Edit physical quantity; save

---

## Phase 4: Procurement Module

### TICKET-025: Procurement Shell & Tabs
**Scope:** Procurement module structure.
**Requirements:**
- Tabs: Purchase Orders, Vendors, Invoices
**Tasks:**
- Procurement layout with 3 tabs
**Acceptance:** All tabs visible
**Test:** Tab navigation

---

### TICKET-026: Purchase Orders Tab
**Scope:** Purchase orders.
**Requirements:**
- Table: Number, Created, Expected date, Vendor number, Vendor name, Edit
- +Create: Vendor, Expected date, Order Date, Due date, Arrival date
- Line items: Product group, Item, Vendor Part no, Ordered quantity, Price, Subtotal, Expected quantity, Expected date
**Tasks:**
- PO table and create form with lines
**Acceptance:** PO CRUD with lines
**Test:** Create PO with lines

---

### TICKET-027: Vendors Tab
**Scope:** Vendors.
**Requirements:**
- Table: Number, Name, Edit
- +Create: Name, Phone, Email, Payment Period
**Tasks:**
- Vendors table and create form
**Acceptance:** Vendors CRUD
**Test:** Vendor CRUD

---

### TICKET-028: Incoming Invoices Tab
**Scope:** Incoming invoices.
**Requirements:**
- Table: Number, Invoice ID, Invoice date, Vendor Number, Purchase order, Total, Tax, Paid sum
**Tasks:**
- Incoming invoices table (read/list; edit if needed)
**Acceptance:** Table displays incoming invoices
**Test:** List incoming invoices

---

## Phase 5: Settings Module

### TICKET-029: Settings Layout — Left Sidebar
**Scope:** Settings structure.
**Requirements:**
- Left sidebar: Company details, Numbering formats, User roles
**Tasks:**
- Settings layout with sidebar navigation
**Acceptance:** Sidebar with 3 items
**Test:** Sidebar navigation

---

### TICKET-030: Company Details
**Scope:** Company settings form.
**Requirements:**
- Fields: Company Name, Legal Address, Email, Website, Phone, TAX Number, Tax Rate
**Tasks:**
- Company details form
**Acceptance:** Company details editable
**Test:** Save company details

---

### TICKET-031: Numbering Formats
**Scope:** Numbering formats (static).
**Requirements:**
- Static display of codes:
  - Customer orders: CO00010
  - Customers: CU00002
  - Invoices: I00003
  - Pro-forma invoices: PI00000
  - Quotations: Q00000
  - Order confirmations: OC00000
  - Manufacturing orders: MO00003
  - Workstations: C00000
  - Workstation groups: WCT00002
  - BOM: BO00003
  - Routings: R00003
  - Items: A00014
  - Shipments: S00003
  - Product group: AG00003
  - Purchase orders: PO00003
- Unchangeable; these are the app codes
**Tasks:**
- Numbering formats page (read-only display)
- Ensure API uses these prefixes/patterns
**Acceptance:** Numbering formats displayed; used by app
**Test:** Verify codes in use

---

### TICKET-032: User Roles
**Scope:** User roles management.
**Requirements:**
- List of users
- Dropdown per user: role (Admin, Operator only)
**Tasks:**
- User list with role dropdown
- Update role API call
**Acceptance:** Assign admin or operator per user
**Test:** Change user role

---

## Phase 6: Kiosk Module

### TICKET-033: Kiosk — Admin View
**Scope:** Kiosk for admin.
**Requirements:**
- Big boxes: workstation name + indicative light (idle=grey, on job=green, setup=yellow, alarm=red)
- Under workstation: current job if any
- Manufacturing backlog with manufacturing orders
**Tasks:**
- Kiosk dashboard with workstation status
- Status lights; current job; backlog
**Acceptance:** Admin sees workstation status and backlog
**Test:** Kiosk view for admin

---

### TICKET-034: Kiosk — Operator View (Workstation Select)
**Scope:** Operator Kiosk entry.
**Requirements:**
- First: "Select a workstation" popup + Proceed
- Then: Manufacturing orders list
**Tasks:**
- Workstation selection popup for operator
- Proceed → orders list
**Acceptance:** Operator selects workstation then sees orders
**Test:** Operator flow

---

### TICKET-035: Kiosk — Operator Job Execution
**Scope:** Operator job controls.
**Requirements:**
- Start Job per MO
- After Start → Set up button (machine in setup mode)
- After Set up → Start Job (working mode)
- Stop button to stop job
- Complete Job button always visible
- Complete Job → Popup: Good quantity, Scrap quantity
**Tasks:**
- Start Job, Set up, Start Job (production), Stop, Complete Job
- Complete Job popup with good/scrap
**Acceptance:** Full operator execution flow
**Test:** Start → Setup → Start → Stop/Complete

---

## Phase 7: API & Data Model Alignment

### TICKET-036: API Alignment — Customer Orders & Quotes
**Scope:** Align API with new Customer Order flow (Quotation → Confirmed, etc.).
**Tasks:**
- Map Quote/SalesOrder to Customer Order model if needed
- Ensure statuses: Quotation, Waiting for confirmation, Confirmed, Waiting for Production, In production, Ready for shipment
- API endpoints for create, update, list by status
**Acceptance:** API supports new flow
**Test:** API integration tests

---

### TICKET-037: API Alignment — Workstations & Workstation Groups
**Scope:** Add Workstation and WorkstationGroup if not in schema.
**Tasks:**
- Prisma schema: Workstation, WorkstationGroup (if missing)
- API CRUD for workstations, workstation groups
**Acceptance:** Workstation data model and API
**Test:** API tests

---

### TICKET-038: API Alignment — Numbering
**Scope:** Implement numbering per TICKET-031.
**Tasks:**
- Numbering service/API using static prefixes
- Apply to all document types
**Acceptance:** All documents use correct numbering
**Test:** Create entities; verify numbers

---

### TICKET-039: API Alignment — Username vs Email
**Scope:** Login with username.
**Tasks:**
- If API uses email: add username field or use email as "username" in UI
- Ensure login works with admin credentials
**Acceptance:** Login accepts username (or email as username)
**Test:** Login flow

---

## Phase 8: Polish & Regression

### TICKET-040: Remove Legacy Primitives
**Scope:** Remove custom primitives; use MUI everywhere.
**Tasks:**
- Replace all Button, Field, Panel, etc. with MUI
- Remove primitives.tsx or reduce to MUI wrappers
- Update globals.css if needed
**Acceptance:** No custom primitives in use
**Test:** Full regression

---

### TICKET-041: Inline Form Behavior — Universal
**Scope:** Ensure all nested forms use inline + Back pattern.
**Tasks:**
- Audit all create/edit flows
- "Add new X" from dropdown → inline form, Back → parent
- No full-page redirects for nested creates
**Acceptance:** Consistent inline behavior
**Test:** All nested form flows

---

### TICKET-042: Save → Details Conversion — Universal
**Scope:** All create forms convert to details on save.
**Tasks:**
- Audit: Customer Order, Customer, Invoice, Item, Workstation, etc.
- Save → same URL or update to /:id, show details view
**Acceptance:** Create → Save → Details everywhere
**Test:** All create flows

---

### TICKET-043: Operator Role Restriction
**Scope:** Operator sees only Kiosk.
**Tasks:**
- Dashboard: operator goes to Kiosk directly (no dashboard)
- Navigation: operator has no access to CRM, Production, Stock, Procurement, Settings
- Kiosk: operator sees only operator view (workstation select, job execution)
**Acceptance:** Operator isolated to Kiosk
**Test:** Login as operator; verify no other routes

---

### TICKET-044: End-to-End & Visual QA
**Scope:** Full application QA.
**Tasks:**
- Run all tests
- Manual walkthrough: Login → Dashboard → each module → create/edit flows
- Fix any regressions
**Acceptance:** All tests pass; no critical bugs
**Test:** Full E2E

---

## Ticket Dependency Graph (Summary)

```
001 (MUI) → 002 (Login) → 003 (Dashboard) → 004 (Module Layout)
                                                    ↓
005 (CRM Shell) → 006–012 (CRM tabs)
013 (Prod Shell) → 014–019 (Prod tabs)
020 (Stock Shell) → 021–024 (Stock tabs)
025 (Proc Shell) → 026–028 (Proc tabs)
029 (Settings) → 030–032
033–035 (Kiosk)
036–039 (API alignment)
040–044 (Polish)
```

---

## Execution Order (Recommended)

1. **001** → **002** → **003** — Foundation
2. **004** — Module layout
3. **005** → **006** → **007** → **008** — CRM Customer Orders
4. **009** → **010** → **011** → **012** — CRM remaining tabs
5. **013** → **014** → **015** → **016** → **017** → **018** → **019** — Production
6. **020** → **021** → **022** → **023** → **024** — Stock
7. **025** → **026** → **027** → **028** — Procurement
8. **029** → **030** → **031** → **032** — Settings
9. **033** → **034** → **035** — Kiosk
10. **036** → **037** → **038** → **039** — API (can overlap with above)
11. **040** → **041** → **042** → **043** → **044** — Polish

---

## Notes

- **Username vs Email**: Current API uses email. Ticket 002 may use "Username" label but pass email; or API can be extended for username.
- **Customer Order vs Quote/SalesOrder**: Existing schema has Quote → SalesOrder. Customer Order may map to Quote (quotation) or a new model. Ticket 036 addresses this.
- **Workstation model**: Current schema has `workstation` as string on RoutingOperation. Ticket 037 may introduce Workstation/WorkstationGroup models.
- **Numbering**: Static codes in TICKET-031; API must implement. Check existing NumberingSetting model.
