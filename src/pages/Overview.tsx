import { useState } from 'react';
import { PageHeader, StatCard, SegmentedControl, StatusBadge } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import MapCanvas from '../components/MapCanvas';
import { attention } from '../data/attention';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, AlertCircle, Briefcase, RadioReceiver, SlidersHorizontal } from 'lucide-react';

const defaultFilters = {
  basemap: 'Street',
  layers: ['Routes', 'Devices']
};

export default function Overview() {
  const { reviewMode } = useAppContext();
  const [timeMode, setTimeMode] = useState('Active now');
  const [showMode, setShowMode] = useState('Operations');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open) {
      setDraftFilters(appliedFilters);
    }
  };

  const isDirty = JSON.stringify(appliedFilters) !== JSON.stringify(draftFilters);
  const isResetDisabled = draftFilters.layers.length === 0 && draftFilters.basemap === 'Street';
  const activeBadgeCount = appliedFilters.layers.length;

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPopoverOpen(false);
  };

  const handleReset = () => {
    setDraftFilters({ basemap: 'Street', layers: [] });
  };

  const toggleLayer = (layer: string) => {
    setDraftFilters(prev => ({
      ...prev,
      layers: prev.layers.includes(layer) 
        ? prev.layers.filter(l => l !== layer) 
        : [...prev.layers, layer]
    }));
  };

  const attentionList = timeMode === 'Active now' 
    ? attention 
    : attention.filter(a => ['EVT_0006', 'CAS_0000'].includes(a.id));

  return (
    <div>
      <PageHeader 
        title="Overview" 
        description={<><strong className="font-semibold text-primary">Active now:</strong> All unresolved events and open cases, regardless of date. Device health shows current status.</>}
        openQuestion={reviewMode ? "refresh interval for device health." : undefined}
        pageId="FAL_OVR_01"
        roles="Admin, Operator, Field, System"
      />

      <div className="grid grid-cols-3 gap-4 w-full mb-6">
        <StatCard overline="NEW EVENTS" number="3" helper="Not yet acknowledged" accent="error" icon={AlertCircle} onShowMap={() => {}} />
        <StatCard overline="OPEN CASES" number="1" helper="Follow up not yet closed" accent="brand" icon={Briefcase} onShowMap={() => {}} />
        <StatCard overline="DEVICE ISSUES" number="4" helper="Offline or stale now" accent="warning" icon={RadioReceiver} onShowMap={() => {}} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 app_card p-0 flex flex-col h-[640px] overflow-hidden relative">
          <div className="flex items-center justify-between w-full px-5 py-4 overflow-hidden border-b border-secondary z-10 bg-primary">
            <div className="flex items-center gap-3 shrink-0">
              <SegmentedControl options={['Active now', 'History']} value={timeMode} onChange={setTimeMode} />
              <SegmentedControl options={['Operations', 'Infrastructure']} value={showMode} onChange={setShowMode} />
              {timeMode === 'History' && <span className="badge badge_neutral">Sample history</span>}
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <Popover.Root open={popoverOpen} onOpenChange={handleOpenChange}>
                <Popover.Trigger asChild>
                  <button className="h-10 box-border px-3.5 bg-primary border border-secondary hover:border-[var(--border\_hover)] rounded-[10px] shadow-sm transition-shadow focus:outline-none focus:border-primary focus:shadow-[var(--ring\_brand)] flex items-center gap-2 text-sm font-medium leading-none text-primary">
                    <SlidersHorizontal className="w-4 h-4 text-tertiary" />
                    <span>Map view</span>
                    {activeBadgeCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full badge_brand ml-1.5">{activeBadgeCount}</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-tertiary ml-0.5" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content className="bg-elevated border border-secondary rounded-[12px] shadow-lg p-0 z-50 flex flex-col w-[320px] max-h-[min(500px,calc(100vh-250px))]" sideOffset={8} align="end">
                    
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                      <div className="flex flex-col gap-3">
                        <div className="text-xs font-semibold text-tertiary uppercase tracking-wider">Basemap</div>
                        <div className="flex flex-col gap-2">
                          {['Street', 'Satellite', 'Dark', 'Light'].map(bm => (
                            <label key={bm} className="choice">
                              <input type="radio" name="basemap" className="radio" checked={draftFilters.basemap === bm} onChange={() => setDraftFilters(p => ({ ...p, basemap: bm }))} />
                              <span className="choice_body"><span className="choice_label text_sm">{bm}</span></span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-secondary pt-4 flex flex-col gap-3">
                        <div className="text-xs font-semibold text-tertiary uppercase tracking-wider">Layers</div>
                        <div className="flex flex-col gap-2">
                          {['Routes', 'Devices', 'Poles', 'Cable spans', 'Hazard zones'].map(lyr => (
                            <label key={lyr} className="choice">
                              <input type="checkbox" className="check" checked={draftFilters.layers.includes(lyr)} onChange={() => toggleLayer(lyr)} />
                              <span className="choice_body"><span className="choice_label text_sm">{lyr}</span></span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-secondary pt-4 flex flex-col gap-3 pb-2">
                        <div className="text-xs font-semibold text-tertiary uppercase tracking-wider">Legend</div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text_sm text-secondary">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success-solid"></div> Online</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-error-solid"></div> Offline</div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-solid"></div> Stale</div>
                          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-brand-solid text-white text-[10px] flex items-center justify-center font-bold">3</div> Cluster</div>
                          <div className="flex items-center gap-2 col-span-2 mt-1"><div className="w-4 h-1 bg-[var(--map\_route)] rounded-full"></div> Route</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-tertiary border-t border-secondary flex items-center justify-between shrink-0 rounded-b-[12px]">
                      <button 
                        className="btn btn_text !px-0 disabled:opacity-40 disabled:cursor-not-allowed" 
                        disabled={isResetDisabled}
                        onClick={handleReset}
                      >
                        Reset
                      </button>
                      <button 
                        className="btn btn_secondary h-8 px-3 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!isDirty}
                        onClick={handleApply}
                      >
                        Apply
                      </button>
                    </div>

                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-[var(--bg\_map)]">
            <MapCanvas 
              mode={timeMode === 'History' ? 'history' : showMode.toLowerCase()} 
              selectedId={selectedId} 
              onMarkerClick={(id: string) => setSelectedId(id)} 
            />
          </div>
        </div>

        <div className="xl:col-span-1 app_card p-0 flex flex-col h-[640px] overflow-hidden">
          <div className="p-4 border-b border-secondary bg-elevated z-10">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="h6">Needs attention</h5>
              <span className="badge badge_brand">{attentionList.length}</span>
            </div>
            <p className="text_xs text-tertiary">Most urgent first. An event followed in a case is listed once, as its case.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {attentionList.map((item, i) => {
              const isSelected = selectedId === item.marker;
              return (
                <div 
                  key={i} 
                  className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-brand shadow-[var(--ring\_gray)] bg-secondary' : 'bg-primary border-secondary hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedId(item.marker)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold uppercase tracking-[var(--tracking\_wide)] text-[10px] text-tertiary">{item.kind}</span>
                    <span className="font-mono text_xs text-brand">{item.id}</span>
                  </div>
                  <div className="text_sm font-semibold text-primary mb-2">{item.title}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.badges.map(b => (
                      <StatusBadge key={b} kind={item.kind === 'DEVICE' ? 'device' : item.kind === 'CASE' ? 'case' : 'priority'} value={b} />
                    ))}
                  </div>
                  <div className="text_xs text-secondary mb-1">{item.detail}</div>
                  <div className="text_xs">
                    <span className="font-semibold text-secondary">Why: </span>
                    <span className="text-tertiary">{item.why}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-3 border-t border-secondary">
                    <button className="btn btn_secondary btn_sm flex-1 text_xs">Investigate</button>
                    <button className="btn btn_secondary_gray btn_sm flex-1 text_xs" onClick={(e) => { e.stopPropagation(); }}>Dismiss</button>
                  </div>
                </div>
              );
            })}
            {attentionList.length === 0 && (
              <div className="text-center p-8 text-tertiary text_sm">
                No items need attention.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
