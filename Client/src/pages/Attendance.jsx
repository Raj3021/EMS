import { useState } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week, day

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const attendanceData = [
    {
      id: 1,
      name: "John Doe",
      status: "present",
      checkIn: "09:00 AM",
      checkOut: "05:30 PM",
    },
    {
      id: 2,
      name: "Jane Smith",
      status: "present",
      checkIn: "08:45 AM",
      checkOut: "05:15 PM",
    },
    {
      id: 3,
      name: "Mike Johnson",
      status: "absent",
      checkIn: "-",
      checkOut: "-",
    },
    {
      id: 4,
      name: "Sarah Williams",
      status: "present",
      checkIn: "09:15 AM",
      checkOut: "05:45 PM",
    },
    {
      id: 5,
      name: "Tom Brown",
      status: "late",
      checkIn: "10:30 AM",
      checkOut: "06:00 PM",
    },
  ];

  const stats = {
    totalEmployees: 156,
    present: 142,
    absent: 8,
    late: 6,
    avgAttendance: "91%",
  };

  const goToPreviousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    );
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Track employee attendance and work hours
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalEmployees}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Present</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.present}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Absent</p>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Late</p>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">{stats.late}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {stats.avgAttendance}
            </p>
          </div>
        </div>

        {/* Calendar and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1 hover:bg-accent rounded transition-colors">
                  ←
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1 hover:bg-accent rounded transition-colors">
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors \${
                    day === null
                      ? ""
                      : day === new Date().getDate() &&
                        selectedDate.getMonth() === new Date().getMonth()
                      ? "bg-primary text-primary-foreground font-bold"
                      : "hover:bg-accent cursor-pointer"
                  }`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Attendance List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Today's Attendance
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Employee
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Check In
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Check Out
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-accent transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {record.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {record.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium \${
                            record.status === "present"
                              ? "bg-green-500/10 text-green-500"
                              : record.status === "absent"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-orange-500/10 text-orange-500"
                          }`}>
                          {record.status === "present" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {record.status === "absent" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {record.status === "late" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {record.checkIn}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {record.checkOut}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
