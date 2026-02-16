import { useState } from "react";
import {
  Plus,
  Video,
  Users,
  Clock,
  Calendar,
  Grid,
  Mic,
  MicOff,
  VideoOff,
  Phone,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { meetings } from "@/data/mockData";

export default function Meetings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMeetingRoom, setShowMeetingRoom] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and join video meetings with your team
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMeetingRoom(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Video className="w-4 h-4" />
            Join Meeting
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowMeetingRoom(true)}
          className="dashboard-card flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-4 bg-primary/10 rounded-xl">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Start Instant Meeting</h3>
            <p className="text-sm text-muted-foreground">
              Create a meeting right now
            </p>
          </div>
        </button>
        <button className="dashboard-card flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-4 bg-accent/10 rounded-xl">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Schedule Meeting</h3>
            <p className="text-sm text-muted-foreground">
              Plan a meeting for later
            </p>
          </div>
        </button>
        <button className="dashboard-card flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-4 bg-success/10 rounded-xl">
            <Grid className="w-6 h-6 text-success" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">View Recordings</h3>
            <p className="text-sm text-muted-foreground">
              Access past recordings
            </p>
          </div>
        </button>
      </div>

      {/* Upcoming Meetings */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Upcoming Meetings</h2>
          <button className="text-sm text-primary hover:underline">
            View Calendar
          </button>
        </div>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meeting.attendees} attendees
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    meeting.type === "recurring"
                      ? "badge-primary"
                      : "badge-muted"
                  }`}>
                  {meeting.type}
                </span>
                <button
                  onClick={() => setShowMeetingRoom(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Meeting Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Meeting"
        size="lg">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Meeting Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Weekly Team Standup"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input type="time" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <select className="input-field">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Invite Participants
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter email addresses..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              className="input-field h-20 resize-none"
              placeholder="Add meeting agenda..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Create Meeting
            </button>
          </div>
        </form>
      </Modal>

      {/* Video Meeting Room Modal */}
      <Modal
        isOpen={showMeetingRoom}
        onClose={() => setShowMeetingRoom(false)}
        title="Meeting Room"
        size="xl">
        <div className="space-y-4">
          {/* Video Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="avatar avatar-lg mx-auto mb-2">
                    {i === 1 ? "JD" : i === 2 ? "SJ" : i === 3 ? "MC" : "ED"}
                  </div>
                  <p className="text-sm font-medium">
                    {i === 1
                      ? "You"
                      : i === 2
                        ? "Sarah Johnson"
                        : i === 3
                          ? "Michael Chen"
                          : "Emily Davis"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-4">
            <button className="p-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button className="p-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMeetingRoom(false)}
              className="p-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
