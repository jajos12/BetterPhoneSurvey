import { getDashboardStats } from '@/lib/admin-stats';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

export const revalidate = 0;

export default async function AdminPage() {
    // Default to parent view for initial load
    const stats = await getDashboardStats('parent');
    return <DashboardClient initialStats={stats} />;
}

