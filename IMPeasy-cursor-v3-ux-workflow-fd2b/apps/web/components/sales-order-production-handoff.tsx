'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import {
  generateManufacturingOrdersForSalesOrder,
  listManufacturingOrdersBySalesOrder,
} from '../lib/api';
import {
  formatProductionDate,
  manufacturingOrderStatusTone,
  normalizeProductionStatus,
} from '../lib/production';
import type { Item } from '../types/item';
import type { ManufacturingOrder } from '../types/manufacturing-order';
import type { SalesOrderDetail } from '../types/sales-order';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Notice,
  Panel,
  StatCard,
  StatGrid,
} from './ui/primitives';

type SalesOrderProductionHandoffProps = {
  salesOrder: SalesOrderDetail;
  items: Item[];
};

export function SalesOrderProductionHandoff({
  salesOrder,
  items,
}: SalesOrderProductionHandoffProps): JSX.Element {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setOrders(await listManufacturingOrdersBySalesOrder(salesOrder.id));
      } catch {
        setError('Unable to load linked Manufacturing Orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, [salesOrder.id]);

  if (loading) {
    return <p>Loading production handoff...</p>;
  }

  const manufacturableLines = salesOrder.salesOrderLines.map((line) => {
    const item = items.find((candidate) => candidate.id === line.itemId) ?? null;
    const manufacturingOrder =
      orders.find((order) => order.salesOrderLineId === line.id) ?? null;

    return {
      ...line,
      item,
      manufacturingOrder,
      hasBom: Boolean(item?.defaultBomId),
      hasRouting: Boolean(item?.defaultRoutingId),
    };
  });

  const canGenerate = ['released', 'in_production'].includes(salesOrder.status);

  return (
    <div className="page-stack">
      {error ? <Notice title="Production handoff issue" tone="warning">{error}</Notice> : null}
      {message ? <Notice title="Saved">{message}</Notice> : null}

      <StatGrid>
        <StatCard label="Sales Order Status" value={normalizeProductionStatus(salesOrder.status)} />
        <StatCard label="Sales Lines" value={salesOrder.salesOrderLines.length} />
        <StatCard label="Linked MOs" value={orders.length} />
        <StatCard label="Manufacturable Lines" value={manufacturableLines.length} />
      </StatGrid>

      <div className="split-grid">
        <Panel
          title="Manufacturing handoff"
          description="This tab is the manual bridge from released sales orders into planner-facing Manufacturing Orders."
          actions={
            canGenerate ? (
              <Button
                tone="primary"
                disabled={generating}
                onClick={() => {
                  void (async () => {
                    setGenerating(true);
                    setError(null);
                    setMessage(null);
                    try {
                      const createdOrders = await generateManufacturingOrdersForSalesOrder(salesOrder.id);
                      setOrders(createdOrders);
                      setMessage(
                        createdOrders.length > 0
                          ? 'Manufacturing Orders generated or refreshed for this sales order.'
                          : 'No Manufacturing Orders were generated.',
                      );
                    } catch {
                      setError(
                        'Unable to generate Manufacturing Orders. Confirm the sales order is released and each item has a default BOM and routing.',
                      );
                    } finally {
                      setGenerating(false);
                    }
                  })();
                }}
              >
                {generating ? 'Generating...' : orders.length > 0 ? 'Generate missing MOs' : 'Create Manufacturing Orders'}
              </Button>
            ) : undefined
          }
        >
          {!canGenerate ? (
            <Notice title="Release required">
              Confirm and release this sales order before generating Manufacturing Orders. The active
              production workflow starts from released sales orders only.
            </Notice>
          ) : null}
          <DataTable
            columns={[
              {
                header: 'Line',
                width: '90px',
                cell: (line) => <span className="mono">Line {line.id}</span>,
              },
              {
                header: 'Item',
                cell: (line) => (
                  <div className="stack stack--tight">
                    <strong>{line.itemName ?? line.item?.name ?? 'Unknown item'}</strong>
                    <span className="muted-copy--small mono">
                      {line.itemCode ?? line.item?.code ?? '-'}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Quantity',
                width: '90px',
                align: 'right',
                cell: (line) => <span className="mono">{line.quantity}</span>,
              },
              {
                header: 'Due',
                width: '118px',
                cell: (line) => (
                  <span className="mono">
                    {formatProductionDate(line.deliveryDateOverride ?? salesOrder.promisedDate)}
                  </span>
                ),
              },
              {
                header: 'Default BOM',
                width: '110px',
                cell: (line) => (
                  <Badge tone={line.hasBom ? 'success' : 'warning'}>
                    {line.hasBom ? 'ready' : 'missing'}
                  </Badge>
                ),
              },
              {
                header: 'Default Routing',
                width: '120px',
                cell: (line) => (
                  <Badge tone={line.hasRouting ? 'success' : 'warning'}>
                    {line.hasRouting ? 'ready' : 'missing'}
                  </Badge>
                ),
              },
              {
                header: 'Manufacturing Order',
                cell: (line) =>
                  line.manufacturingOrder ? (
                    <Link href={`/manufacturing-orders/${line.manufacturingOrder.id}`} className="mono">
                      {line.manufacturingOrder.documentNumber}
                    </Link>
                  ) : (
                    'Not created'
                  ),
              },
            ]}
            rows={manufacturableLines}
            getRowKey={(line) => String(line.id)}
            emptyState={
              <EmptyState
                title="No lines to hand off"
                description="This sales order has no lines available for Manufacturing Order generation."
              />
            }
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title="Linked Manufacturing Orders"
            description="Existing linked Manufacturing Orders stay visible here so office users can hand the order cleanly to planning."
          >
            {orders.length === 0 ? (
              <EmptyState
                title="No Manufacturing Orders yet"
                description="Generate them from this tab once the sales order is released and the manufactured items have default BOM and routing links."
              />
            ) : (
              <div className="page-stack">
                {orders.map((order) => (
                  <div key={order.id} className="link-list__item">
                    <div className="stack stack--tight">
                      <Link href={`/manufacturing-orders/${order.id}`} className="mono">
                        {order.documentNumber}
                      </Link>
                      <span className="muted-copy">{order.itemName}</span>
                      <span className="muted-copy--small">
                        Due {formatProductionDate(order.dueDate)} / {order.currentOperationName ?? 'Completed'}
                      </span>
                    </div>
                    <Badge tone={manufacturingOrderStatusTone(order.status)}>
                      {normalizeProductionStatus(order.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Planner route"
            description="Once created, the planner continues the flow from the Manufacturing Orders list and detail workspace."
          >
            <ButtonLink href="/manufacturing-orders">Open Manufacturing Orders</ButtonLink>
          </Panel>
        </div>
      </div>
    </div>
  );
}
