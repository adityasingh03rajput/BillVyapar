/**
 * MobileLayout — refined Android portrait shell.
 *
 * Layout:
 *   ┌──────────────────────────────┐  ← safe-area top
 *   │  Top bar                     │  56px  gradient header
 *   ├──────────────────────────────┤
 *   │  [subscription banner]       │  conditional
 *   │  Page content (scrollable)   │  flex-1
 *   ├──────────────────────────────┤
 *   │  Bottom tab bar              │  60px + safe-area bottom
 *   └──────────────────────────────┘
 *
 * FAB floats above the tab bar.
 * "More" slides up as a bottom sheet with CSS transition.
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

/** Returns true for ~120ms after every route change — used to fade content in */
function usePageTransition() {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const prev = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname === prev.current) return;
    prev.current = location.pathname;
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 120);
    return () => clearTimeout(t);
  }, [location.pathname]);
  return transitioning;
}import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  MoreHorizontal,
  Plus,
  Package,
  Receipt,
  CreditCard,
  Landmark,
  LogOut,
  X,
  AlertCircle,
  ShoppingCart,
  Truck,
  ChevronRight,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { TraceLoader } from './TraceLoader';
import { prefetchRoute } from '../hooks/usePrefetch';

interface MobileLayoutProps {
  children: ReactNode;
  subscriptionWarning: string | null;
  subscriptionExpired: boolean;
  daysRemaining: number | null;
  profileGateChecked: boolean;
}

const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home',     path: '/dashboard' },
  { icon: FileText,        label: 'Docs',     path: '/documents' },
  { icon: Users,           label: 'Parties',  path: '/customers', matchPrefixes: ['/customers', '/suppliers'] },
  { icon: BarChart3,       label: 'Reports',  path: '/analytics' },
  { icon: MoreHorizontal,  label: 'More',     path: '__more__' },
] as const;

const MORE_ITEMS = [
  { icon: Package,   label: 'Items',         path: '/items' },
  { icon: Receipt,   label: 'GST Reports',   path: '/reports/gst' },
  { icon: CreditCard,label: 'Ledger',        path: '/ledger' },
  { icon: Landmark,  label: 'Bank Accounts', path: '/bank-accounts' },
  { icon: ShoppingCart, label: 'POS',        path: '/pos' },
  { icon: Truck,     label: 'Expenses',      path: '/extra-expenses' },
  { icon: CreditCard,label: 'Subscription',  path: '/subscription' },
];

const SALES_TYPES = [
  { label: 'Sale Invoice',    type: 'invoice',               icon: '🧾' },
  { label: 'Quotation',       type: 'quotation',             icon: '📋' },
  { label: 'Proforma',        type: 'proforma',              icon: '📄' },
  { label: 'Sale Order',      type: 'order',                 icon: '📦' },
  { label: 'Challan',         type: 'challan',               icon: '🚚' },
  { label: 'Sale Return',     type: 'invoice_cancellation',  icon: '↩️' },
];

function readProfile() {
  try {
    const raw = localStorage.getItem('currentProfile');
    if (!raw) return {} as any;
    const p = JSON.parse(raw);
    return typeof p === 'string' ? JSON.parse(p) : p || {};
  } catch { return {}; }
}

function initials(name: string) {
  return String(name || 'P')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((s) => s[0]).join('').toUpperCase();
}

/** Tiny hook — true when navigator.onLine is false */
function useOffline() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return offline;
}

