import { Suspense, lazy, useEffect, useState } from 'react';
import React from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { useIsNative } from './hooks/useIsNative';
import { AuthPage } from './pages/AuthPage';

// Lazy-load all heavy pages — they'll be split into separate chunks
const WelcomePageWrapper        = lazy(() => import('./pages/WelcomePageWrapper').then(m => ({ default: m.WelcomePageWrapper })));
const ProfilesPageWrapper       = lazy(() => import('./pages/ProfilesPageWrapper').then(m => ({ default: m.ProfilesPageWrapper })));
const DashboardPageWrapper      = lazy(() => import('./pages/DashboardPageWrapper').then(m => ({ default: m.DashboardPageWrapper })));
const DocumentsPageWrapper      = lazy(() => import('./pages/DocumentsPageWrapper').then(m => ({ default: m.DocumentsPageWrapper })));
const CreateDocumentPageWrapper = lazy(() => import('./pages/CreateDocumentPageWrapper').then(m => ({ default: m.CreateDocumentPageWrapper })));
const CustomersPageWrapper      = lazy(() => import('./pages/CustomersPageWrapper').then(m => ({ default: m.CustomersPageWrapper })));
const SuppliersPageWrapper      = lazy(() => import('./pages/SuppliersPageWrapper').then(m => ({ default: m.SuppliersPageWrapper })));
const ItemsPageWrapper          = lazy(() => import('./pages/ItemsPageWrapper').then(m => ({ default: m.ItemsPageWrapper })));
const AnalyticsPageWrapper      = lazy(() => import('./pages/AnalyticsPageWrapper').then(m => ({ default: m.AnalyticsPageWrapper })));
const SubscriptionPageWrapper   = lazy(() => import('./pages/SubscriptionPageWrapper').then(m => ({ default: m.SubscriptionPageWrapper })));
const GstReportsPage            = lazy(() => import('./pages/GstReportsPage').then(m => ({ default: m.GstReportsPage })));
const PartyLedgerPageWrapper    = lazy(() => import('./pages/PartyLedgerPageWrapper').then(m => ({ default: m.PartyLedgerPageWrapper })));
const BankAccountsPageWrapper   = lazy(() => import('./pages/BankAccountsPageWrapper').then(m => ({ default: m.BankAccountsPageWrapper })));
const PosPageWrapper            = lazy(() => import('./pages/PosPageWrapper').then(m => ({ default: m.PosPageWrapper })));
const ExtraExpensesPageWrapper  = lazy(() => import('./pages/ExtraExpensesPageWrapper').then(m => ({ default: m.ExtraExpensesPageWrapper })));
const VyaparKhataPageWrapper    = lazy(() => import('./pages/VyaparKhataPageWrapper').then(m => ({ default: m.VyaparKhataPageWrapper })));
const VyaparKhataPageNewWrapper = lazy(() => import('./pages/VyaparKhataPageNewWrapper').then(m => ({ default: m.VyaparKhataPageNewWrapper })));

/** Minimal skeleton shown while a lazy page chunk is loading */
function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

/** Wraps page content with a fade+slide-up animation on route change (web only) */
function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isNative = useIsNative();
  const [key, setKey] = useState(location.pathname);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // On native Android, MobileLayout handles its own skeleton transition — skip the opacity flash
    if (isNative) {
      setKey(location.pathname);
      return;
    }
    setVisible(false);
    const t = setTimeout(() => {
      setKey(location.pathname);
      setVisible(true);
    }, 60); // brief pause lets old page fade out
    return () => clearTimeout(t);
  }, [location.pathname, isNative]);

  return (
    <div
      key={key}
      className="page-enter"
      style={!isNative ? { opacity: visible ? undefined : 0, transition: 'opacity 0.06s ease' } : undefined}
    >
      {children}
    </div>
  );
}

function wrap(Component: React.ComponentType) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <AnimatedPage>
          <Component />
        </AnimatedPage>
      </Suspense>
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  { path: "/",                    element: <AuthPage /> },
  { path: "/profiles",            element: wrap(ProfilesPageWrapper) },
  { path: "/welcome",             element: wrap(WelcomePageWrapper) },
  { path: "/dashboard",           element: wrap(DashboardPageWrapper) },
  { path: "/documents",           element: wrap(DocumentsPageWrapper) },
  { path: "/documents/create",    element: wrap(CreateDocumentPageWrapper) },
  { path: "/documents/edit/:id",  element: wrap(CreateDocumentPageWrapper) },
  { path: "/customers",           element: wrap(CustomersPageWrapper) },
  { path: "/suppliers",           element: wrap(SuppliersPageWrapper) },
  { path: "/items",               element: wrap(ItemsPageWrapper) },
  { path: "/analytics",           element: wrap(AnalyticsPageWrapper) },
  { path: "/reports/gst",         element: wrap(GstReportsPage) },
  { path: "/ledger",              element: wrap(PartyLedgerPageWrapper) },
  { path: "/subscription",        element: wrap(SubscriptionPageWrapper) },
  { path: "/bank-accounts",       element: wrap(BankAccountsPageWrapper) },
  { path: "/pos",                 element: wrap(PosPageWrapper) },
  { path: "/extra-expenses",      element: wrap(ExtraExpensesPageWrapper) },
  { path: "/vyapar-khata",        element: wrap(VyaparKhataPageWrapper) },
  { path: "/vyapar-khata-new",    element: wrap(VyaparKhataPageNewWrapper) },
]);

function AppInner() {
  const isNative = useIsNative();
  return (
    <>
      {/* Only show the offline banner on web — mobile has its own indicator in MobileLayout */}
      {!isNative && <OfflineBanner />}
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
