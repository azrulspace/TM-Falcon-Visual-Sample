import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  Moon,
  Sun,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronDown,
  Laptop,
  Tablet,
  Sparkles,
  MapPin,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

import { useAppContext } from '../contexts/AppContext';
import { useUiMode } from '@/hooks/useUiMode';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GlobalSearchCommand } from './GlobalSearchCommand';
import { navigationConfig, type NavItem } from '@/config/navigation';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel, setAccountLabel, previewClipStatus, setPreviewClipStatus } = useAppContext();
  const { modeSetting, setModeSetting, resolvedMode, orientation, viewportWidth } = useUiMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedLocation, setSelectedLocation] = useState('Teluk Panglima Garang');
  const locations = [
    'Teluk Panglima Garang',
    'Kuching Central',
    'Kuching North',
    'Samarahan',
    'Shah Alam',
    'Petaling Jaya',
  ];

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/overview')) return 'Overview';
    if (location.pathname.startsWith('/events')) return 'Event inbox';
    if (location.pathname.startsWith('/cases')) return 'Cases';
    if (location.pathname.startsWith('/risk')) return 'Risk & preventive';
    if (location.pathname.startsWith('/assets')) return 'Assets & devices';
    return 'Overview';
  }, [location.pathname]);

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

  const isTablet = resolvedMode === 'tablet';
  const isTabletPortrait = isTablet && orientation === 'portrait';
  const isTabletLandscape = isTablet && orientation === 'landscape';

  // Listen to visual viewport for virtual keyboard handling
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleVvResize = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    };
    vv.addEventListener('resize', handleVvResize);
    handleVvResize();
    return () => vv.removeEventListener('resize', handleVvResize);
  }, []);

  // Tap outside to close rail flyout on touch/tablet
  useEffect(() => {
    if (!activeFlyoutItem) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.glass-panel') && !target.closest('aside')) {
        setActiveFlyoutItem(null);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [activeFlyoutItem]);

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="flex flex-col h-[100dvh] w-full min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-background text-foreground">
        {/* Header matching Staging: TM Logo, Sidebar Toggle, Page Title, Location, Avatar */}
        <header className="h-[60px] border-b dark:border-[#2a323d] border-slate-200 dark:bg-[#10151c] bg-white flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 select-none gap-4 transition-colors">
          {/* Left: TM Logo, Sidebar Toggle, Page Title */}
          <div className="flex items-center gap-3.5 shrink-0">
            <Link to="/overview" className="flex items-center" aria-label="Falcon Overview">
              <Logo className="h-6 w-auto" markOnly={true} />
            </Link>

            {/* Sidebar Toggle Icon (Panel layout icon) */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (isTabletPortrait || viewportWidth < 1024) {
                      setMobileNavOpen(true);
                    } else {
                      setSidebarMinimized((prev) => !prev);
                    }
                  }}
                  className="flex items-center justify-center size-8 rounded-lg text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1c232e] transition-colors cursor-pointer"
                  aria-label="Toggle sidebar navigation"
                  title="Toggle sidebar"
                >
                  <PanelLeft className="size-4.5" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-md px-2 py-1 rounded text-xs z-50">
                  Toggle sidebar
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <span className="text-[15px] font-semibold text-slate-900 dark:text-[#ecf0f5] tracking-tight">
              {pageTitle}
            </span>
          </div>

          {/* Right: Location Dropdown and User Profile Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Location Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 h-9 px-3 rounded-lg border dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-slate-50 hover:bg-slate-100 dark:hover:bg-[#1c232e] text-xs font-medium text-slate-800 dark:text-[#ecf0f5] transition-colors cursor-pointer select-none"
                aria-label="Select location"
              >
                <MapPin className="size-3.5 text-slate-400 dark:text-[#a3adbd] shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">{selectedLocation}</span>
                <ChevronDown className="size-3 text-slate-400 dark:text-[#a3adbd] shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-xs z-50">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Monitoring Region
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {locations.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className="cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span>{loc}</span>
                      {selectedLocation === loc && <span className="text-primary text-[10px] font-bold">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Avatar with dropdown (appearance, admin, tablet mode, logout) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1c232e] transition-colors focus-visible:outline-none cursor-pointer select-none"
                aria-label="User account menu"
              >
                <div className="size-8 rounded-full bg-[#581c87] dark:bg-[#6b21a8] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                  A
                </div>
                <ChevronDown className="size-3 text-slate-400 dark:text-[#bdc5d1]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border text-popover-foreground z-50">
                <div className="px-2 py-1.5 border-b border-border">
                  <div className="text-xs font-semibold">{accountLabel || 'Ahmad Syukri'}</div>
                  <div className="text-[11px] text-muted-foreground">TM Operations • Network Command</div>
                </div>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/planned/admin')} className="cursor-pointer text-xs">
                    <span>Administration Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/planned/reports')} className="cursor-pointer text-xs">
                    <span>Reports & Audits</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
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
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">UI Mode</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setModeSetting('auto')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5" />
                      <span>Auto ({resolvedMode})</span>
                    </div>
                    {modeSetting === 'auto' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModeSetting('tablet')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Tablet className="size-3.5" />
                      <span>Tablet Mode</span>
                    </div>
                    {modeSetting === 'tablet' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModeSetting('desktop')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="size-3.5" />
                      <span>Desktop Mode</span>
                    </div>
                    {modeSetting === 'desktop' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Developer Flag: Preview Clip States (Section 4.3) */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Preview Clip States</span>
                    {previewClipStatus && <span className="text-[9px] font-mono text-amber-500 font-bold">PREVIEW</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus(null)}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Real data (no forced state)</span>
                    {previewClipStatus === null && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('not_requested')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Not requested</span>
                    {previewClipStatus === 'not_requested' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('requested')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Requested (waiting)</span>
                    {previewClipStatus === 'requested' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('uploading')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Uploading (progress)</span>
                    {previewClipStatus === 'uploading' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('ready')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Ready (video player)</span>
                    {previewClipStatus === 'ready' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('failed')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Failed (camera error)</span>
                    {previewClipStatus === 'failed' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('expired')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Expired</span>
                    {previewClipStatus === 'expired' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('device_offline')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>Device offline</span>
                    {previewClipStatus === 'device_offline' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPreviewClipStatus('no_permission')}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>No permission</span>
                    {previewClipStatus === 'no_permission' && <span className="text-[10px] text-primary">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-3.5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Global Search Dialog */}
        <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Main Body with Sidebar + Viewport */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar: 80px fixed labeled rail in tablet landscape, hidden in portrait, 72/264px desktop */}
          {!isTabletPortrait && (
            <aside
              style={{ width: isTabletLandscape ? '80px' : (sidebarMinimized ? '72px' : '264px') }}
              className="dark:bg-[#151a22] bg-white border-r dark:border-[#2a323d] border-slate-200 hidden lg:flex flex-col shrink-0 h-full max-h-full transition-all duration-200 z-30 select-none relative"
              onMouseLeave={handleRailMouseLeave}
            >
              {/* Top expand/collapse toggle container (hidden on tablet landscape) */}
              {!isTabletLandscape && (
                <div className="flex items-center justify-center p-3 border-b dark:border-[#2a323d]/60 border-slate-200 shrink-0">
                  <button
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1e2632] text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] transition-colors focus-visible:outline-none"
                    onClick={handleToggleSidebar}
                    aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarMinimized ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
                  </button>
                </div>
              )}

              {/* Scrollable Nav Sections */}
              <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto overflow-x-hidden">
                {navigationConfig.map((sec) => (
                  <div key={sec.id} className="flex flex-col gap-1">
                    {!sidebarMinimized && !isTabletLandscape && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#778394] px-2.5 mt-2 mb-0.5">
                        {sec.label}
                      </div>
                    )}

                    {sec.items.map((item) => {
                      const isEventsRoute = location.pathname.startsWith('/events') && item.id === 'event-inbox';
                      const isCasesRoute = (location.pathname.startsWith('/cases') || location.pathname.startsWith('/planned/cases')) && item.id === 'cases';
                      const isParentActive = location.pathname.startsWith(item.route) || isEventsRoute || isCasesRoute;
                      const isLeafActive = location.pathname === item.route || isEventsRoute || isCasesRoute;
                      const hasChildren = item.children && item.children.length > 0;
                      const isExpanded = openGroups[item.id] !== false; // default open

                      if (isTabletLandscape) {
                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col items-center justify-center h-[56px] w-full px-1 py-1 rounded-[8px] cursor-pointer text-xs font-medium transition-all relative ${
                              isLeafActive
                                ? 'bg-blue-500/15 dark:bg-[#2f6fed]/20 text-blue-600 dark:text-[#60a5fa] font-semibold shadow-xs'
                                : isParentActive
                                ? 'text-slate-900 dark:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1e2632]'
                                : 'text-slate-500 dark:text-[#a3adbd] hover:text-slate-900 dark:hover:text-[#e2e7ef] hover:bg-slate-100 dark:hover:bg-[#1e2632]'
                            }`}
                            onClick={(e) => {
                              if (hasChildren) {
                                if (activeFlyoutItem?.item.id === item.id) {
                                  setActiveFlyoutItem(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActiveFlyoutItem({
                                    item,
                                    top: Math.max(8, Math.min(rect.top - 64, window.innerHeight - 380)),
                                  });
                                }
                              } else {
                                setActiveFlyoutItem(null);
                                navigate(item.route);
                              }
                            }}
                          >
                            {isLeafActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#2f6fed] rounded-r-[6px]" />
                            )}
                            <item.icon className="size-5 shrink-0" />
                            <span className="text-[11px] leading-tight text-center truncate max-w-[72px] mt-0.5">
                              {item.label}
                            </span>
                            {item.badge !== undefined && (
                              <span className="absolute top-1.5 right-2 size-2 rounded-full bg-destructive" />
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={item.id} className="flex flex-col">
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div
                                className={`flex items-center gap-2.5 h-[40px] px-[12px] rounded-[6px] cursor-pointer text-xs font-medium transition-all relative ${
                                  sidebarMinimized ? 'justify-center' : 'justify-between'
                                } ${
                                  isLeafActive
                                    ? 'bg-blue-500/15 dark:bg-[#2f6fed]/20 text-blue-600 dark:text-[#60a5fa] font-semibold shadow-xs'
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
                                {/* Active blue accent bar on left edge */}
                                {isLeafActive && (
                                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2f6fed] rounded-r-[6px]" />
                                )}
                                <item.icon className={`size-5 shrink-0 ${isLeafActive ? 'text-blue-600 dark:text-[#60a5fa]' : isParentActive ? 'text-primary' : 'text-[#a3adbd]'}`} />
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
                                          ? 'bg-blue-500/15 dark:bg-[#2f6fed]/20 text-blue-600 dark:text-[#60a5fa] font-semibold'
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

              {/* Collapsed Rail Flyout Panel anchored to rail dock */}
              {(sidebarMinimized || isTabletLandscape) && activeFlyoutItem && (
                <div
                  style={{ top: `${activeFlyoutItem.top}px`, left: isTabletLandscape ? '80px' : '72px' }}
                  className="absolute w-64 glass-panel p-3 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150 shadow-2xl border border-border"
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
                          className={`flex items-center justify-between min-h-[48px] h-12 px-3 rounded-lg text-xs cursor-pointer transition-colors ${
                            location.pathname === sub.route
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <span className="truncate font-medium">{sub.label}</span>
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
                                className={`min-h-[44px] h-11 px-3 py-1 rounded text-[11px] cursor-pointer transition-colors flex items-center justify-between ${
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
              <div className="p-3 border-t border-[#2a323d] mt-auto shrink-0">
                {isTabletLandscape ? (
                  <div
                    className="flex flex-col items-center justify-center h-[56px] w-full rounded-lg cursor-pointer text-xs font-medium transition-all text-[#a3adbd] hover:text-[#e2e7ef] hover:bg-[#1e2632]"
                    onClick={handleLogout}
                    role="button"
                    tabIndex={0}
                  >
                    <LogOut className="size-5 shrink-0" />
                    <span className="text-[11px] leading-tight text-center mt-0.5">Log out</span>
                  </div>
                ) : (
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
                )}
              </div>
            </aside>
          )}

          {/* Mobile Sheet Navigation (< 1024px or Portrait Tablet) */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="p-0 w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border flex flex-col">
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
                    {sec.items.map((item) => {
                      const isItemActive =
                        location.pathname.startsWith(item.route) ||
                        (location.pathname.startsWith('/events') && item.id === 'event-inbox') ||
                        ((location.pathname.startsWith('/cases') || location.pathname.startsWith('/planned/cases')) && item.id === 'cases');
                      return (
                        <div key={item.id} className="space-y-1">
                          <div
                            onClick={() => {
                              navigate(item.route);
                              setMobileNavOpen(false);
                            }}
                            className={`flex items-center justify-between min-h-[48px] h-12 px-3.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                              isItemActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-foreground/80 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="size-5 text-primary" />
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
                                  className={`flex items-center justify-between min-h-[44px] h-11 px-3 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                                    location.pathname === child.route
                                      ? 'text-primary font-semibold bg-primary/5'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
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
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 min-h-[48px] h-12 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4.5" />
                  <span>Log out</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Workspace: Full Bleed for Overview (p-0) */}
          <main className={`flex-1 flex flex-col min-w-0 h-full max-h-full ${isOverview ? 'overflow-hidden p-0 relative' : 'overflow-y-auto p-4 lg:p-6'}`}>
            {!isOverview && !location.pathname.startsWith('/events') && (
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
