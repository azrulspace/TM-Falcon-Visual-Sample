import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge, EmptyState } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import { devices as initialDevices } from '../data/devices';
import { Plus, ChevronDown, Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Inventory() {
  const { reviewMode } = useAppContext();
  const navigate = useNavigate();
  
  const [devices] = useState(initialDevices);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredDevices = devices.filter(d => {
    if (filterType !== 'All' && d.type !== filterType) return false;
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    if (search && !d.id.toLowerCase().includes(search.toLowerCase()) && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = key === 'device' ? a.id : a[key as keyof typeof a];
    const bVal = key === 'device' ? b.id : b[key as keyof typeof b];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalFiltered = sortedDevices.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);
  const paginatedDevices = sortedDevices.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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

  return (
    <div>
      <PageHeader 
        title="Inventory register" 
        description="All physical devices configured in the system."
        openQuestion={reviewMode ? "device types and bulk import requirements." : undefined}
        pageId="FAL_INV_01"
        roles="Admin, System"
        actions={
          <button className="btn btn_primary btn_md" onClick={() => navigate('/assets/inventory/devices/new')}>
            <Plus className="w-4 h-4" /> Add device
          </button>
        }
      />

      <div className="app_card p-0 overflow-hidden mt-6">
        <div className="p-4 border-b border-secondary bg-elevated flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="relative h-10 w-full max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input 
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-secondary bg-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow" 
                placeholder="Search by ID or name..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="relative h-10 bg-primary border border-secondary rounded-[10px] shadow-sm flex items-center min-w-[140px]">
              <select className="h-full w-full pl-3 pr-8 bg-transparent text-sm outline-none appearance-none cursor-pointer" value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                <option value="All">All types</option>
                <option value="Gateway">Gateway</option>
                <option value="Sensor">Sensor</option>
                <option value="Camera">Camera</option>
              </select>
              <ChevronDown className="absolute right-3 w-4 h-4 text-tertiary pointer-events-none" />
            </div>

            <div className="relative h-10 bg-primary border border-secondary rounded-[10px] shadow-sm flex items-center min-w-[140px]">
              <select className="h-full w-full pl-3 pr-8 bg-transparent text-sm outline-none appearance-none cursor-pointer" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                <option value="All">All statuses</option>
                <option value="Online">Online</option>
                <option value="Stale">Stale</option>
                <option value="Offline">Offline</option>
              </select>
              <ChevronDown className="absolute right-3 w-4 h-4 text-tertiary pointer-events-none" />
            </div>
          </div>
        </div>
        
        {filteredDevices.length > 0 ? (
          <div className="app_table_container">
            <table className="app_table">
              <thead>
                <tr className="border-b border-secondary">
                  <SortableHeader label="DEVICE" sortKey="device" />
                  <SortableHeader label="TYPE" sortKey="type" />
                  <SortableHeader label="STATUS" sortKey="status" />
                  <th>LOCATION</th>
                  <SortableHeader label="LAST SEEN" sortKey="lastContact" />
                  <th>FIRMWARE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDevices.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex flex-col">
                        <Link to={`/assets/inventory/devices/${d.id}`} className="font-semibold text-primary hover:text-brand hover:underline transition-colors">{d.id}</Link>
                        {d.name !== d.id && <span className="text_xs text-tertiary">{d.name}</span>}
                      </div>
                    </td>
                    <td>{d.type}</td>
                    <td><StatusBadge kind="device" value={d.status} /></td>
                    <td className="text-tertiary">{d.location}</td>
                    <td className="text-tertiary">{d.lastContact}</td>
                    <td className="text-tertiary">{d.model}</td>
                    <td>
                      <Link to={`/assets/inventory/devices/${d.id}`} className="btn btn_text btn_sm px-3">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Footer */}
            <div className="p-4 border-t border-secondary flex items-center justify-between bg-primary rounded-b-[16px]">
              <div className="text_sm text-secondary">
                Showing <span className="font-medium text-primary">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-primary">{Math.min(currentPage * rowsPerPage, totalFiltered)}</span> of <span className="font-medium text-primary">{totalFiltered}</span> devices
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
          </div>
        ) : (
          <EmptyState 
            icon={Search} 
            title="No devices found" 
            description="No devices match these filters." 
            action={<button className="btn btn_tertiary_gray btn_md" onClick={() => { setSearch(''); setFilterType('All'); setFilterStatus('All'); setCurrentPage(1); }}>Clear filters</button>} 
          />
        )}
      </div>
    </div>
  );
}
