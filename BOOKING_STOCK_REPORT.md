# Manufacturing Order Booking vs Stock Quantity – Findings and Fixes

## 1. Where "booking" happens (material booking / reserve stock)

**Location:** Work orders (manufacturing orders) service and controller.

| What | File path |
|------|-----------|
| **API that creates/updates a booking** | `apps/api/src/work-orders/manufacturing-orders.controller.ts` |
| **Booking logic (check + deduct)** | `apps/api/src/work-orders/work-orders.service.ts` |

**Flow:**

- **POST** `manufacturing-orders/:id/bookings` → `createOrUpdateBooking` → `workOrdersService.upsertMaterialBooking(id, payload)`  
- **PATCH** `manufacturing-orders/:id/bookings/:bookingId` → `updateBooking` → `workOrdersService.updateMaterialBooking` (then delegates to `upsertMaterialBooking`).

**Inventory check and validation:**

- In `work-orders.service.ts`, `upsertMaterialBooking` (lines ~637–716):
  1. Loads the work order and BOM item.
  2. Loads the selected **StockLot** by `payload.stockLotId`.
  3. Calls **`buildAvailableLots([bomItem.itemId])`** to get available lots and their **available** quantity.
  4. Finds `selectedLot` in that list; if missing, throws `Stock lot ... is not available for booking`.
  5. Computes `effectiveAvailable = selectedLot.availableQuantity + currentlyBooked` (current booking on same lot).
  6. If `payload.quantity > effectiveAvailable`, throws `Booking quantity ... exceeds available lot quantity ...`.
  7. Creates or updates the **MaterialBooking** row (no direct deduction yet; consumption happens on operation completion).

**Deduction (actual stock decrease):**

- Stock is **not** deducted at booking time. It is **reserved** (MaterialBooking rows with `consumedAt: null`).
- **Deduction** happens when the **final operation is completed**: in `work-orders.service.ts`, the completion flow (around lines 939–977) updates **StockLot**: `quantityOnHand = quantityOnHand - booking.quantity` and marks the booking as consumed.

So: the **service that checks inventory at booking time** is `WorkOrdersService.upsertMaterialBooking`; the **quantity it uses** comes from **StockLot** via **`buildAvailableLots`** (see below). The same service later **deducts** from **StockLot** when the MO is completed.

---

## 2. Where the "2 in stock" (or quantity) message comes from

The quantity shown for booking (e.g. "X available") is **not** from `InventoryItem.quantityOnHand`. It comes from **stock lots** only.

**Source of quantity:**

| Source | Used for booking? | Where it’s read |
|--------|--------------------|------------------|
| **StockLot.quantityOnHand** | **Yes** | `work-orders.service.ts` → `buildAvailableLots()` |
| InventoryItem.quantityOnHand | No | Inventory summary report, adjustments, item detail |
| Cached value | No (API is stateless) | N/A |

**Exact flow:**

1. **GET** `manufacturing-orders/:id` → `findOne(id)` → `getWorkOrderOrThrow(id)` then **`toWorkOrderDetailResponse(workOrder, ...)`**.
2. **`toWorkOrderDetailResponse`** calls **`buildMaterialRequirements(workOrder)`** (lines 1500–1542).
3. **`buildMaterialRequirements`** calls **`buildAvailableLots(componentItemIds)`** (lines 1558–1608).
4. **`buildAvailableLots`**:
   - Runs **`prisma.stockLot.findMany({ where: { itemId: { in: componentItemIds } }, orderBy: [...] })`** (no `select` → full model, including **quantityOnHand**).
   - Loads all **active material bookings** for those lots (`consumedAt: null`) and sums reserved quantity per lot.
   - Returns for each lot: **`availableQuantity = Math.max(0, lot.quantityOnHand - reservedByLot.get(lot.id))`** (line 1608).

So the **"2 in stock"** (or any number) in the booking UI is:

