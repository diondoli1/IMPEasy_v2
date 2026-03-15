# IMPEasy UI/UX & Application Specification — Reference

Use this file as the authoritative reference for all UI/UX and application behavior. Call it whenever you need to verify requirements.

---

## Design Principles (Universal)

1. **MUI only** — Use Material-UI exclusively. No other form or UI libraries.
2. **Inline form behavior** — When filling a form and you need data from another entity (e.g., "add new customer" from customer order form), open the nested form in the same workspace. Add a Back button that returns to the parent form. Never navigate away.
3. **Save → Details conversion** — After saving a create form, the page stays in place and converts to the entity's details page (with auto-generated number, delete button, etc.). Repeatable across the app.
4. **Back button** — In nested forms, Back returns to the previous form. The workspace stays in the same place; you can continue work there.

---

## Login Screen

- **Content only:** IMPEasy header text, username field, password field
- No panels, descriptions, MVP user hints, or extra UI
- Minimal, clean layout

---

## Dashboard (Admin)

- **Header:** IMPEasy, user name, logout icon (right)
- **Six big clickable boxes:** CRM, Production Planning, Stock, Procurement, Settings, Kiosk
- Operator role: **only Kiosk** box visible (or operator lands directly on Kiosk, no dashboard)

---

## Module Layout (All Modules)

- Under the header: **thumbnail square boxes** with logos for: CRM, Production Planning, Stock, Procurement, Settings, Kiosk
- These are quick navigation to switch between modules
- Consistent across all module screens

---

## CRM Module

### Tabs
Customer Orders | Customers | Invoices | Sales Management

### 1. Customer Orders

**Main workspace:**
- 5 vertical columns (max 6 items each): Quotation, Waiting for confirmation, Confirmed, Waiting for Production, In production, Ready for shipment
- 6 most recent items per column
- **+Create** button (top right)

**Create Customer Order form (opens in workspace):**
- Title: "Create a new customer order"
- Back button → returns to Customer Orders workspace
- Save button
- **Fields:** Customer (dropdown + "Add new customer" first option → Create Customer Company inline), Status (Quotation, Waiting for confirmation, Confirmed), Delivery date, Delivery Terms, Shipping Address, Notes
- **Line items table:** Product group (dropdown + create new), Product (dropdown + create new), Quantity, Price, Discount %, Subtotal, Delivery Date, delete icon per line
- New empty line appears when row is filled
- Pricing by kg, pieces, production hour, or other methods depending on product format
- "Add new customer" → Create Customer Company inline, Back → back to Create Order
- "Create product group" / "Create product" → same inline behavior

**After Save:**
- Screen converts to "Customer Order {number}" details page
- Auto-generated number above forms
- Delete button
- Status dropdown: Quotation, Waiting for confirmation, Confirmed (+ auto status for In production, Ready for shipment when applicable)

### 2. Customers

**Workspace:**
- Table columns: Number, Name, Status, Next contact, Phone, Email, Edit icon
- **+Create** → Create Customer Company form (inline, Back/Save)

**Create Customer Company form:**
- Name, Status (No contact, No Interest, Interested, Permanent Buyer), Reg. no., TAX Number, Phone, Email, Contact Started, Next Contact, Tax Rate, Payment Period, Currency (locked EUR)

### 3. Invoices

**Workspace:**
- Table: Number, Customer Number, Customer name, Status (Paid, Unpaid), Total including tax, Paid sum, Created, Due date, Edit icon
- Edit → Invoice details page

**Invoice details:**
- Number (auto, unchangeable), Customer order number, Customer, Status (Paid, Unpaid), Created, Due Date, Billing Address, Notes
- Line items table: Order, Product Group, Product (read-only), Quantity, Price per UoM, Discount, Subtotal, Delivery date
- Can add more lines

**+Create Invoice:**
- Customer Order (pick or create new → redirects to Create Customer Order inline)
- Customer (pick or create)
- Type (Quotation, Invoice, Proforma Invoice)
- Status (Unpaid, Dummy, Paid)
- Created, Due Date, Billing Address, Notes
- Selecting customer order/customer autofills
- Line items: Order, Product Group, Product, Quantity, Price, UoM, Discount, Subtotal, Delivery Date

### 4. Sales Management

- Big table of customers
- Click row → Customer information page/form

---

