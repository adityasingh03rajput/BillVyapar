import { ProtectedRoute } from '../components/ProtectedRoute';
import { PartyLedgerPage } from './PartyLedgerPage';

export function PartyLedgerPageWrapper() {
  return (
    <ProtectedRoute>
      <PartyLedgerPage />
    </ProtectedRoute>
  );
}
