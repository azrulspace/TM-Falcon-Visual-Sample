import React, { useState } from 'react';
import { useNavigate, } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff} from 'lucide-react';import { useAppContext } from '../contexts/AppContext';
import * as Dialog from '@radix-ui/react-dialog';
import { useToast } from '../contexts/ToastContext';
import { Logo } from '../components/Logo';
import { accounts, samplePassword } from '../data/accounts';
import signInBg from '../assets/sign-up-in-image.png';

export default function SignIn() {
  const [email, setEmail] = useState('admin@falcon.example');
  const [password, setPassword] = useState('FalconDemo1!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  
  const { setAccountLabel, reviewMode } = useAppContext();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(true);
      return;
    }
    const acc = accounts.find(a => a.email === email);
    if (acc && password === samplePassword) {
      setLoading(true);
      setError(false);
      setTimeout(() => {
        setAccountLabel(acc.label);
        navigate('/overview');
      }, 600);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-primary relative">
      {/* Review Mode Banner for Auth */}
      {reviewMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-brand-primary border border-brand rounded-[10px] text_xs flex gap-4">
          <div><span className="font-semibold">Page:</span> FAL_AUTH_01</div>
          <div><span className="font-semibold">Roles:</span> All</div>
          <div><span className="font-semibold">Question:</span> identity provider to be confirmed.</div>
        </div>
      )}

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-12 overflow-hidden bg-auth-panel">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105" style={{ backgroundImage: `url('${signInBg}')` }}></div>
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-auth_panel via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-auth-panel opacity-30 mix-blend-multiply"></div>
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: "radial-gradient(circle at center, var(--bg_auth_glow), transparent)" }}></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, mixBlendMode: 'overlay' }}></div>
        
        <div className="relative z-10 flex flex-col gap-6 text-white w-full backdrop-blur-md p-8 rounded-3xl bg-black/20 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex justify-start">
            <Logo className="h-8 brightness-0 invert opacity-90" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight mt-2">AI-Powered Utility & Grid Intelligence</h1>
          <p className="text-lg text-white/80">Next-generation asset monitoring and preventive maintenance platform for modern grid infrastructure.</p>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          <Logo className="h-8 mb-8" />
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="text-base text-slate-500 mt-2 mb-8">Enter your credentials to access your account.</p>
          
          <form onSubmit={handleSignIn} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email <span className="text-red-500">*</span></label>
              <div className="relative h-11 w-full flex items-center">
                <Mail className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <input id="email" className={`w-full h-full pl-10 pr-4 rounded-[10px] border ${error && !email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-600 focus:border-indigo-600'} bg-white text-base text-slate-900 focus:outline-none focus:ring-2 transition-shadow`} type="email" placeholder="name@falcon.example" value={email} onChange={e => {setEmail(e.target.value); setError(false);}} />
              </div>
              {error && !email && <p className="text-xs text-red-500">Enter your email address.</p>}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password <span className="text-red-500">*</span></label>
              <div className="relative h-11 w-full flex items-center">
                <Lock className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <input id="password" className={`w-full h-full pl-10 pr-12 rounded-[10px] border ${error && !password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-600 focus:border-indigo-600'} bg-white text-base text-slate-900 focus:outline-none focus:ring-2 transition-shadow`} type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => {setPassword(e.target.value); setError(false);}} />
                <button type="button" className="absolute right-3.5 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && !password && <p className="field_hint is_error">Enter your password.</p>}
            </div>

            {error && email && password && (
              <div className="alert alert_error" role="alert">
                <div className="alert_body"><div className="alert_title">Email or password does not match a sample account.</div></div>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-2">
              <button type="submit" className="w-full h-11 rounded-[10px] bg-slate-950 hover:bg-slate-900 text-white font-medium shadow-sm transition-all flex items-center justify-center" disabled={loading}>
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : null}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-sm font-medium text-slate-400">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button type="button" className="w-full h-11 rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-sm transition-all flex items-center justify-center">Revoke Access</button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-2xl shadow-xl z-50 w-full max-w-md border border-slate-200">
                    <Dialog.Title className="text-lg font-semibold mb-4 text-slate-900">Revoke Access</Dialog.Title>
                      <div className="flex flex-col gap-1.5 mb-6">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative h-11 w-full flex items-center">
                          <Mail className="absolute left-3.5 w-5 h-5 text-slate-400" />
                          <input className="w-full h-full pl-10 pr-4 rounded-[10px] border border-slate-200 bg-white text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-shadow" type="email" placeholder="name@falcon.example" value={recoverEmail} onChange={e => setRecoverEmail(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Dialog.Close asChild>
                          <button className="h-10 px-4 rounded-[10px] border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                        </Dialog.Close>
                        <Dialog.Close asChild>
                          <button className="h-10 px-4 rounded-[10px] bg-slate-950 text-white font-medium hover:bg-slate-900 transition-colors" onClick={() => addToast('info', 'Sample only. No email was sent.')}>Send recovery link</button>
                        </Dialog.Close>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
