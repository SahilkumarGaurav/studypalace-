import { listCoupons } from '@/lib/repo';
import CouponManager from '@/components/admin/CouponManager';

export const dynamic = 'force-dynamic';

export default function AdminCouponsPage() {
  return <CouponManager coupons={listCoupons() as never} />;
}
