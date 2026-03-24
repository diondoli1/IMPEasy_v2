import React from 'react';

import { DataTable, EmptyState, Panel } from './ui/primitives';
import type { SalesOrderAudit } from '../types/sales-order';

type SalesOrderAuditTrailProps = {
  entries: SalesOrderAudit[];
};

export function SalesOrderAuditTrail({ entries }: SalesOrderAuditTrailProps): JSX.Element {
  return (
    <Panel title="Audit trail">
      {entries.length === 0 ? (
        <EmptyState title="No audit entries found" description="Status transitions and edits will appear here." />
      ) : (
        <DataTable
          columns={[
            { header: 'Action', cell: (entry) => entry.action },
            { header: 'From Status', cell: (entry) => entry.fromStatus ?? '-' },
            { header: 'To Status', cell: (entry) => entry.toStatus },
            { header: 'Actor', cell: (entry) => entry.actor },
            { header: 'Created At', cell: (entry) => entry.createdAt },
          ]}
          rows={entries}
          getRowKey={(entry) => String(entry.id)}
        />
      )}
    </Panel>
  );
}
