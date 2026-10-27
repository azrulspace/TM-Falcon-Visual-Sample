import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { devices } from '../data/devices';
import { ChevronDown, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiMode } from '@/contexts/UiModeContext';
import { cn } from '@/lib/utils';

export default function CreateDevice() {
  const { reviewMode } = useAppContext();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { id } = useParams();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';
  
  const isEdit = !!id;
  const existingDevice = isEdit ? devices.find(d => d.id === id) : null;

  const [form, setForm] = useState({
    id: existingDevice?.id || `DEV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    name: existingDevice?.name || '',
    type: existingDevice?.type || 'Sensor',
    location: existingDevice?.location || '',
    mac: (existingDevice as any)?.mac || '',
    notes: (existingDevice as any)?.notes || ''
  });

  const [errors, setErrors] = useState<any>({});

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!form.name) newErrors.name = true;
    if (!form.location) newErrors.location = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Please fill in required fields.');
      return;
    }

    addToast('success', isEdit ? 'Device updated.' : 'Device registered.');
    navigate(isEdit ? `/assets/inventory/devices/${form.id}` : '/assets/inventory');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-6 space-y-6">
      <PageHeader 
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} className="-ml-1 text-tertiary hover:text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {isEdit ? `Edit ${form.id}` : "Register new device"}
          </div>
        } 
        breadcrumbs={[
          { label: 'Inventory', href: '/assets/inventory' },
          { label: isEdit ? form.id : 'New device' }
        ]}
        openQuestion={reviewMode ? "device commissioning workflow and MAC validation." : undefined}
        pageId={isEdit ? "FAL_INV_03" : "FAL_INV_02"}
        roles="Admin, System"
      />

      <div className="pb-12">
        <form onSubmit={handleSave} className="app_card p-6 md:p-8">
          
          <div>
            <h4 className="h5 mb-6 text-primary">Device Information</h4>
            <div className={cn("grid gap-6", isPortrait ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
              
              <div className="field">
                <label className="field_label text_sm font-medium text-secondary mb-1">Device ID</label>
                <input 
                  className={cn("w-full px-3 rounded-[10px] border border-secondary bg-secondary text-tertiary text-sm cursor-not-allowed outline-none", isTablet ? "h-11" : "h-10")} 
                  value={form.id} 
                  disabled 
                  readOnly
                />
                <p className="text-xs text-tertiary mt-1">Auto-generated identifier.</p>
              </div>

              <div className="field">
                <label className="field_label text_sm font-medium text-secondary mb-1">Name <span className="text-error">*</span></label>
                <input 
                  className={cn(`w-full px-3 rounded-[10px] border ${errors.name ? 'border-error ring-1 ring-error' : 'border-secondary'} bg-primary text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow`, isTablet ? "h-11" : "h-10")} 
                  placeholder="e.g. Gateway North" 
                  value={form.name} 
                  onChange={e => {setForm({...form, name: e.target.value}); setErrors({...errors, name: false});}} 
                />
              </div>

              <div className="field">
                <label className="field_label text_sm font-medium text-secondary mb-1">Type <span className="text-error">*</span></label>
                <div className={cn("relative bg-primary border border-secondary rounded-[10px] shadow-sm flex items-center", isTablet ? "h-11" : "h-10")}>
                  <select 
                    className="h-full w-full pl-3 pr-8 bg-transparent text-sm outline-none appearance-none cursor-pointer" 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="Gateway">Gateway</option>
                    <option value="Sensor">Sensor</option>
                    <option value="Camera">Camera</option>
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-tertiary pointer-events-none" />
                </div>
              </div>

              <div className="field">
                <label className="field_label text_sm font-medium text-secondary mb-1">MAC Address</label>
                <input 
                  className={cn("w-full px-3 rounded-[10px] border border-secondary bg-primary text-primary text-sm font-mono focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow", isTablet ? "h-11" : "h-10")} 
                  placeholder="00:00:00:00:00:00" 
                  value={form.mac} 
                  onChange={e => setForm({...form, mac: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-6 pt-6">
            <h4 className="h5 mb-6 text-primary">Placement Details</h4>
            <div className={cn("grid gap-6", isPortrait ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
              
              <div className={cn("field", !isPortrait && "md:col-span-2")}>
                <label className="field_label text_sm font-medium text-secondary mb-1">Location description <span className="text-error">*</span></label>
                <div className={cn("relative w-full", isTablet ? "h-11" : "h-10")}>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                  <input 
                    className={cn(`w-full pl-9 pr-3 rounded-[10px] border ${errors.location ? 'border-error ring-1 ring-error' : 'border-secondary'} bg-primary text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow`, isTablet ? "h-11" : "h-10")} 
                    placeholder="e.g. Block A, Roof" 
                    value={form.location} 
                    onChange={e => {setForm({...form, location: e.target.value}); setErrors({...errors, location: false});}} 
                  />
                </div>
              </div>

              <div className="field">
                <label className="field_label text_sm font-medium text-secondary mb-1">Coordinates</label>
                <div className="flex gap-2">
                  <input className={cn("flex-1 px-3 rounded-[10px] border border-secondary bg-secondary text-tertiary text-sm cursor-not-allowed outline-none", isTablet ? "h-11" : "h-10")} placeholder="Lat" disabled readOnly />
                  <input className={cn("flex-1 px-3 rounded-[10px] border border-secondary bg-secondary text-tertiary text-sm cursor-not-allowed outline-none", isTablet ? "h-11" : "h-10")} placeholder="Lng" disabled readOnly />
                </div>
                <p className="text-xs text-tertiary mt-1">Automatically set during field commissioning.</p>
              </div>

              <div className={cn("field", !isPortrait && "md:col-span-2")}>
                <label className="field_label text_sm font-medium text-secondary mb-1">Notes</label>
                <textarea 
                  className="w-full min-h-[90px] p-3 rounded-[10px] border border-secondary bg-primary text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow resize-y" 
                  placeholder="Installation notes..." 
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})} 
                ></textarea>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" className={cn(isTablet && "h-11 px-4 text-sm")} onClick={() => navigate(isEdit ? `/assets/inventory/devices/${form.id}` : '/assets/inventory')}>Cancel</Button>
            <Button type="submit" className={cn(isTablet && "h-11 px-5 text-sm")}>{isEdit ? 'Save changes' : 'Register device'}</Button>
          </div>

        </form>
      </div>
    </div>
  );
}
