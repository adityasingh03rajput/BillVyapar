/**
 * usePrefetch — preloads a lazy route chunk when the user hovers/focuses a nav link.
 * This means by the time they click, the JS chunk is already in the browser cache.
 *
 * Usage:
 *   const prefetch = usePrefetch();
 *   <button onMouseEnter={() => prefetch('/documents')} onClick={...}>
 */

// Map route paths to their lazy import functions
const ROUTE_PREFETCH_MAP: Record<string, () => Promise<any>> = {
  '/dashboard':        () => import('../pages/DashboardPageWrapper'),
  '/documents':        () => import('../pages/DocumentsPageWrapper'),
  '/documents/create': () => import('../pages/CreateDocumentPageWrapper'),
  '/customers':        () => import('../pages/CustomersPageWrapper'),
  '/suppliers':        () => import('../pages/SuppliersPageWrapper'),
  '/items':            () => import('../pages/ItemsPageWrapper'),
  '/analytics':        () => import('../pages/AnalyticsPageWrapper'),
  '/reports/gst':      () => import('../pages/GstReportsPage'),
  '/ledger':           () => import('../pages/PartyLedgerPageWrapper'),
  '/subscription':     () => import('../pages/SubscriptionPageWrapper'),
  '/bank-accounts':    () => import('../pages/BankAccountsPageWrapper'),
  '/pos':              () => import('../pages/PosPageWrapper'),
  '/extra-expenses':   () => import('../pages/ExtraExpensesPageWrapper'),
  '/profiles':         () => import('../pages/ProfilesPageWrapper'),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = ROUTE_PREFETCH_MAP[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire and forget — browser will cache the chunk
  loader().catch(() => {});
}

export function usePrefetch() {
  return prefetchRoute;
}

/**
 * Prefetch a set of routes during browser idle time.
 * Call this after a page has finished its own data loading.
 * On Android WebView requestIdleCallback is available from API 47+.
 */
export function prefetchRoutesOnIdle(paths: string[]) {
  const run = () => paths.forEach(prefetchRoute);
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1000);
  }
}
