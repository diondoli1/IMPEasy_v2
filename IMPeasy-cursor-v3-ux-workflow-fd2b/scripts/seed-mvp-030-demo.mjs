import { PrismaClient } from '@prisma/client';

const API_BASE_URL = process.env.IMPEASY_API_URL ?? 'http://localhost:3000';
const WEB_BASE_URL = process.env.IMPEASY_WEB_URL ?? 'http://localhost:3001';
const DEFAULT_PASSWORD = process.env.IMPEASY_DEMO_PASSWORD ?? 'StrongPass1!';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    name: 'Admin Review User',
    email: 'admin.review@impeasy.local',
    role: 'admin',
  },
  {
    name: 'Office User',
    email: 'office@impeasy.local',
    role: 'office',
  },
  {
    name: 'Planner User',
    email: 'planner@impeasy.local',
    role: 'planner',
  },
  {
    name: 'Operator User',
    email: 'operator@impeasy.local',
    role: 'operator',
  },
];

const CUSTOMER_CODE = 'CUS-MVP030';
const CUSTOMER_NAME = 'Helios Drive Systems GmbH';
const DEMO_REFERENCE = 'MVP030-PRODUCTION-DEMO';

const PRODUCED_ITEM = {
  code: 'FG-MVP030-ASSY',
  name: 'Servo Bracket Assembly',
  description: 'Seeded finished item for the MVP-030 engineering and production walkthrough.',
  itemGroup: 'Assemblies',
  unitOfMeasure: 'pcs',
  itemType: 'produced',
  defaultPrice: 245,
  reorderPoint: 0,
  safetyStock: 0,
  notes: 'Use this item for the MVP-030 manufacturing-order demo flow.',
};

const COMPONENT_ITEMS = [
  {
    code: 'RM-MVP030-PLATE',
    name: 'Laser-Cut Plate Blank',
    description: 'Primary component for the MVP-030 demo BOM.',
    itemGroup: 'Raw Material',
    unitOfMeasure: 'pcs',
    itemType: 'procured',
    defaultPrice: 18.5,
    notes: 'Seeded component item for the MVP-030 manufacturing-order demo flow.',
    bomQuantity: 1,
    lotNumber: 'LOT-MVP030-PLATE-01',
    lotQuantity: 40,
  },
  {
    code: 'RM-MVP030-FASTENER',
    name: 'Fastener Set M8',
    description: 'Hardware set for the MVP-030 demo BOM.',
    itemGroup: 'Hardware',
    unitOfMeasure: 'set',
    itemType: 'procured',
    defaultPrice: 3.2,
    notes: 'Seeded component item for the MVP-030 manufacturing-order demo flow.',
    bomQuantity: 4,
    lotNumber: 'LOT-MVP030-FASTENER-01',
    lotQuantity: 160,
  },
];

const BOM_DEFINITION = {
  code: 'BOM-MVP030-ASSY',
  name: 'Servo Bracket Demo BOM',
  description: 'Lean BOM for the MVP-030 checkpoint walkthrough.',
  status: 'active',
  notes: 'Seeded by scripts/seed-mvp-030-demo.mjs',
};

const WORKSTATION_GROUPS = [
  { code: 'WSG-ASSY-A', name: 'Assembly Cell A', type: 'Assembly', hourlyRate: 45 },
  { code: 'WSG-ASSY-B', name: 'Assembly Cell B', type: 'Assembly', hourlyRate: 45 },
];

const WORKSTATIONS = [
  { code: 'WS-ASSY-A1', name: 'Assembly Cell A - Station 1', groupCode: 'WSG-ASSY-A', type: 'Assembly', hourlyRate: 45 },
  { code: 'WS-ASSY-B1', name: 'Assembly Cell B - Station 1', groupCode: 'WSG-ASSY-B', type: 'Assembly', hourlyRate: 45 },
];

const ROUTING_DEFINITION = {
  code: 'ROUT-MVP030-ASSY',
  name: 'Servo Bracket Demo Routing',
  description: 'Single-operation routing so the kiosk finish step creates the final lot.',
  status: 'active',
  operation: {
    sequence: 10,
    name: 'Bracket Assembly',
    description: 'Assemble and verify the seeded servo bracket order.',
    workstation: 'Assembly Cell A',
    workstationGroupCode: 'WSG-ASSY-A',
    setupTimeMinutes: 15,
    runTimeMinutes: 8,
    queueNotes: 'Release after booking the seeded component lots.',
    moveNotes: 'Final operation: completion creates the finished-goods lot.',
  },
};