- **Per requirement (row):** **`material.availableQuantity`** = sum of **`lot.availableQuantity`** over all lots for that component (lines 1533–1536).
- **Per lot (dropdown):** **`lot.availableQuantity`** = **StockLot.quantityOnHand − reserved** (line 1608).

There is **no caching** in the API: every GET and every booking call recomputes from the DB. The only “cache” is **UI state**: the manufacturing order is fetched once on load and only updated when the user triggers an action that returns a new order (e.g. save booking, release).

**Relevant file paths:**

- **Material requirements + available quantity:**  
  `apps/api/src/work-orders/work-orders.service.ts`  
  - `buildMaterialRequirements` (lines ~1500–1542)  
  - `buildAvailableLots` (lines ~1558–1608)
- **Work order detail include (stock lots with quantityOnHand):**  
  Same file, `WORK_ORDER_DETAIL_INCLUDE` (lines 100–117): `materialBookings` include `stockLot: { select: { id, lotNumber, quantityOnHand, itemId } }`.

---

## 3. Possible causes for "updated stock to 100 but still says 2"

### (a) UI not refetching after update

- The manufacturing order workspace loads data **once** in `useEffect(..., [manufacturingOrderId])` via **`loadWorkspace()`** → **`getManufacturingOrder(manufacturingOrderId)`**.
- If the user updates stock **elsewhere** (e.g. Stock > Inventory, or lot detail in another tab) and then returns to the MO page **without** navigating away, the component does **not** refetch. So the UI keeps showing the old **availableQuantity** (e.g. 2) until the user saves a booking (which returns updated order) or reloads the page.

**Conclusion:** Yes – **stale UI** is a possible cause if stock was changed elsewhere and the MO page was never refetched.

### (b) Booking uses a different source (e.g. stock lots vs inventory item)

- **Booking uses only StockLot.quantityOnHand** (via `buildAvailableLots`).
- **Stock > Inventory** page and **inventory item detail** use:
  - **Reporting:** `getInventorySummaryReport()` → **InventoryItem.quantityOnHand** (see `reporting.service.ts` → `mapInventorySummaryItem` → `inventoryItem.quantityOnHand`).
  - **Adjustment:** **`adjustInventoryItem(id, { delta })`** → updates **InventoryItem.quantityOnHand** only (in `inventory.service.ts` → `adjustInventory` → `prisma.inventoryItem.update`).

So if the user “updated stock to 100” via:

- **Stock > Inventory** (physical count / adjustment), or  
- **Inventory item detail** (adjustment),

then only **InventoryItem** was updated. **StockLot.quantityOnHand** was **not** updated, so booking correctly keeps showing the **lot** quantity (e.g. 2). That is the **main likely cause** when the user believes they “updated stock” but booking still shows 2.

**Conclusion:** Yes – **different source**: booking reads **lots**; many “stock” UIs read/update **InventoryItem**. Updating the latter does not change what booking sees.

### (c) Transaction / cache

- The API does **not** cache work order or lot data. Each `findOne` and `upsertMaterialBooking` uses a fresh **`prisma.stockLot.findMany`** / **findUnique**.
- No application-level transaction holds a stale read for the “2” display; the only way to see “2” after a real update to **StockLot.quantityOnHand** is if the **client** never sent a new GET (see (a)).

**Conclusion:** Transaction/cache in the API is **not** the cause; the discrepancy is either UI refetch or source (InventoryItem vs StockLot).

---

## 4. File paths summary

