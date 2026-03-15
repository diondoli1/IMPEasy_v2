'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { DashboardTemplate } from '../../../components/ui/page-templates';
import { EmptyState, Notice, Panel } from '../../../components/ui/primitives';
import { getPurchasingDashboard } from '../../../lib/api';
import type { ModuleDashboardCard } from '../../../types/dashboard';

export default function PurchasingDashboardPage(): JSX.Element {
  const [cards, setCards] = useState<ModuleDashboardCard[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const dashboard = await getPurchasingDashboard();
        if (!isCancelled) {
          setCards(dashboard.cards);
          setGeneratedAt(dashboard.generatedAt);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load purchasing dashboard.');
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
    return <p>Loading purchasing dashboard...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <DashboardTemplate
      eyebrow="Dashboards"
      title="Purchasing dashboard"
      description="Compact buyer dashboard with workflow cards first."
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
          <Panel title="Quick links" description="Primary purchasing entry points.">
            <div className="link-list">
              <Link href="/purchase-orders" className="link-list__item">
                <span>Purchase orders</span>
                <span className="muted-copy">Open</span>
              </Link>
              <Link href="/suppliers" className="link-list__item">
                <span>Suppliers</span>
                <span className="muted-copy">Open</span>
              </Link>
            </div>
          </Panel>
          <Panel title="Buyer exceptions" description="Shared panel for supplier issues.">
            <EmptyState
              title="No supplier escalations"
              description="Overdue confirmations and receipt blockers can surface here."
            />
          </Panel>
        </div>
      </div>
    </DashboardTemplate>
  );
}
