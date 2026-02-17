import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Video,
  FileText,
  Calendar,
  FolderOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Heading1,
  Check,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Employees", path: "/employees" },
  { icon: CheckSquare, label: "Tasks & Projects", path: "/tasks" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Video, label: "Meetings", path: "/meetings" },
  { icon: FileText, label: "Notes", path: "/notes" },
  { icon: Calendar, label: "Attendance & Leave", path: "/attendance" },
  { icon: FolderOpen, label: "Files", path: "/files" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];



export function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const [status, setStatus] = useState("active");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/employees/current/settings")
        .then((res) => setStatus(res.data.profile.status || "active"))
        .catch((err) => console.error("Failed to fetch status", err));
    }
  }, [user]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    try {
      await api.put("/employees/current/status", { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

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

  return (
    <aside
      className={`fixed left-0 top-0 h-svh bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col overflow-hidden ${
        collapsed ? "w-20" : "w-64"
      }`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground">
              WorkHub
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isChat = item.path === "/chat";
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full nav-item relative ${isActive ? "nav-item-active" : ""}`}
              title={collapsed ? item.label : undefined}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
              
              {/* Unread Badge */}
              {isChat && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-sidebar" />
                ) : (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )
              )}
            </button>
          );
        })}
      </nav>

      {/* User section at bottom */}
      {!collapsed && (
        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="avatar avatar-sm"
              />
            ) : (
              <div className="avatar avatar-sm">{initials}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate mb-1">
                {subtitle}
              </p>
              
              {/* Status Switcher */}
              <div className="relative mt-1" ref={statusRef}>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md hover:bg-sidebar-accent-hover w-full"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'active' ? 'bg-green-500' : 
                    status === 'busy' ? 'bg-yellow-500' : 
                    'bg-slate-400'
                  }`} />
                  <span className="capitalize">{status}</span>
                  <ChevronUp className={`w-3 h-3 ml-auto transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatusOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 z-50">
                    {['active', 'busy', 'offline'].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          handleStatusChange({ target: { value: s } });
                          setIsStatusOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          s === 'active' ? 'bg-green-500' : 
                          s === 'busy' ? 'bg-yellow-500' : 
                          'bg-slate-400'
                        }`} />
                        <span className="capitalize">{s}</span>
                        {status === s && <Check className="w-3 h-3 ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
