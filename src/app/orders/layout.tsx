import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders - Automata Control Center',
  description: 'View and manage your orders.',
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You can add common layout elements for all order-related pages here later
  // e.g., Breadcrumbs, common actions
  return <>{children}</>;
}
