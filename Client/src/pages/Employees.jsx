import { useState, useRef } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Edit2,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import api from "@/services/api";
import { employeeService } from "@/services/employeeService";
import { useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "manager",
    department: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empData, inviteData] = await Promise.all([
        employeeService.getAll(),
        api.get("/invites").then(res => res.data).catch(() => []) // Handle error in case invites fail
      ]);

      // Format employees
      const formattedEmployees = empData.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
        email: emp.email,
        role: emp.role_name || emp.designation || 'Employee', // Prioritize system role
        department: emp.department || 'Unassigned',
        status: emp.status || (emp.is_active ? 'active' : 'inactive'),
        avatar: `${emp.first_name[0]}${emp.last_name ? emp.last_name[0] : ''}`.toUpperCase(),
        joinDate: new Date(emp.joining_date || emp.created_at).toLocaleDateString(),
        type: 'employee'
      }));

      // Format invites
      const formattedInvites = inviteData.map(inv => ({
        id: `invite-${inv.id}`,
        name: `${inv.first_name} ${inv.last_name || ''}`.trim(),
        email: inv.email,
        role: inv.role_name || 'Pending',
        department: inv.department || 'Pending',
        status: 'invited',
        avatar: '?',
        joinDate: 'Pending',
        type: 'invite'
      }));

      setEmployees([...formattedEmployees, ...formattedInvites]);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = departmentFilter
      ? emp.department.toLowerCase() === departmentFilter.toLowerCase()
      : true;

    const matchesStatus = statusFilter
      ? emp.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Robust role checking
  const roles = Array.isArray(user?.roles) 
    ? user.roles 
    : user?.role 
      ? [user.role] 
      : [];
      
  const canManageEmployees = roles.some(role => {
    const r = typeof role === 'string' ? role.toLowerCase() : '';
    return r === 'admin' || r === 'manager';
  });

  const handleViewProfile = (employee) => {
    setSelectedEmployee(employee);
    setShowProfileModal(true);
    setShowMenu(null);
  };

  const handleInviteChange = (field, value) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setInviteLoading(true);
    // setInviteError(""); 
    setInviteSuccess("");
    setInviteLink("");

    try {
      const payload = {
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        department: inviteForm.department,
      };

      const response = await api.post("/invites", payload);

      setInviteSuccess("Invite sent successfully.");
      toast.success("Invite sent successfully!");
      if (response.data?.inviteLink) {
        setInviteLink(response.data.inviteLink);
        // Keep the success message in the modal so they can copy the link
      } else {
         // If no link to show, we can close the modal or just clear form
         setShowAddModal(false);
      }

      setInviteForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "manager",
        department: "",
      });
      
      // Refresh list
      fetchData();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || "Failed to send invite. Try again.";
      setInviteError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setInviteForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "manager",
      department: "",
    });
    setInviteError("");
    setInviteSuccess("");
    setInviteLink("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>
        {canManageEmployees && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select 
            className="input-field sm:w-48"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="hr">Human Resources</option>
          </select>
          <select 
            className="input-field sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="invited">Invited</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="dashboard-card min-h-[500px] mb-8 pb-24">
        {loading ? (
             <div className="p-8 text-center text-muted-foreground">Loading employees...</div>
        ) : (
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left p-4 rounded-l-lg">Employee</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Department</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Join Date</th>
                <th className="text-right p-4 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar">{employee.avatar}</div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{employee.role}</td>
                  <td className="p-4">
                    <span className="badge badge-muted">
                      {employee.department}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        employee.status === "active"
                          ? "badge-success"
                          : employee.status === "busy"
                            ? "badge-warning"
                            : "badge-muted"
                      }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {employee.joinDate}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 relative" ref={showMenu === employee.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(
                            showMenu === employee.id ? null : employee.id,
                          );
                        }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {showMenu === employee.id && (
                        <div className="absolute right-0 top-10 w-48 bg-card rounded-xl border border-border shadow-soft-lg z-10 animate-fade-in">
                          <div className="p-2">
                            <button
                              onClick={() => handleViewProfile(employee)}
                              className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                              <Edit2 className="w-4 h-4" />
                              View Profile
                            </button>
                            <button 
                              onClick={() => {
                                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${employee.email}`, "_blank");
                                setShowMenu(null);
                              }}
                              className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Send Email
                            </button>
                            {canManageEmployees && (
                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to remove ${employee.name}?`)) {
                                    try {
                                      if (employee.type === 'invite') {
                                         const inviteId = employee.id.replace('invite-', '');
                                         await api.delete(`/invites/${inviteId}`);
                                         toast.success("Invite removed successfully");
                                         setEmployees(prev => prev.filter(e => e.id !== employee.id));
                                      } else {
                                          await employeeService.delete(employee.id);
                                          toast.success("Employee and associated user removed successfully");
                                          setEmployees(prev => prev.filter(e => e.id !== employee.id));
                                      }
                                    } catch (err) {
                                      toast.error("Failed to remove employee");
                                      console.error(err);
                                    }
                                  }
                                  setShowMenu(null);
                                }}
                                className="w-full p-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Add New Employee"
        size="lg">
        <form className="space-y-4" onSubmit={handleInviteSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="First Name"
                value={inviteForm.firstName}
                onChange={(e) =>
                  handleInviteChange("firstName", e.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Last Name"
                value={inviteForm.lastName}
                onChange={(e) => handleInviteChange("lastName", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="john.doe@company.com"
              value={inviteForm.email}
              onChange={(e) => handleInviteChange("email", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                className="input-field"
                value={inviteForm.role}
                onChange={(e) => handleInviteChange("role", e.target.value)}
                required>
                <option value="" disabled>
                  Select Role
                </option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Department
              </label>
              <select
                className="input-field"
                value={inviteForm.department}
                onChange={(e) =>
                  handleInviteChange("department", e.target.value)
                }
                required>
                <option value="" disabled>
                  Select Department
                </option>
                <option value="engineering">Engineering</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="hr">Human Resources</option>
              </select>
            </div>
          </div>

          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}
          {inviteSuccess && (
            <div className="text-sm text-success space-y-2">
              <p>{inviteSuccess}</p>
              {inviteLink && (
                <p className="text-xs text-muted-foreground break-all">
                  Invite link: {inviteLink}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {inviteLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Profile Modal */}
      
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Employee Profile"
        size="lg">
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="avatar avatar-lg">{selectedEmployee.avatar}</div>
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedEmployee.name}
                </h3>
                <p className="text-muted-foreground">{selectedEmployee.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium mt-1">{selectedEmployee.email}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium mt-1">
                  {selectedEmployee.department}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium mt-1 capitalize">
                  {selectedEmployee.status}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Join Date</p>
                <p className="font-medium mt-1">{selectedEmployee.joinDate}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedEmployee.email}`, "_blank")}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
            
          </div>
        )}
      </Modal>
    </div>
  );
}
