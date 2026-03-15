import { redirect } from 'next/navigation';

export default function SalesOrdersRedirectPage(): never {
  redirect('/customer-orders');
}
