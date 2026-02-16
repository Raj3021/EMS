import { useState } from "react";
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
import { employees } from "@/data/mockData";
import api from "@/services/api";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
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

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
    setInviteError("");
    setInviteSuccess("");
    setInviteLink("");

    try {
      const payload = {
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      };

      if (inviteForm.role === "employee") {
        payload.department = inviteForm.department;
      }

      const response = await api.post("/invites", payload);

      setInviteSuccess("Invite sent successfully.");
      if (response.data?.inviteLink) {
        setInviteLink(response.data.inviteLink);
      }

      setInviteForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "manager",
        department: "",
      });
    } catch (error) {
      setInviteError(
        error?.response?.data?.error || "Failed to send invite. Try again.",
      );
    } finally {
      setInviteLoading(false);
    }
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
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
          <select className="input-field sm:w-48">
            <option value="">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
          </select>
          <select className="input-field sm:w-40">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">
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
                          : employee.status === "away"
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
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        onClick={() =>
                          setShowMenu(
                            showMenu === employee.id ? null : employee.id,
                          )
                        }
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
                            <button className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Send Email
                            </button>
                            <button className="w-full p-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
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
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
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

            {inviteForm.role === "employee" && (
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
                  required={inviteForm.role === "employee"}>
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
            )}
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
              onClick={() => setShowAddModal(false)}
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
              <button className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2">
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
