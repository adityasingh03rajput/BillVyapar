import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Users, UserCircle, Key, BarChart3, ScrollText,
  ShieldCheck, LogOut, ChevronRight, Bell, X, Command,
  AlertTriangle, Clock, Zap, Settings, Menu, Palette,
} from 'lucide-react';
import { ADMIN_API_URL as API_URL } from '../../config/api';
import { THEMES, DEFAULT_THEME_ID, getTheme, type AdminTheme } from './themes';

const NAV = [
  { group: 'Overview', items: [
    { path: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard, c: '#6366f1', bg: '#eef2ff' },
    { path: '/data',           label: 'Analytics',      icon: BarChart3,       c: '#0ea5e9', bg: '#e0f2fe' },
    { path: '/audit',          label: 'Audit Logs',     icon: ScrollText,      c: '#8b5cf6', bg: '#ede9fe' },
  ]},
  { group: 'Customers', items: [
    { path: '/subscribers',    label: 'Subscribers',    icon: Users,           c: '#10b981', bg: '#d1fae5' },
    { path: '/users',          label: 'All Users',      icon: UserCircle,      c: '#06b6d4', bg: '#cffafe' },
  ]},
  { group: 'Licensing', items: [
    { path: '/license-keys',   label: 'License Keys',   icon: Key,             c: '#f59e0b', bg: '#fef3c7' },
  ]},
  { group: 'Admin', items: [
    { path: '/admin-accounts', label: 'Admin Accounts', icon: ShieldCheck,     c: '#f43f5e', bg: '#ffe4e6' },
  ]},
];

const CMD_ITEMS = [
  { label: 'Dashboard',      action: '/dashboard',      icon: LayoutDashboard },
  { label: 'Analytics',      action: '/data',           icon: BarChart3 },
  { label: 'Audit Logs',     action: '/audit',          icon: ScrollText },
  { label: 'Subscribers',    action: '/subscribers',    icon: Users },
  { label: 'All Users',      action: '/users',          icon: UserCircle },
  { label: 'License Keys',   action: '/license-keys',   icon: Key },
  { label: 'Admin Accounts', action: '/admin-accounts', icon: ShieldCheck },
];

interface Props { children: React.ReactNode }

