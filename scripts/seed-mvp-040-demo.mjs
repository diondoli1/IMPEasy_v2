import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = process.env.IMPEASY_API_URL ?? 'http://localhost:3000';
const WEB_BASE_URL = process.env.IMPEASY_WEB_URL ?? 'http://localhost:3001';
const DEFAULT_PASSWORD = process.env.IMPEASY_DEMO_PASSWORD ?? 'StrongPass1!';
const DATABASE_URL =
  process.env.IMPEASY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://postgres@localhost:5432/impeasy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLEANUP_SQL_FILE = path.join(__dirname, 'sql', 'seed-mvp-040-cleanup.sql');

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

const CUSTOMER_CODE = 'CUS-MVP040';
const CUSTOMER_NAME = 'Northwind Motion Systems GmbH';
const SALES_REFERENCE = 'MVP040-SHIP-DEMO';

const SUPPLIER_CODE = 'SUP-MVP040';
const SUPPLIER_NAME = 'Nordic Alloy Supply GmbH';
const PURCHASE_REFERENCE = 'MVP040-PO-DEMO';

const RAW_ITEM = {
  code: 'RM-MVP040-ALU',
  name: 'Aluminum Rail Stock',
  description: 'Procured item seeded for the MVP-040 purchasing and receiving walkthrough.',
  itemGroup: 'Raw Material',
  unitOfMeasure: 'pcs',
  itemType: 'procured',
  defaultPrice: 18.5,
  reorderPoint: 8,
  safetyStock: 4,
  notes: 'Seeded by scripts/seed-mvp-040-demo.mjs',
};

const FINISHED_ITEM = {
  code: 'FG-MVP040-KIT',
  name: 'Actuator Mount Kit',
  description: 'Produced item seeded for the MVP-040 shipment-picking walkthrough.',
  itemGroup: 'Assemblies',
  unitOfMeasure: 'pcs',
  itemType: 'produced',
  defaultPrice: 265,
  reorderPoint: 0,
  safetyStock: 0,
  notes: 'Seeded by scripts/seed-mvp-040-demo.mjs',
};

const ROUTING = {
  code: 'ROUT-MVP040-FG',
  name: 'Actuator Mount Final Assembly',
  description: 'Single-step routing so completion creates the finished-goods lot for shipment.',
  status: 'active',
  operation: {
    sequence: 10,
    name: 'Final Assembly',
    description: 'Complete the seeded finished goods so shipment picking has a traceable lot.',
    workstation: 'Assembly Cell B',
    setupTimeMinutes: 10,
    runTimeMinutes: 6,
    queueNotes: 'Seeded MVP-040 production output.',
    moveNotes: 'Completion should create the finished-goods lot for shipping.',
  },
};

const RECEIPT_LOT_NUMBER = 'LOT-MVP040-ALU-01';
const PURCHASE_RECEIPT_QUANTITY = 12;
const PURCHASE_ORDER_LINE_QUANTITY = 30;
const SALES_ORDER_QUANTITY = 6;

function isoDateOffset(days) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function jsonHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function apiRequest(pathname, options = {}) {
  const response = await fetch(`${API_BASE_URL}${pathname}`, options);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`${options.method ?? 'GET'} ${pathname} failed: ${response.status} ${message}`);
  }

  return body;
}

