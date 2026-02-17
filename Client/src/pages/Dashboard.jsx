import {
  Users,
  Briefcase,
  Video,
  CheckSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  MessageCircle,
  Upload,
  Calendar,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { stats, activities, meetings, tasks } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const iconMap = {
  check: CheckCircle,
  code: TrendingUp,
  upload: Upload,
  calendar: Calendar,
  message: MessageCircle,
};

export default function Dashboard() {
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const upcomingMeetings = meetings.slice(0, 3);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // exp is in seconds
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      // Invalid token format
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          change={stats.employeeGrowth}
          icon={Users}
          variant="gradient"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          change={stats.projectGrowth}
          icon={Briefcase}
        />
        <StatCard
          title="Meetings Today"
          value={stats.meetingsToday}
          icon={Video}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          change={stats.taskCompletion + " completed"}
          icon={CheckSquare}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Overview (Taking the place of Activity Feed) */}
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Pending Tasks</h2>
            <button className="text-sm text-primary hover:underline">
              View all tasks
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 rounded-l-lg">Task</th>
                  <th className="text-left p-3">Project</th>
                  <th className="text-left p-3">Assignee</th>
                  <th className="text-left p-3">Priority</th>
                  <th className="text-left p-3">Due Date</th>
                  <th className="text-left p-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.slice(0, 5).map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="font-medium">{task.title}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{task.project}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm">
                          {task.assignee
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          task.priority === "high"
                            ? "badge-warning"
                            : task.priority === "medium"
                              ? "badge-primary"
                              : "badge-muted"
                        }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{task.dueDate}</td>
                    <td className="p-3">
                      <span
                        className={`badge whitespace-nowrap ${
                          task.status === "in-progress"
                            ? "badge-primary"
                            : "badge-muted"
                        }`}>
                        {task.status === "in-progress" ? "In Progress" : "To Do"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Meetings (Kept on the side) */}
        <div className="dashboard-card h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Upcoming Meetings</h2>
            <button className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{meeting.title}</h3>
                  <span className="badge badge-primary">{meeting.date}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meeting.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.attendees}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
