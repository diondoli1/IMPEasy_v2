import { redirect } from 'next/navigation';

export default function QuotesRedirectPage(): never {
  redirect('/customer-orders');
}
