import { useState } from "react";
import {
  FolderOpen,
  FileText,
  Upload,
  Search,
  Grid,
  List,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  File,
  Image,
} from "lucide-react";
import { files } from "@/data/mockData";

const getFileIcon = (type) => {
  switch (type) {
    case "folder":
      return <FolderOpen className="w-6 h-6 text-warning" />;
    case "pdf":
      return <FileText className="w-6 h-6 text-destructive" />;
    case "excel":
      return <File className="w-6 h-6 text-success" />;
    case "word":
      return <FileText className="w-6 h-6 text-primary" />;
    case "figma":
      return <Image className="w-6 h-6 text-accent" />;
    default:
      return <File className="w-6 h-6 text-muted-foreground" />;
  }
};

export default function Files() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(null);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your documents
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="dashboard-card p-4 text-center hover:border-primary/30 cursor-pointer relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(showMenu === file.id ? null : file.id);
                }}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              {showMenu === file.id && (
                <div className="absolute top-8 right-2 w-40 bg-card rounded-xl border border-border shadow-soft-lg z-10 animate-fade-in">
                  <div className="p-2">
                    <button className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="w-full p-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-muted rounded-xl">
                {getFileIcon(file.type)}
              </div>
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{file.size}</p>
            </div>
          ))}

          {/* Upload Card */}
          <button className="dashboard-card p-4 border-dashed border-2 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-muted/30 transition-colors">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-muted rounded-full">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm text-muted-foreground">Upload</p>
          </button>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-4 rounded-l-lg">Name</th>
                  <th className="text-left p-4">Owner</th>
                  <th className="text-left p-4">Modified</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-right p-4 rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{file.owner}</td>
                    <td className="p-4 text-muted-foreground">
                      {file.modified}
                    </td>
                    <td className="p-4 text-muted-foreground">{file.size}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
