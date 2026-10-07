import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, StatusBadge, EmptyState } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import { segments } from '../data/segments';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ChevronDown, Info, Search, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

const FilterDropdown = ({ icon: Icon, value, options, onChange, prefix = "" }: { icon?: React.ElementType, value: string, options: string[], onChange: (v: string) => void, prefix?: string }) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button className="h-10 px-3 bg-primary border border-primary hover:border-[var(--border\_hover)] rounded-[10px] shadow-sm transition-shadow focus:outline-none focus:border-primary focus:shadow-[var(--ring\_brand)] flex items-center gap-2 text_sm text-primary">
        {Icon && <Icon className="w-4 h-4 text-secondary" />}
        <span>{prefix}{value}</span>
        <ChevronDown className="w-4 h-4 text-tertiary ml-1" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="bg-elevated border border-secondary shadow-lg rounded-[10px] p-1 min-w-[160px] z-50 flex flex-col gap-1" align="start" sideOffset={4}>
        {options.map(opt => (
          <DropdownMenu.Item 
            key={opt}
            className={`flex items-center px-3 py-2 text_sm rounded-[8px] cursor-pointer outline-none text-primary hover:bg-secondary ${value === opt ? 'font-medium' : ''}`} 
            style={value === opt ? { backgroundColor: 'var(--bg_selected)' } : {}}
            onSelect={() => onChange(opt)}
          >
            {prefix}{opt}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export default function Risk() {
  const { reviewMode } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterRoute, setFilterRoute] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const tabValue = searchParams.get('view') || 'Map';

  const filteredSegments = segments.filter(s => {
    if (filterPriority !== 'All' && s.priority !== filterPriority) return false;
    if (filterRoute !== 'All' && s.route !== filterRoute) return false;
    return true;
  });

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterPriority, filterRoute]);

  const totalPages = Math.ceil(filteredSegments.length / itemsPerPage);
  const paginatedSegments = filteredSegments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return 'var(--bg_error_solid)';
    if (priority === 'Medium') return 'var(--bg_warning_solid)';
    return 'var(--bg_info_solid)';
  };

  const setTab = (value: string) => {
    setSearchParams({ view: value });
  };

  const pageTitle = (
    <div className="flex items-center gap-2">
      Risk overview
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full">
              <Info className="w-5 h-5 text-tertiary hover:text-secondary transition-colors" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="px-3 py-2 bg-elevated text-primary text_sm rounded-[8px] shadow-lg border border-secondary max-w-[300px] z-50 font-normal leading-normal" sideOffset={5}>
              Priority comes from versioned rules on incident history. A risk priority does not establish that damage occurred.
              <Tooltip.Arrow className="fill-[var(--bg\_elevated)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );

  return (
    <div>
      <PageHeader 
        title={pageTitle} 
        description="Where to inspect or protect next, ranked by versioned rules on incident history."
        openQuestion={reviewMode ? "period, granularity and action thresholds." : undefined}
        pageId="FAL_RSK_01"
        roles="Admin, Operator"
      />

      {/* View Tabs */}
      <div className="flex items-center gap-6 border-b border-secondary mb-6 -mt-2">
        <button 
          className={`pb-3 text_sm font-medium transition-colors border-b-2 ${tabValue === 'Map' ? 'border-brand text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => setTab('Map')}
        >
          Map
        </button>
        <button 
          className={`pb-3 text_sm font-medium transition-colors border-b-2 ${tabValue === 'Ranked list' ? 'border-brand text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => setTab('Ranked list')}
        >
          Ranked list
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className={`${tabValue === 'Map' ? 'xl:col-span-8 h-[640px]' : 'xl:col-span-12 h-auto'} app_card p-0 flex flex-col overflow-hidden relative`}>
          <div className="app_toolbar flex-wrap z-10 justify-between items-center w-full">
            <div className="flex items-center gap-4 flex-wrap">
              <FilterDropdown 
                prefix="Priority: "
                value={filterPriority} 
                options={['All', 'High', 'Medium', 'Low']} 
                onChange={(v) => { setFilterPriority(v); }} 
              />
              <FilterDropdown 
                prefix="Route: "
                value={filterRoute} 
                options={['All', 'Route 01', 'Route 02']} 
                onChange={(v) => { setFilterRoute(v); }} 
              />
              
              {/* Map Toolbar Extras (Only visible in Map view) */}
              {tabValue === 'Map' && (
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="h-10 px-3 bg-primary border border-primary hover:border-[var(--border\_hover)] rounded-[10px] shadow-sm transition-shadow focus:outline-none focus:border-primary focus:shadow-[var(--ring\_brand)] flex items-center gap-2 text_sm text-primary">
                      <span>Basemap: Street</span>
                      <ChevronDown className="w-4 h-4 text-tertiary ml-1" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="bg-elevated border border-secondary shadow-lg rounded-[10px] p-2 z-50 flex flex-col gap-1 min-w-[160px]" align="start" sideOffset={4}>
                      <label className="choice px-2 py-2 rounded-[8px] hover:bg-secondary cursor-pointer"><input type="radio" name="basemap" className="radio" defaultChecked /><span className="choice_body"><span className="choice_label text_sm">Street</span></span></label>
                      <label className="choice px-2 py-2 rounded-[8px] hover:bg-secondary cursor-pointer"><input type="radio" name="basemap" className="radio" /><span className="choice_body"><span className="choice_label text_sm">Satellite</span></span></label>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )}
            </div>
            
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Showing {filteredSegments.length} risk segments
            </div>
          </div>
          
          <div className="flex-1 bg-[var(--bg\_map)] relative group overflow-auto">
            {tabValue === 'Map' ? (
              <>
                <svg viewBox="0 0 1000 700" className="w-full h-full object-cover min-h-[500px]">
                  {/* Background */}
                  <rect width="1000" height="700" fill="var(--bg_map)" />
                  <path d="M-50 750 Q 200 600 300 750 Z" fill="var(--bg_success_primary)" opacity="0.5" />
                  
                  {/* Blocks */}
                  <rect x="50" y="50" width="300" height="200" rx="20" fill="var(--map_block)" />
                  <rect x="400" y="50" width="550" height="200" rx="20" fill="var(--map_block)" />
                  <rect x="50" y="300" width="300" height="350" rx="20" fill="var(--map_block)" />
                  <rect x="400" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />
                  <rect x="700" y="300" width="250" height="350" rx="20" fill="var(--map_block)" />

                  <path d="M 375 0 L 375 700 M 0 275 L 1000 275 M 675 275 L 675 700" stroke="var(--map_road)" strokeWidth="50" strokeLinecap="round" />
                  <path d="M 50 650 L 350 400 M 450 650 L 650 400" stroke="var(--map_road)" strokeWidth="16" strokeLinecap="round" />

                  {/* Segments */}
                  {filteredSegments.map((s) => {
                    const isSelected = selectedSegmentId === s.id;
                    const midPoint = s.path[Math.floor(s.path.length / 2)];
                    
                    return (
                      <g key={s.id} onClick={() => setSelectedSegmentId(s.id)} className="cursor-pointer">
                        {isSelected && (
                          <polyline 
                            points={s.path.map((p: number[]) => p.join(',')).join(' ')} 
                            fill="none" 
                            stroke="var(--border_brand)" 
                            strokeWidth="16" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            opacity="0.3"
                          />
                        )}
                        <polyline 
                          points={s.path.map((p: number[]) => p.join(',')).join(' ')} 
                          fill="none" 
                          stroke={getPriorityColor(s.priority)} 
                          strokeWidth="8" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        <g transform={`translate(${midPoint[0]}, ${midPoint[1]})`}>
                          <rect x="-24" y="-10" width="48" height="20" rx="10" fill="var(--bg_primary)" stroke="var(--border_secondary)" />
                          <text y="4" textAnchor="middle" fill="var(--text_primary)" fontSize="10" fontWeight="600">{s.id}</text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Map Controls */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col bg-elevated rounded-[8px] shadow-sm border border-secondary overflow-hidden">
                  <button className="p-2 text-secondary hover:bg-secondary hover:text-primary transition-colors border-b border-secondary" aria-label="Zoom in">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-secondary hover:bg-secondary hover:text-primary transition-colors border-b border-secondary" aria-label="Zoom out">
                    <Minus className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-secondary hover:bg-secondary hover:text-primary transition-colors" aria-label="Fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 bg-elevated border border-secondary rounded-[10px] p-3 shadow-md flex flex-col gap-2 text_xs text-secondary">
                  <div className="font-semibold mb-1">Priority</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-error-solid"></div> High</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-warning-solid"></div> Medium</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-info-solid"></div> Low</div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="app_table_container flex-1 bg-primary overflow-x-auto">
                  <table className="app_table w-full min-w-[900px]">
                    <thead className="border-b border-secondary">
                      <tr>
                        <th>RANK</th>
                        <th>SEGMENT</th>
                        <th>ROUTE</th>
                        <th>SPAN</th>
                        <th>PRIORITY</th>
                        <th>CONFIDENCE</th>
                        <th>BASIS</th>
                        <th>SUGGESTED ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSegments.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <EmptyState icon={Search} title="No segments found" description="Try adjusting your filters" />
                          </td>
                        </tr>
                      ) : (
                        paginatedSegments.map((s, idx) => (
                        <tr key={s.id}>
                          <td className="text-tertiary font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td><span className="font-mono text-brand whitespace-nowrap">{s.id}</span></td>
                          <td className="whitespace-nowrap">{s.route}</td>
                          <td className="whitespace-nowrap text-tertiary">{s.from} to {s.to}</td>
                          <td><StatusBadge kind="priority" value={s.priority} /></td>
                          <td>{s.confidence}</td>
                          <td className="text-tertiary">{s.basis}</td>
                          <td><span className="badge badge_neutral">{s.action}</span></td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
                {filteredSegments.length > 0 && (
                  <div className="p-4 border-t border-secondary flex items-center justify-between bg-primary rounded-b-[16px]">
                    <div className="text_sm text-secondary">
                      Showing <span className="font-medium text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-primary">{Math.min(currentPage * itemsPerPage, filteredSegments.length)}</span> of <span className="font-medium text-primary">{filteredSegments.length}</span> segments
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text_sm text-secondary">
                        Rows per page
                        <div className="relative h-8 bg-transparent border-transparent hover:bg-secondary transition-colors cursor-pointer rounded-[8px] flex items-center">
                          <select 
                            className="h-full pl-2 pr-8 bg-transparent font-medium text-primary cursor-pointer outline-none appearance-none" 
                            value={itemsPerPage} 
                            onChange={e => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <ChevronDown className="absolute right-1 w-4 h-4 text-secondary pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          className="btn btn_tertiary_gray btn_sm w-8 h-8 p-0 flex items-center justify-center rounded-[8px] disabled:opacity-50"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text_sm font-medium w-8 text-center tabular-nums">{currentPage}</div>
                        <button 
                          className="btn btn_tertiary_gray btn_sm w-8 h-8 p-0 flex items-center justify-center rounded-[8px] disabled:opacity-50"
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {tabValue === 'Map' && (
          <div className="xl:col-span-4 app_card p-0 flex flex-col h-[640px] overflow-hidden">
            <div className="p-4 border-b border-secondary bg-elevated z-10">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="h6">Segments to inspect</h5>
              <span className="badge badge_brand">{filteredSegments.length}</span>
            </div>
            <p className="text_xs text-tertiary">Most urgent first based on priority and span confidence.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {filteredSegments.length === 0 ? (
              <EmptyState icon={Search} title="No segments found" description="Try adjusting your filters" />
            ) : (
              filteredSegments.map(s => {
                const isSelected = selectedSegmentId === s.id;
                const confidenceBars = s.confidence === 'High' ? 3 : s.confidence === 'Medium' ? 2 : 1;
              
                return (
                  <div 
                    key={s.id}
                    className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-brand shadow-[var(--ring\_gray)] bg-secondary' : 'bg-primary border-secondary hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedSegmentId(s.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold uppercase tracking-[var(--tracking\_wide)] text-[10px] text-tertiary">SEGMENT</span>
                      <span className="font-mono text_xs text-brand">{s.id}</span>
                    </div>
                    <div className="text_sm font-semibold text-primary mb-2">{s.from} to {s.to}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <StatusBadge kind="priority" value={s.priority} />
                      <span className="badge badge_neutral">{s.route}</span>
                    </div>
                    <div className="text_xs text-secondary flex flex-col gap-1">
                      <div><span className="font-semibold text-primary">Basis:</span> {s.basis}</div>
                      <div className="inline-flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-primary">Confidence:</span> 
                        <span className="text-secondary">{s.confidence}</span>
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3].map(bar => {
                            const isActive = bar <= confidenceBars;
                            let colorClass = 'bg-slate-200 dark:bg-slate-700';
                            if (isActive) {
                               if (s.confidence === 'High') colorClass = 'bg-emerald-600';
                               else if (s.confidence === 'Medium') colorClass = 'bg-amber-500';
                               else colorClass = 'bg-rose-500';
                            }
                            return (
                              <div key={bar} className={`h-[6px] w-[14px] rounded-full transition-colors ${colorClass}`}></div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-3 border-t border-secondary">
                      <button className="btn btn_secondary h-8 flex-1 text_xs font-medium">Investigate</button>
                      <button className="btn btn_secondary_gray h-8 flex-1 text_xs font-medium" onClick={(e) => e.stopPropagation()}>Dismiss</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
