'use client';

import Link from 'next/link';

import { PageShell } from '../../components/ui/page-templates';
import { Panel, StatCard, StatGrid } from '../../components/ui/primitives';

export default function StockLandingPage(): JSX.Element {
  return (
    <PageShell
      eyebrow="Inventory"
      title="Stock Workspace"
      description="Lean stock navigation centered on item summaries, lots, movements, and shortage review."
      actions={
        <Link className="button button--secondary" href="/stock/items">
          Open stock items
        </Link>
      }
    >
      <StatGrid>
        <StatCard label="Items" value={<Link href="/stock/items">Open item list</Link>} />
        <StatCard label="Lots" value={<Link href="/stock/lots">Open lot list</Link>} />
        <StatCard label="Movements" value={<Link href="/stock/movements">Open movement ledger</Link>} />
        <StatCard label="Critical" value={<Link href="/stock/critical-on-hand">Review shortages</Link>} />
      </StatGrid>

      <Panel
        title="Workflow focus"
        description="Use the item list to review stock positions, then move into lots or movement history when you need traceability."
      >
        <p>
          The MVP keeps one stock location, lot-first receiving and picking, and a light shortage
          review for office and planner users.
        </p>
      </Panel>
    </PageShell>
  );
}
