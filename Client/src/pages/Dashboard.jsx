import { useState } from "react";
import {
  Users,
  Briefcase,
  Video,
  CheckSquare,
  TrendingUp,
  Clock,
  Upload,
  MessageSquare,
  Calendar,
  FileText,
} from "lucide-react";
import { stats, activities, meetings } from "../data/mockData";
import Sidebar from "../components/layouts/Sidebar";
import TopNav from "../components/layouts/TopNav";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Generate Report
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Employees
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalEmployees}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-success font-medium">
              {stats.employeeGrowth} from last month
            </p>
          </div>

          {/* Active Projects */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Active Projects
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.activeProjects}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-success font-medium">
              {stats.projectGrowth} from last month
            </p>
          </div>

          {/* Meetings Today */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Meetings Today
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.meetingsToday}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Scheduled for today</p>
          </div>

          {/* Pending Tasks */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Pending Tasks
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.pendingTasks}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.taskCompletion} completed
            </p>
          </div>
        </div>

        {/* Recent Activity & Upcoming Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Activity
                </h2>
                <button className="text-sm text-primary hover:underline">
                  View all
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 \${
                      activity.icon === 'check' ? 'bg-success/10' :
                      activity.icon === 'code' ? 'bg-blue-500/10' :
                      activity.icon === 'upload' ? 'bg-purple-500/10' :
                      activity.icon === 'calendar' ? 'bg-orange-500/10' :
                      'bg-primary/10'
                    }`}>
                      {activity.icon === "check" && (
                        <CheckSquare className="w-5 h-5 text-success" />
                      )}
                      {activity.icon === "code" && (
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      )}
                      {activity.icon === "upload" && (
                        <Upload className="w-5 h-5 text-purple-500" />
                      )}
                      {activity.icon === "calendar" && (
                        <Calendar className="w-5 h-5 text-orange-500" />
                      )}
                      {activity.icon === "message" && (
                        <MessageSquare className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action}
                        </span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Upcoming Meetings
                </h2>
                <button className="text-sm text-primary hover:underline">
                  View all
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {meetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.attendees} attendees
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          {meeting.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
