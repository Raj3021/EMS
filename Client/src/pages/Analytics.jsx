import { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  Target,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const DEPARTMENT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const StatCard = ({ title, value, subtitle, icon: Icon, color = "primary", trend }) => {
  const colorMap = {
    primary: { bg: "bg-primary/10", text: "text-primary", gradient: "from-primary/20 to-primary/5" },
    success: { bg: "bg-success/10", text: "text-success", gradient: "from-success/20 to-success/5" },
    warning: { bg: "bg-warning/10", text: "text-warning", gradient: "from-warning/20 to-warning/5" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", gradient: "from-indigo-500/20 to-indigo-500/5" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`dashboard-card relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? "text-success" : "text-destructive"}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
              <span>{trend >= 0 ? "+" : ""}{trend}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${c.bg}`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground">{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

const chartAxisStyle = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
};

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState("30");

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role ? [user.role] : [];
  const isAdmin = roles.some(r => r?.toLowerCase?.() === "admin");

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/analytics?days=${daysFilter}`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, daysFilter]);

  if (!isAdmin) return <Navigate to="/" replace />;

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Crunching numbers...</p>
        </div>
      </div>
    );
  }

  const { stats, tasksTrend, hiresTrend, projectProgress, topPerformers, missingDeadlines, departments } = data;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Company-wide insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
          {["30", "60", "90"].map(d => (
            <button
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                daysFilter === d
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productivity Rate"
          value={`${stats.productivity}%`}
          subtitle="Tasks completed vs created"
          icon={Target}
          color="primary"
        />
        <StatCard
          title="Tasks Completed"
          value={stats.tasksCompleted}
          subtitle={`In the last ${daysFilter} days`}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle="Currently running"
          icon={Briefcase}
          color="warning"
        />
        <StatCard
          title="New Hires"
          value={stats.teamGrowth}
          subtitle={`In the last ${daysFilter} days`}
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Row 2: Tasks Trend + Hires Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Completed vs Pending */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tasks Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Completed vs Pending over time</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-success" /><span className="text-muted-foreground">Completed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-muted-foreground">Pending</span></div>
            </div>
          </div>
          {tasksTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No task data in this period.</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tasksTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" {...chartAxisStyle} />
                  <YAxis {...chartAxisStyle} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} fill="url(#completedGrad)" dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2.5} fill="url(#pendingGrad)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* New Hires Trend */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Hiring Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">New hires over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Hires</span>
            </div>
          </div>
          {hiresTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No hiring data in this period.</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hiresTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hiresGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" {...chartAxisStyle} />
                  <YAxis {...chartAxisStyle} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hires" name="Hires" stroke="#3b82f6" strokeWidth={2.5} fill="url(#hiresGrad)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Project Progress + Department Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Project Progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Active projects & task counts</p>
            </div>
          </div>
          <div className="space-y-5">
            {projectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active projects.</p>
            ) : projectProgress.map((project, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-foreground">{project.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.doneTasks ?? 0}/{project.tasksCount} done
                    </span>
                    <span className="font-semibold text-foreground w-8 text-right">{project.progress}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Pie Chart */}
        <div className="dashboard-card">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground">Employees by Department</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution across teams</p>
          </div>
          {departments.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No department data.</div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0" style={{ height: 180, width: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departments}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {departments.map((_, idx) => (
                        <Cell key={idx} fill={DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {departments.map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length] }} />
                      <span className="text-sm text-foreground truncate">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground flex-shrink-0">{dept.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Top Performers + Missing Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Top Performers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Most tasks completed this period</p>
            </div>
            <Award className="w-5 h-5 text-warning" />
          </div>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet — assign and complete some tasks!</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((emp, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    {idx === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{emp.name}</p>
                      <span className="text-xs font-bold text-success ml-2 flex-shrink-0">{emp.score}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${emp.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{emp.role} · {emp.tasks} tasks done</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employees Missing Deadlines */}
        <div className="dashboard-card flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Missed Deadlines</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Employees with overdue tasks</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          {missingDeadlines.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <p className="font-semibold text-foreground">All on track!</p>
              <p className="text-sm text-muted-foreground mt-1">No overdue tasks right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingDeadlines.map((emp, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <p className="text-xs text-destructive mt-0.5">{emp.missed} overdue task{emp.missed > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                    -{emp.missed}
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
