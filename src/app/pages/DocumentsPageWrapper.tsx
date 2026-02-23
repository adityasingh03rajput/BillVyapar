import { ProtectedRoute } from '../components/ProtectedRoute';
import { DocumentsPage } from './DocumentsPage';

export function DocumentsPageWrapper() {
  return (
    <ProtectedRoute>
      <DocumentsPage />
    </ProtectedRoute>
  );
}
