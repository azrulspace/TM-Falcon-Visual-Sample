import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Check, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import signInBg from '../assets/sign-up-in-image.png';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', role: 'Operator', password: '', confirm: '', check: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  const { reviewMode } = useAppContext();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!form.name) newErrors.name = true;
    if (!form.email || !form.email.includes('@')) newErrors.email = true;
    if (form.password.length < 8 || !/\d/.test(form.password)) newErrors.password = true;
    if (form.password !== form.confirm) newErrors.confirm = true;
    if (!form.check) newErrors.check = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addToast('success', 'Sample account created.');
    navigate('/signin');
  };

  return (
    <div className="flex min-h-screen bg-primary relative">
      {reviewMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-brand-primary border border-brand rounded-[10px] text_xs flex gap-4">
          <div><span className="font-semibold">Page:</span> FAL_AUTH_02</div>
          <div><span className="font-semibold">Roles:</span> All</div>
          <div><span className="font-semibold">Question:</span> approval flow for new accounts.</div>
        </div>
      )}

      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-12 overflow-hidden bg-auth-panel">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105" style={{ backgroundImage: `url('${signInBg}')` }}></div>
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-auth_panel via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-auth-panel opacity-30 mix-blend-multiply"></div>
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: "radial-gradient(circle at center, var(--bg_auth_glow), transparent)" }}></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, mixBlendMode: 'overlay' }}></div>
        
        <div className="relative z-10 flex flex-col gap-6 text-white max-w-lg backdrop-blur-md p-8 rounded-3xl bg-black/20 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="inline-flex px-3 py-1 border border-white/30 rounded-full text_xs font-semibold tracking-wide self-start bg-white/10 backdrop-blur-md">SAMPLE ACCOUNT</div>
          <h1 className="display_xl font-semibold tracking-tight">Create your sample account</h1>
          <div className="flex flex-col gap-4 mt-4">
            {["Explore every prototype page", "No real data is stored", "Switch between light and dark mode"].map(text => (
              <div key={text} className="flex items-center gap-3 text_lg text-sidebar-muted">
                <Check className="w-6 h-6 text-brand" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          <h2 className="display_sm font-semibold text-primary">Create sample account</h2>
          <p className="text_md text-tertiary mt-2 mb-8">This creates a local sample account for the demo only.</p>
          
          <form onSubmit={handleSignUp} className="flex flex-col gap-6">
            <div className="field">
              <label className="field_label">Full name <span className="field_required">*</span></label>
              <div className={`input ${errors.name ? 'is_error' : ''}`}>
                <User className="input_icon" />
                <input className="input_field" placeholder="Jane Doe" value={form.name} onChange={e => {setForm({...form, name: e.target.value}); setErrors({...errors, name: false})}} />
              </div>
            </div>

            <div className="field">
              <label className="field_label">Work email <span className="field_required">*</span></label>
              <div className={`input ${errors.email ? 'is_error' : ''}`}>
                <Mail className="input_icon" />
                <input className="input_field" type="email" placeholder="name@falcon.example" value={form.email} onChange={e => {setForm({...form, email: e.target.value}); setErrors({...errors, email: false})}} />
              </div>
            </div>

            <div className="field">
              <label className="field_label">Role <span className="field_required">*</span></label>
              <div className="input">
                <select className="input_field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="Operator">Operator</option>
                  <option value="Field">Field</option>
                  <option value="System">System</option>
                </select>
                <ChevronDown className="input_icon" />
              </div>
            </div>
            
            <div className="field">
              <label className="field_label">Password <span className="field_required">*</span></label>
              <div className={`input ${errors.password ? 'is_error' : ''}`}>
                <Lock className="input_icon" />
                <input className="input_field" type={showPassword ? "text" : "password"} placeholder="Create password" value={form.password} onChange={e => {setForm({...form, password: e.target.value}); setErrors({...errors, password: false})}} />
                <button type="button" className="input_action" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className={`field_hint ${errors.password ? 'is_error' : ''}`}>At least 8 characters with one number.</p>
            </div>

            <div className="field">
              <label className="field_label">Confirm password <span className="field_required">*</span></label>
              <div className={`input ${errors.confirm ? 'is_error' : ''}`}>
                <Lock className="input_icon" />
                <input className="input_field" type="password" placeholder="Confirm password" value={form.confirm} onChange={e => {setForm({...form, confirm: e.target.value}); setErrors({...errors, confirm: false})}} />
              </div>
              {errors.confirm && <p className="field_hint is_error">Passwords do not match.</p>}
            </div>

            <label className="choice mt-2">
              <input type="checkbox" className={`check ${errors.check ? 'is_error' : ''}`} checked={form.check} onChange={e => {setForm({...form, check: e.target.checked}); setErrors({...errors, check: false})}} />
              <span className="choice_body">
                <span className="choice_label">I understand this is a sample access demonstration.</span>
              </span>
            </label>

            <div className="flex flex-col gap-4 mt-4">
              <button type="submit" className="btn btn_primary btn_lg w-full">Create account</button>
              <div className="text-center">
                <span className="text_sm text-secondary">Already have an account? </span>
                <Link to="/signin" className="btn_text text_sm font-medium p-1">Sign in</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
