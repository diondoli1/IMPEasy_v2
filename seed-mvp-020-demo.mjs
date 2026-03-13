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
    const message =
      typeof body === 'string'
        ? body
        : JSON.stringify(body);

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
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
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
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleIds: [roleId] }),
    });
  }
}

async function main() {
  console.log(`Seeding MVP-010 users against ${API_BASE_URL}`);
  const userResults = await ensureUsers();
  const accessToken = await loginFirstAvailableUser();
  const roleIdsByName = await ensureRoles(accessToken);
  await assignRoles(accessToken, roleIdsByName);

  console.log('Seed complete.');
  console.table(
    userResults.map((user) => ({
      email: user.email,
      role: user.role,
      status: user.status,
      password: DEFAULT_PASSWORD,
    })),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
