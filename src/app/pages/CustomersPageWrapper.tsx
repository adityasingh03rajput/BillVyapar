import { ProtectedRoute } from '../components/ProtectedRoute';
import { CustomersPage } from './CustomersPage';

export function CustomersPageWrapper() {
  return (
    <ProtectedRoute>
      <CustomersPage />
    </ProtectedRoute>
  );
}
