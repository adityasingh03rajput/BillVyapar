import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ADMIN_API_URL as API_URL } from '../../config/api';
import { Lock, Mail, Zap } from 'lucide-react';

export function MasterAdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/master-admin/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        localStorage.setItem('masterAdminToken', data.accessToken);
        localStorage.setItem('masterAdmin', JSON.stringify(data.admin));
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #c7d2fe, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #a7f3d0, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #ddd6fe, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ color: '#1e1b4b' }}>Master Admin</h1>
          <p className="text-sm font-medium" style={{ color: '#6366f1' }}>Platform Management Console</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
          }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#475569' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" style={{ color: '#a5b4fc' }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#1e1b4b',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(165,180,252,0.2), inset 0 2px 4px rgba(0,0,0,0.04)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)'; }}
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#475569' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" style={{ color: '#a5b4fc' }} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#1e1b4b',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(165,180,252,0.2), inset 0 2px 4px rgba(0,0,0,0.04)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)'; }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Signing in...' : 'Sign In to Console'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Secure admin access only
            </span>
          </div>
        </div>

        <p className="text-center mt-6 text-xs font-medium" style={{ color: '#94a3b8' }}>
          © 2024 Bill Vyapar. All rights reserved.
        </p>
      </div>
    </div>
  );
}
