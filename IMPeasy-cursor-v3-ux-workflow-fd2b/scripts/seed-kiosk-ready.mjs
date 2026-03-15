#!/usr/bin/env node
/**
 * Seeds manufacturing orders for kiosk testing: books materials and releases
 * planned work orders so operators can pick them up at workstations.
 *
 * Prerequisites: Run seed-mvp-030-demo.mjs first (creates work orders, BOM, routing, stock lots).
 *
 * Usage: node scripts/seed-kiosk-ready.mjs
 *   IMPEASY_API_URL=http://localhost:3000 (default)
 */
const API_BASE_URL = process.env.IMPEASY_API_URL ?? 'http://localhost:3000';

function jsonHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function loginAdmin() {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.IMPEASY_ADMIN_EMAIL ?? 'admin@impeasy.local',
      password: process.env.IMPEASY_ADMIN_PASSWORD ?? 'Admin123!',
    }),
  });
  return response.accessToken;
}

async function main() {
  console.log(`Seeding kiosk-ready manufacturing orders via ${API_BASE_URL}`);

  const token = await loginAdmin();
  const mos = await apiRequest('/manufacturing-orders', { headers: jsonHeaders(token) });

  const planned = mos.filter((mo) => mo.status === 'planned');
  if (planned.length === 0) {
    console.log('No planned manufacturing orders found. Run seed-mvp-030-demo.mjs first.');
    return;
  }

  let released = 0;
  for (const mo of planned) {
    const detail = await apiRequest(`/manufacturing-orders/${mo.id}`, { headers: jsonHeaders(token) });
    const materials = detail.materials ?? [];

    for (const mat of materials) {
      const shortfall = mat.requiredQuantity - mat.bookedQuantity;
      if (shortfall <= 0) continue;

      const lots = mat.availableLots ?? [];
      if (lots.length === 0) {
        console.warn(`MO ${mo.documentNumber}: No lots for ${mat.componentItemCode}, cannot book.`);
        continue;
      }

      let toBook = shortfall;
      for (const lot of lots) {
        if (toBook <= 0) break;
        const qty = Math.min(toBook, lot.availableQuantity);
        if (qty <= 0) continue;

        await apiRequest(`/manufacturing-orders/${mo.id}/bookings`, {
          method: 'POST',
          headers: jsonHeaders(token),
          body: JSON.stringify({
            bomItemId: mat.bomItemId,
            stockLotId: lot.id,
            quantity: qty,
          }),
        });
        toBook -= qty;
      }
    }

    await apiRequest(`/manufacturing-orders/${mo.id}/release`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    released++;
    console.log(`Released ${mo.documentNumber} (id=${mo.id})`);
  }

  console.log(`Done. Released ${released} manufacturing order(s) for kiosk.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