const SALES_ORDER_LINE = {
  quantity: 8,
  unitPrice: 245,
  lineDiscountPercent: 0,
  taxRate: 19,
};

function isoDateOffset(days) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function jsonHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${message}`);
  }

  return body;
}

async function ensureUsers() {
  const results = [];

  for (const user of SEED_USERS) {
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: DEFAULT_PASSWORD,
        }),
      });

      results.push({ ...user, status: 'created' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('409')) {
        throw error;
      }

      results.push({ ...user, status: 'exists' });
    }
  }

  return results;
}

async function loginFirstAvailableUser() {
  const adminEmail = process.env.IMPEASY_ADMIN_EMAIL ?? 'admin@impeasy.local';
  const adminPassword = process.env.IMPEASY_ADMIN_PASSWORD ?? 'Admin123!';
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    return response.accessToken;
  } catch {
    // Fall through to SEED_USERS
  }

  for (const user of SEED_USERS) {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: DEFAULT_PASSWORD,
        }),
      });

      return response.accessToken;
    } catch {
      // Continue trying the next seed user.
    }
  }

  throw new Error(
    'Unable to authenticate any seeded user with the default password. Confirm the API is running and IMPEASY_DEMO_PASSWORD matches local auth data.',
  );
}

async function ensureRoles(accessToken) {
  const existingRoles = await apiRequest('/auth/roles', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const roleIdsByName = new Map(existingRoles.map((role) => [role.name, role.id]));

  for (const roleName of ['admin', 'office', 'planner', 'operator']) {
    if (roleIdsByName.has(roleName)) {
      continue;
    }

    const createdRole = await apiRequest('/auth/roles', {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ name: roleName }),
    });

    roleIdsByName.set(createdRole.name, createdRole.id);
  }

  return roleIdsByName;
}

async function assignRoles(accessToken, roleIdsByName) {
  const users = await apiRequest('/auth/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  for (const seedUser of SEED_USERS) {
    const user = users.find((candidate) => candidate.email === seedUser.email);
    if (!user) {
      throw new Error(`Seeded user ${seedUser.email} was not found after registration.`);
    }

    const roleId = roleIdsByName.get(seedUser.role);
    if (!roleId) {
      throw new Error(`Role ${seedUser.role} was not found after seeding.`);
    }

    await apiRequest(`/auth/users/${user.id}/roles`, {
      method: 'PUT',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ roleIds: [roleId] }),
    });
  }

  return users;
}

async function ensureWorkstationGroups() {
  const groups = [];
  for (const seed of WORKSTATION_GROUPS) {
    const existing = await prisma.workstationGroup.findFirst({
      where: { code: seed.code },
    });
    const data = {
      code: seed.code,
      name: seed.name,
      type: seed.type,
      hourlyRate: seed.hourlyRate,
    };
    const group = existing
      ? await prisma.workstationGroup.update({ where: { id: existing.id }, data })
      : await prisma.workstationGroup.create({ data });
    groups.push(group);
  }
  return groups;
}

async function ensureWorkstations(groups) {
  const groupByCode = new Map(groups.map((g) => [g.code, g]));
  const workstations = [];
  for (const seed of WORKSTATIONS) {
    const group = groupByCode.get(seed.groupCode);
    if (!group) throw new Error(`Workstation group ${seed.groupCode} not found`);
    const existing = await prisma.workstation.findFirst({
      where: { code: seed.code },
    });
    const data = {
      workstationGroupId: group.id,
      code: seed.code,
      name: seed.name,
      type: seed.type,
      hourlyRate: seed.hourlyRate,
    };
    const ws = existing
      ? await prisma.workstation.update({ where: { id: existing.id }, data })
      : await prisma.workstation.create({ data });
    workstations.push(ws);
  }
  return workstations;
}

async function ensureCustomer() {
  const existing = await prisma.customer.findFirst({
    where: {
      OR: [{ code: CUSTOMER_CODE }, { name: CUSTOMER_NAME }],
    },
  });
  const data = {
    code: CUSTOMER_CODE,
    name: CUSTOMER_NAME,
    email: 'production@helios-drive.test',
    phone: '+49 30 5553300',
    vatNumber: 'DE987654321',
    website: 'https://helios-drive.test',
    billingStreet: 'Fertigungstrasse 12',
    billingCity: 'Berlin',
    billingPostcode: '10999',
    billingStateRegion: 'Berlin',
    billingCountry: 'DE',
    shippingStreet: 'Werkhalle 2',
    shippingCity: 'Berlin',
    shippingPostcode: '12489',
    shippingStateRegion: 'Berlin',
    shippingCountry: 'DE',
    defaultPaymentTerm: '30 days',
    defaultShippingTerm: 'DAP',
    defaultShippingMethod: 'Road freight',
    defaultDocumentDiscountPercent: 0,
    defaultTaxRate: 19,
    internalNotes: 'Seeded customer for the MVP-030 production checkpoint flow.',
    isActive: true,
  };

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.customer.create({ data });
}

async function ensureItem(seed) {
  const existing = await prisma.item.findFirst({
    where: {
      OR: [{ code: seed.code }, { name: seed.name }],
    },
  });
  const data = {
    code: seed.code,
    name: seed.name,
    description: seed.description,
    isActive: true,
    itemGroup: seed.itemGroup,
    unitOfMeasure: seed.unitOfMeasure,
    itemType: seed.itemType,
    defaultPrice: seed.defaultPrice,
    reorderPoint: seed.reorderPoint ?? 0,
    safetyStock: seed.safetyStock ?? 0,
    notes: seed.notes,
  };

  if (existing) {
    return prisma.item.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.item.create({ data });
}

async function upsertQuoteAndSalesOrder(customer, finishedItem) {
  const quantity = SALES_ORDER_LINE.quantity;
  const unitPrice = SALES_ORDER_LINE.unitPrice;
  const discountPercent = SALES_ORDER_LINE.lineDiscountPercent;
  const taxRate = SALES_ORDER_LINE.taxRate;
  const lineTotal = roundMoney(quantity * unitPrice * (1 - discountPercent / 100));
  const taxAmount = roundMoney(lineTotal * (taxRate / 100));
  const totalAmount = roundMoney(lineTotal + taxAmount);
  const promisedDate = new Date(`${isoDateOffset(7)}T00:00:00.000Z`);
  const quoteDate = new Date(`${isoDateOffset(0)}T00:00:00.000Z`);
  const validityDate = new Date(`${isoDateOffset(14)}T00:00:00.000Z`);

  let quote =
    (await prisma.quote.findFirst({
      where: {
        customerReference: DEMO_REFERENCE,
      },
    })) ?? null;

  let salesOrder =
    (quote
      ? await prisma.salesOrder.findUnique({
          where: { quoteId: quote.id },
        })
      : await prisma.salesOrder.findFirst({
          where: {
            customerReference: DEMO_REFERENCE,
          },
        })) ?? null;

  if (!quote && salesOrder) {
    quote = await prisma.quote.findUnique({
      where: { id: salesOrder.quoteId },
    });
  }

  if (salesOrder) {
    await cleanupDemoWorkOrders(salesOrder.id);
    await prisma.salesOrderLine.deleteMany({
      where: { salesOrderId: salesOrder.id },
    });
    await prisma.salesOrderAudit.deleteMany({
      where: { salesOrderId: salesOrder.id },
    });
  }

  if (quote) {
    await prisma.quoteLine.deleteMany({
      where: { quoteId: quote.id },
    });
  }

  const quoteData = {
    customerId: customer.id,
    status: 'converted',
    quoteDate,
    validityDate,
    promisedDate,
    customerReference: DEMO_REFERENCE,
    salespersonName: 'Office User',
    salespersonEmail: 'office@impeasy.local',
    paymentTerm: customer.defaultPaymentTerm ?? '30 days',
    shippingTerm: customer.defaultShippingTerm ?? 'DAP',
    shippingMethod: customer.defaultShippingMethod ?? 'Road freight',
    taxMode: 'exclusive',
    documentDiscountPercent: 0,
    notes: 'Seeded quote for the MVP-030 engineering and production walkthrough.',
    internalNotes: 'Seeded by scripts/seed-mvp-030-demo.mjs',
    contactName: 'Nina Vogel',
    contactEmail: 'nina.vogel@helios-drive.test',
    contactPhone: '+49 30 5553301',
    billingStreet: customer.billingStreet,
    billingCity: customer.billingCity,
    billingPostcode: customer.billingPostcode,
    billingStateRegion: customer.billingStateRegion,
    billingCountry: customer.billingCountry,
    shippingStreet: customer.shippingStreet,
    shippingCity: customer.shippingCity,
    shippingPostcode: customer.shippingPostcode,
    shippingStateRegion: customer.shippingStateRegion,
    shippingCountry: customer.shippingCountry,
    subtotalAmount: lineTotal,
    discountAmount: 0,
    taxAmount,
    totalAmount,
  };

  quote = quote
    ? await prisma.quote.update({
        where: { id: quote.id },
        data: quoteData,
      })
    : await prisma.quote.create({
        data: quoteData,
      });

  await prisma.quoteLine.create({
    data: {
      quoteId: quote.id,
      itemId: finishedItem.id,
      itemCode: finishedItem.code,
      itemName: finishedItem.name,
      description: 'Seeded production demo line for manual Manufacturing Order review.',
      quantity,
      unit: finishedItem.unitOfMeasure,
      unitPrice,
      lineDiscountPercent: discountPercent,
      taxRate,
      deliveryDateOverride: promisedDate,
      lineTotal,
      taxAmount,
      totalAmount,
    },
  });

  const salesOrderData = {
    quoteId: quote.id,
    customerId: customer.id,
    status: 'released',
    orderDate: quoteDate,
    promisedDate,
    customerReference: DEMO_REFERENCE,
    salespersonName: 'Office User',
    salespersonEmail: 'office@impeasy.local',
    paymentTerm: customer.defaultPaymentTerm ?? '30 days',
    shippingTerm: customer.defaultShippingTerm ?? 'DAP',
    shippingMethod: customer.defaultShippingMethod ?? 'Road freight',
    taxMode: 'exclusive',
    documentDiscountPercent: 0,
    notes: 'Released sales order seeded for the MVP-030 production handoff.',
    internalNotes: 'Seeded by scripts/seed-mvp-030-demo.mjs',
    contactName: 'Nina Vogel',
    contactEmail: 'nina.vogel@helios-drive.test',
    contactPhone: '+49 30 5553301',
    billingStreet: customer.billingStreet,
    billingCity: customer.billingCity,
    billingPostcode: customer.billingPostcode,
    billingStateRegion: customer.billingStateRegion,
    billingCountry: customer.billingCountry,
    shippingStreet: customer.shippingStreet,
    shippingCity: customer.shippingCity,
    shippingPostcode: customer.shippingPostcode,
    shippingStateRegion: customer.shippingStateRegion,
    shippingCountry: customer.shippingCountry,
    subtotalAmount: lineTotal,
    discountAmount: 0,
    taxAmount,
    totalAmount,
  };

  salesOrder = salesOrder
    ? await prisma.salesOrder.update({
        where: { id: salesOrder.id },
        data: salesOrderData,
      })
    : await prisma.salesOrder.create({
        data: salesOrderData,
      });

  const salesOrderLine = await prisma.salesOrderLine.create({
    data: {
      salesOrderId: salesOrder.id,
      itemId: finishedItem.id,
      itemCode: finishedItem.code,
      itemName: finishedItem.name,
      description: 'Seeded production demo line for manual Manufacturing Order review.',
      quantity,
      unit: finishedItem.unitOfMeasure,
      unitPrice,
      lineDiscountPercent: discountPercent,
      taxRate,
      deliveryDateOverride: promisedDate,
      lineTotal,
      taxAmount,
      totalAmount,
    },
  });

  await prisma.salesOrderAudit.createMany({
    data: [
      {
        salesOrderId: salesOrder.id,
        action: 'status_transition',
        fromStatus: 'draft',
        toStatus: 'confirmed',
        actor: 'seed',
      },
      {
        salesOrderId: salesOrder.id,
        action: 'status_transition',
        fromStatus: 'confirmed',
        toStatus: 'released',
        actor: 'seed',
      },
    ],
  });

  return { quote, salesOrder, salesOrderLine };
}

async function cleanupDemoWorkOrders(salesOrderId) {
  const salesOrderLines = await prisma.salesOrderLine.findMany({
    where: { salesOrderId },
    select: { id: true },
  });
  const salesOrderLineIds = salesOrderLines.map((line) => line.id);

  if (salesOrderLineIds.length === 0) {
    return;
  }

  const workOrders = await prisma.workOrder.findMany({
    where: {
      salesOrderLineId: {
        in: salesOrderLineIds,
      },
    },
    include: {
      workOrderOperations: {
        select: {
          id: true,
        },
      },
    },
  });

  for (const workOrder of workOrders) {
    const operationIds = workOrder.workOrderOperations.map((operation) => operation.id);

    if (operationIds.length > 0) {
      await prisma.productionLog.deleteMany({
        where: {
          operationId: {
            in: operationIds,
          },
        },
      });
      await prisma.inspection.deleteMany({
        where: {
          operationId: {
            in: operationIds,
          },
        },
      });
    }

    await prisma.materialBooking.deleteMany({
      where: { workOrderId: workOrder.id },
    });
    await prisma.workOrderHistory.deleteMany({
      where: { workOrderId: workOrder.id },
    });
    await prisma.workOrderOperation.deleteMany({
      where: { workOrderId: workOrder.id },
    });
    await prisma.stockLot.deleteMany({
      where: {
        OR: [{ sourceWorkOrderId: workOrder.id }, { id: workOrder.finishedGoodsLotId ?? -1 }],
      },
    });
    await prisma.workOrder.delete({
      where: { id: workOrder.id },
    });
  }
}

async function ensureProductionMasterData(finishedItem, componentItems) {
  let bom =
    (await prisma.bom.findFirst({
      where: {
        itemId: finishedItem.id,
        name: BOM_DEFINITION.name,
      },
    })) ?? null;

  bom = bom
    ? await prisma.bom.update({
        where: { id: bom.id },
        data: BOM_DEFINITION,
      })
    : await prisma.bom.create({
        data: {
          itemId: finishedItem.id,
          ...BOM_DEFINITION,
        },
      });

  await prisma.bomItem.deleteMany({
    where: { bomId: bom.id },
  });

  for (const [index, componentItem] of componentItems.entries()) {
    await prisma.bomItem.create({
      data: {
        bomId: bom.id,
        itemId: componentItem.id,
        quantity: COMPONENT_ITEMS[index].bomQuantity,
        rowOrder: (index + 1) * 10,
        notes: `Seeded component row for ${componentItem.code ?? componentItem.name}.`,
      },
    });
  }

  let routing =
    (await prisma.routing.findFirst({
      where: {
        itemId: finishedItem.id,
        name: ROUTING_DEFINITION.name,
      },
    })) ?? null;

  routing = routing
    ? await prisma.routing.update({
        where: { id: routing.id },
        data: {
          code: ROUTING_DEFINITION.code,
          name: ROUTING_DEFINITION.name,
          description: ROUTING_DEFINITION.description,
          status: ROUTING_DEFINITION.status,
        },
      })
    : await prisma.routing.create({
        data: {
          itemId: finishedItem.id,
          code: ROUTING_DEFINITION.code,
          name: ROUTING_DEFINITION.name,
          description: ROUTING_DEFINITION.description,
          status: ROUTING_DEFINITION.status,
        },
      });

  const workstationGroup = ROUTING_DEFINITION.operation.workstationGroupCode
    ? await prisma.workstationGroup.findFirst({
        where: { code: ROUTING_DEFINITION.operation.workstationGroupCode },
      })
    : null;

  await prisma.routingOperation.deleteMany({
    where: { routingId: routing.id },
  });

  await prisma.routingOperation.create({
    data: {
      routingId: routing.id,
      sequence: ROUTING_DEFINITION.operation.sequence,
      name: ROUTING_DEFINITION.operation.name,
      description: ROUTING_DEFINITION.operation.description,
      workstation: ROUTING_DEFINITION.operation.workstation,
      workstationGroupId: workstationGroup?.id ?? null,
      setupTimeMinutes: ROUTING_DEFINITION.operation.setupTimeMinutes,
      runTimeMinutes: ROUTING_DEFINITION.operation.runTimeMinutes,
      queueNotes: ROUTING_DEFINITION.operation.queueNotes,
      moveNotes: ROUTING_DEFINITION.operation.moveNotes,
    },
  });

  await prisma.item.update({
    where: { id: finishedItem.id },
    data: {
      defaultBomId: bom.id,
      defaultRoutingId: routing.id,
    },
  });

  return { bom, routing };
}

async function ensureStockLots(componentItems) {
  for (const [index, componentItem] of componentItems.entries()) {
    const seed = COMPONENT_ITEMS[index];
    const existingLot = await prisma.stockLot.findUnique({
      where: { lotNumber: seed.lotNumber },
    });

    if (existingLot) {
      await prisma.stockLot.update({
        where: { id: existingLot.id },
        data: {
          itemId: componentItem.id,
          quantityOnHand: seed.lotQuantity,
          notes: 'Seeded component stock lot for the MVP-030 production checkpoint.',
          sourceWorkOrderId: null,
        },
      });
    } else {
      await prisma.stockLot.create({
        data: {
          itemId: componentItem.id,
          lotNumber: seed.lotNumber,
          quantityOnHand: seed.lotQuantity,
          notes: 'Seeded component stock lot for the MVP-030 production checkpoint.',
        },
      });
    }
  }
}

async function generatePlannedWorkOrder(salesOrderId, operatorUserId, accessToken) {
  const generated = await apiRequest(`/sales-orders/${salesOrderId}/work-orders/generate`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
  });

  if (!Array.isArray(generated) || generated.length === 0) {
    throw new Error(`No Manufacturing Order was generated for sales order ${salesOrderId}.`);
  }

  const workOrderId = generated[0].id;

  await apiRequest(`/manufacturing-orders/${workOrderId}`, {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({
      assignedOperatorId: operatorUserId,
      assignedWorkstation: ROUTING_DEFINITION.operation.workstation,
      notes:
        'Seeded for the MVP-030 checkpoint. Book the seeded lots, release the Manufacturing Order, then finish the kiosk operation.',
    }),
  });

  return apiRequest(`/manufacturing-orders/${workOrderId}`, {
    headers: jsonHeaders(accessToken),
  });
}

async function main() {
  console.log(`Seeding MVP-030 demo data against API ${API_BASE_URL} and web ${WEB_BASE_URL}`);

  const userResults = await ensureUsers();
  const accessToken = await loginFirstAvailableUser();
  const roleIdsByName = await ensureRoles(accessToken);
  const users = await assignRoles(accessToken, roleIdsByName);

  const operatorUser = users.find((user) => user.email === 'operator@impeasy.local');
  const plannerUser = users.find((user) => user.email === 'planner@impeasy.local');

  if (!operatorUser || !plannerUser) {
    throw new Error('Planner and operator seed users must exist before seeding the MVP-030 demo flow.');
  }

  const workstationGroups = await ensureWorkstationGroups();
  await ensureWorkstations(workstationGroups);

  const customer = await ensureCustomer();
  const finishedItem = await ensureItem(PRODUCED_ITEM);
  const componentItems = [];

  for (const seed of COMPONENT_ITEMS) {
    componentItems.push(await ensureItem(seed));
  }

  const { quote, salesOrder } = await upsertQuoteAndSalesOrder(customer, finishedItem);
  const { bom, routing } = await ensureProductionMasterData(finishedItem, componentItems);
  await ensureStockLots(componentItems);
  await cleanupDemoWorkOrders(salesOrder.id);

  const workOrder = await generatePlannedWorkOrder(salesOrder.id, operatorUser.id, accessToken);

  console.log('Seed complete.');
  console.table(
    userResults.map((user) => ({
      email: user.email,
      role: user.role,
      status: user.status,
      password: DEFAULT_PASSWORD,
    })),
  );
  console.table([
    {
      kind: 'manufactured_item',
      id: finishedItem.id,
      route: `${WEB_BASE_URL}/manufactured-items/${finishedItem.id}`,
    },
    {
      kind: 'bom',
      id: bom.id,
      route: `${WEB_BASE_URL}/boms/${bom.id}`,
    },
    {
      kind: 'routing',
      id: routing.id,
      route: `${WEB_BASE_URL}/routings/${routing.id}`,
    },
    {
      kind: 'sales_order',
      id: salesOrder.id,
      route: `${WEB_BASE_URL}/customer-orders/sales-order-${salesOrder.id}`,
    },
    {
      kind: 'manufacturing_order',
      id: workOrder.id,
      route: `${WEB_BASE_URL}/manufacturing-orders/${workOrder.id}`,
    },
    {
      kind: 'production_calendar',
      id: '',
      route: `${WEB_BASE_URL}/production/calendar`,
    },
    {
      kind: 'kiosk',
      id: '',
      route: `${WEB_BASE_URL}/kiosk`,
    },
  ]);
  console.table(
    COMPONENT_ITEMS.map((seed) => ({
      component: seed.code,
      lotNumber: seed.lotNumber,
      lotQuantity: seed.lotQuantity,
      requiredPerOrder: seed.bomQuantity * SALES_ORDER_LINE.quantity,
    })),
  );
  console.log(`Planner user: planner@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Operator user: operator@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Sales order reference: ${DEMO_REFERENCE}`);
  console.log(`Quote route: ${WEB_BASE_URL}/customer-orders/quote-${quote.id}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
