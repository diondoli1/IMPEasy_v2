'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { DashboardTemplate } from '../../../components/ui/page-templates';
import { EmptyState, Notice, Panel } from '../../../components/ui/primitives';
import { getProductionDashboard } from '../../../lib/api';
import type { ModuleDashboardCard } from '../../../types/dashboard';

export default function ProductionDashboardPage(): JSX.Element {
  const [cards, setCards] = useState<ModuleDashboardCard[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const dashboard = await getProductionDashboard();
        if (!isCancelled) {
          setCards(dashboard.cards);
          setGeneratedAt(dashboard.generatedAt);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load production dashboard.');
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
    return <p>Loading production dashboard...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <DashboardTemplate
      eyebrow="Dashboards"
      title="Production dashboard"
      description="Compact planner dashboard with workflow cards first."
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
          <Panel title="Quick links" description="Main planner and floor routes.">
            <div className="link-list">
              <Link href="/manufacturing-orders" className="link-list__item">
                <span>Manufacturing orders</span>
                <span className="muted-copy">Planner queue</span>
              </Link>
              <Link href="/kiosk" className="link-list__item">
                <span>Operator kiosk</span>
                <span className="muted-copy">Floor view</span>
              </Link>
            </div>
          </Panel>
          <Panel title="Production exceptions" description="Shared panel for blocked operations.">
            <EmptyState
              title="No blocked operations"
              description="Overdue releases and missing booking alerts can surface here."
            />
          </Panel>
        </div>
      </div>
    </DashboardTemplate>
  );
}
