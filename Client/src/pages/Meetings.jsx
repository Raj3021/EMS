import { useState, useEffect, useCallback } from "react";
import { Plus, Video, Users, Clock, Calendar, MapPin, CheckCircle, XCircle, Edit2, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/context/ToastContext";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import * as meetingService from "@/services/meetingService";
import api from "@/services/api";
import { format, isToday, isTomorrow, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth, parseISO } from "date-fns";

const RSVP_LABELS = { accepted: "Going ✓", declined: "Not Going", pending: "Invited" };
const RSVP_COLORS = { accepted: "badge-success", declined: "badge-destructive", pending: "badge-warning" };
const TYPE_COLORS  = { scheduled: "badge-info", instant: "badge-success", recurring: "badge-muted" };

function MiniCalendar({ meetings, selected, onSelect }) {
  const [current, setCurrent] = useState(new Date());
  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });

  const days = [];
  let d = new Date(gridStart);
  while (d <= gridEnd) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }

  const hasMeeting = (day) => meetings.some(m => isSameDay(parseISO(m.start_time), day));

  return (
    <div className="dashboard-card p-5 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(subMonths(current, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{format(current, "MMMM yyyy")}</span>
        <button onClick={() => setCurrent(addMonths(current, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, current);
          const isCurrentDay   = isToday(day);
          const dot = hasMeeting(day) && isCurrentMonth;
          return (
            <button key={i} onClick={() => onSelect(isSelected ? null : day)}
              className={`flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs transition-colors
                ${isSelected ? "bg-primary text-primary-foreground font-bold"
                  : isCurrentDay ? "border border-primary text-primary font-bold"
                  : isCurrentMonth ? "hover:bg-muted text-foreground"
                  : "text-muted-foreground/40"}`}>
              {day.getDate()}
              {dot && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
            </button>
          );
        })}
      </div>
      {selected && (
        <button onClick={() => onSelect(null)} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
          <X className="w-3 h-3" /> Clear filter
        </button>
      )}
    </div>
  );
}

function AttendeeAvatars({ attendees, max = 4 }) {
  const shown = attendees.slice(0, max);
  const extra = attendees.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((a, i) => (
        <div key={i} title={`${a.first_name} ${a.last_name}`}
          className="w-7 h-7 rounded-xl bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border-2 border-card">
          {a.first_name?.[0]}{a.last_name?.[0]}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-xl bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
          +{extra}
        </div>
      )}
    </div>
  );
}

