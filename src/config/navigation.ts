import {
  LayoutGrid,
  Radio,
  ClipboardList,
  ShieldAlert,
  MapPinned,
  BarChart3,
  Settings,
  HardDrive,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  History,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  badge?: number | string;
  description?: string;
  children?: NavItem[];
  permission?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    id: 'events',
    label: 'EVENTS',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutGrid,
        route: '/overview',
        description: 'Command room map & high-density event triage desk',
      },
      {
        id: 'event-inbox',
        label: 'Event inbox',
        icon: Radio,
        route: '/events',
        badge: 3,
        description: 'Incoming sensor alerts and AI video detection incidents',
        children: [
          {
            id: 'unacknowledged-events',
            label: 'Unacknowledged',
            icon: AlertTriangle,
            route: '/events?filter=new',
            badge: 3,
          },
          {
            id: 'event-history',
            label: 'Event history',
            icon: History,
            route: '/events?filter=history',
          },
        ],
      },
      {
        id: 'cases',
        label: 'Cases',
        icon: ClipboardList,
        route: '/planned/cases',
        badge: 1,
        description: 'Investigation workflows and field tickets',
        children: [
          {
            id: 'active-cases',
            label: 'Open cases',
            icon: ClipboardList,
            route: '/planned/cases?status=open',
            badge: 1,
          },
          {
            id: 'closed-cases',
            label: 'Resolved archive',
            icon: History,
            route: '/planned/cases?status=closed',
          },
        ],
      },
    ],
  },
  {
    id: 'risk',
    label: 'RISK & PREVENTIVE',
    items: [
      {
        id: 'risk-management',
        label: 'Risk & preventive work',
        icon: ShieldAlert,
        route: '/risk',
        description: 'Vulnerability mapping and vegetation encroachment',
        children: [
          {
            id: 'risk-overview',
            label: 'Risk overview',
            icon: ShieldAlert,
            route: '/risk',
          },
          {
            id: 'work-queue',
            label: 'Work queue',
            icon: Layers,
            route: '/planned/work-queue',
            badge: 5,
            children: [
              {
                id: 'queue-scheduled',
                label: 'Scheduled maintenance',
                icon: Layers,
                route: '/planned/work-queue/scheduled',
              },
              {
                id: 'queue-urgent',
                label: 'Urgent clearing',
                icon: AlertTriangle,
                route: '/planned/work-queue/urgent',
                badge: 2,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'assets',
    label: 'ASSETS & FLEET',
    items: [
      {
        id: 'assets-devices',
        label: 'Assets & devices',
        icon: MapPinned,
        route: '/assets/inventory',
        description: 'Poles, fibre cables, spans, and telemetry IoT devices',
        children: [
          {
            id: 'inventory-register',
            label: 'Inventory register',
            icon: HardDrive,
            route: '/assets/inventory',
          },
          {
            id: 'devices-fleet',
            label: 'Device health',
            icon: Activity,
            route: '/planned/devices',
            badge: 4,
            children: [
              {
                id: 'fleet-all',
                label: 'All IoT hardware',
                icon: HardDrive,
                route: '/planned/devices/all',
              },
              {
                id: 'fleet-offline',
                label: 'Offline / Stale',
                icon: AlertTriangle,
                route: '/planned/devices/offline',
                badge: 4,
              },
            ],
          },
          {
            id: 'fleet-health',
            label: 'Infrastructure health',
            icon: Layers,
            route: '/planned/fleet',
          },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM & GOVERNANCE',
    items: [
      {
        id: 'reports',
        label: 'Reports & audits',
        icon: BarChart3,
        route: '/planned/reports',
        description: 'SLAs, uptime statistics, and compliance exports',
        children: [
          {
            id: 'reports-uptime',
            label: 'Network uptime SLA',
            icon: FileText,
            route: '/planned/reports/sla',
          },
          {
            id: 'reports-audit',
            label: 'Audit trails',
            icon: FileText,
            route: '/planned/reports/audit',
          },
        ],
      },
      {
        id: 'administration',
        label: 'Administration',
        icon: Settings,
        route: '/planned/admin',
        description: 'User access control, role permissions, and system keys',
        children: [
          {
            id: 'admin-users',
            label: 'User management',
            icon: Settings,
            route: '/planned/admin/users',
          },
          {
            id: 'admin-roles',
            label: 'Role permissions',
            icon: Settings,
            route: '/planned/admin/roles',
          },
        ],
      },
    ],
  },
];

// Helper to flatten all searchable routes with full breadcrumb paths
export interface FlatNavRoute {
  id: string;
  label: string;
  fullPath: string[];
  route: string;
  icon: LucideIcon;
  badge?: number | string;
  section: string;
}

export function getFlattenedNavRoutes(): FlatNavRoute[] {
  const routes: FlatNavRoute[] = [];

  function traverse(item: NavItem, path: string[], sectionName: string) {
    const currentPath = [...path, item.label];
    routes.push({
      id: item.id,
      label: item.label,
      fullPath: currentPath,
      route: item.route,
      icon: item.icon,
      badge: item.badge,
      section: sectionName,
    });

    if (item.children) {
      item.children.forEach((child) => traverse(child, currentPath, sectionName));
    }
  }

  navigationConfig.forEach((sec) => {
    sec.items.forEach((item) => traverse(item, [sec.label], sec.label));
  });

  return routes;
}
