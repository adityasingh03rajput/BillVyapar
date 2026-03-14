import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ADMIN_API_URL as API_URL } from '../../config/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Key, X, Send, Ban } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-600',
  revoked: 'bg-red-100 text-red-800',
};

export function MasterAdminLicenseKeysPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ assignedEmail: '', durationDays: '365', notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const token = () => localStorage.getItem('masterAdminToken');

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const params = search ? `?email=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_URL}/master-admin/license-keys${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.error) toast.error(data.error);
      else setKeys(data.keys || []);
    } catch { toast.error('Failed to load license keys'); }
    finally { setLoading(false); }
  };

  const generateKey = async () => {
    const days = parseInt(String(form.durationDays), 10);
    if (!form.assignedEmail || !days || days <= 0) return toast.error('Email and valid duration are required');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/master-admin/license-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, durationDays: days }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Key generated and emailed to ${form.assignedEmail}`);
      setModal(false);
      setForm({ assignedEmail: '', durationDays: '365', notes: '' });
      loadKeys();
    } catch { toast.error('Failed to generate key'); }
    finally { setSaving(false); }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this license key? The user will lose access.')) return;
    try {
      const res = await fetch(`${API_URL}/master-admin/license-keys/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.error) toast.error(data.error);
      else { toast.success('Key revoked'); loadKeys(); }
    } catch { toast.error('Failed to revoke key'); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Key className="h-5 w-5 text-blue-600" /></div>
                <h1 className="text-xl font-bold text-gray-900">License Keys</h1>
              </div>
            </div>
            <button onClick={() => setModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium gap-2">
              <Plus className="h-4 w-4" />Generate Key
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6 flex gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadKeys()}
          />
          <button onClick={loadKeys} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Search</button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Key</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Assigned Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Activated</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Expires</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keys.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No license keys found</td></tr>
                )}
                {keys.map(k => (
                  <tr key={k._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{k.key}</td>
                    <td className="px-4 py-3 text-gray-700">{k.assignedEmail}</td>
                    <td className="px-4 py-3 text-gray-600">{k.durationDays}d</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[k.status] || ''}`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{k.activatedAt ? fmt(k.activatedAt) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{k.expiresAt ? fmt(k.expiresAt) : '—'}</td>
                    <td className="px-4 py-3">
                      {k.status !== 'revoked' && k.status !== 'expired' && (
                        <button onClick={() => revokeKey(k._id)} className="text-red-500 hover:text-red-700 p-1" title="Revoke">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Generate Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Generate License Key</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="user@example.com"
                  value={form.assignedEmail}
                  onChange={e => setForm(f => ({ ...f, assignedEmail: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">The key will be emailed to this address and can only be activated by this user.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.durationDays}
                  onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Annual plan - Invoice #1234"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={generateKey} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="h-4 w-4" />{saving ? 'Generating...' : 'Generate & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
