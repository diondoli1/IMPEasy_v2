import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_DOCUMENT_TEMPLATES,
  DEFAULT_SETTINGS_LIST_ENTRIES,
  DOCUMENT_TEMPLATE_TYPES,
  SETTINGS_LIST_TYPES,
  type DocumentTemplateType,
  type NumberingDocumentType,
  type SettingsListType,
} from './constants/settings.constants';
import type { CompanySettingResponseDto } from './dto/company-setting-response.dto';
import type { CreateSettingsListEntryDto } from './dto/create-settings-list-entry.dto';
import type { DocumentTemplateSettingResponseDto } from './dto/document-template-setting-response.dto';
import type { NumberingSettingResponseDto } from './dto/numbering-setting-response.dto';
import type { ReplaceNumberingSettingsDto } from './dto/replace-numbering-settings.dto';
import type { SettingsListEntryResponseDto } from './dto/settings-list-entry-response.dto';
import type { UpdateCompanySettingDto } from './dto/update-company-setting.dto';
import type { UpdateDocumentTemplateSettingDto } from './dto/update-document-template-setting.dto';
import type { UpdateSettingsListEntryDto } from './dto/update-settings-list-entry.dto';
import { NumberingService } from './numbering.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberingService: NumberingService,
  ) {}

  async getCompany(): Promise<CompanySettingResponseDto> {
    const companySetting = await this.ensureCompanySetting();
    return this.toCompanyResponse(companySetting);
  }

  async updateCompany(payload: UpdateCompanySettingDto): Promise<CompanySettingResponseDto> {
    const companySetting = await this.ensureCompanySetting();

    const updated = await this.prisma.companySetting.update({
      where: {
        id: companySetting.id,
      },
      data: {
        companyName:
          payload.companyName !== undefined
            ? this.normalizeRequiredString(payload.companyName)
            : undefined,
        legalName:
          payload.legalName !== undefined
            ? this.normalizeOptionalString(payload.legalName)
            : undefined,
        address:
          payload.address !== undefined
            ? this.normalizeOptionalString(payload.address)
            : undefined,
        phone:
          payload.phone !== undefined
            ? this.normalizeOptionalString(payload.phone)
            : undefined,
        email:
          payload.email !== undefined
            ? this.normalizeOptionalString(payload.email)
            : undefined,
        website:
          payload.website !== undefined
            ? this.normalizeOptionalString(payload.website)
            : undefined,
        taxNumber:
          payload.taxNumber !== undefined
            ? this.normalizeOptionalString(payload.taxNumber)
            : undefined,
      },
    });

    return this.toCompanyResponse(updated);
  }

  async listNumbering(): Promise<NumberingSettingResponseDto[]> {
    const settings = await this.numberingService.listSettings();

    return settings.map((setting) => ({
      id: setting.id,
      documentType: setting.documentType as NumberingDocumentType,
      prefix: setting.prefix,
      separator: setting.separator,
      padding: setting.padding,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }));
  }

  async replaceNumbering(
    payload: ReplaceNumberingSettingsDto,
  ): Promise<NumberingSettingResponseDto[]> {
    const settings = await this.numberingService.replaceSettings(payload.settings);

    return settings.map((setting) => ({
      id: setting.id,
      documentType: setting.documentType as NumberingDocumentType,
      prefix: setting.prefix,
      separator: setting.separator,
      padding: setting.padding,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }));
  }

  async listEntries(listType: SettingsListType): Promise<SettingsListEntryResponseDto[]> {
    await this.ensureDefaultListEntries(listType);

    const entries = await this.prisma.settingsListEntry.findMany({
      where: {
        listType,
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return entries.map((entry) => this.toListEntryResponse(entry));
  }

  async createEntry(
    listType: SettingsListType,
    payload: CreateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    await this.ensureDefaultListEntries(listType);

    const highestSortOrder = await this.prisma.settingsListEntry.findFirst({
      where: { listType },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    try {
      const created = await this.prisma.settingsListEntry.create({
        data: {
          listType,
          code: this.normalizeRequiredString(payload.code).toUpperCase(),
          label: this.normalizeRequiredString(payload.label),
          numericValue: this.normalizeNumericValue(payload.numericValue),
          isActive: payload.isActive ?? true,
          sortOrder: payload.sortOrder ?? (highestSortOrder?.sortOrder ?? 0) + 10,
        },
      });

      return this.toListEntryResponse(created);
    } catch (error) {
      this.handleUniqueConstraintError(error, `${listType} code already exists.`);
      throw error;
    }
  }

  async updateEntry(
    listType: SettingsListType,
    id: number,
    payload: UpdateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    const existing = await this.prisma.settingsListEntry.findFirst({
      where: {
        id,
        listType,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Settings entry ${id} not found for ${listType}.`);
    }

    try {
      const updated = await this.prisma.settingsListEntry.update({
        where: { id },
        data: {
          code:
            payload.code !== undefined
              ? this.normalizeRequiredString(payload.code).toUpperCase()
              : undefined,
          label:
            payload.label !== undefined
              ? this.normalizeRequiredString(payload.label)
              : undefined,
          numericValue:
            payload.numericValue !== undefined
              ? this.normalizeNumericValue(payload.numericValue)
              : undefined,
          isActive: payload.isActive,
          sortOrder: payload.sortOrder,
        },
      });

      return this.toListEntryResponse(updated);
    } catch (error) {
      this.handleUniqueConstraintError(error, `${listType} code already exists.`);
      throw error;
    }
  }

  async deleteEntry(listType: SettingsListType, id: number): Promise<void> {
    const existing = await this.prisma.settingsListEntry.findFirst({
      where: {
        id,
        listType,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Settings entry ${id} not found for ${listType}.`);
    }

    await this.prisma.settingsListEntry.delete({
      where: { id },
    });
  }

  async listDocumentTemplates(): Promise<DocumentTemplateSettingResponseDto[]> {
    await this.ensureDefaultDocumentTemplates();

    const templates = await this.prisma.documentTemplateSetting.findMany();
    const byType = new Map(templates.map((template) => [template.templateType, template]));

    return DOCUMENT_TEMPLATE_TYPES.flatMap((templateType) => {
      const template = byType.get(templateType);
      return template ? [this.toDocumentTemplateResponse(template)] : [];
    });
  }

  async updateDocumentTemplate(
    templateType: DocumentTemplateType,
    payload: UpdateDocumentTemplateSettingDto,
  ): Promise<DocumentTemplateSettingResponseDto> {
    await this.ensureDefaultDocumentTemplates();

    const existing = await this.prisma.documentTemplateSetting.findUnique({
      where: {
        templateType,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Document template ${templateType} not found.`);
    }

    const updated = await this.prisma.documentTemplateSetting.update({
      where: {
        id: existing.id,
      },
      data: {
        outputFormat:
          payload.outputFormat !== undefined
            ? this.normalizeRequiredString(payload.outputFormat)
            : undefined,
        headerFieldsEnabled: payload.headerFieldsEnabled,
        footerNotesEnabled: payload.footerNotesEnabled,
        notes:
          payload.notes !== undefined
            ? this.normalizeOptionalString(payload.notes)
            : undefined,
      },
    });

    return this.toDocumentTemplateResponse(updated);
  }

  private async ensureCompanySetting() {
    const existing = await this.prisma.companySetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.companySetting.create({
      data: {
        companyName: DEFAULT_COMPANY_SETTINGS.companyName,
        legalName: DEFAULT_COMPANY_SETTINGS.legalName,
        address: DEFAULT_COMPANY_SETTINGS.address,
        phone: DEFAULT_COMPANY_SETTINGS.phone,
        email: DEFAULT_COMPANY_SETTINGS.email,
        website: DEFAULT_COMPANY_SETTINGS.website,
        taxNumber: DEFAULT_COMPANY_SETTINGS.taxNumber,
      },
    });
  }

  private async ensureDefaultListEntries(listType: SettingsListType): Promise<void> {
    const existingEntries = await this.prisma.settingsListEntry.findMany({
      where: { listType },
      select: { code: true },
    });
    const existingCodes = new Set(existingEntries.map((entry) => entry.code));

    const defaults = DEFAULT_SETTINGS_LIST_ENTRIES[listType];
    const missingDefaults = defaults.filter((entry) => !existingCodes.has(entry.code));

    if (missingDefaults.length === 0) {
      return;
    }

    await this.prisma.settingsListEntry.createMany({
      data: missingDefaults.map((entry) => ({
        listType,
        code: entry.code,
        label: entry.label,
        numericValue: entry.numericValue,
        isActive: true,
        sortOrder: entry.sortOrder,
      })),
      skipDuplicates: true,
    });
  }

  private async ensureDefaultDocumentTemplates(): Promise<void> {
    const existingTemplates = await this.prisma.documentTemplateSetting.findMany({
      select: {
        templateType: true,
      },
    });
    const existingTemplateTypes = new Set(
      existingTemplates.map((template) => template.templateType),
    );

    const missingTemplateTypes = DOCUMENT_TEMPLATE_TYPES.filter(
      (templateType) => !existingTemplateTypes.has(templateType),
    );

    if (missingTemplateTypes.length === 0) {
      return;
    }

    await this.prisma.documentTemplateSetting.createMany({
      data: missingTemplateTypes.map((templateType) => {
        const defaults = DEFAULT_DOCUMENT_TEMPLATES[templateType];

        return {
          templateType,
          outputFormat: defaults.outputFormat,
          headerFieldsEnabled: defaults.headerFieldsEnabled,
          footerNotesEnabled: defaults.footerNotesEnabled,
          notes: defaults.notes,
        };
      }),
      skipDuplicates: true,
    });
  }

  private toCompanyResponse(
    companySetting: {
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
    },
  ): CompanySettingResponseDto {
    return {
      id: companySetting.id,
      companyName: companySetting.companyName,
      legalName: companySetting.legalName,
      address: companySetting.address,
      phone: companySetting.phone,
      email: companySetting.email,
      website: companySetting.website,
      taxNumber: companySetting.taxNumber,
      createdAt: companySetting.createdAt,
      updatedAt: companySetting.updatedAt,
    };
  }

  private toListEntryResponse(
    entry: {
      id: number;
      listType: string;
      code: string;
      label: string;
      numericValue: number | null;
      isActive: boolean;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): SettingsListEntryResponseDto {
    return {
      id: entry.id,
      listType: entry.listType as SettingsListType,
      code: entry.code,
      label: entry.label,
      numericValue: entry.numericValue,
      isActive: entry.isActive,
      sortOrder: entry.sortOrder,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private toDocumentTemplateResponse(
    template: {
      id: number;
      templateType: string;
      outputFormat: string;
      headerFieldsEnabled: boolean;
      footerNotesEnabled: boolean;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): DocumentTemplateSettingResponseDto {
    return {
      id: template.id,
      templateType: template.templateType as DocumentTemplateType,
      outputFormat: template.outputFormat,
      headerFieldsEnabled: template.headerFieldsEnabled,
      footerNotesEnabled: template.footerNotesEnabled,
      notes: template.notes,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeRequiredString(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException('Value is required.');
    }

    return normalized;
  }

  private normalizeNumericValue(value: number | undefined): number | null {
    if (value === undefined || Number.isNaN(value)) {
      return null;
    }

    return value;
  }

  private handleUniqueConstraintError(error: unknown, message: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
  }
}



