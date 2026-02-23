import { ProtectedRoute } from '../components/ProtectedRoute';
import { ItemsPage } from './ItemsPage';

export function ItemsPageWrapper() {
  return (
    <ProtectedRoute>
      <ItemsPage />
    </ProtectedRoute>
  );
}
