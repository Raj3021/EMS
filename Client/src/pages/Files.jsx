import { useState } from "react";
import {
  Search,
  Upload,
  FolderPlus,
  File,
  FileText,
  Image,
  MoreVertical,
  Download,
  Trash2,
} from "lucide-react";

const files = [
  {
    id: 1,
    name: "Project Proposal.pdf",
    size: "2.4 MB",
    modified: "2024-01-15",
    type: "pdf",
    icon: FileText,
  },
  {
    id: 2,
    name: "Design Mockups.fig",
    size: "5.1 MB",
    modified: "2024-01-14",
    type: "design",
    icon: Image,
  },
  {
    id: 3,
    name: "Meeting Notes.docx",
    size: "156 KB",
    modified: "2024-01-13",
    type: "document",
    icon: FileText,
  },
  {
    id: 4,
    name: "Budget 2024.xlsx",
    size: "890 KB",
    modified: "2024-01-12",
    type: "spreadsheet",
    icon: File,
  },
  {
    id: 5,
    name: "Team Photo.jpg",
    size: "3.2 MB",
    modified: "2024-01-11",
    type: "image",
    icon: Image,
  },
  {
    id: 6,
    name: "Code Review.txt",
    size: "45 KB",
    modified: "2024-01-10",
    type: "text",
    icon: FileText,
  },
];

export default function Files() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === "grid" ? "bg-card shadow-sm" : ""
            }`}>
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === "list" ? "bg-card shadow-sm" : ""
            }`}>
            List
          </button>
        </div>
      </div>

      {/* Files Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <file.icon className="w-6 h-6 text-primary" />
                </div>
                <button className="p-1 hover:bg-accent rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="font-medium mb-1 truncate">{file.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{file.size}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {file.modified}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-accent rounded transition-colors">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 hover:bg-accent rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Size</th>
                <th className="text-left p-4 font-medium">Modified</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <file.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{file.size}</td>
                  <td className="p-4 text-muted-foreground">{file.modified}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
