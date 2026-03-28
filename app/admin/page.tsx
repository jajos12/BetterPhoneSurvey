import { DEFAULT_ADMIN_SURVEY_VIEW } from '@/lib/admin-survey-utils';
import { getDashboardStats } from '@/lib/admin-stats';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

export const revalidate = 0;

export default async function AdminPage() {
    const stats = await getDashboardStats(DEFAULT_ADMIN_SURVEY_VIEW);
    return <DashboardClient initialStats={stats} />;
}

