import { ProtectedRoute } from '../components/ProtectedRoute';
import { WelcomePage } from './WelcomePage';

export function WelcomePageWrapper() {
  return (
    <ProtectedRoute>
      <WelcomePage />
    </ProtectedRoute>
  );
}
