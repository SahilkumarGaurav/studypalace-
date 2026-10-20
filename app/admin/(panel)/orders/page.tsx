import { listOrders } from '@/lib/repo';
import OrderManager from '@/components/admin/OrderManager';

export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  const { rows, total } = listOrders({ limit: 300 });
  return <OrderManager orders={rows as never} total={total} />;
}
