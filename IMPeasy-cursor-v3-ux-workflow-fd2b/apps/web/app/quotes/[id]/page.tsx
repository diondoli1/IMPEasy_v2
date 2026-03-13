import { redirect } from 'next/navigation';

export default async function QuoteDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<never> {
  const resolvedParams = await params;
  redirect(`/customer-orders/quote-${resolvedParams.id}`);
}
