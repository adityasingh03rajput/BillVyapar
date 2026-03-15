export interface AdminTheme {
  id: string;
  name: string;
  emoji: string;
  // Page background
  pageBg: string;
  // Sidebar
  sidebarBg: string;
  sidebarBorder: string;
  sidebarShadow: string;
  // Topbar
  topbarBg: string;
  topbarBorder: string;
  topbarShadow: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent (primary brand color)
  accent: string;
  accentLight: string;
  accentBorder: string;
  accentShadow: string;
  // Nav group label
  navGroupColor: string;
  // Nav item hover
  navHoverBg: string;
  navHoverColor: string;
  // Card
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  // Input / button surfaces
  surfaceBg: string;
  surfaceBorder: string;
  // User footer card
  footerCardBg: string;
  footerCardBorder: string;
  // Command palette
  cmdBg: string;
  cmdBorder: string;
  cmdItemHoverBg: string;
  cmdItemHoverColor: string;
  cmdFooterBg: string;
  cmdKbdBg: string;
  cmdKbdColor: string;
  // Notification panel
  notifBg: string;
  notifBorder: string;
  notifDivider: string;
  // Live badge
  liveBg: string;
  liveBorder: string;
  liveColor: string;
  liveDot: string;
  // Brand gradient (logo icon)
  brandGradient: string;
  brandShadow: string;
}

