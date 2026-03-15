import React from 'react';

import type { SalesOrderAudit } from '../types/sales-order';

type SalesOrderAuditTrailProps = {
  entries: SalesOrderAudit[];
};

export function SalesOrderAuditTrail({ entries }: SalesOrderAuditTrailProps): JSX.Element {
  return (
    <section>
      <h2>Audit Trail</h2>
      {entries.length === 0 ? (
        <p>No audit entries found.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Action</th>
              <th align="left">From Status</th>
              <th align="left">To Status</th>
              <th align="left">Actor</th>
              <th align="left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{entry.fromStatus ?? '-'}</td>
                <td>{entry.toStatus}</td>
                <td>{entry.actor}</td>
                <td>{entry.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
