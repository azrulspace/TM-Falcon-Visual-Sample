import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge } from '../components/Shared';
import { useAppContext } from '../contexts/AppContext';
import { devices } from '../data/devices';
import { Edit2, Terminal, MapPin, Wifi, Cpu, Clock } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

export default function DeviceDetail() {
  const { reviewMode } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const device = devices.find(d => d.id === id);

  if (!device) {
    return <div className="p-12 text-center text-secondary">Device not found</div>;
  }

  return (
    <div>
      <PageHeader 
        title={device.name} 
        breadcrumbs={[
          { label: 'Inventory', href: '/assets/inventory' },
          { label: device.id }
        ]}
        openQuestion={reviewMode ? "remote action capabilities." : undefined}
        pageId="FAL_INV_04"
        roles="Admin, System, Operator"
        actions={
          <div className="flex gap-2">
            <button className="btn btn_secondary_gray btn_md" onClick={() => navigate(`/assets/inventory/devices/${device.id}/edit`)}>
              <Edit2 className="w-4 h-4" /> Edit
            </button>
            <button className="btn btn_primary btn_md" onClick={() => alert('Command modal')}>
              <Terminal className="w-4 h-4" /> Send command
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 app_card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-secondary flex items-center justify-center">
                <Cpu className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h4 className="h4">{device.id}</h4>
                <div className="text_sm text-tertiary">{device.type} · {device.serial}</div>
              </div>
            </div>
            <StatusBadge kind="device" value={device.status} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-secondary">
            <div>
              <div className="text_sm font-medium text-secondary mb-1">Location</div>
              <div className="text_md">{device.location}</div>
            </div>
            <div>
              <div className="text_sm font-medium text-secondary mb-1">Last seen</div>
              <div className="text_md flex items-center gap-2">
                <Clock className="w-4 h-4 text-tertiary" /> {device.lastContact}
              </div>
            </div>
            <div>
              <div className="text_sm font-medium text-secondary mb-1">Firmware</div>
              <div className="text_md">{device.model}</div>
            </div>
            <div>
              <div className="text_sm font-medium text-secondary mb-1">Network</div>
              <div className="text_md flex items-center gap-2">
                <Wifi className="w-4 h-4 text-success" /> -68 dBm
              </div>
            </div>
          </div>
        </div>

        <div className="app_card p-6 bg-secondary border-dashed border-secondary flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-primary border border-secondary rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-tertiary" />
          </div>
          <p className="text_sm text-tertiary max-w-[200px] mb-4">Map view of this specific device's location and coverage.</p>
          <button className="btn btn_secondary_gray btn_sm">Open map</button>
        </div>
      </div>

      <Tabs.Root defaultValue="events">
        <Tabs.List className="flex gap-6 border-b border-secondary mb-6">
          <Tabs.Trigger value="events" className="pb-3 text_sm font-medium border-b-2 border-brand-solid text-primary">Recent Events</Tabs.Trigger>
          <Tabs.Trigger value="telemetry" className="pb-3 text_sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors">Telemetry</Tabs.Trigger>
          <Tabs.Trigger value="logs" className="pb-3 text_sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors">Device Logs</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="events">
          <div className="app_card p-0">
             <div className="p-12 text-center text-tertiary text_sm">
                No recent events for this device in the last 7 days.
             </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="telemetry">
           <div className="app_card p-12 text-center text-tertiary text_sm">
              Telemetry graph placeholder
           </div>
        </Tabs.Content>
        <Tabs.Content value="logs">
           <div className="app_card p-12 text-center text-tertiary text_sm">
              Raw device logs placeholder
           </div>
        </Tabs.Content>
      </Tabs.Root>

    </div>
  );
}


