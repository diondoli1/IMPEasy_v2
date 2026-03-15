'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { ListTemplate } from '../../components/ui/page-templates';
import { Badge, BadgeRow, ButtonLink, Notice, Panel, ToolbarGroup } from '../../components/ui/primitives';
import { listManufacturedItems } from '../../lib/api';
import {
  booleanTone,
  itemTypeTone,
  normalizeProductionStatus,
} from '../../lib/production';
import type { Item } from '../../types/item';

export default function ManufacturedItemsPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listManufacturedItems());
      } catch {
        setError('Unable to load manufactured items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading manufactured items...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Engineering"
      title="Manufactured items"
      description="Manufacturing-facing item master with default BOM and routing linkage, stock planning hints, and purchasing context for the active MVP."
      actions={<ButtonLink href="/manufactured-items/new" tone="primary">Create item</ButtonLink>}
      toolbar={
        <>
          <ToolbarGroup>
            <Badge tone="info">{items.length} items</Badge>
            <span className="muted-copy">
              The list keeps both produced and procured items visible because BOMs, routings, stock,
              and purchasing defaults depend on the same item master.
            </span>
          </ToolbarGroup>
        </>
      }
      tableTitle="Item master"
      tableDescription="Dense planner-first listing of the item fields needed before BOM, routing, and Manufacturing Order work can proceed."
      table={{
        columns: [
          {
            header: 'Item Code',
            width: '120px',
            cell: (item) => (
              <Link href={`/manufactured-items/${item.id}`} className="mono">
                {item.code}
              </Link>
            ),
          },
          {
            header: 'Name',
            cell: (item) => (
              <div className="stack stack--tight">
                <strong>{item.name}</strong>
                <span className="muted-copy--small">{item.description ?? 'No description'}</span>
              </div>
            ),
          },
          {
            header: 'Type',
            width: '110px',
            cell: (item) => (
              <Badge tone={itemTypeTone(item.itemType)}>{normalizeProductionStatus(item.itemType)}</Badge>
            ),
          },
          {
            header: 'UoM',
            width: '80px',
            cell: (item) => <span className="mono">{item.unitOfMeasure}</span>,
          },
          {
            header: 'Active',
            width: '88px',
            cell: (item) => <Badge tone={booleanTone(item.isActive)}>{item.isActive ? 'active' : 'inactive'}</Badge>,
          },
          {
            header: 'Default BOM',
            cell: (item) => item.defaultBomName ?? '-',
          },
          {
            header: 'Default Routing',
            cell: (item) => item.defaultRoutingName ?? '-',
          },
          {
            header: 'Reorder Point',
            width: '110px',
            align: 'right',
            cell: (item) => <span className="mono">{item.reorderPoint}</span>,
          },
          {
            header: 'Preferred Vendor',
            cell: (item) => item.preferredVendorName ?? '-',
          },
        ],
        rows: items,
        getRowKey: (item) => String(item.id),
      }}
      aside={
        <>
          <Panel
            title="Checkpoint focus"
            description="This list should feel like a dense planner register rather than a generic catalog."
          >
            <BadgeRow>
              <Badge tone="info">BOM linkage</Badge>
              <Badge tone="info">Routing linkage</Badge>
              <Badge tone="warning">Stock hints</Badge>
            </BadgeRow>
            <Notice title="Expected visual read">
              Code, type, defaults, and vendor should be scannable in one pass without opening the
              detail page for every item.
            </Notice>
          </Panel>
        </>
      }
    />
  );
}
