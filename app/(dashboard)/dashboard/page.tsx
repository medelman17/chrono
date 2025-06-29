import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to cases page as the default dashboard view
  redirect('/dashboard/cases');
}