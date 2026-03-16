# Manual verification steps (post-tickets 1–7)

Use these steps to manually verify the behavior introduced or changed in tickets 1–7. **Do not implement features; only document steps.**

---

## 1. Customer order status dropdown (Ticket 1)

- Create a new customer order (or open an existing quote).
- Set **Status** to **Quotation** (draft), **Waiting for confirmation** (sent), or **Confirmed** (approved) via the dropdown.
- Save and confirm the status is persisted and displayed correctly after reload.

---

## 2. Create customer from popup – saved and selected (Ticket 3)

- From the customer order workspace, open the **Customer** dropdown and choose **Add new customer**.
- Fill in the Create Customer form and save.
- Confirm the new customer is saved and **automatically selected** in the Customer field (no need to re-select).

---

## 3. Customer code is automatic (Ticket 2)

- Create a new customer (e.g. from CRM or from the customer order popup).
- Confirm that the **customer code** is assigned by the system (auto) and not sent from the client when creating.

---

## 4. Removed fields on order (Ticket 4)

- Create or open a customer order (quote or sales order).
- Confirm that **Salesperson**, **Contact**, and **Reference** (or equivalent) fields are **no longer** present in the document header.

---

## 5. Add new product from order lines (Ticket 5)

- Open a customer order and go to the **Lines** tab.
- In a line, open the product/item dropdown and choose **Add new product**.
- Confirm the **Create Product** (inline) popup opens.
- Create a product and confirm it is **selected** on the same order line after save.

---

## 6. MO list filtered by sales order (Ticket 6)

- Release a sales order that generates manufacturing orders.
- From that sales order context, open **Manufacturing Orders** (e.g. “Open Manufacturing Orders” or similar).
- Confirm the list shows **only** the manufacturing orders for that sales order (filtered by `salesOrderId`).

---

## 7. Item without BOM/Routing – redirect and flow (Ticket 7)

- Use an item that has **no BOM** and **no Routing** in a context that requires them (e.g. releasing an order or creating an MO).
- Confirm the app **redirects** to the BOM + Routing page (or equivalent) and that the flow to set BOM/Routing is clear and usable.

---

*Last updated: manual checks for tickets 1–7.*
