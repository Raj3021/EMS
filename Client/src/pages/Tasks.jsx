import { useState } from "react";
import { Plus, MoreHorizontal, Calendar, User, Filter, X } from "lucide-react";

// Sample data
const projects = [
  {
    id: 1,
    name: "UI Redesign",
    status: "active",
    progress: 65,
    deadline: "2024-02-15",
    team: ["Emily Davis", "Sarah Johnson"],
  },
  {
    id: 2,
    name: "Security Update",
    status: "active",
    progress: 80,
    deadline: "2024-01-30",
    team: ["Mike Chen", "David Brown"],
  },
  {
    id: 3,
    name: "Q1 Marketing",
    status: "active",
    progress: 45,
    deadline: "2024-03-01",
    team: ["Jane Wilson"],
  },
  {
    id: 4,
    name: "Documentation",
    status: "active",
    progress: 90,
    deadline: "2024-01-25",
    team: ["David Brown"],
  },
];

const tasks = [
  {
    id: 1,
    title: "Design new dashboard layout",
    project: "UI Redesign",
    assignee: "Emily Davis",
    priority: "high",
    dueDate: "2024-01-20",
    status: "todo",
  },
  {
    id: 2,
    title: "Implement authentication flow",
    project: "Security Update",
    assignee: "Mike Chen",
    priority: "high",
    dueDate: "2024-01-18",
    status: "in-progress",
  },
  {
    id: 3,
    title: "User research interviews",
    project: "User Research",
    assignee: "Sarah Johnson",
    priority: "low",
    dueDate: "2024-01-15",
    status: "done",
  },
  {
    id: 4,
    title: "Create marketing campaign",
    project: "Q1 Marketing",
    assignee: "Jane Wilson",
    priority: "medium",
    dueDate: "2024-01-25",
    status: "todo",
  },
  {
    id: 5,
    title: "Write API documentation",
    project: "Documentation",
    assignee: "David Brown",
    priority: "medium",
    dueDate: "2024-01-22",
    status: "in-progress",
  },
  {
    id: 6,
    title: "Sales report analysis",
    project: "Analytics",
    assignee: "Amy Martinez",
    priority: "low",
    dueDate: "2024-01-14",
    status: "done",
  },
];

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export default function Tasks() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("board");

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tasks & Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and track project progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{project.name}</h3>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">
                {project.status}
              </span>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Deadline: {project.deadline}</span>
              <div className="flex -space-x-2">
                {project.team.slice(0, 3).map((member, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-xs text-primary-foreground border-2 border-card">
                    {member
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "board"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          Board View
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          List View
        </button>
      </div>

      {/* Kanban Board */}
      {activeTab === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  {column.title}
                  <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                    {getTasksByStatus(column.id).length}
                  </span>
                </h3>
                <button className="p-1 rounded hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-orange-500/10 text-orange-500"
                            : task.priority === "medium"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                        {task.priority}
                      </span>
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <h4 className="font-medium mb-2">{task.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.project}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {task.assignee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === "list" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Task</th>
                  <th className="text-left p-4 font-medium">Project</th>
                  <th className="text-left p-4 font-medium">Assignee</th>
                  <th className="text-left p-4 font-medium">Priority</th>
                  <th className="text-left p-4 font-medium">Due Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="p-4">
                      <span className="font-medium">{task.title}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {task.project}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {task.assignee
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-orange-500/10 text-orange-500"
                            : task.priority === "medium"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {task.dueDate}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === "done"
                            ? "bg-green-500/10 text-green-500"
                            : task.status === "in-progress"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                        {task.status === "in-progress"
                          ? "In Progress"
                          : task.status === "done"
                          ? "Done"
                          : "To Do"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Task Details
              </h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedTask.title}
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedTask.priority === "high"
                        ? "bg-orange-500/10 text-orange-500"
                        : selectedTask.priority === "medium"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    {selectedTask.priority} priority
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedTask.status === "done"
                        ? "bg-green-500/10 text-green-500"
                        : selectedTask.status === "in-progress"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    {selectedTask.status === "in-progress"
                      ? "In Progress"
                      : selectedTask.status === "done"
                      ? "Done"
                      : "To Do"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assignee
                  </p>
                  <p className="font-medium mt-1">{selectedTask.assignee}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </p>
                  <p className="font-medium mt-1">{selectedTask.dueDate}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                  placeholder="Add a description..."
                  defaultValue="This task is part of the ongoing project improvements. Review the current implementation and suggest optimizations."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                Close
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
