import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ChevronUp,
  ChevronRight,
  Layers,
  MapPin,
  Cpu,
  MapPinOff,
} from 'lucide-react';
import { allFeatures, featureCounts, type FeatureItem } from '@/data/features.ts';
import { useOverview } from '@/contexts/OverviewContext';

export interface AssetsAndDevicesPanelProps {
  onClose: () => void;
}

export type FeatureTypeFilter = 'all' | 'pole' | 'span' | 'device';

export const AssetsAndDevicesPanel: React.FC<AssetsAndDevicesPanelProps> = ({ onClose }) => {
  const { selectEntity, selectedEntity, selectedId, assetTypeFilter, setAssetTypeFilter } = useOverview();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeatureTypeFilter>(assetTypeFilter || 'all');

  // Synchronize when assetTypeFilter changes from summary row or external trigger
  useEffect(() => {
    if (assetTypeFilter) {
      setTypeFilter(assetTypeFilter);
    }
  }, [assetTypeFilter]);

  const handleSelectType = (newType: FeatureTypeFilter) => {
    setTypeFilter(newType);
    setAssetTypeFilter(newType);
  };

  // Debounce search query by 250ms per Section 4.3
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  // 'F' keyboard shortcut to focus search input while panel is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'f' || e.key === 'F') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter features by type and debounced search
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((item) => {
      // 1. Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // 2. Search match against ID, Type, Name, Site, or Detail
      if (debouncedSearch) {
        const matchId = item.id.toLowerCase().includes(debouncedSearch);
        const matchName = item.name.toLowerCase().includes(debouncedSearch);
        const matchType = item.type.toLowerCase().includes(debouncedSearch);
        const matchSite = item.site.toLowerCase().includes(debouncedSearch);
        return matchId || matchName || matchType || matchSite;
      }
      return true;
    });
  }, [typeFilter, debouncedSearch]);

  const renderTypeIcon = (type: FeatureItem['type']) => {
    if (type === 'pole') return <MapPin className="size-3.5 text-emerald-400 shrink-0" />;
    if (type === 'span') return <Layers className="size-3.5 text-sky-400 shrink-0" />;
    return <Cpu className="size-3.5 text-primary shrink-0" />;
  };

  return (
    <div
      id="assets-and-devices-panel"
      className="flex flex-col w-[300px] max-h-[calc(100vh-220px)] text-foreground select-none overflow-hidden"
    >
      {/* 1. Sticky Header */}
      <div className="flex items-center justify-between h-[42px] px-3.5 border-b border-border shrink-0 bg-card/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Assets and devices
          </span>
          {/* Total feature count badge: 238 */}
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-primary text-primary-foreground">
            {featureCounts.total}
          </span>
          {/* Small danger dot with troubled device count: 4 */}
          {featureCounts.attentionDevices > 0 && (
            <div className="flex items-center gap-1 pl-0.5" title={`${featureCounts.attentionDevices} devices need attention`}>
              <span className="size-1.5 rounded-full bg-[#e33f50] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#e33f50]">
                {featureCounts.attentionDevices}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          aria-label="Collapse Assets and devices panel"
          title="Collapse panel"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>

      {/* 2. Search Field and Helper Text */}
      <div className="p-3 pb-2 border-b border-border shrink-0 space-y-1.5 bg-background/50">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search features"
            aria-label="Search features"
            className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-sans"
          />
          {rawSearch && (
            <button
              onClick={() => setRawSearch('')}
              className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {/* Exact required copy from Section 4.3 */}
        <p className="text-[11px] text-muted-foreground leading-tight px-0.5">
          Records without coordinates appear here only.
        </p>
      </div>

      {/* 3. Type Filter Chips */}
      <div className="flex items-center px-3 py-1.5 gap-1 overflow-x-auto no-scrollbar border-b border-border shrink-0">
        <button
          onClick={() => handleSelectType('all')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          All ({featureCounts.total})
        </button>
        <button
          onClick={() => handleSelectType('pole')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            typeFilter === 'pole'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Poles ({featureCounts.poles})
        </button>
        <button
          onClick={() => handleSelectType('span')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            typeFilter === 'span'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Cable spans ({featureCounts.spans})
        </button>
        <button
          onClick={() => handleSelectType('device')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            typeFilter === 'device'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Devices ({featureCounts.devices})
        </button>
      </div>

      {/* 4. Results Count */}
      <div className="px-3.5 py-1 text-[10.5px] text-muted-foreground shrink-0 border-b border-border/40 flex justify-between items-center">
        <span>Showing {filteredFeatures.length} features</span>
        {rawSearch && (
          <span className="font-mono text-[10px]">Filter: &quot;{rawSearch}&quot;</span>
        )}
      </div>

      {/* 5. Virtualized / Performant Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar min-h-[220px]">
        {filteredFeatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-1">
            <Search className="size-6 text-muted-foreground/40 mb-1" />
            <p className="text-xs font-medium text-foreground">No matching features found</p>
            <p className="text-[11px]">Try adjusting your search query or type filter.</p>
          </div>
        ) : (
          filteredFeatures.map((item) => {
            const isSelected =
              (selectedEntity && (selectedEntity.id === item.id || selectedEntity.rawId === item.rawId)) ||
              (selectedId && (selectedId === item.id || selectedId === item.rawId));

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  selectEntity(item.type, item.id, { fly: item.hasLocation, source: 'panel' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    selectEntity(item.type, item.id, { fly: item.hasLocation, source: 'panel' });
                  }
                }}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-l-2 border-l-primary border-primary/50 bg-primary/10 shadow-sm'
                    : 'bg-card border-border/60 hover:bg-muted'
                }`}
              >
                {/* Left: Icon, Type label, Mono ID */}
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {renderTypeIcon(item.type)}
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold font-sans tracking-wider shrink-0">
                    {item.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground truncate">
                    {item.id}
                  </span>
                </div>

                {/* Right: Status badge / No map location tag & chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* "No map location" tag for unlocated features */}
                  {!item.hasLocation ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
                      <MapPinOff className="size-2.5" />
                      <span>No map location</span>
                    </span>
                  ) : item.status ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase font-sans ${
                        item.status === 'offline'
                          ? 'bg-[#e33f50]/15 text-[#e33f50] border border-[#e33f50]/30'
                          : item.status === 'stale'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  ) : null}

                  <ChevronRight className="size-3.5 text-muted-foreground/60" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
