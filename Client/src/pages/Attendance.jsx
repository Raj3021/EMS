import { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { leaveRequests } from "@/data/mockData";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentMonth = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ day: null, status: null });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const status =
      i < today.getDate()
        ? i % 6 === 0 || i % 7 === 0
          ? "weekend"
          : "present"
        : i === today.getDate()
          ? "today"
          : "future";
    days.push({ day: i, status });
  }

  return days;
};

export default function Attendance() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance & Leave
          </h1>
          <p className="text-muted-foreground mt-1">
            Track attendance and manage leave requests
          </p>
        </div>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-xl">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Present Days</p>
              <p className="text-2xl font-bold">18</p>
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-xl">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Late Arrivals</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leave Balance</p>
              <p className="text-2xl font-bold">12 days</p>
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <X className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absences</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{currentMonth}</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((item, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                  item.day === null
                    ? ""
                    : item.status === "today"
                      ? "bg-primary text-primary-foreground font-bold"
                      : item.status === "present"
                        ? "bg-success/10 text-success"
                        : item.status === "weekend"
                          ? "bg-muted text-muted-foreground"
                          : "text-foreground hover:bg-muted cursor-pointer"
                }`}>
                {item.day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success/30" />
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-sm text-muted-foreground">Weekend</span>
            </div>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold mb-6">Leave Requests</h2>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div key={request.id} className="p-4 rounded-xl bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{request.employee}</span>
                  <span
                    className={`badge ${
                      request.status === "approved"
                        ? "badge-success"
                        : request.status === "pending"
                          ? "badge-warning"
                          : "badge-muted"
                    }`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {request.type}
                </p>
                <p className="text-sm">
                  {request.startDate} - {request.endDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Request Leave"
        size="lg">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type</label>
            <select className="input-field">
              <option value="">Select leave type</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="wfh">Work From Home</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input type="date" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              className="input-field h-24 resize-none"
              placeholder="Explain the reason for your leave request..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