## Production Planning Module

### Tabs
Manufacturing Orders | Workstations | Workstation Group | BOM | Routings

### 1. Manufacturing Orders

**+Create** → Create Manufacturing Order
- Fields: Product group, Product (dropdown + add new), Quantity, Due Date, Start, Finish
- BOM table (editable; can add/edit BOM for product)
- Routing table (editable; can add/edit routing)

**Table:** Number, Group Name, Part No, Part desc, Quantity, Status, Part Status, Due Date, Start, Finish, Edit icon

### 2. Workstations

**Table:** Number, Name, Type, Hourly Rate, Edit
**+Create:** Name, Type, Hourly Rate (Back/Save)

### 3. Workstation Group

**Table:** Number, Name, Type, Number of instances, Edit
**+Create:** Name, Number of instances, Hourly rate (Back/Save)

### 4. BOM

**Table:** Number, Name, Part No, Part description, Group number, Group Name, Approximate Cost
**+Create:** Popup — choose Product group, Product (no create in popup) → Proceed
- Form shows if routing exists; can add routing
- BOM table: Product group, Part, Notes, UoM, Quantity, Delete per line

### 5. Routings

**Table:** Number, Name, Part No, Part Description, Group number, Group name, Duration, Cost, Edit (per line)
**+Create:** Popup — Product group, Product → Proceed
- Connected BOM (show or create)
- Table: Workstation group, Operation description, Setup time, Cycle Time, Edit per line

---

## Stock Module

### Tabs
Items | Stock settings | Shipments | Inventory

### 1. Items

**Table:** Part No, Part Description, Group number, Group Name, In stock, Available, Booked, UoM, Cost, Edit
**+Create:** Part No, Part Desc, Product group, Unit of measurement, This is a procured item, Selling Price
- Save → converts to Item details page

### 2. Stock Settings

- **Product Groups:** table (Number, Name), Create product group button
- **Units of measurement:** table, Create button → Name, Unit conversion (1 blank = Rate blank)

### 3. Shipments

**Table:** Number, Created, Delivery Date, Status, Order, Customer number, Customer name, Edit
**+Create:** Delivery Date, Status (Ready for shipment, Shipment), Customer Order, Shipping address

### 4. Inventory

**Table:** Part No, Group number, Group name, Quantity, Cost, Part description, Physical quantity (only editable field — input + Save button per line)

---

## Procurement Module

### Tabs
Purchase Orders | Vendors | Invoices

### 1. Purchase Orders

**Table:** Number, Created, Expected date, Vendor number, Vendor name, Edit
**+Create:** Vendor, Expected date, Order Date, Due date, Arrival date
- Line items: Product group, Item, Vendor Part no, Ordered quantity, Price, Subtotal, Expected quantity, Expected date

### 2. Vendors

**Table:** Number, Name, Edit
**+Create:** Name, Phone, Email, Payment Period

### 3. Incoming Invoices

**Table:** Number, Invoice ID, Invoice date, Vendor Number, Purchase order, Total, Tax, Paid sum

---

## Settings Module

**Left sidebar:** Company details | Numbering formats | User roles

### Company details
- Company Name, Legal Address, Email, Website, Phone, TAX Number, Tax Rate

### Numbering formats (static, unchangeable)
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

### User roles
- List of users
- Dropdown per user: Admin or Operator only

---

## Kiosk Module

### Admin view
- Big boxes: workstation name + indicative light
  - Idle = grey
  - On job = green
  - Setup = yellow
  - Alarm/defect = red
- Under workstation: current job (if any)
- Manufacturing backlog with manufacturing orders

### Operator view (only view for operator role)
1. **First:** "Select a workstation" popup + Proceed
2. **Then:** Manufacturing orders list
3. **Per order:** Start Job button
4. After Start → **Set up** button (machine in setup mode)
5. After Set up → **Start Job** (working mode)
6. **Stop** button to stop job
7. **Complete Job** button (always visible)
8. Complete Job → Popup: Good quantity, Scrap quantity

---

## Table Edit Behavior

- Edit icon per row where applicable
- Edits are per line; repeatable across all tables in the app

---

## Roles

- **Admin:** Full access to all modules (CRM, Production, Stock, Procurement, Settings, Kiosk)
- **Operator:** Only Kiosk; no dashboard, no other modules
