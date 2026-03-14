import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ADMIN_API_URL as API_URL } from '../../config/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Package, DollarSign, Users, Calendar, Monitor, X, Save } from 'lucide-react';

const emptyPlan = {
  name: '',
  displayName: '',
  description: '',
  durations: [{ days: 30, price: 0 }],
  seatPrice: 0,
  limits: { maxSeats: 5, maxSessions: 1, maxDocumentsPerMonth: -1, maxCustomers: -1, maxItems: -1 },
  isActive: true,
};

export function MasterAdminPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; plan: any; isNew: boolean }>({ open: false, plan: null, isNew: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const token = () => localStorage.getItem('masterAdminToken');

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/master-admin/plans`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.error) toast.error(data.error);
      else setPlans(data.plans || []);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  const openCreate = () => setModal({ open: true, plan: JSON.parse(JSON.stringify(emptyPlan)), isNew: true });
  const openEdit = (plan: any) => setModal({ open: true, plan: JSON.parse(JSON.stringify(plan)), isNew: false });

  const savePlan = async () => {
    setSaving(true);
    try {
      const url = modal.isNew
        ? `${API_URL}/master-admin/plans`
        : `${API_URL}/master-admin/plans/${modal.plan._id}`;
      const res = await fetch(url, {
        method: modal.isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(modal.plan),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(modal.isNew ? 'Plan created' : 'Plan updated');
      setModal({ open: false, plan: null, isNew: false });
      loadPlans();
    } catch { toast.error('Failed to save plan'); }
    finally { setSaving(false); }
  };

  const setPlanField = (path: string, value: any) => {
    setModal(prev => {
      const plan = { ...prev.plan };
      const keys = path.split('.');
      let obj: any = plan;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return { ...prev, plan };
    });
  };

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
                <div className="p-2 bg-blue-100 rounded-lg"><Package className="h-5 w-5 text-blue-600" /></div>
                <h1 className="text-xl font-bold text-gray-900">Manage Plans</h1>
              </div>
            </div>
            <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Plus className="h-4 w-4 mr-2" />Create Plan
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-1">{plan.displayName}</h3>
                  <p className="text-sm opacity-90">{plan.description}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Durations</span>
                    </div>
                    {plan.durations?.map((d: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg mb-1">
                        <span className="text-sm text-gray-700">{d.days} days</span>
                        <span className="text-sm font-semibold text-blue-600">₹{d.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-700">Max Seats</span></div>
                      <span className="text-sm font-semibold">{plan.limits?.maxSeats ?? 5}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-700">Max Sessions</span></div>
                      <span className="text-sm font-semibold text-purple-600">{plan.limits?.maxSessions ?? 1} device(s)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-700">Seat Price</span></div>
                      <span className="text-sm font-semibold">₹{plan.seatPrice?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(plan)} className="w-full mt-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
                    Edit Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal.open && modal.plan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{modal.isNew ? 'Create Plan' : 'Edit Plan'}</h2>
              <button onClick={() => setModal({ open: false, plan: null, isNew: false })}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (slug)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.plan.name} onChange={e => setPlanField('name', e.target.value)} placeholder="basic" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.plan.displayName} onChange={e => setPlanField('displayName', e.target.value)} placeholder="Basic Plan" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.plan.description || ''} onChange={e => setPlanField('description', e.target.value)} />
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm text-gray-700">
                  <Monitor className="h-4 w-4 text-purple-500" />
                  Session & Seat Limits
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Sessions (devices)</label>
                    <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={modal.plan.limits?.maxSessions ?? 1}
                      onChange={e => setPlanField('limits.maxSessions', Number(e.target.value))} />
                    <p className="text-xs text-gray-400 mt-1">How many devices can be logged in simultaneously</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Seats</label>
                    <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={modal.plan.limits?.maxSeats ?? 5}
                      onChange={e => setPlanField('limits.maxSeats', Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-gray-700">Durations & Pricing</div>
                {modal.plan.durations?.map((d: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="number" className="w-24 border rounded-lg px-2 py-1.5 text-sm" value={d.days}
                      onChange={e => { const durations = [...modal.plan.durations]; durations[i].days = Number(e.target.value); setPlanField('durations', durations); }}
                      placeholder="Days" />
                    <span className="text-sm text-gray-500">days —</span>
                    <input type="number" className="flex-1 border rounded-lg px-2 py-1.5 text-sm" value={d.price}
                      onChange={e => { const durations = [...modal.plan.durations]; durations[i].price = Number(e.target.value); setPlanField('durations', durations); }}
                      placeholder="₹ Price" />
                    <button onClick={() => { const durations = modal.plan.durations.filter((_: any, j: number) => j !== i); setPlanField('durations', durations); }} className="text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setPlanField('durations', [...modal.plan.durations, { days: 30, price: 0 }])}
                  className="text-sm text-blue-600 hover:underline">+ Add duration</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Price (₹/extra seat)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.plan.seatPrice || 0}
                  onChange={e => setPlanField('seatPrice', Number(e.target.value))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal({ open: false, plan: null, isNew: false })} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={savePlan} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
