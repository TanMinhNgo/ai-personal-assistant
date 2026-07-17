import { AppShell } from '@/components/DashboardShell';
import { BriefingDetails } from '@/components/BriefingDetails';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Briefing details">
      <BriefingDetails id={id} />
    </AppShell>
  );
}
