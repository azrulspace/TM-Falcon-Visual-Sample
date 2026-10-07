const fs = require("fs");
let content = fs.readFileSync("src/components/AppShell.tsx", "utf8");

// We need to replace the header right section
const headerRightStart = content.indexOf('<div className="flex items-center gap-4">', content.indexOf('</button>') + 1);
const headerRightEnd = content.indexOf('</header>');

const newHeaderRight = `        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-primary border border-secondary rounded-full">
            <div className="w-2 h-2 rounded-full bg-success-solid"></div>
            <span className="text_sm font-medium">Devices: 11/15 online</span>
          </div>
          {accountLabel && (
            <div className="hidden lg:block text_sm font-medium">
              {accountLabel.split(' ')[0]} <span className="text-tertiary">{accountLabel.substring(accountLabel.indexOf(' '))}</span>
            </div>
          )}
          {accountLabel && (
            <button className="btn btn_tertiary_gray btn_sm hidden sm:inline-flex" onClick={handleLogout}>Sign out</button>
          )}
          <button className="btn btn_tertiary_gray btn_sm btn_icon_only" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button 
            className={\`btn btn_sm \${reviewMode ? 'btn_secondary' : 'btn_secondary_gray'}\`}
            onClick={() => setReviewMode(!reviewMode)}
          >
            Review mode
          </button>
        </div>
      `;

content = content.substring(0, headerRightStart) + newHeaderRight + content.substring(headerRightEnd);

// Also let's fix the sidebar text classes
// The issue is that hover:text-sidebar hover:bg-sidebar-hover etc doesn't work if the class doesn't exist.
// Let's ensure text-sidebar, text-sidebar-muted, text-sidebar-label exist in tailwind.config.ts.
fs.writeFileSync("src/components/AppShell.tsx", content);
