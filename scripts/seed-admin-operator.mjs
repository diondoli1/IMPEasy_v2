#!/usr/bin/env node
/**
 * Seeds admin and operator users directly into the database.
 * Uses the same password hashing as the auth service (scrypt).
 * Run: DATABASE_URL="postgresql://..." node scripts/seed-admin-operator.mjs
 */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_DERIVED_KEY_BYTES = 64;

const ADMIN_EMAIL = 'admin@impeasy.local';
const ADMIN_PASSWORD = 'Admin123!';
const OPERATOR_EMAIL = 'operator@impeasy.local';
const OPERATOR_PASSWORD = 'Operator123!';

function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_DERIVED_KEY_BYTES).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    // Ensure roles exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      create: { name: 'admin' },
      update: {},
    });
    const operatorRole = await prisma.role.upsert({
      where: { name: 'operator' },
      create: { name: 'operator' },
      update: {},
    });

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        name: 'Admin',
        email: ADMIN_EMAIL,
        passwordHash: hashPassword(ADMIN_PASSWORD),
        isActive: true,
      },
      update: {
        passwordHash: hashPassword(ADMIN_PASSWORD),
        isActive: true,
      },
    });

    // Create or update operator user
    const operatorUser = await prisma.user.upsert({
      where: { email: OPERATOR_EMAIL },
      create: {
        name: 'Operator',
        email: OPERATOR_EMAIL,
        passwordHash: hashPassword(OPERATOR_PASSWORD),
        isActive: true,
      },
      update: {
        passwordHash: hashPassword(OPERATOR_PASSWORD),
        isActive: true,
      },
    });

    // Assign roles
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
      },
      create: { userId: adminUser.id, roleId: adminRole.id },
      update: {},
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: operatorUser.id, roleId: operatorRole.id },
      },
      create: { userId: operatorUser.id, roleId: operatorRole.id },
      update: {},
    });

    console.log('Seeded admin and operator users:');
    console.log('  Admin:    ', ADMIN_EMAIL, ' / ', ADMIN_PASSWORD);
    console.log('  Operator:  ', OPERATOR_EMAIL, ' / ', OPERATOR_PASSWORD);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
