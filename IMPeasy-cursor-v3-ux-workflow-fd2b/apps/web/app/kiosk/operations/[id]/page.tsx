'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { KioskOperationScreen } from '../../../../components/kiosk-operation-screen';
import { Notice } from '../../../../components/ui/primitives';
import {
  completeOperation,
  getCurrentUser,
  getOperation,
  pauseOperation,
  startOperation,
} from '../../../../lib/api';
import type { AuthUser } from '../../../../types/auth';
import type { OperationDetail, OperationCompletionInput } from '../../../../types/operation';

export default function KioskOperationPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [user, operationData] = await Promise.all([getCurrentUser(), getOperation(id)]);
        setCurrentUser(user);
        setOperation(operationData);
      } catch {
        setError('Unable to load the kiosk operation.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading kiosk operation...</p>;
  }

  if (error || !operation || !currentUser) {
    return <p role="alert">{error ?? 'Unable to load the kiosk operation.'}</p>;
  }

  const isAdmin = currentUser.roles.includes('admin');
  const canAccessOperation =
    isAdmin ||
    operation.assignedOperatorId === null ||
    operation.assignedOperatorId === currentUser.id;

  if (!canAccessOperation) {
    return (
      <Notice title="Access blocked" tone="warning">
        This operation is assigned to a different operator. Return to the kiosk queue and open one
        of your own assigned operations.
      </Notice>
    );
  }

  return (
    <KioskOperationScreen
      operation={operation}
      onStart={async () => {
        const updated = await startOperation(operation.id);
        setOperation(updated);
      }}
      onPause={async () => {
        const updated = await pauseOperation(operation.id);
        setOperation(updated);
      }}
      onComplete={async (input: OperationCompletionInput) => {
        const updated = await completeOperation(operation.id, input);
        setOperation(updated);
      }}
    />
  );
}
