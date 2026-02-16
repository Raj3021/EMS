import { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Tag,
  MoreVertical,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { notes } from "@/data/mockData";

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => handleNoteClick(note)}
            className="dashboard-card cursor-pointer hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-muted transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <h3 className="font-semibold mb-2">{note.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {note.content}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {note.date}
              </span>
              <span className="badge badge-muted">{note.linkedTo}</span>
            </div>
            <div className="flex gap-2 mt-3">
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
          className="dashboard-card border-dashed border-2 flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 hover:bg-muted/30 transition-colors">
          <div className="p-3 bg-muted rounded-full mb-3">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Create New Note</p>
        </button>
      </div>

      {/* Note Editor Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={selectedNote ? "Edit Note" : "Create New Note"}
        size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Note title..."
              defaultValue={selectedNote?.title || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              className="input-field h-64 resize-none font-mono text-sm"
              placeholder="Start writing..."
              defaultValue={selectedNote?.content || ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Link to</label>
              <select
                className="input-field"
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
                className="input-field"
                placeholder="Add tags..."
                defaultValue={selectedNote?.tags.join(", ") || ""}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
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
      </Modal>
    </div>
  );
}