export function ConsoleLayout({ children }: Props) {
  const navigate = useNavigate();
  const loc      = useLocation();
  const [sideOpen, setSideOpen] = useState(true);
  const [cmd,  setCmd]  = useState(false);
  const [q,    setQ]    = useState('');
  const [qi,   setQi]   = useState(0);
  const [notif,  setNotif]  = useState(false);
  const [themePanel, setThemePanel] = useState(false);
  const [alerts, setAlerts] = useState({ e7: 0, e30: 0 });
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem('adminTheme') ?? DEFAULT_THEME_ID
  );
  const cmdRef = useRef<HTMLInputElement>(null);
  const admin  = JSON.parse(localStorage.getItem('masterAdmin') || '{}');

  const t: AdminTheme = getTheme(themeId);
  const isDark = themeId === 'midnight-dark';

  const applyTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem('adminTheme', id);
    setThemePanel(false);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmd(v => !v); }
      if (e.key === 'Escape') {
        setCmd(false); setNotif(false); setThemePanel(false);
        setSideOpen(prev => { if (window.innerWidth < 768) return false; return prev; });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { if (cmd) setTimeout(() => cmdRef.current?.focus(), 50); }, [cmd]);

  useEffect(() => {
    const tk = localStorage.getItem('masterAdminToken');
    if (!tk) { navigate('/'); return; }
    fetch(`${API_URL}/master-admin/dashboard/stats`, { headers: { Authorization: `Bearer ${tk}` } })
      .then(r => {
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('masterAdminToken');
          localStorage.removeItem('masterAdmin');
          navigate('/');
          return null;
        }
        return r.json();
      })
      .then(d => { if (d && !d.error) setAlerts({ e7: d.expiringIn7Days || 0, e30: d.expiringIn30Days || 0 }); })
      .catch(() => {});
  }, [loc.pathname]);

  useEffect(() => {
    if (window.innerWidth < 768) setSideOpen(false);
  }, [loc.pathname]);

  const logout = () => {
    localStorage.removeItem('masterAdminToken');
    localStorage.removeItem('masterAdmin');
    navigate('/');
  };

  const filtered    = CMD_ITEMS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
  const totalAlerts = alerts.e7 + alerts.e30;
  const current     = NAV.flatMap(g => g.items).find(i =>
    loc.pathname === i.path || (i.path !== '/dashboard' && loc.pathname.startsWith(i.path))
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: t.pageBg }}>

      {/* Backdrop (mobile) */}
      {sideOpen && (
        <div className="fixed inset-0 z-[30] md:hidden"
          style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSideOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className="flex-shrink-0 h-full z-[20] relative"
        style={{
          width: sideOpen ? 240 : 0, minWidth: 0, overflow: 'hidden',
          transition: 'width 280ms cubic-bezier(.4,0,.2,1)',
          background: t.sidebarBg,
          backdropFilter: 'blur(24px)',
          borderRight: sideOpen ? `1.5px solid ${t.sidebarBorder}` : 'none',
          boxShadow: sideOpen ? t.sidebarShadow : 'none',
        }}>
        <div className="flex flex-col h-full" style={{ width: 240 }}>

          {/* Brand */}
          <div className="flex items-center gap-3 h-16 px-4 flex-shrink-0"
            style={{ borderBottom: `1.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : `${t.accent}14`}` }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: t.brandGradient, boxShadow: t.brandShadow }}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-none tracking-tight" style={{ color: t.textPrimary }}>Bill Vyapar</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: t.accent }}>Admin Console</p>
            </div>
            <button onClick={() => setSideOpen(false)}
              className="p-1.5 rounded-xl transition-all flex-shrink-0"
              style={{ color: t.navGroupColor }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.accentLight; (e.currentTarget as HTMLElement).style.color = t.accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.navGroupColor; }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {NAV.map(g => (
              <div key={g.group}>
                <p className="px-2 mb-2 text-[9px] font-black tracking-widest uppercase" style={{ color: t.navGroupColor }}>{g.group}</p>
                <div className="space-y-0.5">
                  {g.items.map(item => {
                    const active = loc.pathname === item.path ||
                      (item.path !== '/dashboard' && loc.pathname.startsWith(item.path));
                    // In dark mode use accent-tinted active colors; otherwise use item colors
                    const activeBg   = isDark ? t.accentLight : item.bg;
                    const activeColor = isDark ? t.accent : item.c;
                    return (
                      <button key={item.path}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150"
                        style={{
                          background: active ? activeBg : 'transparent',
                          color: active ? activeColor : t.textSecondary,
                          border: active ? `1.5px solid ${activeColor}25` : '1.5px solid transparent',
                          boxShadow: active ? `0 4px 12px ${activeColor}18` : 'none',
                        }}
                        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = t.navHoverBg; (e.currentTarget as HTMLElement).style.color = t.navHoverColor; } }}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.textSecondary; } }}
                      >
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? `${activeColor}18` : 'transparent' }}>
                          <item.icon style={{ color: active ? activeColor : 'currentColor', width: 15, height: 15 }} />
                        </div>
                        <span className="flex-1 text-left">{item.label}</span>
                        {active && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: activeColor }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 px-3 py-3"
            style={{ borderTop: `1.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : `${t.accent}14`}` }}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mb-2"
              style={{ background: t.footerCardBg, border: `1.5px solid ${t.footerCardBorder}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: t.brandGradient, color: '#fff' }}>
                {(admin.name || admin.email || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{admin.name || admin.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-[10px] capitalize font-medium truncate" style={{ color: t.accent }}>{admin.role?.replace('_', ' ') || 'admin'}</p>
              </div>
              <Settings style={{ width: 13, height: 13, color: t.navGroupColor, flexShrink: 0 }} />
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ color: t.textMuted }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f43f5e'; (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(244,63,94,0.12)' : '#fff1f2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <LogOut style={{ width: 13, height: 13 }} />Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">

        {/* Topbar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 relative z-[10]"
          style={{
            background: t.topbarBg,
            backdropFilter: 'blur(20px)',
            borderBottom: `1.5px solid ${t.topbarBorder}`,
            boxShadow: t.topbarShadow,
          }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(v => !v)}
              className="p-2 rounded-xl transition-all"
              style={{ color: t.textSecondary }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.accentLight; (e.currentTarget as HTMLElement).style.color = t.accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.textSecondary; }}
              aria-label="Toggle sidebar">
              <Menu style={{ width: 18, height: 18 }} />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="hidden sm:inline" style={{ color: t.textMuted }}>Console</span>
              <ChevronRight className="hidden sm:block" style={{ width: 12, height: 12, color: t.textMuted }} />
              <span className="font-bold" style={{ color: t.textPrimary }}>{current?.label || 'Dashboard'}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button onClick={() => setCmd(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium transition-all"
              style={{ background: t.surfaceBg, border: `1.5px solid ${t.surfaceBorder}`, color: t.textSecondary }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.accentLight; (e.currentTarget as HTMLElement).style.borderColor = t.accentBorder; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.surfaceBg; (e.currentTarget as HTMLElement).style.borderColor = t.surfaceBorder; }}>
              <Command style={{ width: 13, height: 13 }} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded-md text-[10px] font-mono"
                style={{ background: t.cmdKbdBg, color: t.cmdKbdColor }}>⌘K</kbd>
            </button>

            {/* Theme picker */}
            <div className="relative">
              <button onClick={() => { setThemePanel(v => !v); setNotif(false); }}
                className="p-2.5 rounded-2xl transition-all"
                style={{ background: t.surfaceBg, border: `1.5px solid ${t.surfaceBorder}`, color: t.textSecondary }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.accentLight; (e.currentTarget as HTMLElement).style.borderColor = t.accentBorder; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.surfaceBg; (e.currentTarget as HTMLElement).style.borderColor = t.surfaceBorder; }}
                title="Change theme">
                <Palette style={{ width: 16, height: 16 }} />
              </button>

              {themePanel && (
                <div className="absolute right-0 top-14 rounded-3xl z-[40] overflow-hidden"
                  style={{ width: 260, background: t.notifBg, backdropFilter: 'blur(20px)', border: `1.5px solid ${t.notifBorder}`, boxShadow: `0 20px 60px ${t.accentShadow}` }}>
                  <div className="px-5 py-4 flex items-center justify-between"
                    style={{ borderBottom: `1.5px solid ${t.notifDivider}` }}>
                    <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Theme</p>
                    <button onClick={() => setThemePanel(false)} className="p-1 rounded-lg" style={{ color: t.textMuted }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {THEMES.map(th => (
                      <button key={th.id} onClick={() => applyTheme(th.id)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left transition-all"
                        style={{
                          background: themeId === th.id ? t.accentLight : t.surfaceBg,
                          border: `1.5px solid ${themeId === th.id ? t.accentBorder : t.surfaceBorder}`,
                          boxShadow: themeId === th.id ? `0 2px 8px ${t.accentShadow}` : 'none',
                        }}>
                        {/* Color swatch */}
                        <span className="w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                          style={{ background: th.brandGradient }}>
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate" style={{ color: t.textPrimary }}>{th.name}</p>
                          <p className="text-[9px]">{th.emoji}</p>
                        </div>
                        {themeId === th.id && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.accent }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotif(v => !v); setThemePanel(false); }}
                className="relative p-2.5 rounded-2xl transition-all"
                style={{ background: t.surfaceBg, border: `1.5px solid ${t.surfaceBorder}`, color: t.textSecondary }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.accentLight; (e.currentTarget as HTMLElement).style.borderColor = t.accentBorder; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.surfaceBg; (e.currentTarget as HTMLElement).style.borderColor = t.surfaceBorder; }}>
                <Bell style={{ width: 16, height: 16 }} />
                {totalAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#f59e0b', color: '#fff', boxShadow: '0 2px 6px rgba(245,158,11,0.4)' }}>
                    {totalAlerts}
                  </span>
                )}
              </button>

              {notif && (
                <div className="absolute right-0 top-14 rounded-3xl z-[40] overflow-hidden"
                  style={{ width: 300, background: t.notifBg, backdropFilter: 'blur(20px)', border: `1.5px solid ${t.notifBorder}`, boxShadow: `0 20px 60px ${t.accentShadow}` }}>
                  <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${t.notifDivider}` }}>
                    <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Notifications</p>
                    {totalAlerts > 0 && <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>{totalAlerts}</span>}
                  </div>
                  <div className="p-3 space-y-2">
                    {totalAlerts === 0 ? (
                      <div className="py-8 text-center">
                        <Bell style={{ width: 28, height: 28, margin: '0 auto 8px', color: t.textMuted }} />
                        <p className="text-xs font-medium" style={{ color: t.textMuted }}>No alerts right now</p>
                      </div>
                    ) : (
                      <>
                        {alerts.e7 > 0 && (
                          <div className="flex gap-3 p-3.5 rounded-2xl" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#92400e' }}>{alerts.e7} license{alerts.e7 > 1 ? 's' : ''} expiring in 7 days</p>
                              <button onClick={() => { navigate('/subscribers'); setNotif(false); }} className="text-[10px] mt-0.5 font-medium" style={{ color: '#d97706' }}>View →</button>
                            </div>
                          </div>
                        )}
                        {alerts.e30 > 0 && (
                          <div className="flex gap-3 p-3.5 rounded-2xl" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                            <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#1e40af' }}>{alerts.e30} license{alerts.e30 > 1 ? 's' : ''} expiring in 30 days</p>
                              <button onClick={() => { navigate('/subscribers'); setNotif(false); }} className="text-[10px] mt-0.5 font-medium" style={{ color: '#3b82f6' }}>View →</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{ background: t.liveBg, border: `1.5px solid ${t.liveBorder}` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.liveDot }} />
              <span className="text-[10px] font-black tracking-widest hidden sm:inline" style={{ color: t.liveColor }}>LIVE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full relative z-[0]">
          {children}
        </main>
      </div>

      {/* ══ COMMAND PALETTE ══ */}
      {cmd && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setCmd(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(15,23,42,0.4)' }} />
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: t.cmdBg, backdropFilter: 'blur(20px)', border: `1.5px solid ${t.cmdBorder}`, boxShadow: `0 32px 80px ${t.accentShadow}` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1.5px solid ${t.notifDivider}` }}>
              <Command style={{ width: 16, height: 16, color: t.navGroupColor, flexShrink: 0 }} />
              <input ref={cmdRef} value={q} onChange={e => { setQ(e.target.value); setQi(0); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') setQi(i => Math.min(i + 1, filtered.length - 1));
                  if (e.key === 'ArrowUp')   setQi(i => Math.max(i - 1, 0));
                  if (e.key === 'Enter' && filtered[qi]) { navigate(filtered[qi].action); setCmd(false); setQ(''); }
                }}
                placeholder="Search pages and actions..."
                className="flex-1 bg-transparent text-sm outline-none font-medium"
                style={{ color: t.textPrimary }} />
              <button onClick={() => setCmd(false)} className="p-1 rounded-lg" style={{ color: t.textMuted }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div className="py-2 max-h-72 overflow-y-auto">
              {filtered.length === 0
                ? <p className="text-center py-8 text-sm font-medium" style={{ color: t.textMuted }}>No results</p>
                : filtered.map((item, i) => (
                  <button key={item.action}
                    onClick={() => { navigate(item.action); setCmd(false); setQ(''); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all"
                    style={{ background: i === qi ? t.cmdItemHoverBg : 'transparent', color: i === qi ? t.cmdItemHoverColor : t.textSecondary }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: i === qi ? t.accentBorder : t.surfaceBg }}>
                      <item.icon style={{ width: 14, height: 14, color: i === qi ? t.cmdItemHoverColor : t.textMuted }} />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                ))}
            </div>
            <div className="px-5 py-3 flex items-center gap-4"
              style={{ borderTop: `1.5px solid ${t.notifDivider}`, background: t.cmdFooterBg }}>
              {[['↑↓','nav'],['↵','open'],['Esc','close']].map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: t.textMuted }}>
                  <kbd className="px-1.5 py-0.5 rounded-lg font-mono text-[10px]"
                    style={{ background: t.cmdKbdBg, color: t.cmdKbdColor }}>{k}</kbd>{v}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
