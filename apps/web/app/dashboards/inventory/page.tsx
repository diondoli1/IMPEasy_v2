'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { DashboardTemplate } from '../../../components/ui/page-templates';
import { EmptyState, Notice, Panel } from '../../../components/ui/primitives';
import { getInventoryDashboard } from '../../../lib/api';
import type { ModuleDashboardCard } from '../../../types/dashboard';

export default function InventoryDashboardPage(): JSX.Element {
  const [cards, setCards] = useState<ModuleDashboardCard[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const dashboard = await getInventoryDashboard();
        if (!isCancelled) {
          setCards(dashboard.cards);
          setGeneratedAt(dashboard.generatedAt);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load inventory dashboard.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p>Loading inventory dashboard...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <DashboardTemplate
      eyebrow="Dashboards"
      title="Inventory dashboard"
      description="Compact lot-aware inventory summary with workflow-first cards."
      cards={cards.map((card) => ({
        label: card.label,
        value: card.value,
        hint: card.hint,
        href: card.href ?? undefined,
      }))}
    >
      <div className="page-stack">
        {generatedAt ? (
          <Notice title="Data freshness">
            Generated at {new Date(generatedAt).toLocaleString('de-DE')}.
          </Notice>
        ) : null}
        <div className="split-grid">
          <Panel title="Quick links" description="Inventory and stock entry points.">
            <div className="link-list">
              <Link href="/stock/items" className="link-list__item">
                <span>Stock items</span>
                <span className="muted-copy">Open</span>
              </Link>
              <Link href="/stock/lots" className="link-list__item">
                <span>Stock lots</span>
                <span className="muted-copy">Open</span>
              </Link>
            </div>
          </Panel>
          <Panel title="Inventory exceptions" description="Shared panel for stock alerts.">
            <EmptyState
              title="No highlighted stock issues"
              description="Critical shortages and blocked lots can surface here."
            />
          </Panel>
        </div>
      </div>
    </DashboardTemplate>
  );
}
