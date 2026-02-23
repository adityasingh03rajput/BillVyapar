import { ProtectedRoute } from '../components/ProtectedRoute';
import { CreateDocumentPage } from './CreateDocumentPage';

export function CreateDocumentPageWrapper() {
  return (
    <ProtectedRoute>
      <CreateDocumentPage />
    </ProtectedRoute>
  );
}
