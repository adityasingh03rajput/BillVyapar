import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { API_URL, clearApiUrlOverride, getApiUrlOverride, setApiUrlOverride } from '../config/api';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email' | 'both'>('sms');
  const [apiEditOpen, setApiEditOpen] = useState(false);
  const [apiDraft, setApiDraft] = useState('');
  const apiOverrideActive = !!getApiUrlOverride();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    try {
      const raw = localStorage.getItem('currentProfile');
      if (raw) {
        const profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (profile?.id) { navigate('/dashboard', { replace: true }); return; }
      }
    } catch {}
    navigate('/welcome', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setCheckingBackend(true);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!cancelled) setBackendOnline(res.ok);
      } catch {
        if (!cancelled) setBackendOnline(false);
      } finally {
        if (!cancelled) setCheckingBackend(false);
      }
    };
    void check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (apiEditOpen) setApiDraft(API_URL);
  }, [apiEditOpen]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="flex flex-col items-center gap-3">
          <FileText className="h-12 w-12 text-blue-400 animate-pulse" />
          <span className="text-lg font-bold text-white">BillVyapar</span>
        </div>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, channel: otpChannel }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        toast.success('OTP sent (if account exists)');
        setMode('reset'); setLoading(false); return;
      }
      if (mode === 'reset') {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        toast.success('Password reset successful. Please sign in.');
        setMode('auth'); setIsSignUp(false); setPassword(''); setNewPassword(''); setOtp('');
        setLoading(false); return;
      }
      if (isSignUp) {
        if (!name.trim()) { toast.error('Please enter your name'); setLoading(false); return; }
        if (!phone.trim()) { toast.error('Please enter your phone number'); setLoading(false); return; }
        const normalizePhone = (raw: string) => {
          const v = String(raw || '').trim();
          if (!v) return v;
          if (v.startsWith('+')) return v;
          const digits = v.replace(/\D/g, '');
          if (digits.length === 10) return `+91${digits}`;
          if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
          return v;
        };
        await signUp(email, password, name, normalizePhone(phone));
        toast.success('Account created successfully!');
        navigate('/welcome', { replace: true }); return;
      } else {
        await signIn(email, password);
        toast.success('Signed in successfully!');
      }
      try {
        const raw = localStorage.getItem('currentProfile');
        if (raw) {
          const profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (profile?.id) { navigate('/dashboard', { replace: true }); return; }
        }
      } catch {}
      try {
        const tok = localStorage.getItem('accessToken');
        const did = localStorage.getItem('deviceId') || '';
        const res = await fetch(`${API_URL}/profiles`, {
          headers: { Authorization: `Bearer ${tok}`, 'X-Device-ID': did },
        });
        const profiles = await res.json();
        if (Array.isArray(profiles) && profiles.length > 0) {
          localStorage.setItem('currentProfile', JSON.stringify(profiles[0]));
          navigate('/dashboard', { replace: true }); return;
        }
      } catch {}
      navigate('/welcome', { replace: true });
    } catch (error: any) {
      if (error?.code === 'ALREADY_LOGGED_IN_ANOTHER_DEVICE') {
        toast.error('Already opened on another device. Reset password to continue.');
        setMode('forgot');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusColor = backendOnline ? '#22c55e' : backendOnline === false ? '#ef4444' : '#f59e0b';
  const statusText = checkingBackend && backendOnline === null ? 'Connecting…'
    : backendOnline ? 'Online' : backendOnline === false && checkingBackend ? 'Reconnecting…'
    : backendOnline === false ? 'Offline' : '…';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f2027 100%)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-xs" style={{ color: '#64748b' }}>
        <span className="truncate max-w-[60%]">
          {API_URL}{apiOverrideActive ? ' (custom)' : ''}
          {!apiEditOpen && (
            <button type="button" className="ml-1 underline" style={{ color: '#6366f1' }} onClick={() => setApiEditOpen(true)}>edit</button>
          )}
        </span>
        <span className="font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusColor }} />
          {statusText}
        </span>
      </div>
      {apiEditOpen && (
        <div className="flex items-center gap-2 px-4 pb-3">
          <input value={apiDraft} onChange={e => setApiDraft(e.target.value)} placeholder="https://your-backend.com"
            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
          <button type="button" onClick={() => { const n = setApiUrlOverride(apiDraft); toast.success(`API → ${n}`); window.location.reload(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#6366f1', color: '#fff' }}>Save</button>
          <button type="button" onClick={() => setApiEditOpen(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#334155', color: '#94a3b8' }}>✕</button>
          <button type="button" onClick={() => { clearApiUrlOverride(); toast.success('Reset'); window.location.reload(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#334155', color: '#94a3b8' }}>Reset</button>
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">BillVyapar</h1>
        <p className="text-sm mt-1 font-medium" style={{ color: '#94a3b8' }}>Business Billing &amp; Documentation</p>

        {/* Pill badges */}
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {['GST Invoices', 'Multi-Business', 'Offline Ready'].map(t => (
            <span key={t} className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 flex flex-col justify-start px-5">
        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-lg font-black text-white mb-1">
            {mode === 'auth' ? (isSignUp ? 'Create Account' : 'Welcome Back') : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-xs mb-5" style={{ color: '#64748b' }}>
            {mode === 'auth' ? (isSignUp ? 'Start managing your business' : 'Sign in to your dashboard') : mode === 'forgot' ? 'Enter your email to get an OTP' : 'Enter OTP and new password'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'auth' && isSignUp && (
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
            )}
            {mode === 'auth' && isSignUp && (
              <input type="tel" placeholder="Phone (+91XXXXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />

            {mode === 'forgot' && (
              <div>
                <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>Send OTP via</p>
                <RadioGroup value={otpChannel} onValueChange={v => setOtpChannel(v as any)} className="flex gap-4">
                  {(['sms', 'email', 'both'] as const).map(v => (
                    <div key={v} className="flex items-center gap-1.5">
                      <RadioGroupItem value={v} id={`otp-${v}`} />
                      <Label htmlFor={`otp-${v}`} className="text-xs capitalize" style={{ color: '#94a3b8' }}>{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {mode === 'auth' && (
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
            )}

            {mode === 'reset' && (
              <>
                <input type="text" placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-black transition-all mt-1"
              style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)' }}>
              {loading ? 'Please wait…' : mode === 'forgot' ? 'Send OTP' : mode === 'reset' ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="flex flex-col items-center gap-2 mt-4">
            {mode === 'auth' && !isSignUp && (
              <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                Forgot password?
              </button>
            )}
            {mode !== 'auth' && (
              <button type="button" onClick={() => setMode('auth')} className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                ← Back to sign in
              </button>
            )}
            <button type="button" onClick={() => { setMode('auth'); setIsSignUp(!isSignUp); }}
              className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      <div className="py-6 text-center text-xs" style={{ color: '#334155' }}>© 2025 BillVyapar</div>
    </div>
  );
}
