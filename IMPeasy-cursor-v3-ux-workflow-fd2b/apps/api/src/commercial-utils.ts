export type CommercialTaxMode = 'exclusive' | 'inclusive';

export type CommercialLineInput = {
  itemId: number;
  itemCode?: string | null;
  itemName?: string | null;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineDiscountPercent?: number | null;
  taxRate?: number | null;
  deliveryDateOverride?: Date | null;
};

export type CommercialLineCalculation = CommercialLineInput & {
  unit: string;
  lineDiscountPercent: number;
  taxRate: number;
  lineTotal: number;
  taxAmount: number;
  totalAmount: number;
};

export type CommercialDocumentCalculation = {
  lines: CommercialLineCalculation[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function formatCustomerCode(id: number): string {
  return `CUS-${String(id).padStart(4, '0')}`;
}

export function formatQuoteNumber(id: number): string {
  return `Q-${String(id).padStart(5, '0')}`;
}

export function formatSalesOrderNumber(id: number): string {
  return `SO-${String(id).padStart(5, '0')}`;
}

export function formatPurchaseOrderNumber(id: number): string {
  return `PO-${String(id).padStart(5, '0')}`;
}

export function formatShipmentNumber(id: number): string {
  return `SHP-${String(id).padStart(5, '0')}`;
}

export function formatInvoiceNumber(id: number): string {
  return `INV-${String(id).padStart(5, '0')}`;
}

export function buildItemCode(itemId: number): string {
  return `ITEM-${String(itemId).padStart(4, '0')}`;
}

export function calculateCommercialDocument(input: {
  lines: CommercialLineInput[];
  taxMode: CommercialTaxMode;
  documentDiscountPercent?: number | null;
}): CommercialDocumentCalculation {
  const taxMode = input.taxMode;
  const documentDiscountPercent = Math.max(0, input.documentDiscountPercent ?? 0);

  const discountedBaseLines = input.lines.map((line) => {
    const quantity = Math.max(0, line.quantity);
    const unitPrice = Math.max(0, line.unitPrice);
    const lineDiscountPercent = Math.max(0, line.lineDiscountPercent ?? 0);
    const taxRate = Math.max(0, line.taxRate ?? 0);
    const baseAmount = roundCurrency(quantity * unitPrice);
    const discountedBaseAmount = roundCurrency(baseAmount * (1 - lineDiscountPercent / 100));

    return {
      ...line,
      quantity,
      unitPrice,
      unit: normalizeOptionalString(line.unit) ?? 'pcs',
      itemCode: normalizeOptionalString(line.itemCode),
      itemName: normalizeOptionalString(line.itemName),
      description: normalizeOptionalString(line.description),
      lineDiscountPercent,
      taxRate,
      discountedBaseAmount,
    };
  });

  const discountedBaseTotal = roundCurrency(
    discountedBaseLines.reduce((sum, line) => sum + line.discountedBaseAmount, 0),
  );
  const documentDiscountAmount = roundCurrency(
    discountedBaseTotal * (documentDiscountPercent / 100),
  );

  let remainingDiscount = documentDiscountAmount;

  const calculatedLines = discountedBaseLines.map((line, index) => {
    const isLastLine = index === discountedBaseLines.length - 1;
    const proportionalDiscount =
      discountedBaseTotal > 0
        ? roundCurrency((documentDiscountAmount * line.discountedBaseAmount) / discountedBaseTotal)
        : 0;
    const allocatedDiscount = isLastLine ? remainingDiscount : proportionalDiscount;

    remainingDiscount = roundCurrency(remainingDiscount - allocatedDiscount);

    const discountedAmount = roundCurrency(line.discountedBaseAmount - allocatedDiscount);
    const taxAmount =
      taxMode === 'inclusive'
        ? roundCurrency(
            line.taxRate > 0 ? (discountedAmount * line.taxRate) / (100 + line.taxRate) : 0,
          )
        : roundCurrency((discountedAmount * line.taxRate) / 100);
    const lineTotal = taxMode === 'inclusive' ? roundCurrency(discountedAmount - taxAmount) : discountedAmount;
    const totalAmount = taxMode === 'inclusive' ? discountedAmount : roundCurrency(lineTotal + taxAmount);

    return {
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      lineDiscountPercent: line.lineDiscountPercent,
      taxRate: line.taxRate,
      deliveryDateOverride: line.deliveryDateOverride ?? null,
      lineTotal,
      taxAmount,
      totalAmount,
    };
  });

  return {
    lines: calculatedLines,
    subtotalAmount: roundCurrency(calculatedLines.reduce((sum, line) => sum + line.lineTotal, 0)),
    discountAmount: documentDiscountAmount,
    taxAmount: roundCurrency(calculatedLines.reduce((sum, line) => sum + line.taxAmount, 0)),
    totalAmount: roundCurrency(calculatedLines.reduce((sum, line) => sum + line.totalAmount, 0)),
  };
}
