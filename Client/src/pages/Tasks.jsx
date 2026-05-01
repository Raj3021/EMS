import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Calendar, User, Filter, X, Trash2, Edit2, Lock } from "lucide-react";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { employeeService } from "@/services/employeeService";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatDate";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export default function Tasks() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("board");
  const [viewingProject, setViewingProject] = useState(null);
  
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", project_id: "", assignee_id: "", priority: "medium", status: "todo", due_date: "" });
  const [projectForm, setProjectForm] = useState({ name: "", status: "active", progress: 0, deadline: "", team_members: [] });

  const handleOpenCreateProject = () => {
    setEditingProjectId(null);
    setProjectForm({ name: "", status: "active", progress: 0, deadline: "", team_members: [] });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({ 
      name: project.name, 
      status: project.status || "active",
      progress: project.progress || 0,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "",
      team_members: project.team ? project.team.map(m => m.id) : []
    });
    setShowProjectModal(true);
  };

  const handleAddNewTaskClick = (status = "todo", projectId = "") => {
    setNewTask({ title: "", project_id: projectId, assignee_id: "", priority: "medium", status: status, due_date: "" });
    setShowCreateTask(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCreateTask) setShowCreateTask(false);
        else if (showTaskModal) setShowTaskModal(false);
        else if (showProjectModal) setShowProjectModal(false);
        else if (viewingProject) setViewingProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateTask, showTaskModal, showProjectModal, viewingProject]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, employeesData] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks(),
        employeeService.getAll()
      ]);
      setProjects(projectsData);
      const sortedTasks = [...tasksData].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      setTasks(sortedTasks);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load tasks and projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(newTask);
      toast.success("Task created");
      setShowCreateTask(false);
      setNewTask({ title: "", project_id: "", assignee_id: "", priority: "medium", status: "todo", due_date: "" });
      fetchData();
    } catch(e) { 
      toast.error(e.response?.data?.message || "Failed to create task"); 
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProjectId) {
         await projectService.updateProject(editingProjectId, projectForm);
         toast.success("Project updated");
      } else {
         await projectService.createProject(projectForm);
         toast.success("Project created");
      }
      setShowProjectModal(false);
      fetchData();
    } catch(e) { 
      toast.error(e.response?.data?.message || `Failed to ${editingProjectId ? 'update' : 'create'} project`); 
    }
  };

  const handleDeleteProject = async () => {
    if(!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectService.deleteProject(editingProjectId);
      toast.success("Project deleted");
      setShowProjectModal(false);
      fetchData();
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to delete project");
    }
  };

  const handleUpdateTask = async () => {
    try {
      await taskService.updateTask(selectedTask.id, {
        title: selectedTask.title,
        description: selectedTask.description,
        status: selectedTask.status,
        priority: selectedTask.priority,
        assignee_id: selectedTask.assignee_id,
        project_id: selectedTask.project_id,
        due_date: selectedTask.dueDate
      });
      toast.success("Task updated");
      setShowTaskModal(false);
      fetchData();
    } catch(e) { 
      toast.error(e.response?.data?.message || "Failed to update task"); 
    }
  };

  const handleDeleteTask = async () => {
    if(!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(selectedTask.id);
      toast.success("Task deleted");
      setShowTaskModal(false);
      fetchData();
    } catch(e) { 
      toast.error(e.response?.data?.message || "Failed to delete task"); 
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading tasks and projects...</p>
        </div>
      ) : (
        <>
          {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks & Projects</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage your tasks and track project progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleOpenCreateProject} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />
            New Project
          </button>
          <button onClick={() => handleAddNewTaskClick("todo")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm">
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
            onClick={() => setViewingProject(project)}
            className="bg-card border border-border rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-sm leading-tight flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">{project.name}</span>
                {(project.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin')) && (
                  <button onClick={(e) => { e.stopPropagation(); handleOpenEditProject(project); }} className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </h3>
              <span className="badge badge-success flex-shrink-0 ml-2">{project.status}</span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Due {project.deadline ? formatDate(project.deadline) : 'N/A'}</span>
              <div className="flex -space-x-2">
                {(project.team || []).slice(0, 3).map((member, i) => (
                  <div
                    key={i}
                    title={`${member.first_name} ${member.last_name}`}
                    className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-[10px] text-primary-foreground border-2 border-card font-semibold">
                    {member.first_name?.[0]}{member.last_name?.[0]}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map((column) => (
            <div key={column.id} className="bg-muted/70 border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  {column.title}
                  <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                    {getTasksByStatus(column.id).length}
                  </span>
                </h3>
                <button onClick={() => handleAddNewTaskClick(column.id)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-card border border-border rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`badge ${
                        task.priority === "high" ? "badge-warning"
                        : task.priority === "medium" ? "badge-info"
                        : "badge-success"
                      }`}>
                        {task.priority}
                      </span>
                      <button className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <h4 className="font-semibold text-sm mb-1.5 leading-snug">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 truncate">{task.project}</p>
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1 text-xs ${
                        task.dueDate && new Date(task.dueDate) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {task.assignee?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
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
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left px-5 py-3.5">Task</th>
                  <th className="text-left px-5 py-3.5">Project</th>
                  <th className="text-left px-5 py-3.5">Assignee</th>
                  <th className="text-left px-5 py-3.5">Priority</th>
                  <th className="text-left px-5 py-3.5">Due Date</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-sm">{task.title}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {task.project}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {task.assignee?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?"}
                        </div>
                        <span className="text-sm">{task.assignee || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${
                        task.priority === "high" ? "badge-warning"
                        : task.priority === "medium" ? "badge-info"
                        : "badge-success"
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm ${
                        task.dueDate && new Date(task.dueDate) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"
                      }`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${
                        task.status === "done" ? "badge-success"
                        : task.status === "in-progress" ? "badge-info"
                        : "badge-muted"
                      }`}>
                        {task.status === "in-progress" ? "In Progress" : task.status === "done" ? "Done" : "To Do"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (() => {
        const editProjectObj = projects.find(p => p.id === selectedTask.project_id);
        const canEditAll = !editProjectObj || editProjectObj.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin');
        const isAssignee = selectedTask.assignee_id === user?.id;
        const canEditStatus = canEditAll || isAssignee;

        return (
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
                <h3 className="text-xl font-semibold mb-4">
                  <input type="text" disabled={!canEditAll} className="bg-transparent border-b border-transparent hover:border-border focus:border-primary w-full outline-none disabled:opacity-75 disabled:cursor-not-allowed" value={selectedTask.title || ""} onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})} />
                </h3>
                <div className="flex items-center gap-3">
                  <select disabled={!canEditAll} value={selectedTask.priority} onChange={(e) => setSelectedTask({...selectedTask, priority: e.target.value})} className={`px-2 py-1 rounded text-xs font-medium outline-none disabled:opacity-75 disabled:cursor-not-allowed ${selectedTask.priority === "high" ? "bg-orange-500/10 text-orange-500" : selectedTask.priority === "medium" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}>
                    <option className="bg-background text-foreground" value="low">Low Priority</option>
                    <option className="bg-background text-foreground" value="medium">Medium Priority</option>
                    <option className="bg-background text-foreground" value="high">High Priority</option>
                  </select>
                  <select disabled={!canEditStatus} value={selectedTask.status} onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value})} className={`px-2 py-1 rounded text-xs font-medium outline-none disabled:opacity-75 disabled:cursor-not-allowed ${selectedTask.status === "done" ? "bg-green-500/10 text-green-500" : selectedTask.status === "in-progress" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}>
                    <option className="bg-background text-foreground" value="todo">To Do</option>
                    <option className="bg-background text-foreground" value="in-progress">In Progress</option>
                    <option className="bg-background text-foreground" value="done">Done</option>
                  </select>
                  <select disabled={!canEditAll} value={selectedTask.project_id || ""} onChange={(e) => {
                    const newProjectId = e.target.value;
                    const newProjectObj = projects.find(p => p.id === newProjectId);
                    const canEditAssignee = !newProjectObj || newProjectObj.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin');
                    setSelectedTask({...selectedTask, project_id: newProjectId, assignee_id: canEditAssignee ? selectedTask.assignee_id : ""});
                  }} className="px-2 py-1 rounded text-xs font-medium outline-none bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors disabled:opacity-75 disabled:cursor-not-allowed">
                    <option className="bg-background text-foreground" value="">No Project</option>
                    {projects.map(p => <option className="bg-background text-foreground" key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-transparent hover:border-border transition-colors">
                  <p className="text-sm text-muted-foreground flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assignee
                    </span>
                  </p>
                  <select 
                    disabled={!canEditAll}
                    value={selectedTask.assignee_id || ""} 
                    onChange={(e) => setSelectedTask({...selectedTask, assignee_id: e.target.value})} 
                    className="w-full bg-transparent outline-none font-medium text-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option className="bg-background text-foreground" value="">Unassigned</option>
                    {employees.map(emp => <option className="bg-background text-foreground" key={emp.id} value={emp.user_id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </p>
                  <input disabled={!canEditAll} type="date" value={selectedTask.dueDate || ""} onChange={(e) => setSelectedTask({...selectedTask, dueDate: e.target.value})} className="w-full bg-transparent outline-none font-medium text-foreground disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  disabled={!canEditAll}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder="Add a description..."
                  value={selectedTask.description || ""}
                  onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border">
              {canEditAll ? (
                <button 
                  onClick={handleDeleteTask}
                  className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  {canEditStatus ? "Cancel" : "Close"}
                </button>
                {canEditStatus && (
                  <button onClick={handleUpdateTask} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingProjectId ? "Edit Project" : "Create Project"}
              </h2>
              <button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <input required type="text" className="input-field" placeholder="E.g. UI Redesign" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="input-field" value={projectForm.status} onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}>
                    <option className="bg-background text-foreground" value="active">Active</option>
                    <option className="bg-background text-foreground" value="completed">Completed</option>
                    <option className="bg-background text-foreground" value="on-hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline</label>
                  <input type="date" className="input-field" value={projectForm.deadline} onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Team Members</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border border-border rounded-lg bg-background">
                  {employees.map(emp => {
                    const isSelected = projectForm.team_members.includes(emp.user_id);
                    return (
                      <div 
                        key={emp.id} 
                        onClick={() => {
                          const newMembers = isSelected 
                            ? projectForm.team_members.filter(id => id !== emp.user_id)
                            : [...projectForm.team_members, emp.user_id];
                          setProjectForm({...projectForm, team_members: newMembers});
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 border ${
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "bg-muted border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                        }`}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <span className="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                {editingProjectId ? (
                  <button type="button" onClick={handleDeleteProject} className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    {editingProjectId ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Create Task</h2>
              <button onClick={() => setShowCreateTask(false)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input required type="text" className="input-field" placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project</label>
                <select className="input-field" value={newTask.project_id} onChange={(e) => {
                  const newProjectId = e.target.value;
                  const newProjectObj = projects.find(p => p.id === newProjectId);
                  const canAssign = !newProjectObj || newProjectObj.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin');
                  setNewTask({...newTask, project_id: newProjectId, assignee_id: canAssign ? newTask.assignee_id : ""});
                }}>
                  <option className="bg-background text-foreground" value="">Select Project</option>
                  {projects.map(p => <option className="bg-background text-foreground" key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assignee
                  </label>
                  {(() => {
                    const selectedProjectObj = projects.find(p => p.id === newTask.project_id);
                    const canAssign = !selectedProjectObj || selectedProjectObj.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin');
                    return (
                      <select 
                        disabled={!canAssign}
                        className="input-field disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                        value={newTask.assignee_id} 
                        onChange={(e) => setNewTask({...newTask, assignee_id: e.target.value})}
                      >
                        <option className="bg-background text-foreground" value="">Unassigned</option>
                        {employees.map(emp => <option className="bg-background text-foreground" key={emp.id} value={emp.user_id}>{emp.first_name} {emp.last_name}</option>)}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select className="input-field" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                    <option className="bg-background text-foreground" value="low">Low</option>
                    <option className="bg-background text-foreground" value="medium">Medium</option>
                    <option className="bg-background text-foreground" value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input type="date" className="input-field" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setShowCreateTask(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Inspector Modal */}
      {viewingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{viewingProject.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded-md text-xs font-semibold uppercase tracking-wider">
                    {viewingProject.status}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Project Progress: {viewingProject.progress}%
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingProject(null)} className="p-2 hover:bg-accent rounded-lg transition-colors absolute top-6 right-6 sm:static">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8 bg-muted/20">
              
              {/* Left Column: Team and Details */}
              <div className="w-full lg:w-1/3 space-y-8">
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4 border-b border-border pb-2">Project Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="text-sm font-medium">{viewingProject.deadline ? formatDate(viewingProject.deadline) : 'No Deadline'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4 border-b border-border pb-2">
                    Team Members ({(viewingProject.team?.length || 0) + (viewingProject.team?.find(m => m.id === viewingProject.owner_id) ? 0 : (viewingProject.owner_id ? 1 : 0))})
                  </h3>
                  {(viewingProject.team?.length > 0 || viewingProject.owner_id) ? (
                    <div className="space-y-3">
                      {/* Explicitly Render Creator First */}
                      {(() => {
                        const creatorEmp = employees.find(e => e.user_id === viewingProject.owner_id);
                        if (creatorEmp) {
                          return (
                            <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/20 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-primary/30 ring-offset-1 ring-offset-background">
                                {creatorEmp.first_name?.[0]}{creatorEmp.last_name?.[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">{creatorEmp.first_name} {creatorEmp.last_name}</span>
                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Project Creator</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Render Rest of Team */}
                      {(viewingProject.team || []).filter(m => m.id !== viewingProject.owner_id).map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors">
                          <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                          <span className="text-sm font-medium">{member.first_name} {member.last_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-2">No team members assigned.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Embedded Task List */}
              <div className="w-full lg:w-2/3 bg-card p-5 rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                    Associated Tasks
                  </h3>
                  <div className="flex items-center gap-4">
                    {(viewingProject.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin')) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setViewingProject(null); handleAddNewTaskClick("todo", viewingProject.id); }} 
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> New Task
                      </button>
                    )}
                    <div className="text-xs font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground">
                      {tasks.filter(t => t.project_id === viewingProject.id).length} Total
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {tasks.filter(t => t.project_id === viewingProject.id).length > 0 ? (
                    tasks.filter(t => t.project_id === viewingProject.id).map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => { setViewingProject(null); handleTaskClick(task); }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:shadow-md cursor-pointer transition-all bg-background"
                      >
                        <div className="flex-1 space-y-1 z-10">
                          <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="inline-block w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary">
                              {task.assignee.split(" ").map(n => n[0]).join("")}
                            </span>
                            {task.assignee}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === "high" ? "bg-orange-500/10 text-orange-500" : task.priority === "medium" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.status === "done" ? "bg-green-500/10 text-green-500" : task.status === "in-progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
                      <p className="text-muted-foreground font-medium">No tasks found in this project.</p>
                      {(viewingProject.owner_id === user?.id || user?.role === 'admin' || user?.roles?.includes('admin')) && (
                        <button onClick={(e) => { e.stopPropagation(); setViewingProject(null); handleAddNewTaskClick("todo", viewingProject.id); }} className="text-sm text-primary hover:underline font-semibold">
                          + Create a task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
         </div>
      )}
    </div>
  );
}
