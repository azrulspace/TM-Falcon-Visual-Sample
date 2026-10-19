import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Menu,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

import { useAppContext } from '../contexts/AppContext';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GlobalSearchCommand } from './GlobalSearchCommand';
import { navigationConfig, type NavItem } from '@/config/navigation';

interface HeaderModuleTab {
  id: string;
  label: string;
  route: string;
  isMatch: (pathname: string) => boolean;
  children?: { id: string; label: string; route: string; badge?: number | string }[];
}

const headerModules: HeaderModuleTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    route: '/overview',
    isMatch: (p) => p === '/overview',
  },
  {
    id: 'events',
    label: 'Events',
    route: '/events',
    isMatch: (p) => p.startsWith('/events') || p.startsWith('/planned/cases'),
    children: [
      { id: 'event-inbox', label: 'Event inbox', route: '/events', badge: 3 },
      { id: 'cases', label: 'Cases & field tickets', route: '/planned/cases', badge: 1 },
    ],
  },
  {
    id: 'risk',
    label: 'Risk & preventive work',
    route: '/risk',
    isMatch: (p) => p.startsWith('/risk') || p.startsWith('/planned/work-queue'),
    children: [
      { id: 'risk-overview', label: 'Risk overview', route: '/risk' },
      { id: 'work-queue', label: 'Work queue', route: '/planned/work-queue', badge: 5 },
    ],
  },
  {
    id: 'assets',
    label: 'Assets & devices',
    route: '/assets/inventory',
    isMatch: (p) => p.startsWith('/assets') || p.startsWith('/planned/devices') || p.startsWith('/planned/fleet'),
    children: [
      { id: 'inventory', label: 'Inventory register', route: '/assets/inventory' },
      { id: 'devices', label: 'Device health', route: '/planned/devices', badge: 4 },
      { id: 'fleet', label: 'Infrastructure health', route: '/planned/fleet' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/planned/reports',
    isMatch: (p) => p.startsWith('/planned/reports'),
    children: [
      { id: 'reports-sla', label: 'Network uptime SLA', route: '/planned/reports/sla' },
      { id: 'reports-audit', label: 'Audit trails', route: '/planned/reports/audit' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    route: '/planned/admin',
    isMatch: (p) => p.startsWith('/planned/admin'),
    children: [
      { id: 'admin-users', label: 'User management', route: '/planned/admin/users' },
      { id: 'admin-roles', label: 'Role permissions', route: '/planned/admin/roles' },
    ],
  },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel, setAccountLabel } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isOverview = location.pathname === '/overview';

  // Mobile navigation drawer (< 1024px)
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Desktop rail vs expanded (>= 1024px)
  // Default to 56px collapsed rail on other pages
  const [sidebarMinimized, setSidebarMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('falcon_sidebar_minimized');
    if (saved !== null) return saved === 'true';
    return true;
  });

  // Persist open collapsible groups in expanded sidebar
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('falcon_nav_open_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Collapsed rail hover/click flyout panel state
  const [activeFlyoutItem, setActiveFlyoutItem] = useState<{
    item: NavItem;
    top: number;
  } | null>(null);
  const flyoutCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("theme_dark") || document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Keep live time updated with MYT timezone
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTime(`${timeStr} MYT`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const r = document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";
    r.classList.remove("theme_light", "theme_dark", "dark");
    r.classList.add("theme_" + newTheme);
    if (newTheme === "dark") {
      r.classList.add("dark");
    }
    localStorage.setItem("ds_theme", newTheme);
    setTheme(newTheme);
  };

  const handleToggleSidebar = () => {
    const next = !sidebarMinimized;
    setSidebarMinimized(next);
    localStorage.setItem('falcon_sidebar_minimized', String(next));
    setActiveFlyoutItem(null);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('falcon_nav_open_groups', JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    setAccountLabel(null);
    navigate('/signin');
  };

  // Derive current breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/overview') return ['Overview'];
    if (path.startsWith('/events')) return ['Events', 'Event inbox'];
    if (path.startsWith('/risk')) return ['Risk & preventive', 'Risk overview'];
    if (path.startsWith('/assets/inventory/devices/new')) return ['Assets & devices', 'Inventory', 'New device'];
    if (path.startsWith('/assets/inventory/devices')) return ['Assets & devices', 'Inventory', 'Device detail'];
    if (path.startsWith('/assets/inventory')) return ['Assets & devices', 'Inventory register'];
    if (path.startsWith('/planned/cases')) return ['Events', 'Cases'];
    if (path.startsWith('/planned/work-queue')) return ['Risk', 'Work queue'];
    if (path.startsWith('/planned/devices')) return ['Assets', 'Device health'];
    if (path.startsWith('/planned/fleet')) return ['Assets', 'Infrastructure health'];
    if (path.startsWith('/planned/reports')) return ['System', 'Reports'];
    if (path.startsWith('/planned/admin')) return ['System', 'Administration'];
    return ['Dashboard', path.replace('/', '').toUpperCase()];
  }, [location.pathname]);

  // Handle flyout mouse enter / leave with grace period
  const handleRailMouseEnter = (item: NavItem, event: React.MouseEvent<HTMLElement>) => {
    if (!item.children || item.children.length === 0) {
      if (flyoutCloseTimerRef.current) clearTimeout(flyoutCloseTimerRef.current);
      setActiveFlyoutItem(null);
      return;
    }
    if (flyoutCloseTimerRef.current) clearTimeout(flyoutCloseTimerRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setActiveFlyoutItem({
      item,
      top: Math.max(8, Math.min(rect.top - 64, window.innerHeight - 340)),
    });
  };

  const handleRailMouseLeave = () => {
    flyoutCloseTimerRef.current = setTimeout(() => {
      setActiveFlyoutItem(null);
    }, 200);
  };

  const handleFlyoutMouseEnter = () => {
    if (flyoutCloseTimerRef.current) clearTimeout(flyoutCloseTimerRef.current);
  };

  const handleFlyoutMouseLeave = () => {
    flyoutCloseTimerRef.current = setTimeout(() => {
      setActiveFlyoutItem(null);
    }, 200);
  };

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* 64px Solid Control Room Header matching CEO_REFERENCE */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-30 shrink-0 gap-3">
          {/* Left: Mobile trigger, Wordmark Lockup */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile menu trigger */}
            <button
              className="flex lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>

            {/* Desktop sidebar toggle only on non-overview */}
            {!isOverview && (
              <button
                className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mr-1"
                onClick={handleToggleSidebar}
                aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarMinimized ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
              </button>
            )}

            <Link to="/overview" className="flex items-center gap-2 mr-1">
              <Logo className="h-6 w-auto" markOnly={true} />
              <span className="text-xl font-bold tracking-wider text-foreground select-none">
                FALCON
              </span>
            </Link>

            {/* Subtitle (Hidden below 1280px) */}
            <span className="hidden xl:inline-block h-6 w-px bg-border mx-2" />
            <div className="hidden xl:flex flex-col text-[10px] leading-tight text-muted-foreground select-none">
              <span>Telecom Infrastructure</span>
              <span>Monitoring Platform</span>
            </div>
          </div>

          {/* Center: Module Navigation Tabs (Overview, Events, Risk..., Assets..., Reports, Administration) */}
          <nav className="hidden lg:flex items-center h-full gap-0.5 xl:gap-1 mx-1 xl:mx-2 shrink-0">
            {headerModules.map((mod) => {
              const isActive = mod.isMatch(location.pathname);
              const hasChildren = mod.children && mod.children.length > 0;

              return (
                <div key={mod.id} className="relative h-full flex items-center">
                  {hasChildren ? (
                    <DropdownMenu>
                      <div className="flex items-center h-full">
                        <Link
                          to={mod.route}
                          className={`flex items-center h-full px-2 xl:px-2.5 text-xs xl:text-[13px] font-medium transition-colors select-none ${
                            isActive
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {mod.label}
                        </Link>
                        <DropdownMenuTrigger
                          render={
                            <button
                              className="p-0.5 -ml-1 mr-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`${mod.label} sub-navigation`}
                            >
                              <ChevronDown className="size-3 opacity-60 hover:opacity-100" />
                            </button>
                          }
                        />
                      </div>

                      <DropdownMenuContent align="start" className="w-52 bg-popover border border-border text-popover-foreground z-50">
                        {mod.children?.map((child) => (
                          <DropdownMenuItem
                            key={child.id}
                            onClick={() => navigate(child.route)}
                            className="cursor-pointer text-xs flex items-center justify-between py-2"
                          >
                            <span className={location.pathname === child.route ? 'font-semibold text-primary' : ''}>
                              {child.label}
                            </span>
                            {child.badge !== undefined && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-destructive/20 text-destructive font-bold">
                                {child.badge}
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      to={mod.route}
                      className={`flex items-center h-full px-2 xl:px-2.5 text-xs xl:text-[13px] font-medium transition-colors select-none ${
                        isActive
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mod.label}
                    </Link>
                  )}

                  {/* Animated active underline bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1.5 right-1.5 h-[2.5px] bg-primary rounded-t-sm shadow-[0_-1px_6px_rgba(56,189,248,0.5)]" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: Search, Live indicator, Notifications, Theme toggle, User profile */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            {/* Search Trigger (~240-280px wide) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-36 lg:w-44 xl:w-56 2xl:w-[260px] h-8 px-2.5 rounded-md bg-muted/50 hover:bg-muted border border-border flex items-center justify-between text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">Search location, device...</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono text-muted-foreground/80 pl-1">
                <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px]">⌘K</kbd>
              </div>
            </button>

            {/* Live Indicator with MYT timezone */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-status-online-tint border border-status-online-border text-xs font-medium text-status-online select-none">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-status-online"></span>
              </span>
              <span className="font-bold tracking-wide text-[10px]">LIVE</span>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums pl-1 border-l border-status-online-border/60 hidden sm:inline">
                {currentTime || 'MYT'}
              </span>
            </div>

            {/* Notifications Button */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
                  <Bell className="size-4" />
                  <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                    4
                  </span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
                4 unread critical events
              </Tooltip.Content>
            </Tooltip.Root>

            {/* Theme Toggle */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  id="theme-toggle-btn"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="text-xs bg-popover text-popover-foreground border border-border p-1.5 rounded shadow-md z-50">
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </Tooltip.Content>
            </Tooltip.Root>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <Avatar className="size-7 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {accountLabel ? accountLabel.substring(0, 2).toUpperCase() : 'AS'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden 2xl:inline text-xs font-medium text-foreground pr-1">
                      {accountLabel || 'Admin (sample)'}
                    </span>
                  </button>
                }
              />

              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-popover-foreground z-50">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{accountLabel || 'Admin User'}</span>
                    <span className="text-[11px] text-muted-foreground">TM Operations • Network Command</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/planned/admin')} className="cursor-pointer text-xs">
                  <span>Administration Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/planned/reports')} className="cursor-pointer text-xs">
                  <span>Reports & Audits</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-3.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Global Search Dialog */}
        <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Main Body with Sidebar + Viewport */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop Sidebar (Only rendered on non-overview pages) */}
          {!isOverview && (
            <aside
              style={{ width: sidebarMinimized ? '56px' : '264px' }}
              className="bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col shrink-0 transition-all duration-200 z-30 select-none relative"
              onMouseLeave={handleRailMouseLeave}
            >
            {/* Scrollable Nav Sections */}
            <div className="flex flex-col gap-3 p-2 flex-1 overflow-y-auto overflow-x-hidden">
              {navigationConfig.map((sec) => (
                <div key={sec.id} className="flex flex-col gap-1">
                  {!sidebarMinimized && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sidebar-label px-2.5 mt-2 mb-0.5 text-muted-foreground/70">
                      {sec.label}
                    </div>
                  )}

                  {sec.items.map((item) => {
                    const isParentActive = location.pathname.startsWith(item.route);
                    const isLeafActive = location.pathname === item.route;
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = openGroups[item.id] !== false; // default open

                    return (
                      <div key={item.id} className="flex flex-col">
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <div
                              className={`flex items-center gap-2.5 px-2.5 h-9 rounded-md cursor-pointer text-xs font-medium transition-all relative ${
                                sidebarMinimized ? 'justify-center' : 'justify-between'
                              } ${
                                isLeafActive
                                  ? 'bg-sidebar-active text-sidebar font-semibold'
                                  : isParentActive
                                  ? 'text-sidebar hover:bg-sidebar-hover'
                                  : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                              } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring`}
                              onClick={() => {
                                if (hasChildren && !sidebarMinimized) {
                                  toggleGroup(item.id);
                                } else {
                                  navigate(item.route);
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (sidebarMinimized) handleRailMouseEnter(item, e);
                              }}
                              tabIndex={0}
                              role="link"
                              aria-current={isLeafActive ? 'page' : undefined}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (hasChildren && !sidebarMinimized) toggleGroup(item.id);
                                  else navigate(item.route);
                                } else if (e.key === 'ArrowRight' && sidebarMinimized && hasChildren) {
                                  handleRailMouseEnter(item, e as any);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isLeafActive && (
                                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r" />
                                )}
                                <item.icon className={`size-4 shrink-0 ${isParentActive ? 'text-primary' : 'text-sidebar-muted'}`} />
                                {!sidebarMinimized && <span className="truncate">{item.label}</span>}
                              </div>

                              {!sidebarMinimized && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge !== undefined && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-destructive/20 text-destructive font-bold">
                                      {item.badge}
                                    </span>
                                  )}
                                  {hasChildren && (
                                    <ChevronDown
                                      className={`size-3 text-muted-foreground transition-transform duration-150 ${
                                        isExpanded ? 'rotate-0' : '-rotate-90'
                                      }`}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </Tooltip.Trigger>

                          {/* Rail Tooltip on collapsed state */}
                          {sidebarMinimized && (
                            <Tooltip.Portal>
                              <Tooltip.Content
                                side="right"
                                sideOffset={12}
                                className="bg-popover text-popover-foreground border border-border shadow-lg px-2.5 py-1 rounded text-xs z-50 font-medium"
                              >
                                <span>{item.label}</span>
                                {item.badge !== undefined && (
                                  <span className="ml-1.5 px-1 rounded bg-destructive text-white text-[10px]">
                                    {item.badge}
                                  </span>
                                )}
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          )}
                        </Tooltip.Root>

                        {/* Expanded Children Tree (Up to 3 levels) */}
                        {!sidebarMinimized && hasChildren && isExpanded && (
                          <div className="ml-4 pl-3 border-l border-sidebar-border flex flex-col gap-1 my-1 animate-in fade-in-50 duration-150">
                            {item.children?.map((child) => {
                              const isChildActive = location.pathname === child.route;
                              const hasGrandChildren = child.children && child.children.length > 0;

                              return (
                                <div key={child.id} className="flex flex-col">
                                  <div
                                    className={`flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                                      isChildActive
                                        ? 'bg-sidebar-active text-sidebar font-semibold'
                                        : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                                    }`}
                                    onClick={() => navigate(child.route)}
                                  >
                                    <span className="truncate">{child.label}</span>
                                    {child.badge !== undefined && (
                                      <span className="px-1 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                                        {child.badge}
                                      </span>
                                    )}
                                  </div>

                                  {/* 3rd Level Indentation */}
                                  {hasGrandChildren && (
                                    <div className="ml-3 pl-2 border-l border-sidebar-border/60 flex flex-col gap-0.5 my-0.5">
                                      {child.children?.map((grandChild) => {
                                        const isGrandActive = location.pathname === grandChild.route;
                                        return (
                                          <div
                                            key={grandChild.id}
                                            className={`px-2 py-1 text-[11px] rounded cursor-pointer transition-colors flex items-center justify-between ${
                                              isGrandActive
                                                ? 'text-primary font-semibold'
                                                : 'text-sidebar-muted hover:text-sidebar'
                                            }`}
                                            onClick={() => navigate(grandChild.route)}
                                          >
                                            <span className="truncate">{grandChild.label}</span>
                                            {grandChild.badge !== undefined && (
                                              <span className="text-[10px] font-mono text-muted-foreground">
                                                {grandChild.badge}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Collapsed Rail Flyout Panel */}
            {sidebarMinimized && activeFlyoutItem && (
              <div
                style={{ top: `${activeFlyoutItem.top}px` }}
                className="absolute left-[58px] w-64 glass-panel p-3 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150 shadow-2xl border border-border"
                onMouseEnter={handleFlyoutMouseEnter}
                onMouseLeave={handleFlyoutMouseLeave}
              >
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border">
                  <activeFlyoutItem.item.icon className="size-4 text-primary" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {activeFlyoutItem.item.label}
                    </span>
                    {activeFlyoutItem.item.description && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {activeFlyoutItem.item.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {activeFlyoutItem.item.children?.map((sub) => (
                    <div key={sub.id} className="flex flex-col">
                      <div
                        onClick={() => {
                          navigate(sub.route);
                          setActiveFlyoutItem(null);
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                          location.pathname === sub.route
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge !== undefined && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-destructive text-white font-bold">
                            {sub.badge}
                          </span>
                        )}
                      </div>

                      {/* 3rd level inside flyout */}
                      {sub.children && (
                        <div className="ml-3 pl-2 border-l border-border/60 flex flex-col gap-1 my-1">
                          {sub.children.map((leaf) => (
                            <div
                              key={leaf.id}
                              onClick={() => {
                                navigate(leaf.route);
                                setActiveFlyoutItem(null);
                              }}
                              className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors flex items-center justify-between ${
                                location.pathname === leaf.route
                                  ? 'text-primary font-semibold'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="truncate">{leaf.label}</span>
                              {leaf.badge !== undefined && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {leaf.badge}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Log out button */}
            <div className="p-2 border-t border-sidebar-border mt-auto">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div
                    className={`flex items-center gap-3 px-2.5 h-9 rounded-md cursor-pointer text-xs font-medium transition-all text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover ${
                      sidebarMinimized ? 'justify-center' : ''
                    }`}
                    onClick={handleLogout}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogout();
                    }}
                  >
                    <LogOut className="size-4.5 shrink-0" />
                    {!sidebarMinimized && <span className="truncate">Log out</span>}
                  </div>
                </Tooltip.Trigger>
                {sidebarMinimized && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={12}
                      className="bg-popover text-popover-foreground border border-border shadow-lg px-2.5 py-1 rounded text-xs z-50 font-medium"
                    >
                      Log out
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          </aside>
        )}

          {/* Mobile Sheet Navigation (< 1024px) */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
              <SheetHeader className="p-4 border-b border-sidebar-border flex flex-row items-center justify-between">
                <SheetTitle className="text-sm font-bold text-foreground">
                  <Logo className="h-6" />
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {navigationConfig.map((sec) => (
                  <div key={sec.id} className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2">
                      {sec.label}
                    </div>
                    {sec.items.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div
                          onClick={() => {
                            navigate(item.route);
                            setMobileNavOpen(false);
                          }}
                          className={`flex items-center justify-between h-11 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                            location.pathname.startsWith(item.route)
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground/80 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="size-4.5 text-primary" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-destructive text-white font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {item.children && (
                          <div className="ml-6 pl-3 border-l border-border/60 space-y-1">
                            {item.children.map((child) => (
                              <div
                                key={child.id}
                                onClick={() => {
                                  navigate(child.route);
                                  setMobileNavOpen(false);
                                }}
                                className={`flex items-center justify-between h-9 px-2 text-xs font-medium rounded cursor-pointer transition-colors ${
                                  location.pathname === child.route
                                    ? 'text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <span>{child.label}</span>
                                {child.badge !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                                    {child.badge}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Workspace: Full Bleed for Overview (p-0) */}
          <main className={`flex-1 flex flex-col min-w-0 ${isOverview ? 'overflow-hidden p-0 relative h-full' : 'overflow-y-auto p-4 lg:p-6'}`}>
            {!isOverview && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 select-none">
                <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate('/overview')}>
                  Falcon
                </span>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb + idx}>
                    <ChevronRight className="size-3 text-muted-foreground/60" />
                    <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-foreground' : 'hover:text-foreground cursor-pointer'}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
};
