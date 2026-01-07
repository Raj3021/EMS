import { useState } from "react";
import { Calendar, Clock, Users, Video, Plus, MapPin, X } from "lucide-react";

const meetings = [
  {
    id: 1,
    title: "Team Standup",
    date: "2024-01-20",
    time: "09:00 AM",
    duration: "30 min",
    attendees: ["John Doe", "Jane Smith", "Mike Johnson"],
    type: "recurring",
    location: "Conference Room A",
  },
  {
    id: 2,
    title: "Project Review",
    date: "2024-01-20",
    time: "02:00 PM",
    duration: "1 hour",
    attendees: ["Sarah Williams", "Tom Brown"],
    type: "one-time",
    location: "Zoom",
  },
  {
    id: 3,
    title: "Client Presentation",
    date: "2024-01-21",
    time: "10:00 AM",
    duration: "2 hours",
    attendees: ["John Doe", "Jane Smith"],
    type: "one-time",
    location: "Client Office",
  },
  {
    id: 4,
    title: "Sprint Planning",
    date: "2024-01-22",
    time: "11:00 AM",
    duration: "1.5 hours",
    attendees: ["Mike Johnson", "Sarah Williams", "Tom Brown"],
    type: "recurring",
    location: "Conference Room B",
  },
];

export default function Meetings() {
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your meetings
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    meeting.type === "recurring"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {meeting.type === "recurring" ? "Recurring" : "One-time"}
                </span>
              </div>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Video className="w-5 h-5 text-primary" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{meeting.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {meeting.time} • {meeting.duration}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{meeting.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {meeting.attendees.length} attendees
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  View Details
                </button>
              </div>
              <div className="flex -space-x-2 mt-3">
                {meeting.attendees.slice(0, 3).map((attendee, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-xs text-primary-foreground border-2 border-card">
                    {attendee
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                ))}
                {meeting.attendees.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                    +{meeting.attendees.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Detail Modal */}
      {showModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Meeting Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedMeeting.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedMeeting.type === "recurring"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {selectedMeeting.type === "recurring"
                    ? "Recurring"
                    : "One-time"}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedMeeting.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {selectedMeeting.time} • {selectedMeeting.duration}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedMeeting.location}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Attendees</p>
                <div className="space-y-2">
                  {selectedMeeting.attendees.map((attendee, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {attendee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm">{attendee}</span>
                    </div>
                  ))}
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
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
