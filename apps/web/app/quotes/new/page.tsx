import { redirect } from 'next/navigation';

export default function NewQuoteRedirectPage(): never {
  redirect('/customer-orders/new');
}