export function MobileLayout({
  children,
  subscriptionWarning,
  subscriptionExpired,
  daysRemaining,
  profileGateChecked,
}: MobileLayoutProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { signOut } = useAuth();
  const offline   = useOffline();
  const transitioning = usePageTransition();

  const [moreOpen, setMoreOpen]   = useState(false);
  const [fabOpen,  setFabOpen]    = useState(false);
  const [moreMounted, setMoreMounted] = useState(false); // for CSS transition
  const fabRef = useRef<HTMLDivElement>(null);

  const profile = readProfile();
  const ini     = initials(profile?.businessName);

  // Mount → next tick → add 'open' class for slide-up transition
  useEffect(() => {
    if (moreOpen) {
      setMoreMounted(true);
    }
  }, [moreOpen]);

  // Close FAB when tapping outside
  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fabOpen]);

  const isTabActive = (tab: (typeof PRIMARY_TABS)[number]) => {
    if (tab.path === '__more__')
      return MORE_ITEMS.some((m) => location.pathname.startsWith(m.path));
    if ('matchPrefixes' in tab)
      return (tab.matchPrefixes as readonly string[]).some((p) => location.pathname.startsWith(p));
    return location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
  };

  const goTo = (path: string) => {
    setMoreOpen(false);
    setFabOpen(false);
    navigate(path);
  };

  const closeMore = () => {
    setMoreOpen(false);
    setTimeout(() => setMoreMounted(false), 300);
  };

  // Hide FAB on document create/edit pages — it would cover form fields
  const hideFab = location.pathname.startsWith('/documents/create') ||
                  location.pathname.startsWith('/documents/edit');

  return (
    // fixed inset-0 escapes the parent flex container in AppLayout
    <div className="fixed inset-0 flex flex-col overflow-hidden z-0" style={{ background: 'var(--mobile-bg, #f0f7f0)' }}>

      {/* ── Top bar ── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 bg-gradient-to-r from-blue-600 to-blue-500"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          paddingBottom: '10px',
          minHeight: '56px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">BillVyapar</span>
        </div>

        {/* Right side: offline indicator + avatar */}
        <div className="flex items-center gap-2">
          {offline && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
              <WifiOff className="h-3 w-3 text-white" />
              <span className="text-white text-[10px] font-medium">Offline</span>
            </div>
          )}
          {!offline && (
            <div className="h-2 w-2 rounded-full bg-green-300" title="Online" />
          )}
          <button
            type="button"
            onClick={() => !subscriptionExpired && navigate('/profiles')}
            aria-label="Profile"
            className="h-9 w-9 rounded-full bg-white/25 border-2 border-white/40 text-white flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
          >
            {ini}
          </button>
        </div>
      </header>

      {/* ── Subscription warning banner ── */}
      {subscriptionWarning && (
        <div className="shrink-0 mx-3 mt-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 flex-1 leading-snug">{subscriptionWarning}</p>
          <button
            type="button"
            onClick={() => navigate('/subscription')}
            className="shrink-0 text-xs font-semibold text-amber-900 bg-amber-100 rounded-lg px-2 py-1"
          >
            Renew
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', background: 'var(--mobile-bg, #f0f7f0)' } as any}>
        {!profileGateChecked ? (
          <div className="flex items-center justify-center h-full">
            <TraceLoader label="Loading..." />
          </div>
        ) : transitioning ? (
          /* ── Page skeleton — shown for ~120ms on navigation to prevent green flash ── */
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-7 w-40 bg-white/60 rounded-xl" />
            <div className="h-4 w-56 bg-white/40 rounded-lg" />
            <div className="h-12 w-full bg-white/60 rounded-2xl mt-2" />
            <div className="bg-white/70 rounded-2xl p-4 space-y-3">
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/70 rounded-2xl p-4 space-y-2">
                <div className="flex gap-2">
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                </div>
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div
            key={location.pathname}
            style={{ animation: 'mobileFadeIn 0.15s ease-out' }}
          >
            {children}
          </div>
        )}
      </main>

      {/* ── FAB — hidden on create/edit pages so it doesn't cover form fields ── */}
      {!hideFab && (
      <div
        ref={fabRef}
        className="fixed right-4 z-40 flex flex-col items-end gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
      >
        {/* Speed-dial options */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 origin-bottom ${
            fabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
        >
          {SALES_TYPES.map((s) => (
            <button
              key={s.type}
              type="button"
              onClick={() => goTo(`/documents/create?type=${encodeURIComponent(s.type)}`)}
              className="flex items-center gap-2.5 bg-card border border-border rounded-2xl pl-3 pr-4 py-2.5 shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>

        {/* FAB button */}
        <button
          type="button"
          onClick={() => setFabOpen((v) => !v)}
          aria-label="Create document"
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
            fabOpen
              ? 'bg-slate-700 rotate-45'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>
      </div>
      )}

      {/* ── Bottom tab bar ── */}
      <nav
        className="shrink-0 bg-white border-t border-gray-200 flex items-stretch relative"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {PRIMARY_TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = isTabActive(tab);
          return (
            <button
              key={tab.path}
              type="button"
              onMouseEnter={() => tab.path !== '__more__' && prefetchRoute(tab.path)}
              onClick={() => tab.path === '__more__' ? setMoreOpen(true) : goTo(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:scale-90 transition-transform"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── "More" bottom sheet ── */}
      {(moreOpen || moreMounted) && (
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-all duration-300 ${
            moreOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div className="flex-1 bg-black/50 backdrop-blur-[2px]" onClick={closeMore} />

          {/* Sheet */}
          <div
            className={`bg-background rounded-t-3xl shadow-2xl transition-transform duration-300 ${
              moreOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Business card */}
            <div className="mx-4 mb-4 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-3.5">
              <div className="h-11 w-11 rounded-full bg-white/25 border-2 border-white/40 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {ini}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile.businessName || 'My Business'}
                </p>
                <p className="text-xs text-blue-100 truncate">{profile.ownerName || ''}</p>
              </div>
              <button
                type="button"
                onClick={closeMore}
                className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Secondary nav grid */}
            <div className="grid grid-cols-4 gap-2.5 px-4 pb-3">
              {MORE_ITEMS.map((item) => {
                const Icon   = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onClick={() => goTo(item.path)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 transition-all active:scale-90 ${
                      active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-[9px] font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider + sign out */}
            <div className="mx-4 mb-4 mt-1">
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-semibold">Sign Out</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscription expired bottom sheet ── */}
      {subscriptionExpired &&
        location.pathname !== '/subscription' &&
        location.pathname !== '/dashboard' &&
        location.pathname !== '/welcome' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
            <div
              className="w-full bg-card rounded-t-3xl p-6 shadow-2xl"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Subscription Expired</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Renew to continue using BillVyapar.
                  </p>
                  {typeof daysRemaining === 'number' && daysRemaining >= 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Days remaining: {daysRemaining}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-xl" onClick={() => navigate('/subscription')}>
                  Renew Now
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
