import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, ClipboardList, ShieldAlert, MapPinned, BarChart3, Settings, LogOut, Moon, Sun, Menu } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { reviewMode, setReviewMode, accountLabel, setAccountLabel } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { label: 'Events', icon: Radio, route: '/events', children: [{ label: 'Event Inbox', route: '/events' }, { label: 'Intervention Outcomes', route: '/planned/intervention' }], group: 'EVENTS' },
    { label: 'Cases', icon: ClipboardList, route: '/planned/cases' },
    { label: 'Risk & Preventive Work', icon: ShieldAlert, route: '/risk', children: [{ label: 'Risk overview', route: '/risk' }, { label: 'Work queue', route: '/planned/work-queue' }], group: 'RISK' },
    { label: 'Assets & Devices', icon: MapPinned, route: '/assets/inventory', children: [{ label: 'Inventory register', route: '/assets/inventory' }, { label: 'Devices', route: '/planned/devices' }, { label: 'Fleet Health', route: '/planned/fleet' }], group: 'ASSETS' },
    { label: 'Reports', icon: BarChart3, route: '/planned/reports' },
    { label: 'Administration', icon: Settings, route: '/planned/admin' },
  ];

  return (
    <div className="app_shell">
      <header className="app_header">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-[var(--text_primary)]" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--bg_brand_solid)] rounded-[var(--radius_sm)] flex items-center justify-center text-white font-bold text-sm">TM</div>
            <span className="text_xl font-semibold tracking-tight">FALCON</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[var(--bg_primary)] border border-[var(--border_secondary)] rounded-full">
            <div className="w-2 h-2 rounded-full bg-[var(--bg_success_solid)]"></div>
            <span className="text_sm font-medium">Devices: 11/15 online</span>
          </div>
          {accountLabel && (
            <div className="hidden lg:block text_sm font-medium">
              {accountLabel.split(' ')[0]} <span className="text-[var(--text_tertiary)]">{accountLabel.substring(accountLabel.indexOf(' '))}</span>
            </div>
          )}
          {accountLabel && (
            <button className="btn btn_tertiary_gray btn_sm hidden sm:inline-flex" onClick={handleLogout}>Sign out</button>
          )}
          <button className="btn btn_tertiary_gray btn_sm btn_icon_only" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button 
            className={`btn btn_sm ${reviewMode ? 'btn_secondary' : 'btn_secondary_gray'}`}
            onClick={() => setReviewMode(!reviewMode)}
          >
            Review mode
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-[var(--bg_overlay)] z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        <aside className={`app_sidebar ${sidebarOpen ? 'is_open' : ''}`}>
          <div className="p-4 flex flex-col gap-1 flex-1">
            {navItems.map((item, i) => (
              <React.Fragment key={i}>
                {item.group && <div className="text_xs font-semibold uppercase tracking-[var(--tracking_wide)] text-[var(--text_sidebar_muted)] px-4 mt-4 mb-2">{item.group}</div>}
                <div 
                  className={`flex items-center gap-3 px-3 h-10 rounded-[var(--radius_md)] cursor-pointer text_sm font-medium ${
                    location.pathname.startsWith(item.route) ? 'bg-[var(--bg_sidebar_active)] text-[var(--text_sidebar_active)] border-l-4 border-[var(--border_brand)]' : 'text-[var(--text_sidebar)] hover:bg-[var(--bg_sidebar_hover)]'
                  }`}
                  onClick={() => {
                    navigate(item.route);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
                {item.children && location.pathname.startsWith(item.route) && (
                  <div className="ml-5 pl-4 border-l border-[var(--border_sidebar)] flex flex-col gap-1 mt-1">
                    {item.children.map(child => (
                      <div 
                        key={child.route}
                        className={`px-3 py-2 text_sm font-medium rounded-[var(--radius_md)] cursor-pointer ${
                          location.pathname === child.route ? 'bg-[var(--bg_sidebar_active)] text-[var(--text_sidebar_active)]' : 'text-[var(--text_sidebar_muted)] hover:text-[var(--text_sidebar)]'
                        }`}
                        onClick={() => {
                          navigate(child.route);
                          setSidebarOpen(false);
                        }}
                      >
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="p-4 mt-auto">
            <div className="p-3 bg-[var(--bg_sidebar_hover)] rounded-[var(--radius_lg)] text_xs text-[var(--text_sidebar_muted)]">
              Proposed design with fictional sample data. Turn on <strong className="text-[var(--text_sidebar_active)]">Review mode</strong> for page IDs, roles and open questions.
            </div>
          </div>
        </aside>
        
        <main className="app_page" id="main-content">
          <div className="app_page_content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

