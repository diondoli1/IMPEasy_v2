import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';

function trimStringValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function normalizeOptionalString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeOptionalNullableString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function TrimRequiredString(): PropertyDecorator {
  return Transform(({ value }) => trimStringValue(value));
}

export function TrimOptionalString(): PropertyDecorator {
  return Transform(({ value }) => normalizeOptionalString(value));
}

export function TrimOptionalNullableString(): PropertyDecorator {
  return Transform(({ value }) => normalizeOptionalNullableString(value));
}

export function ValidateWhenPresent(): PropertyDecorator {
  return ValidateIf((_, value: unknown) => value !== undefined && value !== null);
}
