import { ProtectedRoute } from '../components/ProtectedRoute';
import { ProfilesPage } from './ProfilesPage';

export function ProfilesPageWrapper() {
  return (
    <ProtectedRoute>
      <ProfilesPage />
    </ProtectedRoute>
  );
}
