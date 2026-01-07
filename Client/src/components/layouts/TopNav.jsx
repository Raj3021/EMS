import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";

function TopNav({ sidebarCollapsed, onMenuClick }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        sidebarCollapsed ? "left-20" : "left-64"
      }`}>
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="input-field pl-10 w-64 lg:w-80"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-muted transition-colors">
          {darkMode ? (
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card rounded-xl border border-border shadow-soft-lg animate-fade-in">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <p className="text-sm font-medium">New task assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sarah assigned you a new task
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      5 min ago
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <div className="avatar avatar-sm">JD</div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-14 w-56 bg-card rounded-xl border border-border shadow-soft-lg animate-fade-in">
              <div className="p-2">
                <button className="w-full p-3 rounded-lg text-left text-sm hover:bg-muted transition-colors">
                  View Profile
                </button>
                <button className="w-full p-3 rounded-lg text-left text-sm hover:bg-muted transition-colors">
                  Account Settings
                </button>
                <hr className="my-2 border-border" />
                <button className="w-full p-3 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNav;
