import { useState } from "react";
import { Search, Plus, Mail, Phone, MoreVertical, X, TrendingUpDown } from "lucide-react";
import { Modal } from "../components/ui/Modal";

const employees = [
  {
    id: 1,
    name: "John Doe",
    role: "Software Engineer",
    department: "Engineering",
    email: "john@company.com",
    phone: "+1 234-567-8900",
    status: "active",
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Product Manager",
    department: "Product",
    email: "jane@company.com",
    phone: "+1 234-567-8901",
    status: "active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Designer",
    department: "Design",
    email: "mike@company.com",
    phone: "+1 234-567-8902",
    status: "active",
  },
  {
    id: 4,
    name: "Sarah Williams",
    role: "Marketing Manager",
    department: "Marketing",
    email: "sarah@company.com",
    phone: "+1 234-567-8903",
    status: "active",
  },
  {
    id: 5,
    name: "Tom Brown",
    role: "HR Manager",
    department: "HR",
    email: "tom@company.com",
    phone: "+1 234-567-8904",
    status: "away",
  },
];

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-orange-500/10 text-orange-500"
                  }`}>
                  {employee.status}
                </span>
                <button className="p-1 hover:bg-accent rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">{employee.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {employee.role}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {employee.department}
            </p>
            <div className="space-y-2 pt-4 border-t border-border">
              <a
                href={`mailto:${employee.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                {employee.email}
              </a>
              <a
                href={`tel:${employee.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" />
                {employee.phone}
              </a>
            </div>
            <button
              onClick={() => {
                setSelectedEmployee(employee);
                setShowModal(true);
              }}
              className="w-full mt-4 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Add employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        size="lg">
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div >
              <label className="block text-sm font-medium mb-2">
                First Name
              </label>
              <input type="text" className="input-field" placeholder="First Name" required autocomplete="new"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name
              </label>
              <input type="text" className="input-field" placeholder="Last Name" required autoComplete="new"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="john.doe@company.com"
              required
              autoComplete="new"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div onChange={(e) => {
              setSelectedRole(e.target.value);
              setIsEmployee(e.target.value === "Employee");
            }}>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select className="input-field">
                <option value="">Select Role</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            {isEmployee && (<div >
              <label className="block text-sm font-medium mb-2">
                Department
              </label>
              <select className="input-field">
                <option value="">Select department</option>
                <option value="engineering">Engineering</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="hr">Human Resources</option>
              </select>
            </div>)}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {setShowAddModal(false); setIsEmployee(false); setSelectedRole("");}}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              onClick={() => {setIsEmployee(false); setSelectedRole("");}}
              >
              Add Employee
            </button>
          </div>
        </form>
      </Modal>


      {/* Employee Detail Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Employee Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {selectedEmployee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.role}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEmployee.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-orange-500/10 text-orange-500"
                    }`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
