import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  ClipboardList,
  ShieldAlert,
  MapPinned,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  ChevronRight,
  RadioTower,
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
import { GlobalSearchCommand } from './GlobalSearchCommand';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel, setAccountLabel } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isOverview = location.pathname === '/overview';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Default to minimized 56px rail on Overview page as per Section 8.1
  const [sidebarMinimized, setSidebarMinimized] = useState(isOverview);
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
      // Format as e.g. "14:32:05 MYT"
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

  const handleLogout = () => {
    setAccountLabel(null);
    navigate('/signin');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, route: '/overview' },
    {
      label: 'Event inbox',
      icon: Radio,
      route: '/events',
      children: [
        { label: 'Event inbox', route: '/events' },
        { label: 'Intervention outcomes', route: '/planned/intervention' },
      ],
      group: 'EVENTS',
    },
    { label: 'Cases', icon: ClipboardList, route: '/planned/cases', group: 'EVENTS' },
    {
      label: 'Risk & preventive work',
      icon: ShieldAlert,
      route: '/risk',
      children: [
        { label: 'Risk overview', route: '/risk' },
        { label: 'Work queue', route: '/planned/work-queue' },
      ],
      group: 'RISK',
    },
    {
      label: 'Assets & devices',
      icon: MapPinned,
      route: '/assets/inventory',
      children: [
        { label: 'Inventory register', route: '/assets/inventory' },
        { label: 'Devices', route: '/planned/devices' },
        { label: 'Fleet health', route: '/planned/fleet' },
      ],
      group: 'ASSETS',
    },
    { label: 'Reports', icon: BarChart3, route: '/planned/reports', group: 'SYSTEM' },
    { label: 'Administration', icon: Settings, route: '/planned/admin' },
  ];

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Top Bar (56px, no wasted space) */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 z-30 shrink-0 gap-3">
          {/* Left: Sidebar trigger, Logo, Breadcrumbs */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarMinimized(!sidebarMinimized);
                }
              }}
              aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarMinimized ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>

            <Link to="/overview" className="flex items-center gap-2">
              <Logo className="h-6" markOnly={sidebarMinimized} />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-border text-xs text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/overview')}>Falcon</span>
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
              <span className="font-semibold text-foreground">
                {location.pathname === '/overview' ? 'Overview' : location.pathname.split('/')[1]?.toUpperCase() || 'Page'}
              </span>
            </div>
          </div>

          {/* Center: Global Search Command Trigger */}
          <div className="flex-1 max-w-xl mx-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full h-8 px-3 rounded-md bg-muted/60 hover:bg-muted border border-border flex items-center justify-between text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">Search poles, spans, devices, events, cases...</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-medium text-muted-foreground/80 pl-2">
                <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">⌘K</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">/</kbd>
              </div>
            </button>
          </div>

          {/* Right: Live indicator, Notifications, Theme toggle, User profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-status-online-tint border border-status-online-border text-xs font-medium text-status-online">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-status-online"></span>
              </span>
              <span className="font-semibold tracking-wide text-[11px]">LIVE</span>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums pl-1 border-l border-status-online-border/60">
                {currentTime || 'MYT'}
              </span>
            </div>

            {/* Notifications Button with count badge */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
                  <Bell className="size-4" />
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
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
                <Button variant="ghost" size="icon-sm" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
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
                    <span className="hidden xl:inline text-xs font-medium text-foreground pr-1">
                      {accountLabel || 'Ahmad Syukri'}
                    </span>
                  </button>
                }
              />

              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-popover-foreground z-50">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{accountLabel || 'Ahmad Syukri'}</span>
                    <span className="text-[11px] text-muted-foreground">TM Operations • Admin</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/planned/admin')} className="cursor-pointer text-xs">
                  <Settings className="mr-2 size-3.5" />
                  <span>Administration Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/planned/reports')} className="cursor-pointer text-xs">
                  <RadioTower className="mr-2 size-3.5" />
                  <span>System Diagnostics</span>
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
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar (Collapsible to 56px icon rail) */}
          <aside
            style={{ width: sidebarMinimized ? '56px' : '240px' }}
            className={`bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
              sidebarOpen ? 'fixed top-14 bottom-0 left-0 z-50 w-60' : 'hidden lg:flex'
            }`}
          >
            <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto overflow-x-hidden">
              {navItems.map((item, i) => {
                const isParentActive = location.pathname.startsWith(item.route);
                const isLeafActive = isParentActive && !item.children;
                return (
                  <React.Fragment key={i}>
                    {item.group && !sidebarMinimized && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sidebar-label px-3 mt-3 mb-1">
                        {item.group}
                      </div>
                    )}

                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`flex items-center gap-3 px-2.5 h-9 rounded-md cursor-pointer text-xs font-medium transition-all relative ${
                            sidebarMinimized ? 'justify-center' : ''
                          } ${
                            isLeafActive
                              ? 'bg-sidebar-active text-sidebar font-semibold'
                              : isParentActive
                              ? 'text-sidebar hover:bg-sidebar-hover'
                              : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                          } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring`}
                          onClick={() => {
                            navigate(item.route);
                            setSidebarOpen(false);
                          }}
                          tabIndex={0}
                          role="link"
                          aria-current={isLeafActive ? 'page' : undefined}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(item.route);
                          }}
                        >
                          {isLeafActive && (
                            <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-r" />
                          )}
                          <item.icon className={`size-4.5 shrink-0 ${isParentActive ? 'text-sidebar' : 'text-sidebar-muted'}`} />
                          {!sidebarMinimized && <span className="truncate">{item.label}</span>}
                        </div>
                      </Tooltip.Trigger>
                      {sidebarMinimized && (
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="right"
                            sideOffset={12}
                            className="bg-popover text-popover-foreground border border-border shadow-lg px-2.5 py-1 rounded text-xs z-50 font-medium"
                          >
                            {item.label}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>

                    {item.children && isParentActive && !sidebarMinimized && (
                      <div className="ml-4 pl-3 border-l border-sidebar-border flex flex-col gap-1 my-0.5">
                        {item.children.map((child) => {
                          const isChildActive =
                            location.pathname === child.route || location.pathname.startsWith(child.route + '/');
                          return (
                            <div
                              key={child.route}
                              className={`relative px-2.5 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                                isChildActive
                                  ? 'bg-sidebar-active text-sidebar font-semibold'
                                  : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                              }`}
                              onClick={() => {
                                navigate(child.route);
                                setSidebarOpen(false);
                              }}
                              tabIndex={0}
                              role="link"
                              aria-current={isChildActive ? 'page' : undefined}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') navigate(child.route);
                              }}
                            >
                              {child.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

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

          {/* Main workspace container */}
          <main className={`flex-1 flex flex-col min-w-0 ${isOverview ? 'overflow-hidden p-3' : 'overflow-y-auto p-4 lg:p-6'}`}>
            {children}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

