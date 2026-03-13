const API_BASE_URL = process.env.IMPEASY_API_URL ?? 'http://localhost:3000';
const DEFAULT_PASSWORD = process.env.IMPEASY_DEMO_PASSWORD ?? 'StrongPass1!';

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

const ITEM_SEEDS = [
  {
    name: 'Precision Housing',
    description: 'MVP-020 commercial demo item for quote line entry.',
  },
  {
    name: 'Drive Shaft Assembly',
    description: 'MVP-020 commercial demo item for sales-order conversion.',
  },
];

const CUSTOMER_CODE = 'CUS-MVP020';
const CUSTOMER_NAME = 'Apex Aerospace GmbH';
const DRAFT_REFERENCE = 'MVP020-DRAFT';
const CONVERSION_REFERENCE = 'MVP020-CONVERT';

function isoDateOffset(days) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
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

function jsonHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
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
    'Unable to authenticate any seeded user with the default password. Reset the local auth data or provide IMPEASY_DEMO_PASSWORD.',
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
}

async function ensureItems(accessToken) {
  const items = await apiRequest('/items', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const ensuredItems = [];

  for (const seed of ITEM_SEEDS) {
    const existing = items.find((item) => item.name === seed.name);
    if (existing) {
      const updated = await apiRequest(`/items/${existing.id}`, {
        method: 'PATCH',
        headers: jsonHeaders(accessToken),
        body: JSON.stringify(seed),
      });
      ensuredItems.push(updated);
      continue;
    }

    const created = await apiRequest('/items', {
      method: 'POST',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(seed),
    });
    ensuredItems.push(created);
  }

  return ensuredItems;
}

async function ensureCustomer(accessToken) {
  const customers = await apiRequest('/customers', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const existing =
    customers.find((customer) => customer.code === CUSTOMER_CODE) ??
    customers.find((customer) => customer.name === CUSTOMER_NAME);
  const payload = {
    code: CUSTOMER_CODE,
    name: CUSTOMER_NAME,
    email: 'orders@apex-aerospace.test',
    phone: '+49 30 5551000',
    vatNumber: 'DE123456789',
    website: 'https://apex-aerospace.test',
    billingAddress: {
      street: 'Werkstrasse 4',
      city: 'Berlin',
      postcode: '10115',
      stateRegion: 'Berlin',
      country: 'DE',
    },
    shippingAddress: {
      street: 'Industriestrasse 18',
      city: 'Berlin',
      postcode: '12435',
      stateRegion: 'Berlin',
      country: 'DE',
    },
    defaultPaymentTerm: '30 days',
    defaultShippingTerm: 'DAP',
    defaultShippingMethod: 'Road freight',
    defaultDocumentDiscountPercent: 2.5,
    defaultTaxRate: 19,
    internalNotes: 'MVP-020 seeded customer for commercial workspace review.',
    isActive: true,
    contacts: [
      {
        name: 'Nina Vogel',
        jobTitle: 'Purchasing Lead',
        email: 'nina.vogel@apex-aerospace.test',
        phone: '+49 30 5551001',
        isPrimary: true,
        isActive: true,
      },
      {
        name: 'Lars Becker',
        jobTitle: 'Logistics Coordinator',
        email: 'lars.becker@apex-aerospace.test',
        phone: '+49 30 5551002',
        isPrimary: false,
        isActive: true,
      },
    ],
  };

  if (existing) {
    return apiRequest(`/customers/${existing.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    });
  }

  return apiRequest('/customers', {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

function buildQuotePayload(customer, items, customerReference, notes, promisedOffsetDays) {
  const primaryContact =
    customer.contacts.find((contact) => contact.isPrimary) ??
    customer.contacts[0] ??
    null;

  return {
    customerId: customer.id,
    quoteDate: isoDateOffset(0),
    validityDate: isoDateOffset(14),
    promisedDate: isoDateOffset(promisedOffsetDays),
    customerReference,
    salespersonName: 'Office User',
    salespersonEmail: 'office@impeasy.local',
    paymentTerm: customer.defaultPaymentTerm ?? '30 days',
    shippingTerm: customer.defaultShippingTerm ?? 'DAP',
    shippingMethod: customer.defaultShippingMethod ?? 'Road freight',
    taxMode: 'exclusive',
    documentDiscountPercent: customer.defaultDocumentDiscountPercent ?? 0,
    notes,
    internalNotes: 'Seeded for MVP-020 visual checkpoint.',
    contactName: primaryContact?.name ?? '',
    contactEmail: primaryContact?.email ?? '',
    contactPhone: primaryContact?.phone ?? '',
    billingAddress: customer.billingAddress,
    shippingAddress: customer.shippingAddress,
    lines: items.map((item, index) => ({
      itemId: item.id,
      description: `${item.name} commercial demo line`,
      quantity: index === 0 ? 24 : 12,
      unit: 'pcs',
      unitPrice: index === 0 ? 145.5 : 268,
      lineDiscountPercent: index === 0 ? 0 : 5,
      taxRate: 19,
      deliveryDateOverride: isoDateOffset(promisedOffsetDays + index + 1),
    })),
  };
}

async function ensureQuote(accessToken, payload, existingQuote) {
  if (existingQuote && existingQuote.status === 'converted') {
    return existingQuote;
  }

  if (existingQuote && existingQuote.status !== 'rejected') {
    return apiRequest(`/quotes/${existingQuote.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify(payload),
    });
  }

  return apiRequest('/quotes', {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

async function ensureDraftQuote(accessToken, customer, items) {
  const quotes = await apiRequest('/quotes', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const existing = quotes.find((quote) => quote.customerReference === DRAFT_REFERENCE) ?? null;
  const payload = buildQuotePayload(
    customer,
    items,
    DRAFT_REFERENCE,
    'Draft quote for manual review of the commercial workspace.',
    21,
  );

  return ensureQuote(accessToken, payload, existing);
}

async function ensureConvertedSalesOrder(accessToken, customer, items) {
  const salesOrders = await apiRequest('/sales-orders', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const existingSalesOrder =
    salesOrders.find((salesOrder) => salesOrder.customerReference === CONVERSION_REFERENCE) ?? null;

  if (existingSalesOrder) {
    return { salesOrder: existingSalesOrder, quoteId: existingSalesOrder.quoteId };
  }

  const quotes = await apiRequest('/quotes', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const existingQuote =
    quotes.find((quote) => quote.customerReference === CONVERSION_REFERENCE) ?? null;
  const payload = buildQuotePayload(
    customer,
    [items[1]],
    CONVERSION_REFERENCE,
    'Quote that is approved and converted for workspace review.',
    28,
  );
  let quote = await ensureQuote(accessToken, payload, existingQuote);

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

    return {
      salesOrder: conversion.salesOrder,
      quoteId: conversion.quote.id,
    };
  }

  if (quote.status === 'converted') {
    const latestSalesOrders = await apiRequest('/sales-orders', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const convertedSalesOrder =
      latestSalesOrders.find((salesOrder) => salesOrder.quoteId === quote.id) ?? null;

    if (convertedSalesOrder) {
      return {
        salesOrder: convertedSalesOrder,
        quoteId: quote.id,
      };
    }
  }

  throw new Error(
    `Unable to ensure converted sales order for ${CONVERSION_REFERENCE}; current quote status was ${quote.status}.`,
  );
}

async function main() {
  console.log(`Seeding MVP-020 demo data against ${API_BASE_URL}`);

  const userResults = await ensureUsers();
  const accessToken = await loginFirstAvailableUser();
  const roleIdsByName = await ensureRoles(accessToken);
  await assignRoles(accessToken, roleIdsByName);

  const items = await ensureItems(accessToken);
  const customer = await ensureCustomer(accessToken);
  const draftQuote = await ensureDraftQuote(accessToken, customer, items);
  const converted = await ensureConvertedSalesOrder(accessToken, customer, items);

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
      kind: 'customer',
      id: customer.id,
      route: `http://localhost:3001/customers/${customer.id}`,
    },
    {
      kind: 'draft_quote',
      id: draftQuote.id,
      route: `http://localhost:3001/customer-orders/quote-${draftQuote.id}`,
    },
    {
      kind: 'converted_quote',
      id: converted.quoteId,
      route: `http://localhost:3001/customer-orders/quote-${converted.quoteId}`,
    },
    {
      kind: 'sales_order',
      id: converted.salesOrder.id,
      route: `http://localhost:3001/customer-orders/sales-order-${converted.salesOrder.id}`,
    },
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
