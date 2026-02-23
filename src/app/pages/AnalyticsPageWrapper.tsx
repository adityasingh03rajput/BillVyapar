import { ProtectedRoute } from '../components/ProtectedRoute';
import { AnalyticsPage } from './AnalyticsPage';

export function AnalyticsPageWrapper() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
