import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type CompanySettingRecord = {
  id: number;
  companyName: string;
  legalName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NumberingSettingRecord = {
  id: number;
  documentType: string;
  prefix: string;
  separator: string;
  padding: number;
  createdAt: Date;
  updatedAt: Date;
};

type SettingsListEntryRecord = {
  id: number;
  listType: string;
  code: string;
  label: string;
  numericValue: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private companySettings: CompanySettingRecord[] = [];
  private numberingSettings: NumberingSettingRecord[] = [];
  private settingsEntries: SettingsListEntryRecord[] = [];
  private nextCompanyId = 1;
  private nextNumberingId = 1;
  private nextEntryId = 1;

  companySetting = {
    findFirst: async (): Promise<CompanySettingRecord | null> => {
      return this.companySettings[0] ?? null;
    },
    create: async ({
      data,
    }: {
      data: Omit<CompanySettingRecord, 'id' | 'createdAt' | 'updatedAt'>;
    }): Promise<CompanySettingRecord> => {
      const now = new Date();
      const created: CompanySettingRecord = {
        id: this.nextCompanyId++,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      this.companySettings = [created];
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: Partial<CompanySettingRecord>;
    }): Promise<CompanySettingRecord> => {
      const existing = this.companySettings.find((candidate) => candidate.id === where.id);
      if (!existing) {
        throw new Error('Company setting not found');
      }

      const updated: CompanySettingRecord = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      this.companySettings = [updated];
      return updated;
    },
  };

  numberingSetting = {
    findMany: async ({
      where,
      select,
    }: {
      where?: {
        documentType?: {
          in?: string[];
        };
      };
      select?: {
        documentType?: boolean;
      };
    } = {}): Promise<Array<NumberingSettingRecord | Pick<NumberingSettingRecord, 'documentType'>>> => {
      let rows = [...this.numberingSettings];
      const documentTypes = where?.documentType?.in;
      if (documentTypes) {
        const allowed = new Set(documentTypes);
        rows = rows.filter((row) => allowed.has(row.documentType));
      }

      if (select?.documentType) {
        return rows.map((row) => ({ documentType: row.documentType }));
      }

      return rows;
    },
    createMany: async ({
      data,
    }: {
      data: Array<{
        documentType: string;
        prefix: string;
        separator: string;
        padding: number;
      }>;
    }): Promise<{ count: number }> => {
      let count = 0;
      for (const candidate of data) {
        const exists = this.numberingSettings.some(
          (existing) => existing.documentType === candidate.documentType,
        );
        if (exists) {
          continue;
        }

        const now = new Date();
        this.numberingSettings.push({
          id: this.nextNumberingId++,
          documentType: candidate.documentType,
          prefix: candidate.prefix,
          separator: candidate.separator,
          padding: candidate.padding,
          createdAt: now,
          updatedAt: now,
        });
        count += 1;
      }
      return { count };
    },
    update: async ({
      where,
      data,
    }: {
      where: { documentType: string };
      data: {
        prefix: string;
        separator: string;
        padding: number;
      };
    }): Promise<NumberingSettingRecord> => {
      const existing = this.numberingSettings.find(
        (candidate) => candidate.documentType === where.documentType,
      );
      if (!existing) {
        throw new Error('Numbering setting not found');
      }

      existing.prefix = data.prefix;
      existing.separator = data.separator;
      existing.padding = data.padding;
      existing.updatedAt = new Date();
      return existing;
    },
  };

  settingsListEntry = {
    findMany: async ({
      where,
      select,
      orderBy,
    }: {
      where?: {
        listType?: string;
      };
      select?: {
        code?: boolean;
      };
      orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    } = {}): Promise<Array<SettingsListEntryRecord | Pick<SettingsListEntryRecord, 'code'>>> => {
      let rows = [...this.settingsEntries];
      if (where?.listType) {
        rows = rows.filter((row) => row.listType === where.listType);
      }

      if (orderBy) {
        rows.sort((left, right) => {
          if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
          }
          return left.id - right.id;
        });
      }

      if (select?.code) {
        return rows.map((row) => ({ code: row.code }));
      }

      return rows;
    },
    findFirst: async ({
      where,
      select,
      orderBy,
    }: {
      where?: {
        id?: number;
        listType?: string;
      };
      select?: {
        sortOrder?: boolean;
        id?: boolean;
      };
      orderBy?: {
        sortOrder?: 'asc' | 'desc';
      };
    }): Promise<
      | SettingsListEntryRecord
      | Pick<SettingsListEntryRecord, 'sortOrder'>
      | Pick<SettingsListEntryRecord, 'id'>
      | null
    > => {
      let rows = [...this.settingsEntries];
      if (where?.listType) {
        rows = rows.filter((row) => row.listType === where.listType);
      }
      if (where?.id !== undefined) {
        rows = rows.filter((row) => row.id === where.id);
      }
      if (orderBy?.sortOrder === 'desc') {
        rows.sort((left, right) => right.sortOrder - left.sortOrder);
      }
      const row = rows[0] ?? null;
      if (!row) {
        return null;
      }

      if (select?.sortOrder) {
        return { sortOrder: row.sortOrder };
      }
      if (select?.id) {
        return { id: row.id };
      }

      return row;
    },
    createMany: async ({
      data,
    }: {
      data: Array<{
        listType: string;
        code: string;
        label: string;
        numericValue: number | null;
        isActive: boolean;
        sortOrder: number;
      }>;
    }): Promise<{ count: number }> => {
      let count = 0;
      for (const candidate of data) {
        const exists = this.settingsEntries.some(
          (row) => row.listType === candidate.listType && row.code === candidate.code,
        );
        if (exists) {
          continue;
        }

        const now = new Date();
        this.settingsEntries.push({
          id: this.nextEntryId++,
          listType: candidate.listType,
          code: candidate.code,
          label: candidate.label,
          numericValue: candidate.numericValue,
          isActive: candidate.isActive,
          sortOrder: candidate.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
        count += 1;
      }
      return { count };
    },
    create: async ({
      data,
    }: {
      data: {
        listType: string;
        code: string;
        label: string;
        numericValue: number | null;
        isActive: boolean;
        sortOrder: number;
      };
    }): Promise<SettingsListEntryRecord> => {
      const now = new Date();
      const created: SettingsListEntryRecord = {
        id: this.nextEntryId++,
        listType: data.listType,
        code: data.code,
        label: data.label,
        numericValue: data.numericValue,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        createdAt: now,
        updatedAt: now,
      };
      this.settingsEntries.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: Partial<SettingsListEntryRecord>;
    }): Promise<SettingsListEntryRecord> => {
      const existing = this.settingsEntries.find((row) => row.id === where.id);
      if (!existing) {
        throw new Error('Settings entry not found');
      }

      const updated: SettingsListEntryRecord = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      this.settingsEntries = this.settingsEntries.map((row) =>
        row.id === where.id ? updated : row,
      );
      return updated;
    },
    delete: async ({ where }: { where: { id: number } }): Promise<SettingsListEntryRecord> => {
      const existing = this.settingsEntries.find((row) => row.id === where.id);
      if (!existing) {
        throw new Error('Settings entry not found');
      }
      this.settingsEntries = this.settingsEntries.filter((row) => row.id !== where.id);
      return existing;
    },
  };

  async $transaction<T>(operations: Promise<T>[]): Promise<T[]> {
    return Promise.all(operations);
  }
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(new PrismaServiceMock())
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

describe('SettingsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('loads and updates company settings', async () => {
    const getResponse = await request(app.getHttpServer()).get('/settings/company');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.companyName).toBe('IMPeasy Manufacturing');

    const updateResponse = await request(app.getHttpServer()).patch('/settings/company').send({
      companyName: 'IMPeasy Berlin',
      legalName: 'IMPeasy Berlin GmbH',
      email: 'admin@impeasy.local',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.companyName).toBe('IMPeasy Berlin');
    expect(updateResponse.body.legalName).toBe('IMPeasy Berlin GmbH');
    expect(updateResponse.body.email).toBe('admin@impeasy.local');
  });

  it('loads defaults and updates numbering settings', async () => {
    const listResponse = await request(app.getHttpServer()).get('/settings/numbering');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(8);

    const replaceResponse = await request(app.getHttpServer())
      .put('/settings/numbering')
      .send({
        settings: [
          {
            documentType: 'quotes',
            prefix: 'QU',
            separator: '-',
            padding: 6,
          },
          {
            documentType: 'lots',
            prefix: 'LOT',
            separator: '/',
            padding: 5,
          },
        ],
      });

    expect(replaceResponse.status).toBe(200);
    expect(replaceResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          documentType: 'quotes',
          prefix: 'QU',
          padding: 6,
        }),
        expect.objectContaining({
          documentType: 'lots',
          prefix: 'LOT',
          separator: '/',
          padding: 5,
        }),
      ]),
    );
  });

  it('supports payment-term list CRUD', async () => {
    const defaultsResponse = await request(app.getHttpServer()).get('/settings/payment-terms');
    expect(defaultsResponse.status).toBe(200);
    expect(defaultsResponse.body.length).toBeGreaterThanOrEqual(3);

    const createResponse = await request(app.getHttpServer())
      .post('/settings/payment-terms')
      .send({
        code: 'NET45',
        label: 'Net 45 days',
        sortOrder: 40,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.code).toBe('NET45');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/settings/payment-terms/${createResponse.body.id}`)
      .send({
        label: 'Net 45 calendar days',
        isActive: false,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.label).toBe('Net 45 calendar days');
    expect(updateResponse.body.isActive).toBe(false);

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/settings/payment-terms/${createResponse.body.id}`,
    );
    expect(deleteResponse.status).toBe(200);

    const listResponse = await request(app.getHttpServer()).get('/settings/payment-terms');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.some((entry: { code: string }) => entry.code === 'NET45')).toBe(
      false,
    );
  });
});
