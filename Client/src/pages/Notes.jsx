import { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Tag,
  MoreVertical,
  X,
} from "lucide-react";

// Sample notes data (you can import from mockData if available)
const notesData = [
  {
    id: 1,
    title: "Sprint Planning Notes",
    content: "Discussed Q1 priorities and resource allocation...",
    date: "2024-01-14",
    linkedTo: "Sprint Planning",
    tags: ["meeting", "planning"],
  },
  {
    id: 2,
    title: "Design System Updates",
    content: "New color palette and typography guidelines...",
    date: "2024-01-12",
    linkedTo: "UI Redesign",
    tags: ["design", "project"],
  },
  {
    id: 3,
    title: "API Integration Guide",
    content: "Step-by-step guide for third-party integrations...",
    date: "2024-01-10",
    linkedTo: "Documentation",
    tags: ["technical", "guide"],
  },
];

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const filteredNotes = notesData.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Create and organize your notes and documentation
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedNote(null);
            setShowNoteModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => handleNoteClick(note)}
            className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-accent transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{note.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {note.content}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {note.date}
              </span>
              <span className="px-2 py-1 bg-accent rounded text-xs font-medium">
                {note.linkedTo}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Empty Create Card */}
        <button
          onClick={() => {
            setSelectedNote(null);
            setShowNoteModal(true);
          }}
          className="bg-card border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[280px] hover:border-primary/50 hover:bg-muted/30 transition-colors">
          <div className="p-3 bg-muted rounded-full mb-3">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Create New Note</p>
        </button>
      </div>

      {/* Note Editor Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedNote ? "Edit Note" : "Create New Note"}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Note title..."
                  defaultValue={selectedNote?.title || ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content
                </label>
                <textarea
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-64 resize-none font-mono text-sm"
                  placeholder="Start writing..."
                  defaultValue={selectedNote?.content || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Link to
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue={selectedNote?.linkedTo || ""}>
                    <option value="">Select project or meeting</option>
                    <option value="Sprint Planning">Sprint Planning</option>
                    <option value="UI Redesign">UI Redesign</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add tags..."
                    defaultValue={selectedNote?.tags.join(", ") || ""}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                {selectedNote ? "Save Changes" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
