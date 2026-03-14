import { canAccessPath, getLandingPath, normalizeRoles } from '../lib/navigation';

describe('navigation helpers', () => {
  it('normalizes and sorts the active fixed roles', () => {
    expect(normalizeRoles(['planner', 'admin', 'planner', 'unknown'])).toEqual([
      'admin',
      'planner',
    ]);
  });

  it('returns the configured landing path for each role', () => {
    expect(getLandingPath(['admin'])).toBe('/dashboard');
    expect(getLandingPath(['office'])).toBe('/dashboard');
    expect(getLandingPath(['planner'])).toBe('/dashboard');
    expect(getLandingPath(['operator'])).toBe('/kiosk');
  });

  it('enforces route access by role group', () => {
    expect(canAccessPath('/customer-orders', ['office'])).toBe(true);
    expect(canAccessPath('/roles', ['office'])).toBe(false);
    expect(canAccessPath('/kiosk', ['operator'])).toBe(true);
    expect(canAccessPath('/dashboard', ['admin'])).toBe(true);
    expect(canAccessPath('/dashboard', ['operator'])).toBe(false);
    expect(canAccessPath('/manufacturing-orders', ['operator'])).toBe(false);
    expect(canAccessPath('/operations/queue', ['operator'])).toBe(false);
    expect(canAccessPath('/operations/queue', ['planner'])).toBe(true);
    expect(canAccessPath('/settings/company', ['admin'])).toBe(true);
  });
});
