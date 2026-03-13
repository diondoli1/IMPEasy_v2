update work_orders
set "finishedGoodsLotId" = null
where "salesOrderLineId" in (
  select sol.id
  from sales_order_lines sol
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from shipment_picks
where "shipmentLineId" in (
  select sl.id
  from shipment_lines sl
  join shipments s on s.id = sl."shipmentId"
  join sales_orders so on so.id = s."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from invoice_lines
where "invoiceId" in (
  select i.id
  from invoices i
  join shipments s on s.id = i."shipmentId"
  join sales_orders so on so.id = s."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from invoices
where "shipmentId" in (
  select s.id
  from shipments s
  join sales_orders so on so.id = s."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from shipment_lines
where "shipmentId" in (
  select s.id
  from shipments s
  join sales_orders so on so.id = s."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from shipments
where "salesOrderId" in (
  select id
  from sales_orders
  where "customerReference" = 'MVP040-SHIP-DEMO'
);

delete from production_logs
where "operationId" in (
  select woo.id
  from work_order_operations woo
  join work_orders wo on wo.id = woo."workOrderId"
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from inspections
where "operationId" in (
  select woo.id
  from work_order_operations woo
  join work_orders wo on wo.id = woo."workOrderId"
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from material_bookings
where "workOrderId" in (
  select wo.id
  from work_orders wo
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from work_order_history
where "workOrderId" in (
  select wo.id
  from work_orders wo
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from work_order_operations
where "workOrderId" in (
  select wo.id
  from work_orders wo
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from inventory_transactions
where "referenceType" = 'manufacturing_order'
  and "referenceId" in (
    select wo.id
    from work_orders wo
    join sales_order_lines sol on sol.id = wo."salesOrderLineId"
    join sales_orders so on so.id = sol."salesOrderId"
    where so."customerReference" = 'MVP040-SHIP-DEMO'
  );

delete from inventory_transactions
where "stockLotId" in (
  select id
  from stock_lots
  where "sourceWorkOrderId" in (
    select wo.id
    from work_orders wo
    join sales_order_lines sol on sol.id = wo."salesOrderLineId"
    join sales_orders so on so.id = sol."salesOrderId"
    where so."customerReference" = 'MVP040-SHIP-DEMO'
  )
);

delete from stock_lots
where "sourceWorkOrderId" in (
  select wo.id
  from work_orders wo
  join sales_order_lines sol on sol.id = wo."salesOrderLineId"
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from work_orders
where "salesOrderLineId" in (
  select sol.id
  from sales_order_lines sol
  join sales_orders so on so.id = sol."salesOrderId"
  where so."customerReference" = 'MVP040-SHIP-DEMO'
);

delete from sales_order_audits
where "salesOrderId" in (
  select id
  from sales_orders
  where "customerReference" = 'MVP040-SHIP-DEMO'
);

delete from sales_order_lines
where "salesOrderId" in (
  select id
  from sales_orders
  where "customerReference" = 'MVP040-SHIP-DEMO'
);

delete from sales_orders
where "customerReference" = 'MVP040-SHIP-DEMO';

delete from quote_lines
where "quoteId" in (
  select id
  from quotes
  where "customerReference" = 'MVP040-SHIP-DEMO'
);

delete from quotes
where "customerReference" = 'MVP040-SHIP-DEMO';

delete from inventory_transactions
where "purchaseOrderLineId" in (
  select pol.id
  from purchase_order_lines pol
  join purchase_orders po on po.id = pol."purchaseOrderId"
  where po."supplierReference" = 'MVP040-PO-DEMO'
);

delete from purchase_order_lines
where "purchaseOrderId" in (
  select id
  from purchase_orders
  where "supplierReference" = 'MVP040-PO-DEMO'
);

delete from purchase_orders
where "supplierReference" = 'MVP040-PO-DEMO';

delete from shipment_picks
where "stockLotId" in (
  select id
  from stock_lots
  where "lotNumber" like 'LOT-MVP040-%'
);

delete from inventory_transactions
where "stockLotId" in (
  select id
  from stock_lots
  where "lotNumber" like 'LOT-MVP040-%'
);

delete from stock_lots
where "lotNumber" like 'LOT-MVP040-%';

delete from inventory_transactions
where "itemId" in (
  select id
  from items
  where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT')
);

delete from inventory_items
where "itemId" in (
  select id
  from items
  where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT')
);

delete from item_vendor_terms
where "supplierId" in (
    select id
    from suppliers
    where code = 'SUP-MVP040'
  )
  or "itemId" in (
    select id
    from items
    where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT')
  );

update items
set "defaultRoutingId" = null,
    "preferredVendorId" = null
where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT');

delete from routing_operations
where "routingId" in (
  select id
  from routings
  where code = 'ROUT-MVP040-FG'
);

delete from routings
where code = 'ROUT-MVP040-FG';

delete from contacts
where "customerId" in (
  select id
  from customers
  where code = 'CUS-MVP040'
);

delete from quote_lines
where "itemId" in (
  select id
  from items
  where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT')
);

delete from items
where code in ('RM-MVP040-ALU', 'FG-MVP040-KIT');

delete from customers
where code = 'CUS-MVP040';

delete from suppliers
where code = 'SUP-MVP040';