function isUrl(str) {
  if (!str) return false;
  try { const u = new URL(str); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}

function MeetingCard({ meeting, currentUserId, onEdit, onDelete, onRsvp }) {
  const start = parseISO(meeting.start_time);
  const end   = parseISO(meeting.end_time);
  const isOrganizer = meeting.created_by === currentUserId;
  const myRsvp = meeting.attendees?.find(a => a.user_id === currentUserId)?.rsvp_status;
  const diffMin = Math.round((end - start) / 60000);
  const duration = diffMin >= 60 ? `${Math.floor(diffMin/60)}h ${diffMin%60 ? diffMin%60+"m" : ""}`.trim() : `${diffMin}m`;
  const hasLink = isUrl(meeting.location) && new Date() <= end;

  return (
    <div className="group flex gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border transition-all">
      <div className="flex-shrink-0 text-center w-12">
        <p className="text-xs font-semibold text-primary">{format(start,"HH:mm")}</p>
        <p className="text-xs text-muted-foreground">{duration}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-foreground">{meeting.title}</h3>
            {meeting.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {meeting.description}
              </p>
            )}
            {meeting.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {hasLink ? (
                  <a href={meeting.location} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[220px]"
                    onClick={e => e.stopPropagation()}>
                    {meeting.location}
                  </a>
                ) : meeting.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`badge ${TYPE_COLORS[meeting.meeting_type] || "badge-muted"}`}>{meeting.meeting_type}</span>
            {myRsvp && !isOrganizer && <span className={`badge ${RSVP_COLORS[myRsvp]}`}>{RSVP_LABELS[myRsvp] || myRsvp}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <AttendeeAvatars attendees={meeting.attendees || []} />
          <div className="flex items-center gap-1.5">
            {hasLink && (
              <a href={meeting.location} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Video className="w-3.5 h-3.5" /> Join
              </a>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isOrganizer && myRsvp === "pending" && (
                <>
                  <button onClick={() => onRsvp(meeting.id, "accepted")} className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20 transition-colors" title="I'll be there">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </button>
                  <button onClick={() => onRsvp(meeting.id, "declined")} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors" title="Can't make it">
                    <XCircle className="w-4 h-4 text-destructive" />
                  </button>
                </>
              )}
              {isOrganizer && (
                <>
                  <button onClick={() => onEdit(meeting)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => onDelete(meeting)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { title:"", description:"", location:"", meeting_type:"scheduled", date:"", start:"", end:"", attendee_ids:[] };

export default function Meetings() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const currentUserId = user?.id;

  const fetchMeetings = useCallback(async () => {
    try {
      const data = await meetingService.getMeetings();
      setMeetings(data);
    } catch { toast.error("Failed to load meetings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMeetings();
    api.get("/employees").then(r => setEmployees(r.data)).catch(() => {});
  }, [fetchMeetings]);

  // Real-time invite
  useEffect(() => {
    if (!socket) return;
    const handler = ({ meeting, message }) => {
      toast.info(message || "You have a new meeting invite");
      setMeetings(prev => {
        const exists = prev.find(m => m.id === meeting.id);
        return exists ? prev : [meeting, ...prev].sort((a,b) => new Date(a.start_time)-new Date(b.start_time));
      });
    };
    const cancelHandler = ({ meeting_id, message }) => {
      toast.warning(message || "A meeting was cancelled");
      setMeetings(prev => prev.filter(m => m.id !== meeting_id));
    };
    socket.on("meeting_invite", handler);
    socket.on("meeting_cancelled", cancelHandler);
    return () => { socket.off("meeting_invite", handler); socket.off("meeting_cancelled", cancelHandler); };
  }, [socket]);

  useEscapeKey(() => {
    if (deleteTarget) { setDeleteTarget(null); return; }
    if (showModal) { closeModal(); return; }
  }, !!(showModal || deleteTarget));

  const openCreate = () => { setEditingMeeting(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (m) => {
    setEditingMeeting(m);
    const start = parseISO(m.start_time);
    const end   = parseISO(m.end_time);
    setForm({
      title: m.title, description: m.description||"", location: m.location||"",
      meeting_type: m.meeting_type, date: format(start,"yyyy-MM-dd"),
      start: format(start,"HH:mm"), end: format(end,"HH:mm"),
      attendee_ids: (m.attendees||[]).filter(a=>a.user_id!==currentUserId).map(a=>a.user_id),
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingMeeting(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title||!form.date||!form.start||!form.end) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      const start_time = `${form.date}T${form.start}:00`;
      const end_time   = `${form.date}T${form.end}:00`;
      if (new Date(start_time) < new Date()) return toast.error("Start time cannot be in the past");
      if (new Date(end_time) <= new Date(start_time)) return toast.error("End time must be after start time");
      const payload = { ...form, start_time, end_time };
      if (editingMeeting) {
        const updated = await meetingService.updateMeeting(editingMeeting.id, payload);
        setMeetings(prev => prev.map(m => m.id===updated.id ? updated : m));
        toast.success("Meeting updated");
      } else {
        const created = await meetingService.createMeeting(payload);
        setMeetings(prev => [...prev, created].sort((a,b)=>new Date(a.start_time)-new Date(b.start_time)));
        toast.success("Meeting scheduled!");
      }
      closeModal();
    } catch(err) { toast.error(err.response?.data?.message || "Failed to save meeting"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await meetingService.deleteMeeting(deleteTarget.id);
      setMeetings(prev => prev.filter(m=>m.id!==deleteTarget.id));
      toast.success("Meeting deleted");
    } catch { toast.error("Failed to delete meeting"); }
    finally { setDeleteTarget(null); }
  };

  const handleRsvp = async (id, status) => {
    try {
      await meetingService.rsvpMeeting(id, status);
      setMeetings(prev => prev.map(m => m.id!==id ? m : {
        ...m, attendees: m.attendees.map(a => a.user_id===currentUserId ? {...a, rsvp_status:status} : a)
      }));
      toast.success(status === "accepted" ? "You're going! 🎉" : "You've declined the meeting");
    } catch { toast.error("Failed to update your response"); }
  };

  // Group meetings by day
  const filtered = selectedDay
    ? meetings.filter(m => isSameDay(parseISO(m.start_time), selectedDay))
    : meetings;

  const groups = [];
  const seen = {};
  filtered.forEach(m => {
    const d = format(parseISO(m.start_time),"yyyy-MM-dd");
    if (!seen[d]) { seen[d]=true; groups.push({ date: parseISO(m.start_time), meetings:[] }); }
    groups[groups.length-1].meetings.push(m);
  });

  const todayCount    = meetings.filter(m=>isToday(parseISO(m.start_time))).length;
  const upcomingCount = meetings.filter(m=>new Date(m.start_time)>=new Date()).length;
  const pendingRsvp   = meetings.filter(m=>(m.attendees||[]).find(a=>a.user_id===currentUserId&&a.rsvp_status==="pending")).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Schedule and manage team meetings</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Today", value: todayCount,    icon: Calendar,  color:"text-primary",    bg:"bg-primary/10" },
          { label:"Upcoming", value: upcomingCount, icon: Clock,     color:"text-info",       bg:"bg-info/10" },
          { label:"Awaiting Reply", value: pendingRsvp,   icon: Users,     color:"text-warning",    bg:"bg-warning/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="dashboard-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main: calendar + agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <MiniCalendar meetings={meetings} selected={selectedDay} onSelect={setSelectedDay} />

        <div className="space-y-6">
          {loading ? (
            <div className="dashboard-card flex items-center justify-center h-48">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading meetings...</p>
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="dashboard-card flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Calendar className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">No meetings {selectedDay ? "on this day" : "scheduled"}</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Schedule Meeting" to get started</p>
              </div>
            </div>
          ) : groups.map(({ date, meetings: dayMeetings }) => {
            const label = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date,"EEEE, MMM d");
            return (
              <div key={date.toISOString()}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{dayMeetings.length} meeting{dayMeetings.length!==1?"s":""}</span>
                </div>
                <div className="space-y-2">
                  {dayMeetings.map(m => (
                    <MeetingCard key={m.id} meeting={m} currentUserId={currentUserId}
                      onEdit={openEdit} onDelete={setDeleteTarget} onRsvp={handleRsvp} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingMeeting?"Edit Meeting":"Schedule Meeting"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editingMeeting?"Update the meeting details":"Create a new meeting and invite teammates"}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Title *</label>
                <input className="input-field" placeholder="e.g. Sprint Planning" value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Date *</label>
                  <input type="date" className="input-field" value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e=>setForm(f=>({...f,date:e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Start *</label>
                  <input type="time" className="input-field" value={form.start}
                    onChange={e=>setForm(f=>({...f,start:e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">End *</label>
                  <input type="time" className="input-field" value={form.end}
                    onChange={e=>setForm(f=>({...f,end:e.target.value}))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Type</label>
                  <select className="input-field" value={form.meeting_type}
                    onChange={e=>setForm(f=>({...f,meeting_type:e.target.value}))}>
                    <option value="scheduled">Scheduled</option>
                    <option value="instant">Instant</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Location / Link</label>
                  <input className="input-field" placeholder="Room 3B or meet.google.com/..." value={form.location}
                    onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Invite Attendees</label>
                <div className="max-h-36 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {employees.filter(e=>e.user_id&&e.user_id!==currentUserId).map(emp=>{
                    const sel = form.attendee_ids.includes(emp.user_id);
                    return (
                      <label key={emp.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${sel?"bg-primary/5":"hover:bg-muted/50"}`}>
                        <input type="checkbox" className="rounded" checked={sel}
                          onChange={()=>setForm(f=>({...f,
                            attendee_ids: sel ? f.attendee_ids.filter(id=>id!==emp.user_id) : [...f.attendee_ids,emp.user_id]
                          }))} />
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.department || emp.role}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Agenda / Description</label>
                <textarea className="input-field resize-none h-20" placeholder="What will be discussed?"
                  value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                  {saving ? "Saving..." : editingMeeting ? "Save Changes" : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center">Delete Meeting?</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              "<span className="font-medium text-foreground">{deleteTarget.title}</span>" will be permanently deleted and all attendees will be notified.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-colors text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
