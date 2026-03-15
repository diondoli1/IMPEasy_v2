export type ProductionTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function normalizeProductionStatus(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return value.replace(/_/g, ' ');
}

export function formatProductionDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatProductionDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function itemTypeTone(value: string): ProductionTone {
  if (value === 'produced') {
    return 'info';
  }

  if (value === 'procured') {
    return 'warning';
  }

  return 'neutral';
}

export function manufacturingOrderStatusTone(value: string): ProductionTone {
  if (value === 'planned') {
    return 'neutral';
  }

  if (value === 'released') {
    return 'info';
  }

  if (value === 'in_progress') {
    return 'success';
  }

  if (value === 'completed') {
    return 'success';
  }

  return 'warning';
}

export function operationStatusTone(value: string): ProductionTone {
  if (value === 'queued') {
    return 'neutral';
  }

  if (value === 'ready') {
    return 'info';
  }

  if (value === 'running') {
    return 'success';
  }

  if (value === 'paused') {
    return 'warning';
  }

  if (value === 'completed') {
    return 'neutral';
  }

  return 'warning';
}

export function releaseStateTone(value: string): ProductionTone {
  return value === 'released' ? 'success' : 'warning';
}

export function bookingCompletenessTone(value: number): ProductionTone {
  if (value >= 100) {
    return 'success';
  }

  if (value > 0) {
    return 'warning';
  }

  return 'danger';
}

export function booleanTone(value: boolean): ProductionTone {
  return value ? 'success' : 'warning';
}

export function startOfWeek(anchor: Date): Date {
  const date = new Date(anchor);
  const day = date.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + delta);
  return date;
}

export function addDays(anchor: Date, days: number): Date {
  const date = new Date(anchor);
  date.setDate(date.getDate() + days);
  return date;
}

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
