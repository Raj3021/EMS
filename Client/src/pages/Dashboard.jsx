import {
  Users,
  Briefcase,
  Video,
  CheckSquare,
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { formatDate } from "@/utils/formatDate";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { meetings as mockMeetings } from "@/data/mockData";

const StatCard = ({ title, value, subtitle, icon: Icon, accent = false }) => (
  <div className={`dashboard-card relative overflow-hidden`}>
    {accent && (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 pointer-events-none" />
    )}
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-2xl ${accent ? "bg-primary/15" : "bg-muted"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
    </div>
  </div>
);

const priorityConfig = {
  high: { cls: "badge-warning", label: "High" },
  medium: { cls: "badge-info", label: "Medium" },
  low: { cls: "badge-success", label: "Low" },
};

const statusConfig = {
  "in-progress": { cls: "badge-info", label: "In Progress" },
  todo: { cls: "badge-muted", label: "To Do" },
  done: { cls: "badge-success", label: "Done" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    stats: { pendingLeaves: 0, activeProjects: 0, upcomingMeetingsCount: 0, pendingTasks: 0, completedTasks: 0, totalEmployees: 0 },
    pendingTasks: [],
    upcomingMeetings: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
    } catch {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      return;
    }

    api.get("/dashboard")
      .then(res => setDashboardData(res.data))
      .catch(err => console.error("Failed to fetch dashboard data:", err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
  const isAdmin = roles.some(r => r?.toLowerCase?.() === "admin");
  const displayName = user?.name || user?.firstName || "User";
  const { stats, pendingTasks } = dashboardData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? "Admin Dashboard" : `Welcome back, ${displayName}! 👋`}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {isAdmin ? "Company-wide overview and insights" : "Here's a summary of your work today."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isAdmin ? "Total Employees" : "Pending Leaves"}
          value={isAdmin ? (stats.totalEmployees || 0) : (stats.pendingLeaves || 0)}
          subtitle={isAdmin ? "Active in the company" : "Awaiting approval"}
          icon={isAdmin ? Users : Calendar}
          accent
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects || 0}
          subtitle={isAdmin ? "Across all teams" : "You're part of"}
          icon={Briefcase}
        />
        <StatCard
          title="Meetings Today"
          value={mockMeetings.length}
          subtitle="Scheduled for today"
          icon={Video}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks || 0}
          subtitle={`${stats.completedTasks || 0} completed`}
          icon={CheckSquare}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Table */}
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isAdmin ? "All Pending Tasks" : "Your Pending Tasks"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest 5 tasks requiring attention</p>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending tasks right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-3 pb-3">Task</th>
                    <th className="text-left px-3 pb-3">Project</th>
                    <th className="text-left px-3 pb-3 hidden sm:table-cell">Assignee</th>
                    <th className="text-left px-3 pb-3">Priority</th>
                    <th className="text-left px-3 pb-3 hidden md:table-cell">Due</th>
                    <th className="text-left px-3 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingTasks.map(task => (
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-3 py-3.5">
                        <span className="font-medium text-sm text-foreground">{task.title}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm text-muted-foreground">{task.project || "—"}</span>
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {task.assignee ? task.assignee.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                          </div>
                          <span className="text-sm text-foreground hidden lg:inline">{task.assignee || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`badge ${(priorityConfig[task.priority] || priorityConfig.medium).cls}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className={`text-sm ${task.dueDate && new Date(task.dueDate) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {task.dueDate ? formatDate(task.dueDate) : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`badge whitespace-nowrap ${(statusConfig[task.status] || statusConfig.todo).cls}`}>
                          {(statusConfig[task.status] || statusConfig.todo).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meetings */}
        <div className="dashboard-card h-fit">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Upcoming Meetings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Scheduled for today</p>
            </div>
            <button onClick={() => navigate("/meetings")} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {mockMeetings.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No meetings scheduled.</div>
          ) : (
            <div className="space-y-3">
              {mockMeetings.slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm text-foreground leading-tight">{meeting.title}</h3>
                    <span className="badge badge-info flex-shrink-0">{meeting.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {meeting.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {meeting.attendees} attendees
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
