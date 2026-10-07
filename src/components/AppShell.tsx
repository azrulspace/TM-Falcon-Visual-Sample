import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, ClipboardList, ShieldAlert, MapPinned, BarChart3, Settings, LogOut, Moon, Sun, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

import { useAppContext } from '../contexts/AppContext';
import { Logo } from './Logo';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { accountLabel, setAccountLabel } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.classList.contains("theme_dark") ? "dark" : "light");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => {
    const r = document.documentElement;
    r.classList.remove("theme_light", "theme_dark");
    const newTheme = theme === "dark" ? "light" : "dark";
    r.classList.add("theme_" + newTheme);
    localStorage.setItem("ds_theme", newTheme);
    setTheme(newTheme);
  };

  const handleLogout = () => {
    setAccountLabel(null);
    navigate('/signin');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, route: '/overview' },
    { label: 'Event inbox', icon: Radio, route: '/events', children: [{ label: 'Event inbox', route: '/events' }, { label: 'Intervention outcomes', route: '/planned/intervention' }], group: 'EVENTS' },
    { label: 'Cases', icon: ClipboardList, route: '/planned/cases' },
    { label: 'Risk & preventive work', icon: ShieldAlert, route: '/risk', children: [{ label: 'Risk overview', route: '/risk' }, { label: 'Work queue', route: '/planned/work-queue' }], group: 'RISK' },
    { label: 'Assets & devices', icon: MapPinned, route: '/assets/inventory', children: [{ label: 'Inventory register', route: '/assets/inventory' }, { label: 'Devices', route: '/planned/devices' }, { label: 'Fleet health', route: '/planned/fleet' }], group: 'ASSETS' },
    { label: 'Reports', icon: BarChart3, route: '/planned/reports', group: 'SYSTEM' },
    { label: 'Administration', icon: Settings, route: '/planned/admin' },
  ];

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="app_shell">
      <header className="app_header">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-primary" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="h-8" />
          </div>
        </div>
                <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-primary border border-secondary rounded-full">
            <div className="w-2 h-2 rounded-full bg-success-solid"></div>
            <span className="text_sm font-medium">Devices: 11/15 online</span>
          </div>
          {accountLabel && (
            <div className="hidden lg:block text_sm font-medium">
              {accountLabel.split(' ')[0]} <span className="text-tertiary">{accountLabel.substring(accountLabel.indexOf(' '))}</span>
            </div>
          )}
          <button className="btn btn_tertiary_gray btn_sm btn_icon_only" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-overlay z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        <aside className={`app_sidebar ${sidebarOpen ? 'is_open' : ''} ${sidebarMinimized ? 'is_minimized' : ''}`}>
          <div className={`p-4 flex ${sidebarMinimized ? 'justify-center' : 'justify-end'}`}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button 
                  className="text-sidebar-muted hover:text-sidebar transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border\_sidebar\_accent)] rounded"
                  onClick={() => setSidebarMinimized(!sidebarMinimized)}
                  aria-label={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
                  aria-expanded={!sidebarMinimized}
                >
                  {sidebarMinimized ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </button>
              </Tooltip.Trigger>
              {sidebarMinimized && (
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={16} className="bg-elevated text-primary border border-secondary shadow-lg px-3 py-1.5 rounded-sm text_sm z-50">
                    Expand sidebar
                    <Tooltip.Arrow className="fill-[var(--bg\_elevated)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
          <div className="px-4 pb-4 flex flex-col gap-1 flex-1">
            {navItems.map((item, i) => {
              const isParentActive = location.pathname.startsWith(item.route);
              const isLeafActive = isParentActive && !item.children;
              return (
              <React.Fragment key={i}>
                {item.group && !sidebarMinimized && <div className="text_xs font-semibold uppercase tracking-[var(--tracking\_wide)] text-sidebar-label px-4 mt-4 mb-2">{item.group}</div>}
                
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div 
                      className={`flex items-center gap-3 px-3 h-10 rounded-md cursor-pointer text_sm font-medium transition-all relative ${
                        sidebarMinimized ? 'justify-center' : ''
                      } ${
                        isLeafActive 
                          ? 'bg-sidebar-active text-sidebar' 
                          : isParentActive
                            ? 'text-sidebar hover:bg-sidebar-hover hover:text-sidebar'
                            : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                      } focus-visible:outline-none focus-visible:shadow-[var(--ring\_sidebar)]`}
                      onClick={() => {
                        navigate(item.route);
                        setSidebarOpen(false);
                      }}
                      tabIndex={0}
                      role="link"
                      aria-current={isLeafActive ? "page" : undefined}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(item.route); }}
                    >
                      {isLeafActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--border\_sidebar\_accent)] rounded-r-md"></div>}
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isParentActive && !isLeafActive ? 'text-sidebar' : ''}`} />
                      {!sidebarMinimized && <span className="truncate">{item.label}</span>}
                    </div>
                  </Tooltip.Trigger>
                  {sidebarMinimized && (
                    <Tooltip.Portal>
                      <Tooltip.Content side="right" sideOffset={16} className="bg-elevated text-primary border border-secondary shadow-lg px-3 py-1.5 rounded-sm text_sm z-50">
                        {item.label}
                        <Tooltip.Arrow className="fill-[var(--bg\_elevated)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>

                {item.children && isParentActive && !sidebarMinimized && (
                  <div className="ml-5 pl-4 border-l border-secondary flex flex-col gap-1 mt-1">
                    {item.children.map(child => {
                      const isChildActive = location.pathname === child.route || location.pathname.startsWith(child.route + '/');
                      return (
                      <div 
                        key={child.route}
                        className={`relative px-3 py-2 text_sm font-medium rounded-md cursor-pointer focus-visible:outline-none focus-visible:shadow-[var(--ring\_sidebar)] ${
                          isChildActive ? 'bg-sidebar-active text-sidebar' : 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover'
                        }`}
                        onClick={() => {
                          navigate(child.route);
                          setSidebarOpen(false);
                        }}
                        tabIndex={0}
                        role="link"
                        aria-current={isChildActive ? "page" : undefined}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(child.route); }}
                      >
                        {isChildActive && <div className="absolute -left-[17px] top-0 bottom-0 w-[3px] bg-[var(--border\_sidebar\_accent)]"></div>}
                        {child.label}
                      </div>
                    )})}
                  </div>
                )}
              </React.Fragment>
            )})}
          </div>
          <div className="p-4 mt-auto">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div 
                  className={`flex items-center gap-3 px-3 h-10 rounded-md cursor-pointer text_sm font-medium transition-all text-sidebar-muted hover:text-sidebar hover:bg-sidebar-hover focus-visible:outline-none focus-visible:shadow-[var(--ring\_sidebar)] ${
                    sidebarMinimized ? 'justify-center' : ''
                  }`}
                  onClick={handleLogout}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogout(); }}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!sidebarMinimized && <span className="truncate">Log out</span>}
                </div>
              </Tooltip.Trigger>
              {sidebarMinimized && (
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={16} className="bg-elevated text-primary border border-secondary shadow-lg px-3 py-1.5 rounded-sm text_sm z-50">
                    Log out
                    <Tooltip.Arrow className="fill-[var(--bg\_elevated)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </aside>
        
        <main className="app_page" id="main-content">
          <div className="app_page_content">
            {children}
          </div>
        </main>
      </div>
    </div>
    </Tooltip.Provider>
  );
};
