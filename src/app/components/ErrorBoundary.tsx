import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const msg = this.state.error?.message || 'An unexpected error occurred';
      const isAuthError = msg.includes('AuthProvider') || msg.includes('useAuth');

      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
            {/* Animated logo */}
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 16px rgba(79,70,229,0.1)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' }}>
              {isAuthError ? 'Session Error' : 'Something went wrong'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
              {isAuthError
                ? 'Your session could not be loaded. Please refresh the page to continue.'
                : msg}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff',
                  fontSize: 14, fontWeight: 700, boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
