import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Check, X, Shield, Clock, BarChart3, Receipt, 
  Smartphone, Laptop, CloudOff, FileJson, Lock, Search, Play, Phone 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { TraceLoader } from '../components/TraceLoader';
import { cacheSubscriptionToken, validateSubscriptionTokenOnline } from '../utils/subscriptionValidation';

export function WelcomePage() {
  const navigate = useNavigate();
  const { accessToken, deviceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [checkingProfiles, setCheckingProfiles] = useState(false);
  const currentProfile = JSON.parse(localStorage.getItem('currentProfile') || '{}');
  const profileId = currentProfile?.id;

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      if (profileId) {
        const online = await validateSubscriptionTokenOnline({
          apiUrl: API_URL,
          accessToken: accessToken || '',
          deviceId,
          profileId,
        });
        if (online.ok && online.token) {
          cacheSubscriptionToken(profileId, online.token);
        }

        const res = await fetch(`${API_URL}/subscription/validate`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Device-ID': deviceId,
            'X-Profile-ID': profileId,
          },
        });
        const data = await res.json();
        if (!data?.error && data?.subscription) setSubscription(data.subscription);
      } else {
        const res = await fetch(`${API_URL}/subscription`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Device-ID': deviceId,
          },
        });
        const data = await res.json();
        if (!data?.error) setSubscription(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.endDate ? new Date(subscription.endDate) > new Date() : false;

  useEffect(() => {
    const maybeRedirectToProfiles = async () => {
      if (!accessToken || !deviceId) return;
      if (!isActive) return;
      if (checkingProfiles) return;

      try {
        setCheckingProfiles(true);
        const res = await fetch(`${API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Device-ID': deviceId,
          },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          navigate('/profiles');
        }
      } catch {
        // ignore
      } finally {
        setCheckingProfiles(false);
      }
    };

    if (!loading) {
      maybeRedirectToProfiles();
    }
  }, [accessToken, checkingProfiles, deviceId, isActive, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center fixed inset-0 z-50 bg-white">
        <TraceLoader label="Loading Workspace..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 overflow-x-hidden overflow-y-auto fixed inset-0 z-50">
      
      {/* 1. HERO SECTION WITH CLOUD BACKGROUND */}
      <section className="relative pt-6 pb-20 lg:pt-10 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#1e61db] via-[#4895f5] to-[#f4f8fc]">
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=2000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center'}} />
        
        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl mx-auto px-6 mb-16 flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">BILLVYAPAR<span className="text-blue-200">.</span></h1>
            <div className="hidden md:flex gap-8 text-sm font-semibold text-white drop-shadow-md">
                <a href="#features" className="hover:text-blue-100 transition-colors">Features</a>
                <a href="#compare" className="hover:text-blue-100 transition-colors">Technology</a>
                <a href="#contact" className="hover:text-blue-100 transition-colors">Contact</a>
            </div>
            {isActive ? (
               <button onClick={() => navigate('/profiles')} className="px-5 py-2.5 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">Go to App</button>
            ) : (
               <div className="w-24"></div>
            )}
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 drop-shadow-lg leading-tight">
                Run Your Business, Anywhere.<br className="hidden md:block"/>
                No Internet Required.
            </h2>
            <p className="text-lg md:text-2xl text-blue-50 font-semibold mb-12 drop-shadow-md">
                The Real-Time Financial Command Center for Indian SMEs.
            </p>
            
            {/* Mockup Graphic Area */}
            <div className="relative mx-auto max-w-3xl h-48 sm:h-72 md:h-96 w-full mb-12 flex justify-center items-end px-4">
                <div className="absolute top-1/2 left-4 md:-left-12 -translate-y-1/2 flex items-center gap-3 animate-in fade-in slide-in-from-left duration-1000 z-20">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
                        <CloudOff className="text-blue-600 w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5}/>
                    </div>
                    <span className="text-blue-900 font-bold shadow-lg px-3 py-1.5 bg-white rounded-lg hidden lg:block text-sm">Offline Mode</span>
                </div>
                
                <div className="relative z-10 w-full md:w-[85%] aspect-video bg-slate-900 rounded-t-xl sm:rounded-t-3xl shadow-2xl overflow-hidden border-[6px] sm:border-[12px] border-b-0 border-slate-800 flex items-center justify-center">
                     <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop" alt="Dashboard" className="w-full h-full object-cover object-top opacity-90"/>
                </div>
                
                <div className="absolute bottom-4 right-4 sm:bottom-12 sm:-right-8 w-1/4 sm:w-[25%] aspect-[9/19] bg-slate-900 rounded-2xl shadow-2xl border-[4px] sm:border-[6px] border-slate-800 z-20 overflow-hidden transform rotate-2">
                     <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop" alt="Mobile Dashboard" className="w-full h-full object-cover object-center opacity-90"/>
                </div>

                <div className="absolute top-1/3 right-4 md:-right-8 -translate-y-1/2 flex items-center gap-3 animate-in fade-in slide-in-from-right duration-1000 z-20">
                    <span className="text-emerald-900 font-bold shadow-lg px-3 py-1.5 bg-white rounded-lg hidden lg:block text-sm">GST Compliant</span>
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
                        <Shield className="text-emerald-500 w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5}/>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => {
                      if(isActive) navigate('/profiles');
                      else document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors shadow-xl shadow-blue-900/30 w-full sm:w-auto"
                >
                    {isActive ? 'Access Application' : 'Get Started'}
                </button>
                {!isActive && (
                  <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 rounded-xl bg-white/10 text-white border-2 border-white font-bold text-lg hover:bg-white/20 transition-colors flex justify-center items-center gap-2 w-full sm:w-auto backdrop-blur-md"
                  >
                      <Play className="w-5 h-5 fill-current"/> Watch Demo
                  </button>
                )}
            </div>
        </div>
      </section>

      {/* 2. FEATURES RIBBON */}
      <section id="features" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {[
                { icon: CloudOff, title: "Offline-First Power", desc: "Work seamlessly without internet" },
                { icon: Receipt, title: "End-to-End Billing", desc: "Quotations to Invoices to Payments" },
                { icon: Lock, title: "Secure Vault Access", desc: "Device-Locked Enterprise Security" },
                { icon: BarChart3, title: "Real-Time Insights", desc: "Live Financial Dashboards" }
            ].map((f, i) => (
                <div key={i} className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center mb-4 transform hover:scale-110 transition-transform">
                        <f.icon strokeWidth={2} className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{f.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">{f.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* 3. STATS SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-center text-2xl md:text-3xl font-black text-slate-800 mb-12 flex items-center justify-center gap-4">
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
                Why Indian SMEs Choose BillVyapar
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100 divide-x divide-slate-100">
                {[
                    { label: "India's SMEs", value: "60M+" },
                    { label: "Poor Internet Zones", value: "40%" },
                    { label: "GST Filers", value: "20M" },
                    { label: "Downtime Operations", value: "Zero" }
                ].map((s, i) => (
                    <div key={i} className="px-4">
                        <div className="text-3xl md:text-5xl font-black text-blue-600 tracking-tight mb-2">{s.value}</div>
                        <div className="text-slate-600 font-medium text-sm">{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. COMPARISON TABLE */}
      <section id="compare" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-center text-2xl md:text-3xl font-black text-slate-800 mb-12 flex items-center justify-center gap-4">
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
                Beyond Traditional Tools
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
            </h2>

            <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-200">
                <table className="w-full text-left text-sm md:text-base border-collapse">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-4 md:p-6 font-bold text-slate-800 border-b border-r border-slate-200 bg-blue-600 text-white text-lg text-center">BillVyapar</th>
                            <th className="p-4 md:p-6 font-bold text-slate-800 border-b border-r border-slate-200 text-center">Tally & Vyapar</th>
                            <th className="p-4 md:p-6 font-bold text-slate-800 border-b border-slate-200 text-center">Zoho Books</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr className="border-b border-slate-200">
                            <td className="p-4 md:p-6 border-r border-slate-200 bg-blue-50/30">
                                <span className="flex items-center gap-3 font-bold text-slate-800"><Check className="text-emerald-500 w-5 h-5"/> Offline-First Sync</span>
                            </td>
                            <td className="p-4 md:p-6 border-r border-slate-200 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><X className="text-red-500 w-5 h-5"/> Limited Offline</span>
                            </td>
                            <td className="p-4 md:p-6 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><X className="text-red-500 w-5 h-5"/> Cloud-Only</span>
                            </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="p-4 md:p-6 border-r border-slate-200 bg-blue-50/30">
                                <span className="flex items-center gap-3 font-bold text-slate-800"><Check className="text-emerald-500 w-5 h-5"/> Automated GST</span>
                            </td>
                            <td className="p-4 md:p-6 border-r border-slate-200 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><X className="text-red-500 w-5 h-5"/> Manual GST Entry</span>
                            </td>
                            <td className="p-4 md:p-6 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><Check className="text-emerald-500 w-5 h-5"/> GST Automation</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="p-4 md:p-6 border-r border-slate-200 bg-blue-50/30">
                                <span className="flex items-center gap-3 font-bold text-slate-800"><Check className="text-emerald-500 w-5 h-5"/> Enterprise Security</span>
                            </td>
                            <td className="p-4 md:p-6 border-r border-slate-200 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><X className="text-red-500 w-5 h-5"/> Basic Security</span>
                            </td>
                            <td className="p-4 md:p-6 text-slate-600 text-center">
                                <span className="flex items-center justify-center gap-2"><X className="text-red-500 w-5 h-5"/> Weak Security</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </section>

      {/* 5. WORKFLOW HIGHLIGHTS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-center text-2xl md:text-3xl font-black text-slate-800 mb-12 flex items-center justify-center gap-4">
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
                Transform Your Business Workflow
                <span className="h-px bg-slate-300 flex-1 hidden sm:block"></span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transform hover:-translate-y-1 transition-all">
                    <div className="aspect-[4/3] bg-slate-100 relative">
                        <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80" alt="Offline Billing" className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="font-bold text-slate-800">Offline Billing & Sync</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transform hover:-translate-y-1 transition-all">
                    <div className="aspect-[4/3] bg-slate-100 relative">
                        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80" alt="Inventory Management" className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="font-bold text-slate-800">Smart Inventory Management</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transform hover:-translate-y-1 transition-all">
                    <div className="aspect-[4/3] bg-slate-100 relative">
                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" alt="Financial Analytics" className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="font-bold text-slate-800">Real-Time Financial Analytics</h3>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 6. CTA / CONTACT SECTION */}
      <section id="contact" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                Ready for a Smarter Financial System?
            </h2>
            <p className="text-slate-600 text-lg mb-12">
                Join the Next Generation of Indian Business Management.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6 mb-16">
                <a href="tel:+917987412361" className="flex items-center gap-4 p-4 md:px-8 md:py-6 rounded-2xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:bg-blue-100 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5"/>
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Sales & Demo</div>
                        <div className="text-xl font-bold text-slate-800">Sahil Jain</div>
                        <div className="text-blue-600 font-bold">+91 79874 12361</div>
                    </div>
                </a>
                <a href="tel:+917869189465" className="flex items-center gap-4 p-4 md:px-8 md:py-6 rounded-2xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:bg-blue-100 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5"/>
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Enterprise Setup</div>
                        <div className="text-xl font-bold text-slate-800">Anurag Jain</div>
                        <div className="text-blue-600 font-bold">+91 78691 89465</div>
                    </div>
                </a>
            </div>

            <p className="text-sm text-slate-400 font-medium pb-8">
                © {new Date().getFullYear()} BillVyapar. All rights reserved.
            </p>
        </div>
      </section>

    </div>
  );
}
