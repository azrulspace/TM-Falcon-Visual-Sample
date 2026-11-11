import { useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  History,
  Cpu,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import {
  PoleDetailHeader,
  type PoleDetailTabKey,
} from '@/components/assets/PoleDetailHeader';
import { PoleInfoCard } from '@/components/assets/PoleInfoCard';
import { PoleLocationCard } from '@/components/assets/PoleLocationCard';
import { PoleSiteCard } from '@/components/assets/PoleSiteCard';
import { PoleHistoryTab } from '@/components/assets/detail/PoleHistoryTab';
import { PoleDevicesTab } from '@/components/assets/detail/PoleDevicesTab';
import { PoleEventsTab } from '@/components/assets/detail/PoleEventsTab';
import { PoleSpansTab } from '@/components/assets/detail/PoleSpansTab';
import { cn } from '@/lib/utils';

const VALID_TABS: PoleDetailTabKey[] = ['history', 'devices', 'events', 'spans'];

export default function PoleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    poles,
    permissions,
    capabilities,
    getPoleById,
    restorePole,
  } = useAssets();

  const decodedId = id ? decodeURIComponent(id) : '';
  const pole = decodedId ? getPoleById(decodedId) : undefined;

  const rawTab = searchParams.get('tab') as PoleDetailTabKey | null;
  const activeTab: PoleDetailTabKey =
    rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'history';

  const handleSelectTab = (tab: PoleDetailTabKey) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'history') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_poles_url');
    navigate(lastUrl || '/assets/poles');
  };

  const tabItems = useMemo(() => {
    if (!pole) return [];
    return [
      {
        key: 'history' as const,
        label: 'History',
        count: pole.timeline.length,
        icon: <History className="size-3.5 shrink-0" />,
      },
      {
        key: 'devices' as const,
        label: 'Linked devices',
        count: pole.linkedDevicesCount,
        icon: <Cpu className="size-3.5 shrink-0" />,
      },
      {
        key: 'events' as const,
        label: 'Events',
        count: pole.allEventsCount,
        icon: <AlertTriangle className="size-3.5 shrink-0" />,
      },
      {
        key: 'spans' as const,
        label: 'Cable spans',
        count: pole.cableSpansCount,
        icon: <Layers className="size-3.5 shrink-0" />,
      },
    ];
  }, [pole]);

  const handleRelocateOpen = () => {
    if (!pole) return;
    addToast('info', `Relocate dialog for ${pole.identifier} will open in Phase 7.`);
  };

  const handleEditOpen = () => {
    if (!pole) return;
    addToast('info', `Edit dialog for ${pole.identifier} will open in Phase 7.`);
  };

  const handleDeleteOpen = () => {
    if (!pole) return;
    addToast('info', `Delete impact confirmation for ${pole.identifier} will open in Phase 7.`);
  };

  const handleRestore = async () => {
    if (!pole) return;
    const res = await restorePole(pole.identifier);
    if (res.ok) {
      addToast('success', `Restored pole ${pole.identifier}.`);
    } else {
      addToast('error', res.error || 'Unable to restore pole.');
    }
  };

  if (!pole) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[420px]">
        <MapPin className="size-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Pole not found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          The pole identifier &quot;{decodedId || id}&quot; could not be found in the registry.
        </p>
        <Button variant="outline" onClick={handleBack} className="gap-2 text-xs cursor-pointer">
          <ArrowLeft className="size-4" />
          <span>Back to Poles</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-16">
      <PoleDetailHeader
        pole={pole}
        permissions={permissions}
        capabilities={capabilities}
        onSelectTab={handleSelectTab}
        onRelocate={handleRelocateOpen}
        onEdit={handleEditOpen}
        onDelete={handleDeleteOpen}
        onRestore={handleRestore}
      />

      {/* Responsive 12-Column Detail Grid: 8/12 Main + 4/12 Sticky Side Column */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 space-y-5 min-w-0">
          <PoleInfoCard
            pole={pole}
            permissions={permissions}
            onAddLocation={handleRelocateOpen}
          />

          {/* 4 Merged Detail Tabs (with honest item counts) */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4">
              <nav
                role="tablist"
                aria-label="Pole detail sections"
                className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px"
              >
                {tabItems.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleSelectTab(tab.key)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                        isActive
                          ? 'border-primary text-foreground font-semibold'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      )}
                    >
                      <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums',
                          isActive
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-5">
              {activeTab === 'history' && <PoleHistoryTab pole={pole} />}
              {activeTab === 'devices' && (
                <PoleDevicesTab pole={pole} capabilities={capabilities} />
              )}
              {activeTab === 'events' && <PoleEventsTab pole={pole} />}
              {activeTab === 'spans' && <PoleSpansTab pole={pole} />}
            </div>
          </div>
        </div>

        {/* Right Side Column: Location Map + Site Context */}
        <aside className="xl:col-span-4 space-y-5 xl:sticky xl:top-6 min-w-0">
          <PoleLocationCard
            pole={pole}
            allPoles={poles}
            permissions={permissions}
            onRelocate={handleRelocateOpen}
          />
          <PoleSiteCard pole={pole} />
        </aside>
      </div>
    </div>
  );
}
