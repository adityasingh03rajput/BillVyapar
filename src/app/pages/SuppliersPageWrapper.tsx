import { ProtectedRoute } from '../components/ProtectedRoute';
import { SuppliersPage } from './SuppliersPage';

export function SuppliersPageWrapper() {
  return (
    <ProtectedRoute>
      <SuppliersPage />
    </ProtectedRoute>
  );
}
