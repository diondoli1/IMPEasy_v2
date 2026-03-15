import React from 'react';
import type { ReactNode } from 'react';

import { DataTable, EmptyState, Panel, StatCard, StatGrid, Toolbar } from './primitives';
import type { DataTableProps, StatCardProps } from './primitives';

export type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  leadingActions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export type DashboardTemplateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  cards: StatCardProps[];
  children?: ReactNode;
};

export type ListTemplateProps<Row> = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  tableTitle: string;
  tableDescription: string;
  table: DataTableProps<Row>;
  aside?: ReactNode;
};

export type SettingsTemplateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  form: ReactNode;
  aside?: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  leadingActions,
  actions,
  children,
}: PageShellProps): JSX.Element {
  return (
    <div className="page-shell">
      <header className="page-shell__header">
        {leadingActions ? <div className="page-shell__leading">{leadingActions}</div> : null}
        <div className="page-shell__title-block">
          <div className="page-shell__eyebrow">{eyebrow}</div>
          <h1 className="page-shell__title">{title}</h1>
          <p className="page-shell__description">{description}</p>
        </div>
        {actions ? <div className="page-shell__actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function DashboardTemplate({
  eyebrow,
  title,
  description,
  actions,
  cards,
  children,
}: DashboardTemplateProps): JSX.Element {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description} actions={actions}>
      <StatGrid>
        {cards.map((card) => (
          <StatCard
            key={`${card.label}-${String(card.value)}`}
            label={card.label}
            value={card.value}
            hint={card.hint}
            href={card.href}
          />
        ))}
      </StatGrid>
      {children ?? (
        <Panel
          title="No exceptions"
          description="Module issues and escalations will surface here as future slices connect live data."
        >
          <EmptyState
            title="Dashboard shell is ready"
            description="Use this page to verify card density, quick-link affordances, and panel spacing before slice-specific reporting is connected."
          />
        </Panel>
      )}
    </PageShell>
  );
}

export function ListTemplate<Row>({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  tableTitle,
  tableDescription,
  table,
  aside,
}: ListTemplateProps<Row>): JSX.Element {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description} actions={actions}>
      <div className={aside ? 'split-grid' : 'page-stack'}>
        <Panel title={tableTitle} description={tableDescription}>
          {toolbar ? <Toolbar>{toolbar}</Toolbar> : null}
          <DataTable {...table} />
        </Panel>
        {aside ? <div className="page-stack">{aside}</div> : null}
      </div>
    </PageShell>
  );
}

export function SettingsTemplate({
  eyebrow,
  title,
  description,
  actions,
  form,
  aside,
}: SettingsTemplateProps): JSX.Element {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description} actions={actions}>
      <div className={aside ? 'split-grid' : 'page-stack'}>
        <Panel title={title} description={description}>
          {form}
        </Panel>
        {aside ? <div className="page-stack">{aside}</div> : null}
      </div>
    </PageShell>
  );
}
