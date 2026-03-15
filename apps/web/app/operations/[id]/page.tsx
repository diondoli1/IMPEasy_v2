'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OperationInspectionPanel } from '../../../components/operation-inspection-panel';
import { OperatorProductionScreen } from '../../../components/operator-production-screen';
import {
  completeOperation,
  createOperationInspection,
  createOperationInspectionRework,
  recordOperationInspectionScrap,
  createOperationProductionLog,
  getOperation,
  getOperationInspection,
  listOperationProductionLogs,
  pauseOperation,
  recordOperationInspectionResult,
  startOperation,
} from '../../../lib/api';
import type {
  Inspection,
  InspectionInput,
  InspectionResultInput,
  InspectionScrapInput,
} from '../../../types/inspection';
import type { OperationDetail, ProductionLog, ProductionLogInput } from '../../../types/operation';

export default function OperationDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [operationData, logsData, inspectionData] = await Promise.all([
          getOperation(id),
          listOperationProductionLogs(id),
          getOperationInspection(id),
        ]);
        setOperation(operationData);
        setProductionLogs(logsData);
        setInspection(inspectionData);
      } catch {
        setError('Operation not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading operation...</p>;
  }

  if (error || !operation) {
    return <p role="alert">{error ?? 'Operation not found.'}</p>;
  }

  const handleStart = async (): Promise<void> => {
    const updated = await startOperation(operation.id);
    setOperation(updated);
  };

  const handlePause = async (): Promise<void> => {
    const updated = await pauseOperation(operation.id);
    setOperation(updated);
  };

  const handleComplete = async (): Promise<void> => {
    const updated = await completeOperation(operation.id);
    setOperation(updated);
  };

  const handleCreateProductionLog = async (input: ProductionLogInput): Promise<void> => {
    const created = await createOperationProductionLog(operation.id, input);
    setProductionLogs((current) => [...current, created]);
  };

  const handleCreateInspection = async (input: InspectionInput): Promise<void> => {
    const created = await createOperationInspection(operation.id, input);
    setInspection(created);
  };

  const handleRecordInspectionResult = async (input: InspectionResultInput): Promise<void> => {
    const updated = await recordOperationInspectionResult(operation.id, input);
    setInspection(updated);
  };

  const handleCreateReworkOperation = async (): Promise<void> => {
    const updated = await createOperationInspectionRework(operation.id);
    setInspection(updated);
  };

  const handleRecordInspectionScrap = async (input: InspectionScrapInput): Promise<void> => {
    const updated = await recordOperationInspectionScrap(operation.id, input);
    setInspection(updated);
  };

  const producedQuantity = productionLogs.reduce((sum, log) => sum + log.quantity, 0);

  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <OperatorProductionScreen
        operation={operation}
        productionLogs={productionLogs}
        onStart={handleStart}
        onPause={handlePause}
        onComplete={handleComplete}
        onCreateProductionLog={handleCreateProductionLog}
      />
      <OperationInspectionPanel
        operation={operation}
        inspection={inspection}
        producedQuantity={producedQuantity}
        onCreateInspection={handleCreateInspection}
        onRecordInspectionResult={handleRecordInspectionResult}
        onCreateReworkOperation={handleCreateReworkOperation}
        onRecordInspectionScrap={handleRecordInspectionScrap}
      />
    </section>
  );
}
