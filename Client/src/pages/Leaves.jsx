import { useState, useEffect } from "react";
import api from "../services/api";
import { formatDate } from "../utils/formatDate";
import { Calendar, CheckCircle, XCircle, Clock, Plus, Users, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export default function Leaves() {
  const { user } = useAuth();
  const toast = useToast();
  const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
  const isAdmin = roles.some((r) => r?.toLowerCase() === "admin");
  const isManager = roles.some((r) => r?.toLowerCase() === "manager");
  const hasManagementAccess = isAdmin || isManager;

  const [activeTab, setActiveTab] = useState(() => {
    const roleList = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
    return roleList.some(r => r?.toLowerCase() === "admin") ? "team-leaves" : "my-leaves";
  });
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [assignForm, setAssignForm] = useState({
    target_role: "",
    leave_type_id: "",
    total_days: 1,
  });
  const [applyForm, setApplyForm] = useState({
    leave_type_id: "",
    duration_type: "full",
    start_date: "",
    end_date: "",
    total_days: 1,
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Close modals on Escape — prioritised: request detail > apply > assign
  useEscapeKey(() => {
    if (selectedRequest) { handleCloseModal(); return; }
    if (showApplyModal) { setShowApplyModal(false); return; }
    if (showAssignModal) { setShowAssignModal(false); return; }
  }, !!(selectedRequest || showApplyModal || showAssignModal));

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        api.get("/leaves/balances"),
        api.get("/leaves/requests"),
        api.get("/leaves/types"),
      ];
      if (isAdmin) promises.push(api.get("/employees"));

      const results = await Promise.all(promises);
      setBalances(results[0].data);
      setRequests(results[1].data);
      setLeaveTypes(results[2].data);
      if (isAdmin && results[3]) setEmployees(results[3].data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leaves data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBalance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/leaves/balances", assignForm);
      toast.success("Leave balance assigned successfully");
      setShowAssignModal(false);
      setAssignForm({ target_role: "", leave_type_id: "", total_days: 1 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign balance");
    }
  };

  const calculateTotalDays = (start, end, duration) => {
    if (!start) return 1;
    if (duration === 'half') return 0.5;
    if (!end) return 1;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 1;
    if (endDate < startDate) return 0;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleApplyFormChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...applyForm, [name]: value };
    
    if (name === 'duration_type' && value === 'half') {
      newForm.end_date = newForm.start_date;
      newForm.total_days = 0.5;
    } else if (name === 'start_date' && newForm.duration_type === 'half') {
      newForm.end_date = value;
      newForm.total_days = 0.5;
    } else if (name === 'start_date' || name === 'end_date' || name === 'duration_type') {
      newForm.total_days = calculateTotalDays(newForm.start_date, newForm.end_date, newForm.duration_type);
    }
    
    setApplyForm(newForm);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (applyForm.total_days <= 0) {
      return toast.error("End date cannot be before start date.");
    }
    try {
      await api.post("/leaves/requests", applyForm);
      toast.success("Leave request submitted successfully");
      setShowApplyModal(false);
      setApplyForm({ leave_type_id: "", duration_type: "full", start_date: "", end_date: "", total_days: 1, reason: "" });
      fetchData(); // refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply for leave");
    }
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setIsRejecting(false);
    setRejectReason("");
  };

  const handleStatusUpdate = async (id, status, reason = "") => {
    try {
      await api.put(`/leaves/requests/${id}/status`, { status, rejection_reason: reason });
      toast.success(`Leave request ${status}`);
      handleCloseModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await api.put(`/leaves/requests/${id}/cancel`);
      toast.success("Leave request cancelled");
      handleCloseModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const myBalances = balances.filter(b => b.user_id === user.id);
  const myRequests = requests.filter(r => r.user_id === user.id);
  const teamRequests = requests.filter(r => r.user_id !== user.id);
  const teamBalances = balances.filter(b => b.user_id !== user.id);

  const filteredTeamRequests = teamRequests.filter(req => 
    statusFilter === "all" ? true : req.status === statusFilter
  );

  const selectedBalance = selectedRequest ? teamBalances.find(b => 
    b.user_id === selectedRequest.user_id && b.leave_type_id === selectedRequest.leave_type_id
  ) : null;

  const groupedBalances = {};
  teamBalances.forEach(b => {
    if (!groupedBalances[b.user_id]) {
      groupedBalances[b.user_id] = {
        user_id: b.user_id,
        first_name: b.first_name,
        last_name: b.last_name,
        department: b.department,
        balances: {}
      };
    }
    groupedBalances[b.user_id].balances[b.leave_type_id] = {
      total: b.total_days,
      remaining: b.remaining_days
    };
  });
  const employeeListWithBalances = Object.values(groupedBalances);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading leave data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaves Management</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Track and manage your leave requests and balances.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-xl font-medium hover:bg-muted transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Assign Balances
            </button>
          )}
          {!isAdmin && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {hasManagementAccess && !isAdmin && (
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit mb-6">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "my-leaves"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab("team-leaves")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "team-leaves"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Team Leaves
          </button>
        </div>
      )}

      {/* MY LEAVES TAB */}
      {activeTab === "my-leaves" && !isAdmin && (
        <>
          {/* Balances Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {myBalances.length > 0 ? myBalances.map((balance) => (
              <div key={balance.id} className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Calendar className="w-16 h-16 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{balance.leave_type_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Total Allocated: {balance.total_days} days</p>
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold text-primary">{balance.remaining_days}</span>
                  <span className="text-muted-foreground mb-1">days left</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(balance.used_days / balance.total_days) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center p-8 bg-card border border-border rounded-xl shadow-sm text-muted-foreground">
                No leave balances assigned yet. Please contact HR.
              </div>
            )}
          </div>

          {/* My Requests Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5 text-muted-foreground" />
                My Leave History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="text-left px-5 py-3.5">Type</th>
                    <th className="text-left px-5 py-3.5">Duration</th>
                    <th className="text-left px-5 py-3.5">Days</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myRequests.length > 0 ? myRequests.map((req) => (
                    <tr key={req.id} onClick={() => setSelectedRequest(req)} className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5 font-semibold text-sm text-foreground">{req.leave_type_name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {formatDate(req.start_date)} <span className="mx-1">→</span> {formatDate(req.end_date)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{req.total_days}d</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${
                          req.status === 'approved' ? 'badge-success'
                          : req.status === 'rejected' ? 'badge-destructive'
                          : req.status === 'cancelled' ? 'badge-muted'
                          : 'badge-warning'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-5 py-10 text-center text-sm text-muted-foreground">
                        You have not made any leave requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TEAM LEAVES TAB (Manager/Admin Only) */}
      {activeTab === "team-leaves" && hasManagementAccess && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <h3 className="font-semibold text-lg text-primary mb-2 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" /> Pending Approvals
              </h3>
              <p className="text-4xl font-bold text-foreground">
                {teamRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-muted-foreground" />
                Team Requests
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status:</span>
                <select 
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="text-left px-5 py-3.5">Employee</th>
                    <th className="text-left px-5 py-3.5">Type</th>
                    <th className="text-left px-5 py-3.5">Duration</th>
                    <th className="text-left px-5 py-3.5">Days</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTeamRequests.length > 0 ? filteredTeamRequests.map((req) => (
                    <tr key={req.id} onClick={() => setSelectedRequest(req)} className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {req.first_name?.[0]}{req.last_name?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">{req.first_name} {req.last_name}</div>
                            <div className="text-xs text-muted-foreground">{req.department || 'No Dept'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{req.leave_type_name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {formatDate(req.start_date)} → {formatDate(req.end_date)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{req.total_days}d</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${
                          req.status === 'approved' ? 'badge-success'
                          : req.status === 'rejected' ? 'badge-destructive'
                          : req.status === 'cancelled' ? 'badge-muted'
                          : 'badge-warning'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No team leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-muted-foreground" />
                Employee Balances
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium min-w-[200px]">Employee</th>
                    {leaveTypes.map(lt => (
                      <th key={lt.id} className="text-center p-4 font-medium whitespace-nowrap">{lt.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeListWithBalances.length > 0 ? employeeListWithBalances.map((emp) => (
                    <tr key={emp.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{emp.department || 'No Dept'}</div>
                      </td>
                      {leaveTypes.map(lt => {
                        const bal = emp.balances[lt.id];
                        return (
                          <td key={lt.id} className="p-4 text-center">
                            {bal ? (
                              <div className="flex flex-col items-center">
                                <span className={bal.remaining > 0 ? "text-green-500 font-bold" : "text-destructive font-bold"}>{bal.remaining} <span className="text-muted-foreground font-normal text-xs">rem</span></span>
                                <span className="text-muted-foreground text-xs border-t border-border mt-1 pt-1 w-8 text-center">{bal.total}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={leaveTypes.length + 1} className="p-8 text-center text-muted-foreground">
                        No balances assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Assign Balances Modal (Admin Only) */}
      {showAssignModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Assign Leave Balance</h2>
                <p className="text-sm text-muted-foreground mt-1">Set or update a user's leave balance.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleAssignBalance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Target Role *</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={assignForm.target_role}
                  onChange={e => setAssignForm({...assignForm, target_role: e.target.value})}
                >
                  <option value="" className="bg-background">Select Role...</option>
                  <option value="employee" className="bg-background">All Employees</option>
                  <option value="manager" className="bg-background">All Managers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Leave Type *</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={assignForm.leave_type_id}
                  onChange={e => setAssignForm({...assignForm, leave_type_id: e.target.value})}
                >
                  <option value="" className="bg-background">Select Type...</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id} className="bg-background">{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Total Days *</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  required 
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  value={assignForm.total_days}
                  onChange={e => setAssignForm({...assignForm, total_days: parseFloat(e.target.value)})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 mt-4 rounded-lg border border-border hover:bg-muted transition-colors font-medium text-foreground"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 mt-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Assign Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Leave Request Details</h2>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee</p>
                  <p className="text-foreground font-medium">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
                  <p className="text-foreground font-medium">{selectedRequest.leave_type_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-foreground">{formatDate(selectedRequest.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-foreground">{formatDate(selectedRequest.end_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                  <p className="text-foreground font-medium">{selectedRequest.total_days}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                  <p className="text-foreground">
                    {selectedBalance ? (
                      <span className={`font-semibold ${selectedBalance.remaining_days >= selectedRequest.total_days ? "text-green-500" : "text-destructive"}`}>
                        {selectedBalance.remaining_days} days
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">No balance assigned</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium border inline-block mt-1
                          ${selectedRequest.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            selectedRequest.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            selectedRequest.status === 'cancelled' ? 'bg-gray-500/10 text-muted-foreground border-border' : 
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Reason for Leave</p>
                <p className="text-foreground whitespace-pre-wrap text-sm">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Reason for Rejection</p>
                  <p className="text-destructive whitespace-pre-wrap text-sm">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && selectedRequest.user_id === user.id && (
                <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-border">
                  <button 
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border hover:bg-muted/80 rounded-lg transition-colors font-medium"
                  >
                    Cancel Request
                  </button>
                </div>
              )}

              {selectedRequest.status === 'pending' && selectedRequest.user_id !== user.id && activeTab === 'team-leaves' && (
                <div className="pt-4 mt-6 border-t border-border">
                  {isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Reason for Rejection *</label>
                        <textarea 
                          required 
                          rows={2}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 resize-none" 
                          placeholder="Please provide a reason..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 border border-border rounded-lg transition-colors font-medium hover:bg-muted text-foreground"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected', rejectReason)}
                          disabled={!rejectReason.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setIsRejecting(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 rounded-lg transition-colors font-medium"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 rounded-lg transition-colors font-medium"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Apply for Leave</h2>
                <p className="text-sm text-muted-foreground mt-1">Submit a new leave request for approval.</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Leave Type *</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={applyForm.leave_type_id}
                  onChange={e => setApplyForm({...applyForm, leave_type_id: e.target.value})}
                >
                  <option value="" className="bg-background">Select Type...</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id} className="bg-background">{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Duration *</label>
                  <select 
                    name="duration_type"
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    value={applyForm.duration_type}
                    onChange={handleApplyFormChange}
                  >
                    <option value="full" className="bg-background">Full Day(s)</option>
                    <option value="half" className="bg-background">Half Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Total Days</label>
                  <input 
                    type="number" 
                    disabled 
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground focus:outline-none cursor-not-allowed" 
                    value={applyForm.total_days}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Start Date *</label>
                  <input 
                    type="date" 
                    name="start_date"
                    required 
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer" 
                    value={applyForm.start_date}
                    onChange={handleApplyFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">End Date *</label>
                  <input 
                    type="date" 
                    name="end_date"
                    required 
                    disabled={applyForm.duration_type === 'half'}
                    className={`w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${applyForm.duration_type === 'half' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                    value={applyForm.end_date}
                    onChange={handleApplyFormChange}
                    min={applyForm.start_date}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Reason *</label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" 
                  placeholder="Why are you taking leave?"
                  value={applyForm.reason}
                  onChange={e => setApplyForm({...applyForm, reason: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 mt-4 rounded-lg border border-border hover:bg-muted transition-colors font-medium text-foreground"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 mt-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
