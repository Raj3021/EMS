import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  Award,
} from "lucide-react";

const chartData = [
  { month: "Jan", value: 65 },
  { month: "Feb", value: 72 },
  { month: "Mar", value: 68 },
  { month: "Apr", value: 85 },
  { month: "May", value: 78 },
  { month: "Jun", value: 92 },
];

const performanceData = [
  { name: "Sarah Johnson", role: "Product Manager", score: 95, tasks: 24 },
  { name: "Michael Chen", role: "Senior Developer", score: 92, tasks: 31 },
  { name: "Emily Davis", role: "UX Designer", score: 88, tasks: 18 },
  { name: "David Brown", role: "DevOps Engineer", score: 85, tasks: 22 },
];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance metrics and insights
          </p>
        </div>
        <select className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-auto">
          <option value="30">Last 30 days</option>
          <option value="60">Last 60 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Gradient Card */}
        <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Employee Productivity</p>
              <p className="text-3xl font-bold mt-1">87%</p>
              <p className="text-sm mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% from last month
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Regular Cards */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <p className="text-3xl font-bold text-foreground mt-1">284</p>
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8% from last month
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Award className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-3xl font-bold text-foreground mt-1">12</p>
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +3 new this month
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team Growth</p>
              <p className="text-3xl font-bold text-foreground mt-1">156</p>
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +18 new hires
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Productivity Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Productivity Trend</h2>
            <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">
              +12.5%
            </span>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((item) => (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/80 rounded-t-lg transition-all duration-500 hover:bg-primary"
                  style={{ height: `${item.value * 2}px` }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Project Progress</h2>
            <button className="text-sm text-primary hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: "UI Redesign", progress: 65, color: "bg-primary" },
              { name: "Security Update", progress: 40, color: "bg-blue-500" },
              { name: "Documentation", progress: 80, color: "bg-green-500" },
              { name: "Q1 Marketing", progress: 25, color: "bg-orange-500" },
            ].map((project) => (
              <div key={project.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${project.color} rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Top Performers</h2>
          <button className="text-sm text-primary hover:underline">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceData.map((employee, index) => (
            <div
              key={employee.name}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  {index === 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">
                      👑
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.role}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium">{employee.score}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${employee.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {employee.tasks} tasks completed
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
