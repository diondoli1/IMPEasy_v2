import { redirect } from 'next/navigation';

export default function CrmPage(): never {
  redirect('/customer-orders');
}
