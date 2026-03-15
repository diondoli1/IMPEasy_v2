import { BadRequestException, Injectable } from '@nestjs/common';
import type { NumberingSetting } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_NUMBERING_SETTINGS,
  NUMBERING_DOCUMENT_TYPES,
  type NumberingDocumentType,
} from './constants/settings.constants';
import type { UpdateNumberingSettingDto } from './dto/update-numbering-setting.dto';

export type NumberingSnapshot = Record<
  NumberingDocumentType,
  {
    prefix: string;
    separator: string;
    padding: number;
  }
>;

@Injectable()
export class NumberingService {
  constructor(private readonly prisma: PrismaService) {}

  async listSettings(): Promise<NumberingSetting[]> {
    if (!this.hasNumberingSettingsDelegate()) {
      return this.buildFallbackSettings();
    }

    await this.ensureDefaultSettings();

    const settings = await this.prisma.numberingSetting.findMany({
      where: {
        documentType: {
          in: [...NUMBERING_DOCUMENT_TYPES],
        },
      },
    });

    const byType = new Map(settings.map((setting) => [setting.documentType, setting]));

    return NUMBERING_DOCUMENT_TYPES.flatMap((documentType) => {
      const matchedSetting = byType.get(documentType);
      return matchedSetting ? [matchedSetting] : [];
    });
  }

  async replaceSettings(payload: UpdateNumberingSettingDto[]): Promise<NumberingSetting[]> {
    if (payload.length === 0) {
      throw new BadRequestException('At least one numbering setting is required.');
    }

    const overrides: Partial<
      Record<
        NumberingDocumentType,
        {
          prefix: string;
          separator: string;
          padding: number;
        }
      >
    > = {};

    for (const setting of payload) {
      const normalizedPrefix = setting.prefix.trim();
      if (!normalizedPrefix) {
        throw new BadRequestException(
          `Numbering prefix is required for ${setting.documentType}.`,
        );
      }

      overrides[setting.documentType] = {
        prefix: normalizedPrefix,
        separator: setting.separator?.trim() ?? '-',
        padding: setting.padding,
      };
    }

    if (!this.hasNumberingSettingsDelegate()) {
      return this.buildFallbackSettings(overrides);
    }

    await this.ensureDefaultSettings();

    await this.prisma.$transaction(
      payload.map((setting) => {
        const override =
          overrides[setting.documentType] ?? DEFAULT_NUMBERING_SETTINGS[setting.documentType];

        return this.prisma.numberingSetting.update({
          where: {
            documentType: setting.documentType,
          },
          data: {
            prefix: override.prefix,
            separator: override.separator,
            padding: override.padding,
          },
        });
      }),
    );

    return this.listSettings();
  }

  async getSnapshot(): Promise<NumberingSnapshot> {
    const settings = await this.listSettings();
    const snapshot = { ...DEFAULT_NUMBERING_SETTINGS };

    for (const setting of settings) {
      if (!NUMBERING_DOCUMENT_TYPES.includes(setting.documentType as NumberingDocumentType)) {
        continue;
      }

      const documentType = setting.documentType as NumberingDocumentType;
      snapshot[documentType] = {
        prefix: setting.prefix,
        separator: setting.separator,
        padding: setting.padding,
      };
    }

    return snapshot;
  }

  async format(documentType: NumberingDocumentType, id: number): Promise<string> {
    const snapshot = await this.getSnapshot();
    return this.formatFromSnapshot(snapshot, documentType, id);
  }

  formatFromSnapshot(
    snapshot: NumberingSnapshot,
    documentType: NumberingDocumentType,
    id: number,
  ): string {
    const setting = snapshot[documentType] ?? DEFAULT_NUMBERING_SETTINGS[documentType];
    const separator = setting.separator ?? '';
    const sequence = String(Math.max(id, 0)).padStart(Math.max(setting.padding, 1), '0');

    return `${setting.prefix}${separator}${sequence}`;
  }

  private hasNumberingSettingsDelegate(): boolean {
    return (
      'numberingSetting' in this.prisma &&
      typeof (this.prisma as { numberingSetting?: unknown }).numberingSetting === 'object'
    );
  }

  private buildFallbackSettings(
    overrides: Partial<
      Record<
        NumberingDocumentType,
        {
          prefix: string;
          separator: string;
          padding: number;
        }
      >
    > = {},
  ): NumberingSetting[] {
    const now = new Date();

    return NUMBERING_DOCUMENT_TYPES.map((documentType, index) => {
      const setting = overrides[documentType] ?? DEFAULT_NUMBERING_SETTINGS[documentType];

      return {
        id: index + 1,
        documentType,
        prefix: setting.prefix,
        separator: setting.separator,
        padding: setting.padding,
        createdAt: now,
        updatedAt: now,
      };
    }) as NumberingSetting[];
  }

  private async ensureDefaultSettings(): Promise<void> {
    if (!this.hasNumberingSettingsDelegate()) {
      return;
    }

    const existing = await this.prisma.numberingSetting.findMany({
      select: {
        documentType: true,
      },
    });
    const existingTypes = new Set(existing.map((setting) => setting.documentType));

    const missingTypes = NUMBERING_DOCUMENT_TYPES.filter(
      (documentType) => !existingTypes.has(documentType),
    );

    if (missingTypes.length === 0) {
      return;
    }

    await this.prisma.numberingSetting.createMany({
      data: missingTypes.map((documentType) => {
        const defaults = DEFAULT_NUMBERING_SETTINGS[documentType];

        return {
          documentType,
          prefix: defaults.prefix,
          separator: defaults.separator,
          padding: defaults.padding,
        };
      }),
      skipDuplicates: true,
    });
  }
}
