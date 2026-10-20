import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Laptop,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

import { useAppContext } from '../contexts/AppContext';
import { useOverview } from '../contexts/OverviewContext';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlobalSearchCommand } from './GlobalSearchCommand';
import { navigationConfig, type NavItem } from '@/config/navigation';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel, setAccountLabel } = useAppContext();
  const overview = useOverview();
  const location = useLocation();
  const navigate = useNavigate();

  const isOverview = location.pathname === '/overview';

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [notificationsList] = useState([
    {
      id: 'notif-1',
      deviceId: 'DEV-004',
      badge: 'Offline',
      title: 'DEV-004 Signal Lost',
      desc: 'Batu Lintang Relay Tower • No telemetry signal for 2h 14m',
      time: '2h 14m ago',
    },
    {
      id: 'notif-2',
      deviceId: 'DEV-011',
      badge: 'Offline',
      title: 'DEV-011 Mains Blackout',
      desc: 'Pending Industrial Substation • Power loss detected',
      time: '5h 03m ago',
    },
    {
      id: 'notif-3',
      deviceId: 'DEV-003',
      badge: 'Stale',
      title: 'DEV-003 Telemetry Delayed',
      desc: 'Petra Jaya Hub Cabinet B • Last packet 08:14 MYT',
      time: '8h 27m ago',
    },
    {
      id: 'notif-4',
      deviceId: 'DEV-008',
      badge: 'Stale',
      title: 'DEV-008 Telemetry Delayed',
      desc: 'Telaga Air Coastal Station • Last packet 10:31 MYT',
      time: '6h 11m ago',
    },
    {
      id: 'notif-5',
      deviceId: 'CBL-KCH-01',
      badge: 'Restored',
      title: 'Trunk Link Nominal',
      desc: 'Kuching - Samarahan 18km optical path healthy',
      time: '12m ago',
    },
    {
      id: 'notif-6',
      deviceId: 'DEV-002',
      badge: 'Updated',
      title: 'Firmware Patch Applied',
      desc: 'Satok repeater node upgraded to v3.2 build 410',
      time: '1h 45m ago',
    },
  ]);

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
  const [currentDate, setCurrentDate] = useState('Tue, 26 Aug 2025');
  const [currentTime, setCurrentTime] = useState('14:32 MYT');

  // Keep live date & time updated with MYT timezone
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentDate(dateStr);
      setCurrentTime(`${timeStr} MYT`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = useCallback(() => {
    const r = document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";
    r.classList.remove("theme_light", "theme_dark", "dark");
    r.classList.add("theme_" + newTheme);
    if (newTheme === "dark") {
      r.classList.add("dark");
    }
    localStorage.setItem("ds_theme", newTheme);
    setTheme(newTheme);
  }, [theme]);

  // Keyboard shortcut '/' to trigger global search and Shift+T for theme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

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
        {/* Header matching Figma: 60px brand row */}
        <header className="h-[60px] border-b dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white flex items-center justify-between px-6 z-30 shrink-0 select-none gap-4 transition-colors">
          {/* Left: Mobile trigger, TM FALCON Logo + Brand Lockup */}
            <div className="flex items-center gap-3.5 shrink-0">
              {/* Mobile menu trigger */}
              <button
                className="flex lg:hidden p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-[#1e2632] text-slate-500 dark:text-[#a3adbd] transition-colors focus-visible:outline-none"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>

              <Link to="/overview" className="flex items-center gap-3.5">
                <Logo className="h-7 w-auto" markOnly={true} />
                <div className="h-[37px] w-px bg-slate-200 dark:bg-[#2a323d]" />
                <div className="flex flex-col select-none">
                  <span className="text-[20px] font-bold text-slate-900 dark:text-[#e2e7ef] leading-tight tracking-tight">
                    FALCON
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-[#a3adbd] leading-tight font-normal">
                    Telecom Infrastructure Monitoring
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Global Search Input with shortcut badge '/' (Figma exact match) */}
            <div className="flex-1 flex justify-center max-w-sm mx-auto">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-[298px] h-[36px] px-[11px] rounded-[8px] border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 hover:bg-slate-100 dark:hover:bg-[#1c232e] flex items-center justify-between text-xs text-slate-500 dark:text-[#a3adbd] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Search className="size-4 shrink-0 text-slate-400 dark:text-[#a3adbd]" />
                  <span className="text-[11px] text-slate-600 dark:text-[#a3adbd] font-normal truncate">Search devices, sites, poles, cables...</span>
                </div>
                <div className="flex items-center shrink-0">
                  <kbd className="h-[19px] min-w-[18px] px-1 border dark:border-[#2a323d] border-slate-200 rounded flex items-center justify-center text-[11px] font-mono text-slate-500 dark:text-[#778394] dark:bg-[#10151c] bg-slate-100">
                    /
                  </kbd>
                </div>
              </button>
            </div>

            {/* Right: Notifications, Live data dropdown, Clock, User Profile */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Notifications Popover with unread indicator and list */}
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="relative text-slate-600 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1e2632] cursor-pointer"
                      aria-label="View notifications"
                    >
                      <Bell className="size-4.5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 dark:ring-[#151a22] ring-white" />
                      )}
                    </Button>
                  }
                />
                <PopoverContent align="end" side="bottom" sideOffset={10} className="w-80 p-0 bg-popover border border-border shadow-2xl rounded-xl z-50 text-xs overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-destructive text-white font-bold">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={() => setUnreadNotifications(0)}
                        className="text-[11px] text-primary hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                    {notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          overview.setSelectedId(notif.deviceId);
                          if (!isOverview) navigate('/overview');
                          setNotificationsOpen(false);
                        }}
                        className="p-2.5 hover:bg-muted/50 cursor-pointer transition-colors flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-foreground truncate">{notif.title}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">{notif.time}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-2">{notif.desc}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="h-[30.5px] w-px bg-slate-200 dark:bg-[#29313b]" />

              {/* Live Data Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#1e2632] transition-colors text-xs font-medium text-slate-800 dark:text-[#ecf0f5] select-none cursor-pointer">
                      <span className="relative flex size-2.5">
                        {overview.liveState === 'live' ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                            <span className="relative inline-flex rounded-full size-2.5 bg-[#10b981]" />
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full size-2.5 bg-[#ffa114]" />
                        )}
                      </span>
                      <span className="text-[11.4px]">
                        {overview.liveState === 'live' ? 'Live data' : 'Updates paused'}
                      </span>
                      <ChevronDown className="size-3 text-slate-400 dark:text-[#bdc5d1]" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-xs z-50">
                  <DropdownMenuLabel className="text-xs font-semibold flex items-center justify-between">
                    <span>Telemetry Feed</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{overview.lastUpdatedTime}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => overview.setLiveState('live')}
                    className={`cursor-pointer font-medium ${overview.liveState === 'live' ? 'text-emerald-500 font-bold' : ''}`}
                  >
                    <span className="size-2 rounded-full bg-[#10b981] mr-2 inline-block" />
                    <span>Live stream active</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => overview.setLiveState('paused')}
                    className={`cursor-pointer ${overview.liveState === 'paused' ? 'text-amber-500 font-bold' : ''}`}
                  >
                    <span className="size-2 rounded-full bg-[#ffa114] mr-2 inline-block" />
                    <span>Pause telemetry stream</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={overview.refreshNow} className="cursor-pointer">
                    <span>Refresh now (shimmer)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Refresh Interval
                  </DropdownMenuLabel>
                  {[5, 15, 30, 60].map((sec) => (
                    <DropdownMenuItem
                      key={sec}
                      onClick={() => overview.setRefreshInterval(sec)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span>{sec < 60 ? `${sec} seconds` : '1 minute'}</span>
                      {overview.refreshInterval === sec && <span className="text-primary text-[10px]">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-[30.5px] w-px bg-slate-200 dark:bg-[#29313b]" />

              {/* Real-time date/time display */}
              <div className="flex flex-col text-left leading-[1.35] select-none pr-1">
                <span className="text-[9.5px] text-slate-500 dark:text-[#bdc5d1]">{currentDate}</span>
                <span className="text-[12.4px] font-semibold text-slate-800 dark:text-[#ecf0f5] tracking-wide font-mono tabular-nums">{currentTime}</span>
              </div>

              <div className="h-[30.5px] w-px bg-slate-200 dark:bg-[#29313b]" />

              {/* User Profile Avatar with dropdown (appearance, admin, reports, logout) */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-3 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1e2632] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer">
                      <Avatar className="size-[34px] border dark:border-[#2a323d] border-slate-200">
                        <AvatarFallback className="dark:bg-[#2b3440] bg-slate-200 dark:text-[#e2e7ef] text-slate-800 text-xs font-bold">
                          AS
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left leading-tight hidden xl:flex">
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-[#e2e7ef]">Ahmad Syukri</span>
                        <span className="text-[9px] text-slate-500 dark:text-[#a3adbd]">TM Operations</span>
                      </div>
                      <ChevronDown className="size-3 text-slate-400 dark:text-[#bdc5d1]" />
                    </button>
                  }
                />

                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-popover-foreground z-50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{accountLabel || 'Ahmad Syukri'}</span>
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
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Appearance</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                    }}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="size-3.5" />
                      <span>Light Theme</span>
                    </div>
                    {theme === 'light' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                    }}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="size-3.5" />
                      <span>Dark Theme</span>
                    </div>
                    {theme === 'dark' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleTheme()}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="size-3.5" />
                      <span>Toggle (Shift+T)</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-3.5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Explicit Theme Toggle Button matching Figma node 138:13096 / 138:14047 */}
              <button
                id="theme-toggle-button"
                onClick={() => toggleTheme()}
                className="flex items-center justify-center size-[36px] rounded-md hover:bg-slate-100 dark:hover:bg-[#1e2632] text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] transition-colors focus-visible:outline-none cursor-pointer"
                aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
            </div>
        </header>

        {/* Global Search Dialog */}
        <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Main Body with Sidebar + Viewport */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop Left Sidebar (72px collapsed dock persistent across all pages including Overview) */}
          <aside
            style={{ width: sidebarMinimized ? '72px' : '264px' }}
            className="dark:bg-[#151a22] bg-white border-r dark:border-[#2a323d] border-slate-200 hidden lg:flex flex-col shrink-0 transition-all duration-200 z-30 select-none relative"
            onMouseLeave={handleRailMouseLeave}
          >
            {/* Top expand/collapse toggle container matching Figma node 132:10631 */}
            <div className="flex items-center justify-center p-3 border-b dark:border-[#2a323d]/60 border-slate-200 shrink-0">
              <button
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1e2632] text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] transition-colors focus-visible:outline-none"
                onClick={handleToggleSidebar}
                aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarMinimized ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
              </button>
            </div>

            {/* Scrollable Nav Sections */}
            <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto overflow-x-hidden">
              {navigationConfig.map((sec) => (
                <div key={sec.id} className="flex flex-col gap-1">
                  {!sidebarMinimized && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#778394] px-2.5 mt-2 mb-0.5">
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
                              className={`flex items-center gap-2.5 h-[40px] px-[12px] rounded-[6px] cursor-pointer text-xs font-medium transition-all relative ${
                                sidebarMinimized ? 'justify-center' : 'justify-between'
                              } ${
                                isLeafActive
                                  ? 'bg-[#261c80] text-white font-semibold shadow-xs'
                                  : isParentActive
                                  ? 'text-slate-900 dark:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1e2632]'
                                  : 'text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1e2632]'
                              } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary`}
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
                              {/* Active purple accent bar on left edge matching Figma node 132:10644 */}
                              {isLeafActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#7b72e0] rounded-r-[6px]" />
                              )}
                              <item.icon className={`size-5 shrink-0 ${isLeafActive ? 'text-[#e2e7ef]' : isParentActive ? 'text-primary' : 'text-[#a3adbd]'}`} />
                              {!sidebarMinimized && <span className="truncate">{item.label}</span>}

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
                                sideOffset={14}
                                className="bg-[#151a22] text-[#e2e7ef] border border-[#2a323d] shadow-xl px-2.5 py-1 rounded text-xs z-50 font-medium"
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
                          <div className="ml-4 pl-3 border-l border-[#2a323d] flex flex-col gap-1 my-1 animate-in fade-in-50 duration-150">
                            {item.children?.map((child) => {
                              const isChildActive = location.pathname === child.route;
                              const hasGrandChildren = child.children && child.children.length > 0;

                              return (
                                <div key={child.id} className="flex flex-col">
                                  <div
                                    className={`flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                                      isChildActive
                                        ? 'bg-[#261c80] text-white font-semibold'
                                        : 'text-[#a3adbd] hover:text-[#e2e7ef] hover:bg-[#1e2632]'
                                    }`}
                                    onClick={() => navigate(child.route)}
                                  >
                                    <span className="truncate">{child.label}</span>
                                    {child.badge !== undefined && (
                                      <span className="px-1 py-0.2 rounded text-[10px] font-mono bg-[#1c232e] text-[#a3adbd]">
                                        {child.badge}
                                      </span>
                                    )}
                                  </div>

                                  {/* 3rd Level Indentation */}
                                  {hasGrandChildren && (
                                    <div className="ml-3 pl-2 border-l border-[#2a323d]/60 flex flex-col gap-0.5 my-0.5">
                                      {child.children?.map((grandChild) => {
                                        const isGrandActive = location.pathname === grandChild.route;
                                        return (
                                          <div
                                            key={grandChild.id}
                                            className={`px-2 py-1 text-[11px] rounded cursor-pointer transition-colors flex items-center justify-between ${
                                              isGrandActive
                                                ? 'text-primary font-semibold'
                                                : 'text-[#a3adbd] hover:text-[#e2e7ef]'
                                            }`}
                                            onClick={() => navigate(grandChild.route)}
                                          >
                                            <span className="truncate">{grandChild.label}</span>
                                            {grandChild.badge !== undefined && (
                                              <span className="text-[10px] font-mono text-[#a3adbd]">
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

            {/* Collapsed Rail Flyout Panel anchored directly to 72px dock with hover intent bridge */}
            {sidebarMinimized && activeFlyoutItem && (
              <div
                style={{ top: `${activeFlyoutItem.top}px` }}
                className="absolute left-[72px] w-64 glass-panel p-3 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150 shadow-2xl border border-border"
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

            {/* Bottom Log out button matching Figma node 132:10680 */}
            <div className="p-3 border-t border-[#2a323d] mt-auto shrink-0">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div
                    className={`flex items-center gap-3 px-3 h-10 rounded-md cursor-pointer text-xs font-medium transition-all text-[#a3adbd] hover:text-[#e2e7ef] hover:bg-[#1e2632] ${
                      sidebarMinimized ? 'justify-center' : ''
                    }`}
                    onClick={handleLogout}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogout();
                    }}
                  >
                    <LogOut className="size-5 shrink-0" />
                    {!sidebarMinimized && <span className="truncate">Log out</span>}
                  </div>
                </Tooltip.Trigger>
                {sidebarMinimized && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={14}
                      className="bg-[#151a22] text-[#e2e7ef] border border-[#2a323d] shadow-xl px-2.5 py-1 rounded text-xs z-50 font-medium"
                    >
                      <span>Log out</span>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          </aside>

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
