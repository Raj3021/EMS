import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Tag,
  MoreVertical,
  Trash2,
  Pin,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { getNotes, createNote, updateNote, deleteNote } from "@/services/notes";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getNotes(searchQuery);
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const noteData = {
      title: formData.get("title"),
      content: formData.get("content"),
      linked_to: formData.get("linked_to"),
      tags: formData
        .get("tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      color: "default", // You can add color selection later
    };

    try {
      if (selectedNote) {
        await updateNote(selectedNote.id, noteData);
        toast.success("Note updated successfully");
      } else {
        await createNote(noteData);
        toast.success("Note created successfully");
      }
      setShowNoteModal(false);
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
    }
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNote(noteToDelete.id);
      toast.success("Note deleted");
      fetchNotes();
      setNoteToDelete(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const togglePin = async (e, note) => {
    e.stopPropagation();
    try {
      await updateNote(note.id, { ...note, is_pinned: !note.is_pinned });
      fetchNotes();
    } catch (error) {
      console.error("Failed to update pin status:", error);
      toast.error("Failed to update note");
    }
  };

  const openModal = (note = null) => {
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
          onClick={() => openModal()}
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
      {isLoading ? (
        <div className="text-center py-10">Loading notes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Card */}
          <button
            onClick={() => openModal()}
            className="dashboard-card border-dashed border-2 flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 hover:bg-muted/30 transition-colors">
            <div className="p-3 bg-muted rounded-full mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">Create New Note</p>
          </button>

          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openModal(note)}
              className={`dashboard-card cursor-pointer hover:border-primary/30 transition-colors relative group ${
                note.is_pinned ? "border-primary/50 bg-primary/5" : ""
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => togglePin(e, note)}
                    className={`p-1 rounded hover:bg-muted transition-colors ${
                      note.is_pinned
                        ? "text-primary opacity-100"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    }`}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteToDelete(note);
                    }}
                    className="p-1 rounded hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold mb-2">{note.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3rem]">
                {note.content}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(note.updated_at), "MMM d, yyyy")}
                </span>
                {note.linked_to && (
                  <span className="badge badge-muted">{note.linked_to}</span>
                )}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note{" "}
              <span className="font-semibold text-foreground">
                "{noteToDelete?.title}"
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white">
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Note Editor Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={selectedNote ? "Edit Note" : "Create New Note"}
        size="lg">
        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              name="title"
              type="text"
              className="input-field"
              placeholder="Note title..."
              defaultValue={selectedNote?.title || ""}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              name="content"
              className="input-field h-64 resize-none font-mono text-sm"
              placeholder="Start writing..."
              defaultValue={selectedNote?.content || ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Link to</label>
              <select
                name="linked_to"
                className="input-field"
                defaultValue={selectedNote?.linked_to || ""}>
                <option value="">Select project or meeting</option>
                <option value="Sprint">Sprint</option>
                <option value="UI">UI</option>
                <option value="Documentation">Documentation</option>
                <option value="Product Strategy">Product Strategy</option>
                <option value="Marketing">Marketing </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Tags (comma separated)
              </label>
              <input
                name="tags"
                type="text"
                className="input-field"
                placeholder="design, urgent, ideas..."
                defaultValue={selectedNote?.tags?.join(", ") || ""}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowNoteModal(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              {selectedNote ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
