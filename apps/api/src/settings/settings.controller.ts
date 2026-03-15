import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import type { CompanySettingResponseDto } from './dto/company-setting-response.dto';
import { CreateSettingsListEntryDto } from './dto/create-settings-list-entry.dto';
import type { DocumentTemplateSettingResponseDto } from './dto/document-template-setting-response.dto';
import type { NumberingSettingResponseDto } from './dto/numbering-setting-response.dto';
import { ReplaceNumberingSettingsDto } from './dto/replace-numbering-settings.dto';
import type { SettingsListEntryResponseDto } from './dto/settings-list-entry-response.dto';
import { UpdateCompanySettingDto } from './dto/update-company-setting.dto';
import { UpdateDocumentTemplateSettingDto } from './dto/update-document-template-setting.dto';
import { UpdateSettingsListEntryDto } from './dto/update-settings-list-entry.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  getCompany(): Promise<CompanySettingResponseDto> {
    return this.settingsService.getCompany();
  }

  @Patch('company')
  updateCompany(
    @Body() payload: UpdateCompanySettingDto,
  ): Promise<CompanySettingResponseDto> {
    return this.settingsService.updateCompany(payload);
  }

  @Get('numbering')
  listNumbering(): Promise<NumberingSettingResponseDto[]> {
    return this.settingsService.listNumbering();
  }

  @Put('numbering')
  replaceNumbering(
    @Body() payload: ReplaceNumberingSettingsDto,
  ): Promise<NumberingSettingResponseDto[]> {
    return this.settingsService.replaceNumbering(payload);
  }

  @Get('payment-terms')
  @Roles('admin', 'office')
  listPaymentTerms(): Promise<SettingsListEntryResponseDto[]> {
    return this.settingsService.listEntries('payment_terms');
  }

  @Post('payment-terms')
  createPaymentTerm(
    @Body() payload: CreateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.createEntry('payment_terms', payload);
  }

  @Patch('payment-terms/:id')
  updatePaymentTerm(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.updateEntry('payment_terms', id, payload);
  }

  @Delete('payment-terms/:id')
  async deletePaymentTerm(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.settingsService.deleteEntry('payment_terms', id);
  }

  @Get('shipping-terms')
  @Roles('admin', 'office')
  listShippingTerms(): Promise<SettingsListEntryResponseDto[]> {
    return this.settingsService.listEntries('shipping_terms');
  }

  @Post('shipping-terms')
  createShippingTerm(
    @Body() payload: CreateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.createEntry('shipping_terms', payload);
  }

  @Patch('shipping-terms/:id')
  updateShippingTerm(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.updateEntry('shipping_terms', id, payload);
  }

  @Delete('shipping-terms/:id')
  async deleteShippingTerm(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.settingsService.deleteEntry('shipping_terms', id);
  }

  @Get('shipping-methods')
  @Roles('admin', 'office')
  listShippingMethods(): Promise<SettingsListEntryResponseDto[]> {
    return this.settingsService.listEntries('shipping_methods');
  }

  @Post('shipping-methods')
  createShippingMethod(
    @Body() payload: CreateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.createEntry('shipping_methods', payload);
  }

  @Patch('shipping-methods/:id')
  updateShippingMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.updateEntry('shipping_methods', id, payload);
  }

  @Delete('shipping-methods/:id')
  async deleteShippingMethod(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.settingsService.deleteEntry('shipping_methods', id);
  }

  @Get('tax-rates')
  @Roles('admin', 'office')
  listTaxRates(): Promise<SettingsListEntryResponseDto[]> {
    return this.settingsService.listEntries('tax_rates');
  }

  @Post('tax-rates')
  createTaxRate(
    @Body() payload: CreateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.createEntry('tax_rates', payload);
  }

  @Patch('tax-rates/:id')
  updateTaxRate(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSettingsListEntryDto,
  ): Promise<SettingsListEntryResponseDto> {
    return this.settingsService.updateEntry('tax_rates', id, payload);
  }

  @Delete('tax-rates/:id')
  async deleteTaxRate(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.settingsService.deleteEntry('tax_rates', id);
  }

  @Get('document-templates')
  listDocumentTemplates(): Promise<DocumentTemplateSettingResponseDto[]> {
    return this.settingsService.listDocumentTemplates();
  }

  @Patch('document-templates/:templateType')
  updateDocumentTemplate(
    @Param('templateType') templateType: 'quote' | 'sales_order' | 'shipment' | 'invoice',
    @Body() payload: UpdateDocumentTemplateSettingDto,
  ): Promise<DocumentTemplateSettingResponseDto> {
    return this.settingsService.updateDocumentTemplate(templateType, payload);
  }
}
