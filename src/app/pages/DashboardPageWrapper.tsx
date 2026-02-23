import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardPage } from './DashboardPage';

export function DashboardPageWrapper() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
