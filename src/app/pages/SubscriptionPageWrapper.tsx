import { ProtectedRoute } from '../components/ProtectedRoute';
import { SubscriptionPage } from './SubscriptionPage';

export function SubscriptionPageWrapper() {
  return (
    <ProtectedRoute>
      <SubscriptionPage />
    </ProtectedRoute>
  );
}
