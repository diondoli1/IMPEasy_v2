import Link from 'next/link';
import React from 'react';
import type { ReactNode } from 'react';

type ClassValue = string | false | null | undefined;

function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type ButtonLinkProps = {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
};

export type ButtonProps = {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  tone?: ButtonTone;
  disabled?: boolean;
  onClick?: () => void;
};

export type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export type PanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  muted?: boolean;
  compactHeader?: boolean;
};

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type NoticeProps = {
  title: string;
  children: ReactNode;
  tone?: 'default' | 'warning';
};

export type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export type TableColumn<Row> = {
  header: string;
  cell: (row: Row) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
};

export type DataTableProps<Row> = {
  caption?: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyState?: ReactNode;
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
};

export type DialogFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function ButtonLink({ children, href, tone = 'secondary' }: ButtonLinkProps): JSX.Element {
  return (
    <Link href={href} className={cx('button', `button--${tone}`)}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  type = 'button',
  tone = 'secondary',
  disabled,
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx('button', `button--${tone}`)}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: BadgeProps): JSX.Element {
  return <span className={cx('badge', `badge--${tone}`)}>{children}</span>;
}

export function BadgeRow({ children }: { children: ReactNode }): JSX.Element {
  return <div className="badge-row">{children}</div>;
}

export function Panel({
  title,
  description,
  actions,
  children,
  muted = false,
  compactHeader = false,
}: PanelProps): JSX.Element {
  const hasHeader = title || description || actions;

  return (
    <section className={cx('panel', muted && 'panel--muted')}>
      {hasHeader ? (
        <header className={cx('panel__header', compactHeader && 'panel__header--compact')}>
          <div className="panel__title-block">
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {description ? <p className="panel__description">{description}</p> : null}
          </div>
          {actions ? <div className="panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }): JSX.Element {
  return <div className="toolbar">{children}</div>;
}

export function ToolbarGroup({ children }: { children: ReactNode }): JSX.Element {
  return <div className="toolbar__group">{children}</div>;
}

export function Notice({ title, children, tone = 'default' }: NoticeProps): JSX.Element {
  return (
    <div className={cx('notice', tone === 'warning' && 'notice--warning')}>
      <div className="notice__title">{title}</div>
      <div className="notice__copy">{children}</div>
    </div>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state">
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {action}
    </div>
  );
}

export function FormGrid({
  children,
  columns = 1,
}: {
  children: ReactNode;
  columns?: 1 | 2;
}): JSX.Element {
  return <div className={cx('form-grid', columns === 2 && 'form-grid--two')}>{children}</div>;
}

export function Field({ label, hint, children }: FieldProps): JSX.Element {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </label>
  );
}

export function StatGrid({ children }: { children: ReactNode }): JSX.Element {
  return <div className="stat-grid">{children}</div>;
}

export function StatCard({ label, value, hint, href }: StatCardProps): JSX.Element {
  const content = (
    <>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {hint ? <div className="stat-card__hint">{hint}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card">
        {content}
      </Link>
    );
  }

  return <div className="stat-card">{content}</div>;
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyState,
}: DataTableProps<Row>): JSX.Element {
  return (
    <div className="dense-table-wrap">
      <table className="dense-table">
        {caption ? <caption className="dense-table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} style={column.width ? { width: column.width } : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cx(
                      column.align === 'right' && 'dense-table__cell--right',
                      column.align === 'center' && 'dense-table__cell--center',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                {emptyState ?? (
                  <EmptyState
                    title="Nothing here yet"
                    description="No rows are available in this view."
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DialogFrame({
  title,
  description,
  children,
  footer,
}: DialogFrameProps): JSX.Element {
  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="dialog__header">
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        <p className="dialog__description">{description}</p>
      </header>
      <div className="dialog__body">{children}</div>
      <div className="dialog__footer">{footer}</div>
    </div>
  );
}
