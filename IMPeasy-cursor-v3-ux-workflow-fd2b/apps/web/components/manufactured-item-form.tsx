'use client';

import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { listProductGroups } from '../lib/api';
import type { Bom } from '../types/bom';
import type { Item, ItemInput } from '../types/item';
import type { Routing } from '../types/routing';
import type { Supplier } from '../types/supplier';
import type { ProductGroup } from '../types/stock-settings';
import { InlineCreateProductGroupDialog } from './inline-create-product-group-dialog';
import { Button, Field, FormGrid, Notice } from './ui/primitives';

type ManufacturedItemFormProps = {
  initial?: Partial<Item> | null;
  boms?: Bom[];
  routings?: Routing[];
  suppliers?: Supplier[];
  submitLabel: string;
  onSubmit: (input: ItemInput) => Promise<void>;
};

type ManufacturedItemFormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  itemGroup: string;
  unitOfMeasure: string;
  itemType: 'produced' | 'procured';
  defaultBomId: string;
  defaultRoutingId: string;
  defaultPrice: string;
  reorderPoint: string;
  safetyStock: string;
  preferredVendorId: string;
  notes: string;
};

function createFormState(initial?: Partial<Item> | null): ManufacturedItemFormState {
  return {
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    isActive: initial?.isActive ?? true,
    itemGroup: initial?.itemGroup ?? '',
    unitOfMeasure: initial?.unitOfMeasure ?? 'pcs',
    itemType: initial?.itemType ?? 'produced',
    defaultBomId: initial?.defaultBomId ? String(initial.defaultBomId) : '',
    defaultRoutingId: initial?.defaultRoutingId ? String(initial.defaultRoutingId) : '',
    defaultPrice: String(initial?.defaultPrice ?? 0),
    reorderPoint: String(initial?.reorderPoint ?? 0),
    safetyStock: String(initial?.safetyStock ?? 0),
    preferredVendorId: initial?.preferredVendorId ? String(initial.preferredVendorId) : '',
    notes: initial?.notes ?? '',
  };
}

export function ManufacturedItemForm({
  initial,
  boms = [],
  routings = [],
  suppliers = [],
  submitLabel,
  onSubmit,
}: ManufacturedItemFormProps): JSX.Element {
  const [form, setForm] = useState<ManufacturedItemFormState>(() => createFormState(initial));
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setForm(createFormState(initial));
  }, [initial]);

  useEffect(() => {
    void listProductGroups().then(setProductGroups);
  }, []);

  function updateField<Key extends keyof ManufacturedItemFormState>(
    key: Key,
    value: ManufacturedItemFormState[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate(): string | null {
    if (!form.name.trim()) {
      return 'Item name is required.';
    }

    if (!form.unitOfMeasure.trim()) {
      return 'Unit of measure is required.';
    }

    if (Number(form.defaultPrice) < 0) {
      return 'Default price cannot be negative.';
    }

    if (Number(form.reorderPoint) < 0 || Number(form.safetyStock) < 0) {
      return 'Reorder point and safety stock cannot be negative.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit({
        code: form.code.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        itemGroup: form.itemGroup.trim() || undefined,
        unitOfMeasure: form.unitOfMeasure.trim(),
        itemType: form.itemType,
        defaultBomId: form.defaultBomId ? Number(form.defaultBomId) : undefined,
        defaultRoutingId: form.defaultRoutingId ? Number(form.defaultRoutingId) : undefined,
        defaultPrice: Number(form.defaultPrice),
        reorderPoint: Number(form.reorderPoint),
        safetyStock: Number(form.safetyStock),
        preferredVendorId: form.preferredVendorId ? Number(form.preferredVendorId) : undefined,
        notes: form.notes.trim() || undefined,
      });
      setSuccess('Manufactured item saved.');
    } catch {
      setError('Unable to save the manufactured item.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="page-stack" onSubmit={handleSubmit}>
      {error ? <Notice title="Save failed" tone="warning">{error}</Notice> : null}
      {success ? <Notice title="Saved">{success}</Notice> : null}

      <FormGrid columns={2}>
        <Field label="Item Code">
          <input
            className="control"
            value={form.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder="ITEM-0301"
          />
        </Field>
        <Field label="Active">
          <select
            className="control"
            value={form.isActive ? 'true' : 'false'}
            onChange={(event) => updateField('isActive', event.target.value === 'true')}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
        <Field label="Name">
          <input
            className="control"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </Field>
        <Field label="Product group">
          <select
            className="control"
            value={form.itemGroup}
            onChange={(event) => {
              const v = event.target.value;
              if (v === '__add_new__') {
                setAddProductGroupDialogOpen(true);
              } else {
                updateField('itemGroup', v);
              }
            }}
          >
            <option value="">Select product group</option>
            <option value="__add_new__">Add new product group</option>
            {productGroups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            className="control"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </Field>
        <div className="page-stack">
          <Field label="Unit Of Measure">
            <input
              className="control"
              value={form.unitOfMeasure}
              onChange={(event) => updateField('unitOfMeasure', event.target.value)}
            />
          </Field>
          <Field label="Type">
            <select
              className="control"
              value={form.itemType}
              onChange={(event) =>
                updateField('itemType', event.target.value as ManufacturedItemFormState['itemType'])
              }
            >
              <option value="produced">Produced</option>
              <option value="procured">Procured</option>
            </select>
          </Field>
        </div>
      </FormGrid>

      <FormGrid columns={2}>
        <Field label="Default BOM">
          <select
            className="control"
            value={form.defaultBomId}
            onChange={(event) => updateField('defaultBomId', event.target.value)}
          >
            <option value="">No default BOM</option>
            {boms.map((bom) => (
              <option key={bom.id} value={String(bom.id)}>
                {bom.code} {bom.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default Routing">
          <select
            className="control"
            value={form.defaultRoutingId}
            onChange={(event) => updateField('defaultRoutingId', event.target.value)}
          >
            <option value="">No default routing</option>
            {routings.map((routing) => (
              <option key={routing.id} value={String(routing.id)}>
                {routing.code} {routing.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default Price">
          <input
            className="control"
            type="number"
            min={0}
            step="0.01"
            value={form.defaultPrice}
            onChange={(event) => updateField('defaultPrice', event.target.value)}
          />
        </Field>
        <Field label="Preferred Vendor">
          <select
            className="control"
            value={form.preferredVendorId}
            onChange={(event) => updateField('preferredVendorId', event.target.value)}
          >
            <option value="">No preferred vendor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={String(supplier.id)}>
                {supplier.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reorder Point">
          <input
            className="control"
            type="number"
            min={0}
            step="1"
            value={form.reorderPoint}
            onChange={(event) => updateField('reorderPoint', event.target.value)}
          />
        </Field>
        <Field label="Safety Stock">
          <input
            className="control"
            type="number"
            min={0}
            step="1"
            value={form.safetyStock}
            onChange={(event) => updateField('safetyStock', event.target.value)}
          />
        </Field>
      </FormGrid>

      <Field label="Notes">
        <textarea
          className="control"
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </Field>

      <div>
        <Button type="submit" tone="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
      <InlineCreateProductGroupDialog
        open={addProductGroupDialogOpen}
        onClose={() => setAddProductGroupDialogOpen(false)}
        onCreated={(created) => {
          setProductGroups((prev) => [...prev, created]);
          updateField('itemGroup', created.name);
          setAddProductGroupDialogOpen(false);
        }}
      />
    </form>
  );
}
