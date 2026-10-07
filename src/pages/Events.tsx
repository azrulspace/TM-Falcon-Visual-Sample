import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, StatusBadge, EmptyState } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { events as initialEvents } from '../data/events';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  ChevronDown, Search, Info, Calendar,
  ArrowUpDown, ArrowDown, ArrowUp,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';

// A custom dropdown filter to avoid native select popup styling issues
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

export default function Events() {
  const { reviewMode } = useAppContext();
  const { addToast } = useToast();
  
  const [events, setEvents] = useState(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [filterCase, setFilterCase] = useState('All');
  const [dateRange, setDateRange] = useState('Last 24h');
  const [openOnly, setOpenOnly] = useState(false);
  
  type SortConfig = { key: string, direction: 'asc' | 'desc' } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'captured', direction: 'desc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('Team A (sample)');

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterPriority !== 'All' && e.priority !== filterPriority) return false;
      if (filterState !== 'All' && e.state !== filterState) return false;
      if (filterCase === 'With case' && !e.caseId) return false;
      if (filterCase === 'No case' && e.caseId) return false;
      if (openOnly && e.state === 'Closed') return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !e.id.toLowerCase().includes(q) &&
          !e.type.toLowerCase().includes(q) &&
          !(e.device && e.device.toLowerCase().includes(q)) &&
          !(e.asset && e.asset.toLowerCase().includes(q)) &&
          !(e.caseId && e.caseId.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      let valA = (a as any)[sortConfig.key] || '';
      let valB = (b as any)[sortConfig.key] || '';
      
      if (sortConfig.key === 'captured') {
        valA = a.captured;
        valB = b.captured;
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [events, filterPriority, filterState, filterCase, openOnly, searchQuery, sortConfig]);

  const totalFiltered = filteredEvents.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const newInViewCount = filteredEvents.filter(e => e.state === 'New').length;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: string, className?: string }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className={`cursor-pointer hover:bg-row-hover transition-colors select-none group ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          <div className="flex flex-col opacity-0 group-hover:opacity-50 transition-opacity aria-selected:opacity-100" aria-selected={isActive}>
            {isActive ? (
              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-brand" /> : <ArrowDown className="w-3 h-3 text-brand" />
            ) : (
              <ArrowUpDown className="w-3 h-3" />
            )}
          </div>
        </div>
      </th>
    );
  };

  const handleAcknowledge = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, state: 'Acknowledged' } : e));
    addToast('success', `${id} acknowledged.`);
  };

  const handleBulkAcknowledgeAll = () => {
    let ackCount = 0;
    setEvents(events.map(e => {
      if (filteredEvents.some(f => f.id === e.id) && e.state === 'New') {
        ackCount++;
        return { ...e, state: 'Acknowledged' };
      }
      return e;
    }));
    if (ackCount > 0) addToast('success', `${ackCount} events acknowledged.`);
  };

  const handleAssign = () => {
    if (assignTargetIds.length > 0) {
      setEvents(events.map(e => assignTargetIds.includes(e.id) ? { ...e, state: 'Assigned' } : e));
      addToast('success', `${assignTargetIds.length} event(s) assigned to ${selectedTeam}.`);
      setAssignTargetIds([]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPriority('All');
    setFilterState('All');
    setFilterCase('All');
    setDateRange('Last 24h');
    setOpenOnly(false);
    setCurrentPage(1);
  };

  const headerTitle = (
    <div className="flex items-center gap-2">
      Event inbox
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="text-tertiary hover:text-primary transition-colors focus:outline-none">
              <Info className="w-4 h-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="bg-elevated border border-secondary shadow-lg rounded-[8px] p-3 text_sm text-primary max-w-[250px] z-50" sideOffset={4}>
              Event states, and individual or team acknowledgement
              <Tooltip.Arrow className="fill-[var(--bg\_elevated)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );

  const headerActions = (
    <button 
      className="btn btn_primary btn_md shadow-sm" 
      disabled={newInViewCount === 0}
      onClick={handleBulkAcknowledgeAll}
    >
      {newInViewCount === 0 ? "All in view acknowledged" : `Acknowledge ${newInViewCount} new in view`}
    </button>
  );

  return (
    <div className="pb-10">
      <PageHeader 
        title={headerTitle} 
        description="Events raised from accepted observations. Open an event to review its evidence and decide whether it needs a case."
        openQuestion={reviewMode ? "team acknowledgement rules." : undefined}
        pageId="FAL_EVT_01"
        roles="Admin, Operator"
        actions={headerActions}
      />

      {/* Free-floating Filter Bar */}
      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-4 min-w-max animate-in fade-in duration-200">
          {/* Global Search */}
          <div className="relative w-[340px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input 
              type="text" 
              className="w-full h-10 pl-9 pr-3 text_sm bg-primary border border-primary hover:border-[var(--border\_hover)] rounded-[10px] shadow-sm transition-shadow focus:outline-none focus:border-primary focus:shadow-[var(--ring\_brand)]" 
              placeholder="Search by Event ID, Type, Device, or Asset..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3 shrink-0">
            <FilterDropdown 
              icon={Calendar} 
              value={dateRange} 
              options={['Last 24h', 'Last 7 days', 'Last 30 days']} 
              onChange={(v) => { setDateRange(v); setCurrentPage(1); }} 
            />
            <FilterDropdown 
              prefix="Priority: "
              value={filterPriority} 
              options={['All', 'High', 'Medium', 'Low']} 
              onChange={(v) => { setFilterPriority(v); setCurrentPage(1); }} 
            />
            <FilterDropdown 
              prefix="State: "
              value={filterState} 
              options={['All', 'New', 'Acknowledged', 'Assigned', 'Closed']} 
              onChange={(v) => { setFilterState(v); setCurrentPage(1); }} 
            />
            <FilterDropdown 
              prefix="Case: "
              value={filterCase} 
              options={['All', 'With case', 'No case']} 
              onChange={(v) => { setFilterCase(v); setCurrentPage(1); }} 
            />
          </div>
          
          <label className="choice flex items-center mb-0 mt-0 cursor-pointer pl-1 shrink-0">
            <input type="checkbox" className="check" checked={openOnly} onChange={e => { setOpenOnly(e.target.checked); setCurrentPage(1); }} />
            <span className="choice_label text_sm ml-2">Open only</span>
          </label>
        </div>
      </div>

      <div className="app_card p-0 overflow-hidden flex flex-col shadow-sm">
        {filteredEvents.length > 0 ? (
          <>
            <div className="app_table_container flex-1 min-h-[300px]">
              <table className="app_table">
                <thead>
                  <tr className="border-b border-secondary">
                    <SortableHeader label="EVENT" sortKey="id" className="pl-5" />
                    <SortableHeader label="CAPTURED" sortKey="captured" />
                    <SortableHeader label="TYPE" sortKey="type" />
                    <SortableHeader label="DEVICE" sortKey="device" />
                    <SortableHeader label="ASSET" sortKey="asset" />
                    <SortableHeader label="PRIORITY" sortKey="priority" />
                    <SortableHeader label="STATE" sortKey="state" />
                    <SortableHeader label="CASE" sortKey="caseId" />
                    <th className="text-right w-48 pr-5">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map(e => (
                    <tr key={e.id}>
                      <td className="pl-5">
                        <Link to="/planned/event" className="font-semibold text-brand hover:underline transition-colors">
                          {e.id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">{e.captured}</td>
                      <td className="whitespace-nowrap">{e.type}</td>
                      <td>
                        {e.device ? (
                          <Link to={`/assets/inventory/devices/${e.device}`} className="font-semibold text-primary hover:text-brand hover:underline transition-colors">
                            {e.device}
                          </Link>
                        ) : <span className="text-quaternary">-</span>}
                      </td>
                      <td>
                        <Link to={`/planned/asset`} className="font-semibold text-primary hover:text-brand hover:underline transition-colors">
                          {e.asset}
                        </Link>
                      </td>
                      <td><StatusBadge kind="priority" value={e.priority} /></td>
                      <td><StatusBadge kind="state" value={e.state} /></td>
                      <td>
                        {e.caseId ? (
                          <Link to={`/planned/case`} className="font-semibold text-primary hover:text-brand hover:underline transition-colors">
                            {e.caseId}
                          </Link>
                        ) : <span className="text-quaternary">-</span>}
                      </td>
                      <td className="text-right pr-5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {e.state === 'New' && (
                            <>
                              <button className="btn btn_secondary btn_sm px-3" onClick={() => handleAcknowledge(e.id)}>Acknowledge</button>
                              <button className="btn btn_secondary_gray btn_sm px-3" onClick={() => setAssignTargetIds([e.id])}>Assign</button>
                            </>
                          )}
                          {e.state === 'Acknowledged' && (
                            <button className="btn btn_secondary btn_sm px-3" onClick={() => setAssignTargetIds([e.id])}>Assign</button>
                          )}
                          {e.state === 'Assigned' && (
                            <Link to="/planned/case" className="btn btn_text btn_sm px-3 flex items-center gap-1">
                              View Case <ExternalLink className="w-3 h-3 opacity-70" />
                            </Link>
                          )}
                          {e.state === 'Closed' && (
                            <span className="text-quaternary mr-2">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-secondary flex items-center justify-between bg-primary rounded-b-[16px]">
              <div className="text_sm text-secondary">
                Showing <span className="font-medium text-primary">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-primary">{Math.min(currentPage * rowsPerPage, totalFiltered)}</span> of <span className="font-medium text-primary">{totalFiltered}</span> events
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text_sm text-secondary">
                  Rows per page
                  <div className="relative h-8 bg-transparent border-transparent hover:bg-secondary transition-colors cursor-pointer rounded-[8px] flex items-center">
                    <select 
                      className="h-full pl-2 pr-8 bg-transparent font-medium text-primary cursor-pointer outline-none appearance-none" 
                      value={rowsPerPage} 
                      onChange={e => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
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
          </>
        ) : (
          <EmptyState 
            icon={Search} 
            title="No events found" 
            description="No events match these filters." 
            action={<button className="btn btn_tertiary_gray btn_md" onClick={clearFilters}>Clear filters</button>} 
          />
        )}
      </div>

      <Dialog.Root open={assignTargetIds.length > 0} onOpenChange={(open) => !open && setAssignTargetIds([])}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-overlay z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-elevated p-6 rounded-[16px] shadow-2xl z-50 w-full max-w-md border border-secondary">
            <Dialog.Title className="h4 mb-2 text-primary">Assign event{assignTargetIds.length > 1 ? 's' : ''}</Dialog.Title>
            <Dialog.Description className="text-secondary text_sm mb-6">
              You are assigning {assignTargetIds.length} event{assignTargetIds.length > 1 ? 's' : ''}.
            </Dialog.Description>
            <div className="field mb-6">
              <label className="field_label">Team</label>
              <div className="relative h-10 bg-primary border border-secondary rounded-[10px] shadow-sm flex items-center">
                <select className="h-full w-full pl-3 pr-8 bg-transparent outline-none appearance-none cursor-pointer" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
                  <option value="Team A (sample)">Team A (sample)</option>
                  <option value="Team B (sample)">Team B (sample)</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-tertiary pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="btn btn_secondary_gray btn_md">Cancel</button>
              </Dialog.Close>
              <button className="btn btn_primary btn_md" onClick={handleAssign}>Assign</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