export const THEMES: AdminTheme[] = [
  // ── 1. Indigo Frost (default) ──────────────────────────────────────────────
  {
    id: 'indigo-frost',
    name: 'Indigo Frost',
    emoji: '❄️',
    pageBg: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)',
    sidebarBg: 'rgba(255,255,255,0.82)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(99,102,241,0.1)',
    topbarBg: 'rgba(255,255,255,0.78)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(99,102,241,0.06)',
    textPrimary: '#1e1b4b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    accent: '#6366f1',
    accentLight: '#eef2ff',
    accentBorder: '#c7d2fe',
    accentShadow: 'rgba(99,102,241,0.2)',
    navGroupColor: '#a5b4fc',
    navHoverBg: 'rgba(99,102,241,0.06)',
    navHoverColor: '#4f46e5',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(99,102,241,0.06)',
    surfaceBg: '#f1f5f9',
    surfaceBorder: '#e2e8f0',
    footerCardBg: 'linear-gradient(135deg,#eef2ff,#ede9fe)',
    footerCardBorder: 'rgba(99,102,241,0.12)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#eef2ff',
    cmdItemHoverColor: '#4f46e5',
    cmdFooterBg: '#fafafa',
    cmdKbdBg: '#e2e8f0',
    cmdKbdColor: '#64748b',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#f1f5f9',
    liveBg: '#d1fae5',
    liveBorder: '#a7f3d0',
    liveColor: '#059669',
    liveDot: '#10b981',
    brandGradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    brandShadow: '0 4px 14px rgba(99,102,241,0.4)',
  },

  // ── 2. Midnight Dark ──────────────────────────────────────────────────────
  {
    id: 'midnight-dark',
    name: 'Midnight',
    emoji: '🌑',
    pageBg: 'linear-gradient(135deg,#0f0f1a 0%,#13111f 50%,#0d1117 100%)',
    sidebarBg: 'rgba(22,22,38,0.95)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarShadow: '6px 0 32px rgba(0,0,0,0.4)',
    topbarBg: 'rgba(18,18,30,0.92)',
    topbarBorder: 'rgba(255,255,255,0.06)',
    topbarShadow: '0 2px 16px rgba(0,0,0,0.3)',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    accent: '#818cf8',
    accentLight: 'rgba(129,140,248,0.12)',
    accentBorder: 'rgba(129,140,248,0.25)',
    accentShadow: 'rgba(129,140,248,0.2)',
    navGroupColor: '#475569',
    navHoverBg: 'rgba(129,140,248,0.08)',
    navHoverColor: '#a5b4fc',
    cardBg: 'rgba(30,30,50,0.8)',
    cardBorder: 'rgba(255,255,255,0.06)',
    cardShadow: '0 8px 32px rgba(0,0,0,0.3)',
    surfaceBg: 'rgba(255,255,255,0.06)',
    surfaceBorder: 'rgba(255,255,255,0.1)',
    footerCardBg: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
    footerCardBorder: 'rgba(129,140,248,0.2)',
    cmdBg: 'rgba(22,22,38,0.98)',
    cmdBorder: 'rgba(255,255,255,0.08)',
    cmdItemHoverBg: 'rgba(129,140,248,0.12)',
    cmdItemHoverColor: '#a5b4fc',
    cmdFooterBg: 'rgba(15,15,25,0.8)',
    cmdKbdBg: 'rgba(255,255,255,0.08)',
    cmdKbdColor: '#64748b',
    notifBg: 'rgba(22,22,38,0.98)',
    notifBorder: 'rgba(255,255,255,0.08)',
    notifDivider: 'rgba(255,255,255,0.06)',
    liveBg: 'rgba(16,185,129,0.12)',
    liveBorder: 'rgba(16,185,129,0.25)',
    liveColor: '#34d399',
    liveDot: '#10b981',
    brandGradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    brandShadow: '0 4px 14px rgba(99,102,241,0.5)',
  },

  // ── 3. Emerald Forest ─────────────────────────────────────────────────────
  {
    id: 'emerald-forest',
    name: 'Emerald',
    emoji: '🌿',
    pageBg: 'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#f0fdfa 100%)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(16,185,129,0.1)',
    topbarBg: 'rgba(255,255,255,0.8)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(16,185,129,0.06)',
    textPrimary: '#064e3b',
    textSecondary: '#065f46',
    textMuted: '#6ee7b7',
    accent: '#10b981',
    accentLight: '#d1fae5',
    accentBorder: '#a7f3d0',
    accentShadow: 'rgba(16,185,129,0.2)',
    navGroupColor: '#6ee7b7',
    navHoverBg: 'rgba(16,185,129,0.06)',
    navHoverColor: '#059669',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(16,185,129,0.07)',
    surfaceBg: '#f0fdf4',
    surfaceBorder: '#a7f3d0',
    footerCardBg: 'linear-gradient(135deg,#d1fae5,#ccfbf1)',
    footerCardBorder: 'rgba(16,185,129,0.15)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#d1fae5',
    cmdItemHoverColor: '#059669',
    cmdFooterBg: '#f0fdf4',
    cmdKbdBg: '#a7f3d0',
    cmdKbdColor: '#065f46',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#d1fae5',
    liveBg: '#d1fae5',
    liveBorder: '#a7f3d0',
    liveColor: '#059669',
    liveDot: '#10b981',
    brandGradient: 'linear-gradient(135deg,#10b981,#059669)',
    brandShadow: '0 4px 14px rgba(16,185,129,0.4)',
  },

  // ── 4. Rose Gold ──────────────────────────────────────────────────────────
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    emoji: '🌸',
    pageBg: 'linear-gradient(135deg,#fff1f2 0%,#fdf2f8 50%,#fff7ed 100%)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(244,63,94,0.08)',
    topbarBg: 'rgba(255,255,255,0.8)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(244,63,94,0.05)',
    textPrimary: '#4c0519',
    textSecondary: '#9f1239',
    textMuted: '#fda4af',
    accent: '#f43f5e',
    accentLight: '#ffe4e6',
    accentBorder: '#fecdd3',
    accentShadow: 'rgba(244,63,94,0.2)',
    navGroupColor: '#fda4af',
    navHoverBg: 'rgba(244,63,94,0.05)',
    navHoverColor: '#e11d48',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(244,63,94,0.06)',
    surfaceBg: '#fff1f2',
    surfaceBorder: '#fecdd3',
    footerCardBg: 'linear-gradient(135deg,#ffe4e6,#fdf2f8)',
    footerCardBorder: 'rgba(244,63,94,0.12)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#ffe4e6',
    cmdItemHoverColor: '#e11d48',
    cmdFooterBg: '#fff1f2',
    cmdKbdBg: '#fecdd3',
    cmdKbdColor: '#9f1239',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#ffe4e6',
    liveBg: '#ffe4e6',
    liveBorder: '#fecdd3',
    liveColor: '#e11d48',
    liveDot: '#f43f5e',
    brandGradient: 'linear-gradient(135deg,#f43f5e,#fb7185)',
    brandShadow: '0 4px 14px rgba(244,63,94,0.4)',
  },

  // ── 5. Ocean Blue ─────────────────────────────────────────────────────────
  {
    id: 'ocean-blue',
    name: 'Ocean',
    emoji: '🌊',
    pageBg: 'linear-gradient(135deg,#eff6ff 0%,#f0f9ff 50%,#ecfeff 100%)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(14,165,233,0.1)',
    topbarBg: 'rgba(255,255,255,0.8)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(14,165,233,0.06)',
    textPrimary: '#0c4a6e',
    textSecondary: '#0369a1',
    textMuted: '#7dd3fc',
    accent: '#0ea5e9',
    accentLight: '#e0f2fe',
    accentBorder: '#bae6fd',
    accentShadow: 'rgba(14,165,233,0.2)',
    navGroupColor: '#7dd3fc',
    navHoverBg: 'rgba(14,165,233,0.06)',
    navHoverColor: '#0284c7',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(14,165,233,0.07)',
    surfaceBg: '#f0f9ff',
    surfaceBorder: '#bae6fd',
    footerCardBg: 'linear-gradient(135deg,#e0f2fe,#cffafe)',
    footerCardBorder: 'rgba(14,165,233,0.15)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#e0f2fe',
    cmdItemHoverColor: '#0284c7',
    cmdFooterBg: '#f0f9ff',
    cmdKbdBg: '#bae6fd',
    cmdKbdColor: '#0369a1',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#e0f2fe',
    liveBg: '#e0f2fe',
    liveBorder: '#bae6fd',
    liveColor: '#0284c7',
    liveDot: '#0ea5e9',
    brandGradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    brandShadow: '0 4px 14px rgba(14,165,233,0.4)',
  },

  // ── 6. Amber Sunset ───────────────────────────────────────────────────────
  {
    id: 'amber-sunset',
    name: 'Sunset',
    emoji: '🌅',
    pageBg: 'linear-gradient(135deg,#fffbeb 0%,#fff7ed 50%,#fef9c3 100%)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(245,158,11,0.1)',
    topbarBg: 'rgba(255,255,255,0.8)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(245,158,11,0.06)',
    textPrimary: '#451a03',
    textSecondary: '#92400e',
    textMuted: '#fcd34d',
    accent: '#f59e0b',
    accentLight: '#fef3c7',
    accentBorder: '#fde68a',
    accentShadow: 'rgba(245,158,11,0.2)',
    navGroupColor: '#fcd34d',
    navHoverBg: 'rgba(245,158,11,0.06)',
    navHoverColor: '#d97706',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(245,158,11,0.07)',
    surfaceBg: '#fffbeb',
    surfaceBorder: '#fde68a',
    footerCardBg: 'linear-gradient(135deg,#fef3c7,#fff7ed)',
    footerCardBorder: 'rgba(245,158,11,0.15)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#fef3c7',
    cmdItemHoverColor: '#d97706',
    cmdFooterBg: '#fffbeb',
    cmdKbdBg: '#fde68a',
    cmdKbdColor: '#92400e',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#fef3c7',
    liveBg: '#fef3c7',
    liveBorder: '#fde68a',
    liveColor: '#d97706',
    liveDot: '#f59e0b',
    brandGradient: 'linear-gradient(135deg,#f59e0b,#f97316)',
    brandShadow: '0 4px 14px rgba(245,158,11,0.4)',
  },

  // ── 7. Violet Storm ───────────────────────────────────────────────────────
  {
    id: 'violet-storm',
    name: 'Violet',
    emoji: '⚡',
    pageBg: 'linear-gradient(135deg,#faf5ff 0%,#f5f3ff 50%,#ede9fe 100%)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.9)',
    sidebarShadow: '6px 0 32px rgba(139,92,246,0.1)',
    topbarBg: 'rgba(255,255,255,0.8)',
    topbarBorder: 'rgba(255,255,255,0.9)',
    topbarShadow: '0 2px 16px rgba(139,92,246,0.06)',
    textPrimary: '#2e1065',
    textSecondary: '#5b21b6',
    textMuted: '#c4b5fd',
    accent: '#8b5cf6',
    accentLight: '#ede9fe',
    accentBorder: '#ddd6fe',
    accentShadow: 'rgba(139,92,246,0.2)',
    navGroupColor: '#c4b5fd',
    navHoverBg: 'rgba(139,92,246,0.06)',
    navHoverColor: '#7c3aed',
    cardBg: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(255,255,255,0.9)',
    cardShadow: '0 8px 32px rgba(139,92,246,0.07)',
    surfaceBg: '#faf5ff',
    surfaceBorder: '#ddd6fe',
    footerCardBg: 'linear-gradient(135deg,#ede9fe,#f5f3ff)',
    footerCardBorder: 'rgba(139,92,246,0.15)',
    cmdBg: 'rgba(255,255,255,0.97)',
    cmdBorder: 'rgba(255,255,255,0.9)',
    cmdItemHoverBg: '#ede9fe',
    cmdItemHoverColor: '#7c3aed',
    cmdFooterBg: '#faf5ff',
    cmdKbdBg: '#ddd6fe',
    cmdKbdColor: '#5b21b6',
    notifBg: 'rgba(255,255,255,0.97)',
    notifBorder: 'rgba(255,255,255,0.9)',
    notifDivider: '#ede9fe',
    liveBg: '#ede9fe',
    liveBorder: '#ddd6fe',
    liveColor: '#7c3aed',
    liveDot: '#8b5cf6',
    brandGradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
    brandShadow: '0 4px 14px rgba(139,92,246,0.4)',
  },

  // ── 8. Slate Pro ──────────────────────────────────────────────────────────
  {
    id: 'slate-pro',
    name: 'Slate Pro',
    emoji: '🪨',
    pageBg: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 50%,#f0f4f8 100%)',
    sidebarBg: 'rgba(255,255,255,0.9)',
    sidebarBorder: 'rgba(226,232,240,0.8)',
    sidebarShadow: '6px 0 32px rgba(15,23,42,0.06)',
    topbarBg: 'rgba(255,255,255,0.9)',
    topbarBorder: 'rgba(226,232,240,0.8)',
    topbarShadow: '0 2px 16px rgba(15,23,42,0.04)',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#94a3b8',
    accent: '#334155',
    accentLight: '#f1f5f9',
    accentBorder: '#cbd5e1',
    accentShadow: 'rgba(51,65,85,0.15)',
    navGroupColor: '#94a3b8',
    navHoverBg: 'rgba(15,23,42,0.04)',
    navHoverColor: '#0f172a',
    cardBg: 'rgba(255,255,255,0.9)',
    cardBorder: 'rgba(226,232,240,0.8)',
    cardShadow: '0 8px 32px rgba(15,23,42,0.05)',
    surfaceBg: '#f1f5f9',
    surfaceBorder: '#e2e8f0',
    footerCardBg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
    footerCardBorder: 'rgba(15,23,42,0.08)',
    cmdBg: 'rgba(255,255,255,0.98)',
    cmdBorder: 'rgba(226,232,240,0.9)',
    cmdItemHoverBg: '#f1f5f9',
    cmdItemHoverColor: '#0f172a',
    cmdFooterBg: '#f8fafc',
    cmdKbdBg: '#e2e8f0',
    cmdKbdColor: '#475569',
    notifBg: 'rgba(255,255,255,0.98)',
    notifBorder: 'rgba(226,232,240,0.9)',
    notifDivider: '#f1f5f9',
    liveBg: '#dcfce7',
    liveBorder: '#bbf7d0',
    liveColor: '#16a34a',
    liveDot: '#22c55e',
    brandGradient: 'linear-gradient(135deg,#334155,#475569)',
    brandShadow: '0 4px 14px rgba(51,65,85,0.3)',
  },
];

export const DEFAULT_THEME_ID = 'indigo-frost';

export function getTheme(id: string): AdminTheme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
