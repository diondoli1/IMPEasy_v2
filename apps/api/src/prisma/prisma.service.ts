import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    const maxRetries = 10;
    const baseDelayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const waitMs = baseDelayMs * attempt;
        // Keep startup resilient when managed DBs need extra time to wake.
        console.warn(
          `[PrismaService] Database connect attempt ${attempt}/${maxRetries} failed. Retrying in ${waitMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
