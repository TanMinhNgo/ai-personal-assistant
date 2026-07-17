import { AppShell } from '@/components/DashboardShell';
import { AiAgentPage } from '@/components/AiAgentPage';

export default function Page() {
  return (
    <AppShell title="AI Agent">
      <AiAgentPage />
    </AppShell>
  );
}
