import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DeviceDetailHeader } from '@/components/devices/detail/DeviceDetailHeader';
import { DeviceDetailTabs, type DeviceDetailTabKey } from '@/components/devices/detail/DeviceDetailTabs';
import { DeviceOverviewTab } from '@/components/devices/detail/DeviceOverviewTab';
import { DeviceHistoryTab } from '@/components/devices/detail/DeviceHistoryTab';
import { DeviceInstallationTab } from '@/components/devices/detail/DeviceInstallationTab';
import { DeviceEventsTab } from '@/components/devices/detail/DeviceEventsTab';
import { DeviceHealthReportsTab } from '@/components/devices/detail/DeviceHealthReportsTab';
import { useDevices } from '@/contexts/DevicesContext';
import { useToast } from '@/contexts/ToastContext';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDeviceById } = useDevices();
  const { addToast } = useToast();

  const device = useMemo(() => {
    if (!id) return undefined;
    return getDeviceById(id);
  }, [id, getDeviceById]);

  // Tab State synced with URL query param ?tab=
  const initialTab = (searchParams.get('tab') as DeviceDetailTabKey) || 'overview';
  const [activeTab, setActiveTab] = useState<DeviceDetailTabKey>(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as DeviceDetailTabKey;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleSelectTab = (tab: DeviceDetailTabKey) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleManageInstallation = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', 'install');
      return next;
    });
  };

  const handleEdit = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('action', 'edit');
      return next;
    });
  };

  if (!device) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">Device not found</h2>
        <p className="text-xs text-muted-foreground">
          No device matches identifier &ldquo;{id}&rdquo; in the current registry.
        </p>
        <button
          type="button"
          onClick={() => navigate('/assets/devices')}
          className="text-xs text-primary underline cursor-pointer"
        >
          Return to devices list
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header with Breadcrumbs, Identifier, Badges, and Action Buttons */}
      <DeviceDetailHeader
        device={device}
        onManageInstallation={handleManageInstallation}
        onEdit={handleEdit}
        onViewRawPayload={() => {
          console.log('[FALCON] Raw Telemetry Payload for', device.identifier, device);
          addToast('info', `Raw telemetry for ${device.identifier} logged in console.`);
        }}
      />

      {/* 2. Unified Tab Bar with counts on every tab */}
      <DeviceDetailTabs
        device={device}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* 3. Tab Content */}
      {activeTab === 'overview' && (
        <DeviceOverviewTab
          device={device}
          onManageInstallation={handleManageInstallation}
          onEdit={handleEdit}
        />
      )}

      {activeTab === 'configuration' && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Configuration tab will be rendered in Phase 8.
        </div>
      )}

      {activeTab === 'history' && (
        <DeviceHistoryTab device={device} />
      )}

      {activeTab === 'installation' && (
        <DeviceInstallationTab
          device={device}
          onManageInstallation={handleManageInstallation}
        />
      )}

      {activeTab === 'events' && (
        <DeviceEventsTab device={device} />
      )}

      {activeTab === 'health_reports' && (
        <DeviceHealthReportsTab device={device} />
      )}
    </div>
  );
}
