import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { FileText, Shield, Cloud, Zap } from 'lucide-react';
import { API_URL, clearApiUrlOverride, getApiUrlOverride, setApiUrlOverride } from '../config/api';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

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
    if (authLoading) return; // wait for auth to initialize
    if (!user) return;       // not logged in — show login form

    // User is logged in — decide where to send them
    try {
      const raw = localStorage.getItem('currentProfile');
      if (raw) {
        const profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (profile?.id) {
          // Has a selected profile — go straight to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    // No profile selected — go to welcome/profiles
    navigate('/welcome', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      setCheckingBackend(true);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000); // 20s — allows Render cold start
        const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        if (cancelled) return;
        setBackendOnline(res.ok);
      } catch {
        if (cancelled) return;
        setBackendOnline(false);
      } finally {
        if (!cancelled) setCheckingBackend(false);
      }
    };

    void check();
    const id = setInterval(check, 30000); // re-check every 30s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (apiEditOpen) setApiDraft(API_URL);
  }, [apiEditOpen]);

  // While auth is initializing, show a blank splash (prevents login form flash)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex flex-col items-center gap-3">
          <FileText className="h-12 w-12 text-blue-600 animate-pulse" />
          <span className="text-lg font-semibold text-blue-700">BillVyapar</span>
        </div>
      </div>
    );
  }

  // Already logged in — don't render the form, navigation effect will redirect
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, channel: otpChannel }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        toast.success('OTP sent (if account exists)');
        setMode('reset');
        setLoading(false);
        return;
      }

      if (mode === 'reset') {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        toast.success('Password reset successful. Please sign in.');
        setMode('auth');
        setIsSignUp(false);
        setPassword('');
        setNewPassword('');
        setOtp('');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          toast.error('Please enter your phone number');
          setLoading(false);
          return;
        }
        const normalizePhone = (raw: string) => {
          const v = String(raw || '').trim();
          if (!v) return v;
          if (v.startsWith('+')) return v;
          const digits = v.replace(/\D/g, '');
          if (!digits) return v;
          if (digits.length === 10) return `+91${digits}`;
          if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
          return v;
        };

        await signUp(email, password, name, normalizePhone(phone));
        toast.success('Account created successfully!');
        // New user — go to welcome to set up first profile
        navigate('/welcome', { replace: true });
        return;
      } else {
        await signIn(email, password);
        toast.success('Signed in successfully!');
      }

      // After sign-in: check if a profile is already selected
      try {
        const raw = localStorage.getItem('currentProfile');
        if (raw) {
          const profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (profile?.id) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      } catch { /* ignore */ }

      // No profile — try to auto-select the first one from the API
      try {
        const tok = localStorage.getItem('accessToken');
        const did = localStorage.getItem('deviceId') || '';
        const res = await fetch(`${API_URL}/profiles`, {
          headers: { Authorization: `Bearer ${tok}`, 'X-Device-ID': did },
        });
        const profiles = await res.json();
        if (Array.isArray(profiles) && profiles.length > 0) {
          localStorage.setItem('currentProfile', JSON.stringify(profiles[0]));
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch { /* ignore */ }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground truncate">
              API: {API_URL}
              {apiOverrideActive ? ' (custom)' : ''}
              {!apiEditOpen ? (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => setApiEditOpen(true)}
                >
                  Change
                </button>
              ) : null}
            </div>
            <div className={`font-medium ${backendOnline ? 'text-green-700' : backendOnline === false ? 'text-red-700' : 'text-yellow-600'}`}>
              {checkingBackend && backendOnline === null ? 'Backend: Connecting…' : backendOnline ? 'Backend: Connected' : backendOnline === false && checkingBackend ? 'Backend: Reconnecting…' : backendOnline === false ? 'Backend: Disconnected' : 'Backend: Unknown'}
            </div>
          </div>

          {apiEditOpen ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={apiDraft}
                onChange={(e) => setApiDraft(e.target.value)}
                placeholder="https://your-backend.com"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const next = setApiUrlOverride(apiDraft);
                  toast.success(`API set to ${next}`);
                  window.location.reload();
                }}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setApiEditOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  clearApiUrlOverride();
                  toast.success('API reset to default');
                  window.location.reload();
                }}
              >
                Reset
              </Button>
            </div>
          ) : null}
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              BillVyapar
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Complete Business Documentation & Billing Ecosystem
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Single-device login enforcement and encrypted data storage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Offline First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Work without internet, auto-sync when online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Multiple Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Manage multiple businesses under one account
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <Shield className="h-7 w-7 text-blue-600 mb-2" />
                  <CardTitle className="text-base">Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Single-device login enforcement and encrypted data storage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Cloud className="h-7 w-7 text-green-600 mb-2" />
                  <CardTitle className="text-base">Offline First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Work without internet, auto-sync when online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-7 w-7 text-green-600 mb-2" />
                  <CardTitle className="text-base">Multiple Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Manage multiple businesses under one account
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>{mode === 'auth' ? (isSignUp ? 'Create Account' : 'Welcome Back') : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}</CardTitle>
              <CardDescription>
                {mode === 'auth' ? (isSignUp 
                  ? 'Sign up to start managing your business documents'
                  : 'Sign in to access your business dashboard') : mode === 'forgot' ? 'Enter your email to receive a password reset OTP' : 'Enter the OTP and new password to reset your password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'auth' && isSignUp && (
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}

                {mode === 'auth' && isSignUp && (
                  <div>
                    <Label htmlFor="phone">Phone (E.164)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+919999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {mode === 'forgot' && (
                  <div>
                    <Label>Send OTP via</Label>
                    <RadioGroup
                      value={otpChannel}
                      onValueChange={(v) => setOtpChannel(v as any)}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="sms" id="otp-sms" />
                        <Label htmlFor="otp-sms" className="text-sm font-normal">
                          SMS
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="email" id="otp-email" />
                        <Label htmlFor="otp-email" className="text-sm font-normal">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="both" id="otp-both" />
                        <Label htmlFor="otp-both" className="text-sm font-normal">
                          Both
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {mode === 'auth' && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                    {isSignUp && (
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 characters
                      </p>
                    )}
                  </div>
                )}

                {mode === 'reset' && (
                  <>
                    <div>
                      <Label htmlFor="otp">OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="1234"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
                

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? 'Please wait...'
                    : mode === 'forgot'
                      ? 'Send OTP'
                      : mode === 'reset'
                        ? 'Reset Password'
                        : isSignUp
                          ? 'Sign Up'
                          : 'Sign In'}
                </Button>

                {mode === 'auth' && !isSignUp && (
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode !== 'auth' && (
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setMode('auth')}
                      className="text-blue-600 hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}
                

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('auth');
                      setIsSignUp(!isSignUp);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}