function runCommand(command, args) {
  if (process.platform === 'win32') {
    return execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command, ...args], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  return execFileSync(command, args, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runCleanupSql() {
  try {
    runCommand('npx', [
      'prisma',
      'db',
      'execute',
      '--url',
      DATABASE_URL,
      '--file',
      CLEANUP_SQL_FILE,
    ]);
  } catch (error) {
    const stdout = error.stdout ?? '';
    const stderr = error.stderr ?? '';
    throw new Error(`Unable to reset MVP-040 demo data.\n${stdout}\n${stderr}`.trim());
  }
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
      // Continue to the next seed user.
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

  return apiRequest('/auth/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function ensureItem(accessToken, payload) {
  const items = await apiRequest('/items', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existing =
    items.find((item) => item.code === payload.code) ??
    items.find((item) => item.name === payload.name) ??
    null;

  if (existing) {
    return apiRequest(`/items/${existing.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    });
  }

  return apiRequest('/items', {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

async function ensureCustomer(accessToken) {
  const customers = await apiRequest('/customers', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existing =
    customers.find((customer) => customer.code === CUSTOMER_CODE) ??
    customers.find((customer) => customer.name === CUSTOMER_NAME) ??
    null;

  const payload = {
    code: CUSTOMER_CODE,
    name: CUSTOMER_NAME,
    email: 'orders@northwind-motion.test',
    phone: '+49 30 5550400',
    vatNumber: 'DE040040040',
    website: 'https://northwind-motion.test',
    billingAddress: {
      street: 'Werkstrasse 40',
      city: 'Berlin',
      postcode: '10367',
      stateRegion: 'Berlin',
      country: 'DE',
    },
    shippingAddress: {
      street: 'Logistikring 11',
      city: 'Berlin',
      postcode: '12487',
      stateRegion: 'Berlin',
      country: 'DE',
    },
    defaultPaymentTerm: 'Net 30',
    defaultShippingTerm: 'DAP',
    defaultShippingMethod: 'Freight',
    defaultDocumentDiscountPercent: 0,
    defaultTaxRate: 19,
    internalNotes: 'Seeded customer for the MVP-040 stock-to-shipment walkthrough.',
    isActive: true,
    contacts: [
      {
        name: 'Mira Brandt',
        jobTitle: 'Operations Buyer',
        email: 'mira.brandt@northwind-motion.test',
        phone: '+49 30 5550401',
        isPrimary: true,
        isActive: true,
      },
      {
        name: 'Jonas Keller',
        jobTitle: 'Logistics Lead',
        email: 'jonas.keller@northwind-motion.test',
        phone: '+49 30 5550402',
        isPrimary: false,
        isActive: true,
      },
    ],
  };

  const customer = existing
    ? await apiRequest(`/customers/${existing.id}`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify(payload),
      })
    : await apiRequest('/customers', {
        method: 'POST',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify(payload),
      });

  return apiRequest(`/customers/${customer.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function ensureSupplier(accessToken) {
  const suppliers = await apiRequest('/suppliers', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existing =
    suppliers.find((supplier) => supplier.code === SUPPLIER_CODE) ??
    suppliers.find((supplier) => supplier.name === SUPPLIER_NAME) ??
    null;

  const payload = {
    code: SUPPLIER_CODE,
    name: SUPPLIER_NAME,
    email: 'sales@nordic-alloy.test',
    phone: '+49 40 5550400',
  };

  const supplier = existing
    ? await apiRequest(`/suppliers/${existing.id}`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({
          ...payload,
          isActive: true,
        }),
      })
    : await apiRequest('/suppliers', {
        method: 'POST',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify(payload),
      });

  return apiRequest(`/suppliers/${supplier.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function ensureRouting(accessToken, finishedItemId) {
  const routes = await apiRequest(`/routings/item/${finishedItemId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existing = routes.find((routing) => routing.code === ROUTING.code) ?? null;
  const routing = existing
    ? await apiRequest(`/routings/${existing.id}`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({
          code: ROUTING.code,
          name: ROUTING.name,
          description: ROUTING.description,
          status: ROUTING.status,
        }),
      })
    : await apiRequest('/routings', {
        method: 'POST',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({
          itemId: finishedItemId,
          code: ROUTING.code,
          name: ROUTING.name,
          description: ROUTING.description,
          status: ROUTING.status,
        }),
      });

  const operations = await apiRequest(`/routings/${routing.id}/operations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existingOperation =
    operations.find((operation) => operation.sequence === ROUTING.operation.sequence) ??
    operations[0] ??
    null;

  if (existingOperation) {
    await apiRequest(`/routings/${routing.id}/operations/${existingOperation.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(ROUTING.operation),
    });
  } else {
    await apiRequest(`/routings/${routing.id}/operations`, {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(ROUTING.operation),
    });
  }

  await apiRequest(`/routings/${routing.id}/default`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return apiRequest(`/routings/${routing.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function buildQuotePayload(customer, finishedItem) {
  const primaryContact =
    customer.contacts.find((contact) => contact.isPrimary) ??
    customer.contacts[0] ??
    null;

  return {
    customerId: customer.id,
    quoteDate: isoDateOffset(0),
    validityDate: isoDateOffset(14),
    promisedDate: isoDateOffset(10),
    customerReference: SALES_REFERENCE,
    salespersonName: 'Office User',
    salespersonEmail: 'office@impeasy.local',
    paymentTerm: customer.defaultPaymentTerm ?? 'Net 30',
    shippingTerm: customer.defaultShippingTerm ?? 'DAP',
    shippingMethod: customer.defaultShippingMethod ?? 'Freight',
    taxMode: 'exclusive',
    documentDiscountPercent: customer.defaultDocumentDiscountPercent ?? 0,
    notes: 'Seeded sales order for the MVP-040 shipment and invoice-register walkthrough.',
    internalNotes: 'Seeded by scripts/seed-mvp-040-demo.mjs',
    contactName: primaryContact?.name ?? '',
    contactEmail: primaryContact?.email ?? '',
    contactPhone: primaryContact?.phone ?? '',
    billingAddress: customer.billingAddress,
    shippingAddress: customer.shippingAddress,
    lines: [
      {
        itemId: finishedItem.id,
        description: `${finishedItem.name} seeded shipping demo line`,
        quantity: SALES_ORDER_QUANTITY,
        unit: finishedItem.unitOfMeasure ?? 'pcs',
        unitPrice: finishedItem.defaultPrice ?? 265,
        lineDiscountPercent: 0,
        taxRate: 19,
        deliveryDateOverride: isoDateOffset(10),
      },
    ],
  };
}

async function ensureReleasedSalesOrder(accessToken, customer, finishedItem) {
  const existingSalesOrders = await apiRequest('/sales-orders', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let salesOrder =
    existingSalesOrders.find((entry) => entry.customerReference === SALES_REFERENCE) ?? null;

  let quoteId = salesOrder?.quoteId ?? null;
  if (!salesOrder) {
    const quotes = await apiRequest('/quotes', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let quote = quotes.find((entry) => entry.customerReference === SALES_REFERENCE) ?? null;
    const payload = buildQuotePayload(customer, finishedItem);

    quote = quote
      ? await apiRequest(`/quotes/${quote.id}`, {
          method: 'PATCH',
          headers: jsonHeaders(accessToken),
          body: JSON.stringify(payload),
        })
      : await apiRequest('/quotes', {
          method: 'POST',
          headers: jsonHeaders(accessToken),
          body: JSON.stringify(payload),
        });

    if (quote.status === 'draft') {
      quote = await apiRequest(`/quotes/${quote.id}/status`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({ status: 'sent' }),
      });
    }

    if (quote.status === 'sent') {
      quote = await apiRequest(`/quotes/${quote.id}/status`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({ status: 'approved' }),
      });
    }

    if (quote.status === 'approved') {
      const conversion = await apiRequest(`/quotes/${quote.id}/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      salesOrder = conversion.salesOrder;
      quoteId = conversion.quote.id;
    } else if (quote.status === 'converted') {
      quoteId = quote.id;
      const refreshedSalesOrders = await apiRequest('/sales-orders', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      salesOrder = refreshedSalesOrders.find((entry) => entry.quoteId === quote.id) ?? null;
    } else {
      throw new Error(
        `Unable to prepare the MVP-040 sales order because quote ${quote.id} remained in status ${quote.status}.`,
      );
    }
  }

  if (!salesOrder) {
    throw new Error('Unable to locate the seeded sales order after quote conversion.');
  }

  if (salesOrder.status === 'draft') {
    salesOrder = await apiRequest(`/sales-orders/${salesOrder.id}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ status: 'confirmed' }),
    });
  }

  if (salesOrder.status === 'confirmed') {
    salesOrder = await apiRequest(`/sales-orders/${salesOrder.id}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ status: 'released' }),
    });
  }

  const salesOrderDetail = await apiRequest(`/sales-orders/${salesOrder.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    quoteId,
    salesOrder: salesOrderDetail,
  };
}

async function ensureCompletedManufacturingOrder(accessToken, salesOrderId, operatorUserId) {
  let workOrders = await apiRequest(`/sales-orders/${salesOrderId}/work-orders`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!Array.isArray(workOrders) || workOrders.length === 0) {
    workOrders = await apiRequest(`/sales-orders/${salesOrderId}/work-orders/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (!Array.isArray(workOrders) || workOrders.length === 0) {
    throw new Error(`No Manufacturing Order was generated for sales order ${salesOrderId}.`);
  }

  const workOrderId = workOrders[0].id;

  await apiRequest(`/manufacturing-orders/${workOrderId}`, {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({
      assignedOperatorId: operatorUserId,
      assignedWorkstation: ROUTING.operation.workstation,
      notes:
        'Seeded for the MVP-040 checkpoint. This Manufacturing Order is auto-completed so shipment picking has a finished-goods lot to allocate.',
    }),
  });

  let workOrder = await apiRequest(`/manufacturing-orders/${workOrderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (workOrder.status === 'planned') {
    workOrder = await apiRequest(`/manufacturing-orders/${workOrderId}/release`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (workOrder.status !== 'completed') {
    const activeOperation = workOrder.operations.find(
      (operation) => operation.status !== 'completed',
    );

    if (!activeOperation) {
      throw new Error(`Manufacturing order ${workOrderId} has no active operation to complete.`);
    }

    if (['ready', 'paused'].includes(activeOperation.status)) {
      await apiRequest(`/operations/${activeOperation.id}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    await apiRequest(`/operations/${activeOperation.id}/complete`, {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        goodQuantity: workOrder.quantity,
        scrapQuantity: 0,
      }),
    });

    workOrder = await apiRequest(`/manufacturing-orders/${workOrderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (!workOrder.finishedGoodsLotId || !workOrder.finishedGoodsLotNumber) {
    throw new Error(
      `Manufacturing order ${workOrderId} completed without creating a finished-goods lot.`,
    );
  }

  return workOrder;
}

async function ensureItemVendorTerm(accessToken, supplierId, rawItemId) {
  const existingTerms = await apiRequest(`/suppliers/${supplierId}/item-terms`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = {
    itemId: rawItemId,
    vendorItemCode: 'NAS-ALU-RAIL',
    leadTimeDays: 7,
    unitPrice: RAW_ITEM.defaultPrice,
    minimumQuantity: 10,
    isPreferred: true,
    notes: 'Preferred demo supplier term for the MVP-040 purchasing workspace.',
  };

  const existing = existingTerms.find((term) => term.itemId === rawItemId) ?? null;
  if (existing) {
    return apiRequest(`/suppliers/${supplierId}/item-terms/${existing.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    });
  }

  return apiRequest(`/suppliers/${supplierId}/item-terms`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

async function ensurePurchaseOrder(accessToken, supplierId, rawItemId) {
  const purchaseOrders = await apiRequest('/purchase-orders', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let purchaseOrder =
    purchaseOrders.find((entry) => entry.supplierReference === PURCHASE_REFERENCE) ?? null;

  if (!purchaseOrder) {
    purchaseOrder = await apiRequest('/purchase-orders', {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        supplierId,
        supplierReference: PURCHASE_REFERENCE,
        orderDate: isoDateOffset(-2),
        expectedDate: isoDateOffset(5),
        buyer: 'Office User',
        currency: 'EUR',
        paymentTerm: 'Net 30',
        notes: 'Seeded PO for the MVP-040 receiving walkthrough.',
      }),
    });
  }

  let detail = await apiRequest(`/purchase-orders/${purchaseOrder.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let line = detail.lines.find((entry) => entry.itemId === rawItemId) ?? null;
  if (!line) {
    line = await apiRequest(`/purchase-orders/${purchaseOrder.id}/lines`, {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        itemId: rawItemId,
        quantity: PURCHASE_ORDER_LINE_QUANTITY,
        unitPrice: RAW_ITEM.defaultPrice,
      }),
    });
  }

  detail = await apiRequest(`/purchase-orders/${purchaseOrder.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if ((detail.receipts ?? []).length === 0) {
    await apiRequest(`/purchase-orders/${purchaseOrder.id}/lines/${line.id}/receive`, {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({
        quantity: PURCHASE_RECEIPT_QUANTITY,
        lotNumber: RECEIPT_LOT_NUMBER,
        receiptDate: isoDateOffset(-1),
        notes: 'Initial partial receipt for the MVP-040 checkpoint.',
      }),
    });

    detail = await apiRequest(`/purchase-orders/${purchaseOrder.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return detail;
}

async function ensureDraftShipment(accessToken, salesOrderId) {
  const availability = await apiRequest(`/sales-orders/${salesOrderId}/shipping-availability`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const existingShipments = await apiRequest(`/sales-orders/${salesOrderId}/shipments`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (existingShipments.length > 0) {
    return apiRequest(`/shipments/${existingShipments[0].id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  const line = availability.find((entry) => entry.availableToShipQuantity > 0) ?? availability[0];
  if (!line || line.availableToShipQuantity < SALES_ORDER_QUANTITY) {
    throw new Error(
      `Shipping availability was insufficient to seed the MVP-040 shipment. Available quantity: ${line?.availableToShipQuantity ?? 0}.`,
    );
  }

  const shipment = await apiRequest('/shipments', {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({
      salesOrderId,
      notes: 'Seeded draft shipment waiting for lot allocation and ship confirmation.',
      lines: [
        {
          salesOrderLineId: line.salesOrderLineId,
          quantity: SALES_ORDER_QUANTITY,
        },
      ],
    }),
  });

  return apiRequest(`/shipments/${shipment.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function main() {
  if (process.env.RENDER === 'true' && process.env.IMPEASY_SKIP_REMOTE_SEEDS !== 'false') {
    console.log('Skipping MVP-040 remote seed during Render build.');
    return;
  }
  console.log(`Seeding MVP-040 demo data against API ${API_BASE_URL} and web ${WEB_BASE_URL}`);
  if (DATABASE_URL) {
    console.log(`Resetting dedicated demo records using ${DATABASE_URL}`);
  }
  runCleanupSql();

  const userResults = await ensureUsers();
  const accessToken = await loginFirstAvailableUser();
  const roleIdsByName = await ensureRoles(accessToken);
  const users = await assignRoles(accessToken, roleIdsByName);
  const operatorUser = users.find((user) => user.email === 'operator@impeasy.local');

  if (!operatorUser) {
    throw new Error('Operator seed user is required for the MVP-040 production-output seed.');
  }

  const customer = await ensureCustomer(accessToken);
  const rawItem = await ensureItem(accessToken, RAW_ITEM);
  const finishedItem = await ensureItem(accessToken, FINISHED_ITEM);
  const supplier = await ensureSupplier(accessToken);

  await apiRequest(`/items/${rawItem.id}`, {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({
      preferredVendorId: supplier.id,
    }),
  });

  const routing = await ensureRouting(accessToken, finishedItem.id);
  const { quoteId, salesOrder } = await ensureReleasedSalesOrder(accessToken, customer, finishedItem);
  const workOrder = await ensureCompletedManufacturingOrder(
    accessToken,
    salesOrder.id,
    operatorUser.id,
  );
  const itemVendorTerm = await ensureItemVendorTerm(accessToken, supplier.id, rawItem.id);
  const purchaseOrder = await ensurePurchaseOrder(accessToken, supplier.id, rawItem.id);
  const shipment = await ensureDraftShipment(accessToken, salesOrder.id);

  const stockLots = await apiRequest('/stock/lots', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const receivedLot = stockLots.find((lot) => lot.lotNumber === RECEIPT_LOT_NUMBER) ?? null;
  const finishedLot =
    stockLots.find((lot) => lot.id === workOrder.finishedGoodsLotId) ??
    stockLots.find((lot) => lot.lotNumber === workOrder.finishedGoodsLotNumber) ??
    null;

  if (!receivedLot) {
    throw new Error(`Unable to find the received purchase lot ${RECEIPT_LOT_NUMBER}.`);
  }

  if (!finishedLot) {
    throw new Error(
      `Unable to find the finished-goods lot ${workOrder.finishedGoodsLotNumber} for shipment picking.`,
    );
  }

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
      kind: 'customer_order_workspace',
      id: salesOrder.id,
      route: `${WEB_BASE_URL}/customer-orders/sales-order-${salesOrder.id}`,
    },
    {
      kind: 'manufacturing_order',
      id: workOrder.id,
      route: `${WEB_BASE_URL}/manufacturing-orders/${workOrder.id}`,
    },
    {
      kind: 'supplier_detail',
      id: supplier.id,
      route: `${WEB_BASE_URL}/suppliers/${supplier.id}`,
    },
    {
      kind: 'purchase_order_detail',
      id: purchaseOrder.id,
      route: `${WEB_BASE_URL}/purchase-orders/${purchaseOrder.id}`,
    },
    {
      kind: 'shipment_workspace',
      id: shipment.id,
      route: `${WEB_BASE_URL}/shipments/${shipment.id}`,
    },
    {
      kind: 'received_stock_item',
      id: rawItem.id,
      route: `${WEB_BASE_URL}/stock/items/${rawItem.id}`,
    },
    {
      kind: 'received_lot',
      id: receivedLot.id,
      route: `${WEB_BASE_URL}/stock/lots/${receivedLot.id}`,
    },
    {
      kind: 'finished_stock_item',
      id: finishedItem.id,
      route: `${WEB_BASE_URL}/stock/items/${finishedItem.id}`,
    },
    {
      kind: 'finished_lot',
      id: finishedLot.id,
      route: `${WEB_BASE_URL}/stock/lots/${finishedLot.id}`,
    },
    {
      kind: 'stock_movements',
      id: '',
      route: `${WEB_BASE_URL}/stock/movements`,
    },
    {
      kind: 'critical_on_hand',
      id: '',
      route: `${WEB_BASE_URL}/stock/critical-on-hand`,
    },
    {
      kind: 'invoice_register',
      id: '',
      route: `${WEB_BASE_URL}/invoices`,
    },
  ]);
  console.table([
    {
      demo: 'supplier',
      code: supplier.code,
      name: supplier.name,
    },
    {
      demo: 'item_vendor_term',
      code: rawItem.code,
      name: itemVendorTerm.vendorItemCode,
    },
    {
      demo: 'purchase_order',
      code: purchaseOrder.number,
      name: `${purchaseOrder.receivedQuantity}/${purchaseOrder.lines[0]?.quantity ?? PURCHASE_ORDER_LINE_QUANTITY} received`,
    },
    {
      demo: 'received_lot',
      code: receivedLot.lotNumber,
      name: `${receivedLot.quantityOnHand} on hand`,
    },
    {
      demo: 'sales_order',
      code: salesOrder.documentNumber,
      name: SALES_REFERENCE,
    },
    {
      demo: 'manufacturing_order',
      code: workOrder.documentNumber,
      name: workOrder.finishedGoodsLotNumber,
    },
    {
      demo: 'shipment',
      code: shipment.number,
      name: shipment.status,
    },
  ]);
  console.log(`Admin user: admin.review@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Office user: office@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Planner user: planner@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Operator user: operator@impeasy.local / ${DEFAULT_PASSWORD}`);
  console.log(`Seeded quote route: ${WEB_BASE_URL}/customer-orders/quote-${quoteId}`);
  console.log(`Seeded supplier code: ${SUPPLIER_CODE}`);
  console.log(`Seeded purchase receipt lot: ${RECEIPT_LOT_NUMBER}`);
  console.log(`Seeded finished-goods lot: ${workOrder.finishedGoodsLotNumber}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
