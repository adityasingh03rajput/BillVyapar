import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ADMIN_API_URL as API_URL } from '../../config/api';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Building2, FileText, Users, CheckCircle, XCircle,
  Clock, RefreshCw, Ban, Package, Truck, Save, ToggleLeft, ToggleRight,
  KeyRound, Smartphone, LogOut, X, Trash2,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; icon: any }> = {
  active:    { bg: '#d1fae5', color: '#059669', border: '#a7f3d0', icon: CheckCircle },
  expired:   { bg: '#ffe4e6', color: '#f43f5e', border: '#fecdd3', icon: XCircle },
  suspended: { bg: '#fef3c7', color: '#d97706', border: '#fde68a', icon: Clock },
};

const LIMIT_FIELDS: { key: string; label: string }[] = [
  { key: 'maxDocumentsPerMonth',  label: 'Max Documents / Month' },
  { key: 'maxCustomers',          label: 'Max Customers' },
  { key: 'maxSuppliers',          label: 'Max Suppliers' },
  { key: 'maxItems',              label: 'Max Items' },
  { key: 'maxProfiles',           label: 'Max Profiles' },
  { key: 'maxSessions',           label: 'Max Sessions' },
  { key: 'maxPdfExportsPerMonth', label: 'Max PDF Exports / Month' },
  { key: 'maxPaymentsPerMonth',   label: 'Max Payments / Month' },
  { key: 'maxBankTransactions',   label: 'Max Bank Transactions' },
  { key: 'maxExtraExpenses',      label: 'Max Extra Expenses' },
  { key: 'maxKhataEntries',       label: 'Max Khata Entries' },
  { key: 'maxDocumentLineItems',  label: 'Max Line Items / Doc' },
];

const FEATURE_FIELDS: { key: string; label: string }[] = [
  { key: 'allowGstinLookup',  label: 'GSTIN Lookup' },
  { key: 'allowSmsReminders', label: 'SMS Reminders' },
  { key: 'allowLogoUpload',   label: 'Logo Upload' },
  { key: 'allowAnalytics',    label: 'Analytics' },
  { key: 'allowKhata',        label: 'Khata / Ledger' },
  { key: 'allowBankAccounts', label: 'Bank Accounts' },
];

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: '#1e1b4b' }}>{value ?? '—'}</span>
    </div>
  );
}

