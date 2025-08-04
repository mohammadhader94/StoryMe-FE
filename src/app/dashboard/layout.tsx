import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automata Control Center - Dashboard',
  description: 'Manage your automations.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You can add common dashboard layout elements here later (e.g., sidebar, header)
  return <>{children}</>;
}