| Purpose | File path |
|--------|-----------|
| **Material booking API (create/update)** | `apps/api/src/work-orders/manufacturing-orders.controller.ts` (POST/PATCH bookings) |
| **Material booking logic (validate + reserve)** | `apps/api/src/work-orders/work-orders.service.ts` (`upsertMaterialBooking`, `updateMaterialBooking`, `buildAvailableLots`, `buildMaterialRequirements`) |
| **Inventory quantity read for booking** | `apps/api/src/work-orders/work-orders.service.ts` – `buildAvailableLots()` (StockLot.quantityOnHand, minus reserved) |
| **Manufacturing order booking UI** | `apps/web/components/manufacturing-order-workspace.tsx` (loads order, materials table, lot dropdown `lot.availableQuantity`, “Available” column `material.availableQuantity`, save booking) |
| **GET manufacturing order (returns quantity for display)** | API: `apps/api/src/work-orders/work-orders.service.ts` → `findOne()` → `toWorkOrderDetailResponse()` → `buildMaterialRequirements()` → `buildAvailableLots()` |
| **Inventory adjustment (updates InventoryItem only)** | `apps/api/src/inventory/inventory.service.ts` (`adjustInventory`); UI: `apps/web/app/stock/inventory/page.tsx`, `apps/web/app/inventory/items/[id]/page.tsx` |
| **Stock lot quantity (where booking reads from)** | DB: `StockLot.quantityOnHand`; updated on receive, consume (MO completion), ship – **not** by inventory adjustment. |

---

## 5. Recommended fixes so booking sees updated inventory

### Fix 1: Refetch when the MO page gains focus or when Materials tab is shown (avoids stale “2” after updating lots elsewhere)

- **File:** `apps/web/components/manufacturing-order-workspace.tsx`
- **Change:** Refetch the manufacturing order when the window/tab gains focus (and optionally when switching to the Materials tab), so that after the user updates **lot** stock elsewhere, the booking table shows updated `availableQuantity` without a full page reload.
- **Example:** Add a `visibilitychange` or `focus` listener that calls `loadWorkspace()` when the document becomes visible again (and optionally when `activeTab === 'materials'`). Debounce or guard so it doesn’t refetch on every tiny focus change if desired.

This fixes the case where **StockLot** was actually updated (e.g. receiving, or a future “edit lot quantity” feature) but the MO page was already open.

### Fix 2: Use the same source for “stock” that booking uses (avoid updating only InventoryItem when user intends to affect booking)

- **Option A – UX/documentation:** Make it clear that “Available” in the MO booking screen is **per lot** and that **Stock > Inventory** (or item-level) adjustments **do not** change lot quantities. Add a link or short note: “To increase quantity available for booking, receive stock to a lot or adjust at Stock > Lots.”
- **Option B – Sync or single source:** If the product owner wants “adjust stock” to affect booking:
  - Either **drive lot quantity from inventory item** (e.g. when there is a single lot per item, or a designated “default” lot, update that lot’s `quantityOnHand` when adjusting), or
  - Or **sync InventoryItem.quantityOnHand** from sum of StockLot.quantityOnHand after lot updates (already partially present via `syncInventoryItemQuantity`), and ensure **booking never** uses InventoryItem for availability – keep booking strictly on lots.

Recommendation: **Fix 1 + Option A** as the first step (refetch + clear UX). Option B only if you explicitly want adjustments to change what booking can use.

### Fix 3: (Optional) Allow adjusting lot quantity in the UI

- If users need to “set stock to 100” for a **specific lot** (e.g. after a physical count), add an **edit-lot** or **adjust-lot** flow that updates **StockLot.quantityOnHand** (with an API that updates `stock_lots` and optionally writes a history/audit record). Then Fix 1 ensures the MO booking screen shows the new value after refetch.

---

## 6. One-line summary

- **Booking** uses **StockLot.quantityOnHand** (minus reserved) in **`work-orders.service.ts`** via **`buildAvailableLots`**; the “2 in stock” comes from there.  
- If you “updated stock to 100” on **Stock > Inventory** or **inventory item**, that only changed **InventoryItem**, so booking correctly still shows the **lot** quantity (2).  
- Refetching the manufacturing order when the page/tab gains focus (and/or when opening Materials) ensures that any **lot** quantity updates done elsewhere are reflected in the booking screen.
