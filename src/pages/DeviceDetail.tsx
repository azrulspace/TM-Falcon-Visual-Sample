import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Sliders,
  History,
  Link2,
  AlertTriangle,
  HeartPulse,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DeviceDetailHeader,
  type DeviceDetailTabKey,
} from '@/components/assets/devices/DeviceDetailHeader';
import { DeviceOverviewTab } from '@/components/assets/devices/DeviceOverviewTab';
import { DeviceConfigurationTab } from '@/components/assets/devices/DeviceConfigurationTab';
import { DeviceHistoryTab } from '@/components/assets/devices/DeviceHistoryTab';
import { DeviceInstallationTab } from '@/components/assets/devices/DeviceInstallationTab';
import { DeviceEventsTab } from '@/components/assets/devices/DeviceEventsTab';
import { DeviceHealthReportsTab } from '@/components/assets/devices/DeviceHealthReportsTab';
import { VersionHistorySheet } from '@/components/assets/devices/VersionHistorySheet';
import { EditDeviceDialog } from '@/components/assets/devices/EditDeviceDialog';
import { ManageInstallationDialog } from '@/components/assets/devices/ManageInstallationDialog';
import { RetireDeleteDeviceDialog } from '@/components/assets/devices/RetireDeleteDeviceDialog';
import { cn } from '@/lib/utils';

const VALID_TABS: DeviceDetailTabKey[] = [
  'overview',
  'configuration',
  'history',
  'installation',
  'events',
  'health',
];

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    devicePolicyConfig,
    devicePermissions,
    getDeviceById,
    runConnectionCheck,
  } = useAssets();

  const decodedId = id ? decodeURIComponent(id) : '';
  const device = decodedId ? getDeviceById(decodedId) : undefined;

  const [configDirty, setConfigDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<DeviceDetailTabKey | null>(null);
  const [versionSheetOpen, setVersionSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);

  const rawTab = searchParams.get('tab') as DeviceDetailTabKey | null;
  const activeTab: DeviceDetailTabKey =
    rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'overview';

  const commitTabSwitch = (tab: DeviceDetailTabKey) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleSelectTab = (tab: DeviceDetailTabKey) => {
    if (activeTab === 'configuration' && tab !== 'configuration' && configDirty) {
      setPendingTab(tab);
      return;
    }
    commitTabSwitch(tab);
  };

  const tabItems = useMemo(() => {
    if (!device) return [];
    return [
      {
        key: 'overview' as const,
        label: 'Overview',
        icon: <LayoutDashboard className="size-3.5 shrink-0" />,
      },
      {
        key: 'configuration' as const,
        label: 'Configuration',
        badge: device.configVersion || 'None',
        icon: <Sliders className="size-3.5 shrink-0" />,
      },
      {
        key: 'history' as const,
        label: 'History',
        count: device.connectivityPeriods.length + device.timeline.length,
        icon: <History className="size-3.5 shrink-0" />,
      },
      {
        key: 'installation' as const,
        label: 'Installation',
        count: device.installationHistory.length,
        icon: <Link2 className="size-3.5 shrink-0" />,
      },
      {
        key: 'events' as const,
        label: 'Events',
        count: device.allEventsCount,
        icon: <AlertTriangle className="size-3.5 shrink-0" />,
      },
      {
        key: 'health' as const,
        label: 'Health reports',
        count: device.healthReports.length,
        icon: <HeartPulse className="size-3.5 shrink-0" />,
      },
    ];
  }, [device]);

  if (!device) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3 max-w-lg mx-auto mt-8">
        <Cpu className="size-9 text-muted-foreground/60 mx-auto" />
        <h2 className="text-base font-semibold text-foreground">Device not found</h2>
        <p className="text-xs text-muted-foreground">
          No device matching <span className="font-mono text-foreground">{decodedId}</span> exists in the registry.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/assets/inventory')}
          className="gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to devices</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DeviceDetailHeader
        device={device}
        permissions={devicePermissions}
        onSelectTab={handleSelectTab}
        onManageInstallation={() => setInstallDialogOpen(true)}
        onEdit={() => setEditDialogOpen(true)}
        onRunConnectionCheck={() => runConnectionCheck(device.identifier)}
        onRetireOrDelete={() => setRetireDialogOpen(true)}
      />

      {/* Single URL-Synced Tab Bar */}
      <div className="border-b border-border select-none">
        <nav
          role="tablist"
          aria-label="Device detail sections"
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
                  'flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums',
                      isActive
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded font-mono',
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <DeviceOverviewTab
            device={device}
            policyConfig={devicePolicyConfig}
            permissions={devicePermissions}
            onSelectTab={handleSelectTab}
            onManageInstallation={() => setInstallDialogOpen(true)}
            onRunConnectionCheck={() => runConnectionCheck(device.identifier)}
          />
        )}

        {activeTab === 'history' && <DeviceHistoryTab device={device} />}

        {activeTab === 'installation' && (
          <DeviceInstallationTab
            device={device}
            permissions={devicePermissions}
            onOpenManageInstallation={() => setInstallDialogOpen(true)}
          />
        )}

        {activeTab === 'events' && <DeviceEventsTab device={device} />}

        {activeTab === 'health' && (
          <DeviceHealthReportsTab
            device={device}
            permissions={devicePermissions}
            onRunConnectionCheck={() => runConnectionCheck(device.identifier)}
          />
        )}

        {activeTab === 'configuration' && (
          <DeviceConfigurationTab
            device={device}
            permissions={devicePermissions}
            onDirtyChange={setConfigDirty}
            onOpenVersionHistory={() => setVersionSheetOpen(true)}
          />
        )}
      </div>

      {/* Phase 9 Dialogs & Sheets */}
      <VersionHistorySheet
        device={device}
        open={versionSheetOpen}
        onOpenChange={setVersionSheetOpen}
        permissions={devicePermissions}
      />
      <EditDeviceDialog
        device={device}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <ManageInstallationDialog
        device={device}
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
      />
      <RetireDeleteDeviceDialog
        device={device}
        open={retireDialogOpen}
        onOpenChange={setRetireDialogOpen}
        onDeleted={() => navigate('/assets/inventory')}
      />

      {/* Unsaved Configuration Edits Guard */}
      <Dialog open={pendingTab !== null} onOpenChange={(open) => !open && setPendingTab(null)}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Discard unsaved configuration edits?</DialogTitle>
            <DialogDescription className="text-xs">
              You have unsent configuration changes on {device.identifier}. Switching tabs will discard them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingTab(null)}
              className="cursor-pointer"
            >
              Stay on Configuration
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const target = pendingTab!;
                setPendingTab(null);
                setConfigDirty(false);
                commitTabSwitch(target);
              }}
              className="cursor-pointer"
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
