'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { DashboardTemplate } from '../../../components/ui/page-templates';
import { EmptyState, Notice, Panel } from '../../../components/ui/primitives';
import { getCustomerOrdersDashboard } from '../../../lib/api';
import type { ModuleDashboardCard } from '../../../types/dashboard';

export default function CustomerOrdersDashboardPage(): JSX.Element {
  const [cards, setCards] = useState<ModuleDashboardCard[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const dashboard = await getCustomerOrdersDashboard();
        if (!isCancelled) {
          setCards(dashboard.cards);
          setGeneratedAt(dashboard.generatedAt);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load customer orders dashboard.');
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
    return <p>Loading customer orders dashboard...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <DashboardTemplate
      eyebrow="Dashboards"
      title="Customer orders dashboard"
      description="Compact workflow-status dashboard for admin and office users."
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
          <Panel title="Quick links" description="Primary commercial entry points.">
            <div className="link-list">
              <Link href="/customer-orders" className="link-list__item">
                <span>Customer orders board</span>
                <span className="muted-copy">Open</span>
              </Link>
              <Link href="/sales-orders" className="link-list__item">
                <span>Sales orders list</span>
                <span className="muted-copy">Open</span>
              </Link>
            </div>
          </Panel>
          <Panel title="Escalations" description="Operational exceptions for commercial users.">
            <EmptyState
              title="No escalations detected"
              description="Blocked conversions and overdue commercial actions can surface here."
            />
          </Panel>
        </div>
      </div>
    </DashboardTemplate>
  );
}
