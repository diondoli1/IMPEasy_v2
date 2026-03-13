import { redirect } from 'next/navigation';

export default async function SalesOrderDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<never> {
  const resolvedParams = await params;
  redirect(`/customer-orders/sales-order-${resolvedParams.id}`);
}
