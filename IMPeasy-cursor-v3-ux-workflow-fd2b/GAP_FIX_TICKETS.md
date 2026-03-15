# IMPEasy — Gap Fix Tickets (Batched)

**Source:** TEST_REPORT_AND_GAP_ANALYSIS.md  
**Date:** March 15, 2026

---

## Batch 1 — Foundation (No Dependencies)

Run first. Can execute in parallel with Batch 3.

### TICKET-1: Thumbnail Boxes Visibility
- **Priority:** High
- **Spec:** "Under the header you have thumbnail square boxes with the logos of the main dashboard boxes"
- **Current:** ModuleThumbnails component exists in app-shell.tsx but may not be prominent or visible on all screens
- **Tasks:**
  1. Verify ModuleThumbnails renders on all module pages (CRM, Production, Stock, Procurement, Kiosk)
  2. If hidden on dashboard, consider showing on dashboard too (spec says "whichever screen you go")
  3. Add icons/logos per spec if only text labels currently
  4. Ensure styling: square boxes, visible below header
- **Acceptance:** Thumbnail boxes visible and clickable on all module screens

### TICKET-2: Seed Workstation Groups and Workstations
- **Priority:** High
- **Spec:** Kiosk needs workstation boxes; Production Planning Workstation Group table empty
- **Current:** No workstation groups or workstations in seed data
- **Tasks:**
  1. Add workstation groups to seed-mvp-030-demo.mjs or create seed-workstations.mjs
  2. Create at least 2 workstation groups (e.g. "Assembly Cell A", "Assembly Cell B")
  3. Create workstations linked to those groups
  4. Ensure routing_operations can reference workstations
- **Acceptance:** After seed, workstation_groups and workstations tables have data; Kiosk can display them

---

## Batch 2 — Kiosk (Depends on Batch 1)

**Pause until Batch 1 complete.** Needs workstations from TICKET-2.

### TICKET-3: Kiosk Workstation Boxes with Status Lights
- **Priority:** High
- **Spec:** Big boxes with workstation name + indicative light (idle=grey, job=green, setup=yellow, alarm=red)
- **Current:** No workstation boxes shown
- **Tasks:**
  1. Fetch workstation groups and workstations in Kiosk page
  2. Render big boxes per workstation (or workstation group)
  3. Add status light (grey/green/yellow/red) based on operation state
  4. Show current job under workstation if any
- **Acceptance:** Kiosk displays workstation boxes with status lights; admin view shows manufacturing backlog

### TICKET-4: Fix Kiosk Operator Data Loading
- **Priority:** High
- **Spec:** Operator sees manufacturing orders; can Start Job, Set up, Complete Job
- **Current:** "Unable to load kiosk data" for operator
- **Tasks:**
  1. Debug kiosk data fetch (operations queue, manufacturing orders)
  2. Verify operator role has API access to /operations/queue, /manufacturing-orders
  3. Fix any permission or query issues
  4. Ensure "Select workstation" popup works for operator
- **Acceptance:** Operator logs in, selects workstation, sees manufacturing orders, no "Unable to load" error

---

## Batch 3 — Inline Forms (No Dependencies)

Can execute in parallel with Batch 1.

### TICKET-5: Inline "Add New Customer" from Order Form
- **Priority:** Medium
- **Spec:** "Add new customer" opens Create Customer inline in same workspace; Back returns to order form
- **Current:** May navigate to separate page
- **Tasks:**
  1. Find Customer dropdown in Create Customer Order form
  2. When "Add new customer" selected, open Create Customer form inline (modal/overlay or same workspace)
  3. Back button returns to Create Order form without losing state
  4. Save on customer creates customer and returns to order with customer selected
- **Acceptance:** Add new customer opens inline; Back returns to order; no full-page navigation

### TICKET-6: Inline "Add New Product" / "Add New Product Group"
- **Priority:** Medium
- **Spec:** Product group and Product dropdowns have "create new" that opens inline in same workspace
- **Current:** May open separate page
- **Tasks:**
  1. Find Product group and Product dropdowns in Create Order / Create MO / other forms
  2. "Add new product group" → inline form, Back returns to parent
  3. "Add new product" → inline Create Item form, Back returns to parent
  4. Same behavior for BOM, Routings, Purchase Order line items
- **Acceptance:** Create product/group opens inline; Back returns to parent form

---

## Execution Order

1. **Parallel:** Batch 1 (TICKET-1, TICKET-2) + Batch 3 (TICKET-5, TICKET-6)
2. **After Batch 1 done:** Batch 2 (TICKET-3, TICKET-4)
3. **After all:** Run full tests, regenerate report