function Card({ title, Icon, children }: { title: string; Icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(99,102,241,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
          <Icon className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#1e1b4b' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

export function MasterAdminSubscriberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [limitsForm, setLimitsForm] = useState<Record<string, number>>({});
  const [featuresForm, setFeaturesForm] = useState<Record<string, boolean>>({});
  const [savingLimits, setSavingLimits] = useState(false);

  // Reset password
  const [resetModal, setResetModal] = useState(false);
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);

  // Extend license
  const [extendModal, setExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const token = () => localStorage.getItem('masterAdminToken');

  useEffect(() => { load(); loadSessions(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/details`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      setData(json);
      // seed forms from loaded data
      const lim = json.subscriber?.limits || {};
      const feat = json.subscriber?.features || {};
      const limInit: Record<string, number> = {};
      for (const { key } of LIMIT_FIELDS) limInit[key] = lim[key] ?? -1;
      setLimitsForm(limInit);
      const featInit: Record<string, boolean> = {};
      for (const { key } of FEATURE_FIELDS) featInit[key] = feat[key] ?? true;
      setFeaturesForm(featInit);
    } catch { toast.error('Failed to load subscriber details'); }
    finally { setLoading(false); }
  };

  const suspend = async () => {
    if (!confirm('Suspend this subscriber?')) return;
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/suspend`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success('Subscriber suspended'); load(); }
    } catch { toast.error('Failed'); }
  };

  const reactivate = async () => {
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/reactivate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success('Subscriber reactivated'); load(); }
    } catch { toast.error('Failed'); }
  };

  const saveLimits = async () => {
    setSavingLimits(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ limits: limitsForm, features: featuresForm }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else toast.success('Limits & features saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingLimits(false); }
  };

  const resetPassword = async () => {
    if (!resetPw || resetPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setResetting(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ newPassword: resetPw }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success('Password reset successfully'); setResetModal(false); setResetPw(''); }
    } catch { toast.error('Failed to reset password'); }
    finally { setResetting(false); }
  };

  const extendLicense = async () => {
    if (!extendDays || extendDays <= 0) { toast.error('Enter a valid number of days'); return; }
    setExtending(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/licenses/${id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ days: extendDays }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success(`License extended by ${extendDays} days`); setExtendModal(false); load(); }
    } catch { toast.error('Failed to extend license'); }
    finally { setExtending(false); }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/sessions`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (!json.error) setSessions(json.sessions || []);
    } catch {}
    finally { setSessionsLoading(false); }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/master-admin/subscribers/${id}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success('Session terminated'); loadSessions(); }
    } catch { toast.error('Failed to terminate session'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-indigo-500 border-indigo-200 animate-spin" style={{ borderWidth: 3 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>Subscriber not found</p>
        <button onClick={() => navigate('/subscribers')} className="mt-4 text-xs font-semibold" style={{ color: '#6366f1' }}>← Back</button>
      </div>
    );
  }

  const { subscriber, license, profiles, usage } = data;
  const status = subscriber?.status || 'active';
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const StatusIcon = sc.icon;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/subscribers')}
            className="p-2 rounded-xl transition-all"
            style={{ background: '#f1f5f9', color: '#64748b' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#1e1b4b' }}>{subscriber.name}</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>{subscriber.email}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}` }}>
            <StatusIcon className="h-3 w-3" />{status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setResetModal(true); setResetPw(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#eef2ff', color: '#6366f1', border: '1.5px solid #c7d2fe' }}>
            <KeyRound className="h-3.5 w-3.5" />Reset Password
          </button>
          {status === 'active' && (
            <button onClick={suspend} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#ffe4e6', color: '#f43f5e', border: '1.5px solid #fecdd3' }}>
              <Ban className="h-3.5 w-3.5" />Suspend
            </button>
          )}
          {status === 'suspended' && (
            <button onClick={reactivate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#d1fae5', color: '#059669', border: '1.5px solid #a7f3d0' }}>
              <RefreshCw className="h-3.5 w-3.5" />Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Platform Usage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Documents',  value: usage?.documentCount  ?? 0, Icon: FileText,  c: '#6366f1', bg: '#eef2ff' },
          { label: 'Customers',  value: usage?.customerCount  ?? 0, Icon: Users,     c: '#10b981', bg: '#d1fae5' },
          { label: 'Suppliers',  value: usage?.supplierCount  ?? 0, Icon: Truck,     c: '#f59e0b', bg: '#fef3c7' },
          { label: 'Items',      value: usage?.itemCount      ?? 0, Icon: Package,   c: '#8b5cf6', bg: '#ede9fe' },
          { label: 'Profiles',   value: usage?.profileCount   ?? 0, Icon: Building2, c: '#0ea5e9', bg: '#e0f2fe' },
        ].map(({ label, value, Icon, c, bg }) => (
          <div key={label} className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(99,102,241,0.06)' }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color: c }} />
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: '#1e1b4b' }}>{value}</p>
              <p className="text-[10px] font-semibold" style={{ color: '#94a3b8' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info + License */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Subscriber Info" Icon={User}>
          <InfoRow label="Name"   value={subscriber.name} />
          <InfoRow label="Email"  value={subscriber.email} />
          <InfoRow label="Phone"  value={subscriber.phone} />
          <InfoRow label="GSTIN"  value={subscriber.gstin} />
          <InfoRow label="Joined" value={subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
        </Card>
        <Card title="License Info" Icon={CheckCircle}>
          {license ? (
            <>
              <InfoRow label="Key"            value={license.key} />
              <InfoRow label="Status"         value={license.status} />
              <InfoRow label="Duration"       value={license.durationDays ? `${license.durationDays} days` : null} />
              <InfoRow label="Activated"      value={(license.activatedAt || license.licenseStartAt) ? new Date(license.activatedAt || license.licenseStartAt).toLocaleDateString('en-IN') : null} />
              <InfoRow label="Expiry"         value={(license.expiresAt || license.licenseEndAt) ? new Date(license.expiresAt || license.licenseEndAt).toLocaleDateString('en-IN') : null} />
              <InfoRow label="Days Remaining" value={license.daysRemaining != null ? `${license.daysRemaining} days` : null} />
              <button
                onClick={() => { setExtendDays(30); setExtendModal(true); }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-bold"
                style={{ background: '#eef2ff', color: '#6366f1', border: '1.5px solid #c7d2fe' }}>
                <RefreshCw className="h-3.5 w-3.5" />Extend / Renew License
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-medium py-4 text-center" style={{ color: '#94a3b8' }}>No license found</p>
              <button
                onClick={() => { setExtendDays(30); setExtendModal(true); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-bold"
                style={{ background: '#eef2ff', color: '#6366f1', border: '1.5px solid #c7d2fe' }}>
                <RefreshCw className="h-3.5 w-3.5" />Assign License
              </button>
            </>
          )}
        </Card>
      </div>

      {/* Usage Limits + Feature Flags */}
      <Card title="Usage Limits & Feature Controls" Icon={Save}>
        <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>Set -1 for unlimited. Changes apply immediately on next request.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Numeric limits */}
          <div>
            <p className="text-xs font-bold mb-3" style={{ color: '#6366f1' }}>Numeric Limits</p>
            <div className="space-y-2">
              {LIMIT_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold flex-1" style={{ color: '#475569' }}>{label}</label>
                  <input
                    type="number"
                    value={limitsForm[key] ?? -1}
                    onChange={e => setLimitsForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-24 text-xs font-bold text-right rounded-xl px-3 py-1.5 outline-none"
                    style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e1b4b' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Feature toggles */}
          <div>
            <p className="text-xs font-bold mb-3" style={{ color: '#6366f1' }}>Feature Flags</p>
            <div className="space-y-3">
              {FEATURE_FIELDS.map(({ key, label }) => {
                const enabled = featuresForm[key] ?? true;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: '#475569' }}>{label}</span>
                    <button
                      type="button"
                      onClick={() => setFeaturesForm(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: enabled ? '#d1fae5' : '#fee2e2',
                        color: enabled ? '#059669' : '#ef4444',
                        border: `1.5px solid ${enabled ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={saveLimits}
          disabled={savingLimits}
          className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all"
          style={{ background: '#6366f1', color: '#fff', opacity: savingLimits ? 0.6 : 1 }}
        >
          <Save className="h-3.5 w-3.5" />
          {savingLimits ? 'Saving…' : 'Save Limits & Features'}
        </button>
      </Card>

      {/* Business Profiles */}
      {profiles?.length > 0 && (
        <Card title="Business Profiles" Icon={Building2}>
          <div className="space-y-2">
            {profiles.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#1e1b4b' }}>{p.businessName}</p>
                  <p className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>{p.gstin || 'No GSTIN'}</p>
                </div>
                <p className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>{p.phone || p.email || ''}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Sessions */}
      <Card title="Active Sessions" Icon={Smartphone}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: '#94a3b8' }}>Devices currently logged in. Terminate to force logout.</p>
          <button onClick={loadSessions}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
            <RefreshCw className="h-3 w-3" />Refresh
          </button>
        </div>
        {sessionsLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#e0e7ff', borderTopColor: '#6366f1' }} />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-center py-6 font-medium" style={{ color: '#94a3b8' }}>No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                    <Smartphone className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold font-mono" style={{ color: '#1e1b4b' }}>{s.deviceId}</p>
                    <p className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>
                      Last active: {new Date(s.lastActive).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteSession(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: '#ffe4e6', color: '#f43f5e', border: '1.5px solid #fecdd3' }}
                  title="Terminate session">
                  <LogOut className="h-3 w-3" />Logout
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Extend License Modal */}
      {extendModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[50] p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 32px 80px rgba(99,102,241,0.15)' }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1.5px solid #f1f5f9' }}>
              <h2 className="text-base font-black" style={{ color: '#1e1b4b' }}>Extend / Renew License</h2>
              <button onClick={() => setExtendModal(false)} className="p-1.5 rounded-xl"
                style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                Extending license for <span className="font-black" style={{ color: '#1e1b4b' }}>{subscriber.email}</span>
              </p>
              {data?.license && (
                <p className="text-xs px-3 py-2 rounded-xl font-medium"
                  style={{ background: data.license.status === 'active' ? '#d1fae5' : '#ffe4e6', color: data.license.status === 'active' ? '#059669' : '#f43f5e' }}>
                  Current expiry: {(data.license.expiresAt || data.license.licenseEndAt) ? new Date(data.license.expiresAt || data.license.licenseEndAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  {data.license.status === 'expired' ? ' (expired)' : ''}
                </p>
              )}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: '#475569' }}>Extend by (days)</label>
                <input
                  type="number"
                  min={1}
                  value={extendDays}
                  onChange={e => setExtendDays(Number(e.target.value))}
                  style={{
                    background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e1b4b',
                    borderRadius: 16, padding: '10px 14px', fontSize: 14, fontWeight: 700,
                    width: '100%', outline: 'none',
                  }}
                />
                <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#94a3b8' }}>
                  New expiry will be: {(() => {
                    const expiryDate = data?.license?.expiresAt || data?.license?.licenseEndAt;
                    const base = expiryDate && new Date(expiryDate) > new Date()
                      ? new Date(expiryDate)
                      : new Date();
                    return new Date(base.getTime() + extendDays * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  })()}
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-5" style={{ borderTop: '1.5px solid #f1f5f9', background: '#fafafa' }}>
              <button onClick={() => setExtendModal(false)}
                className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#64748b' }}>Cancel</button>
              <button onClick={extendLicense} disabled={extending}
                className="flex-1 px-4 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                {extending ? 'Extending…' : `Extend ${extendDays}d`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[50] p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 32px 80px rgba(99,102,241,0.15)' }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1.5px solid #f1f5f9' }}>
              <h2 className="text-base font-black" style={{ color: '#1e1b4b' }}>Reset Password</h2>
              <button onClick={() => setResetModal(false)} className="p-1.5 rounded-xl"
                style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium mb-4" style={{ color: '#64748b' }}>
                Resetting password for <span className="font-black" style={{ color: '#1e1b4b' }}>{subscriber.email}</span>
              </p>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                style={{
                  background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e1b4b',
                  borderRadius: 16, padding: '10px 14px', fontSize: 14, fontWeight: 500,
                  width: '100%', outline: 'none',
                }}
                value={resetPw}
                onChange={e => setResetPw(e.target.value)}
              />
            </div>
            <div className="flex gap-3 px-6 py-5" style={{ borderTop: '1.5px solid #f1f5f9', background: '#fafafa' }}>
              <button onClick={() => setResetModal(false)}
                className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#64748b' }}>Cancel</button>
              <button onClick={resetPassword} disabled={resetting}
                className="flex-1 px-4 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                {resetting ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
