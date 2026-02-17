import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function TopNav({ sidebarCollapsed, onMenuClick }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];
  const isAdmin = roles.some(
    (role) => role?.toLowerCase && role.toLowerCase() === "admin",
  );
  const primaryRole = user?.role || roles[0] || "Member";
  const tenantName = user?.tenantName || user?.tenant?.name || "";
  const roleLabel = isAdmin ? "Admin" : primaryRole;
  const subtitle = isAdmin && tenantName ? `${tenantName} - Admin` : roleLabel;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    logout();
    setShowProfile(false);
    navigate("/login");
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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card rounded-xl border border-border shadow-soft-lg animate-fade-in z-50">
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
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="avatar avatar-sm"
              />
            ) : (
              <div className="avatar avatar-sm">{initials}</div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium truncate max-w-[160px]">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                {subtitle}
              </p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-14 w-56 bg-card rounded-xl border border-border shadow-soft-lg animate-fade-in z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate("/settings?tab=profile");
                    setShowProfile(false);
                  }}
                  className="w-full p-3 rounded-lg text-left text-sm hover:bg-muted transition-colors">
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate("/settings?tab=company");
                    setShowProfile(false);
                  }}
                  className="w-full p-3 rounded-lg text-left text-sm hover:bg-muted transition-colors">
                  Account Settings
                </button>
                <hr className="my-2 border-border" />
                <button
                  onClick={handleSignOut}
                  className="w-full p-3 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors">
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
