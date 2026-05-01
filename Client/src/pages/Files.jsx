import { useState, useEffect, useRef } from "react";
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
  X,
} from "lucide-react";
import * as fileService from "../services/fileService";
import { useToast } from "../context/ToastContext";
import { formatDate } from "@/utils/formatDate";
import { useEscapeKey } from "@/hooks/useEscapeKey";
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
import { Modal } from "@/components/ui/Modal";
const getFileIcon = (type) => {
  const t = type?.toLowerCase() || "";
  if (t.includes("folder")) return <FolderOpen className="w-6 h-6 text-warning" />;
  if (t.includes("pdf")) return <FileText className="w-6 h-6 text-destructive" />;
  if (t.includes("excel") || t.includes("spreadsheet") || t.includes("csv")) return <File className="w-6 h-6 text-success" />;
  if (t.includes("word") || t.includes("document")) return <FileText className="w-6 h-6 text-primary" />;
  if (t.includes("image")) return <Image className="w-6 h-6 text-accent" />;
  return <File className="w-6 h-6 text-muted-foreground" />;
};

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Files() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(null);
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  
  const toast = useToast();
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape
  useEscapeKey(() => setShowMenu(null), !!showMenu);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fileService.getFiles();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load files", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const newFile = await fileService.uploadFile(formData);
      setFiles([newFile, ...files]);
    } catch (error) {
      console.error("Failed to upload file", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteStatus = (file) => {
    setFileToDelete(file);
    setShowMenu(null);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await fileService.deleteFile(fileToDelete.id);
      setFiles(files.filter((f) => f.id !== fileToDelete.id));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Failed to delete file", error);
      toast.error("Failed to delete file");
    } finally {
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file) => {
    setShowMenu(null);
    let downloadUrl = file.url;
    // For images, we can optionally add fl_attachment 
    if (file.url.includes("cloudinary.com") && file.type && !file.type.includes("pdf") && !file.type.includes("document")) {
      const parts = downloadUrl.split("/upload/");
      if (parts.length === 2 && !file.url.includes("fl_attachment")) {
        downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }
    
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("CORS blocked or failed");
      const blob = await response.blob();
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = windowUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(windowUrl);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      window.open(downloadUrl, "_blank");
    }
  };
  
  const handleView = async (file) => {
    setShowMenu(null);
    window.open(file.url, "_blank");
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage and organize your documents</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload File"}
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

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm">Loading files...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Files Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="dashboard-card p-4 text-center hover:border-primary/30 cursor-pointer relative group transition-all">
                  <div className="absolute top-2 right-2" ref={showMenu === file.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === file.id ? null : file.id);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted transition-all">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {showMenu === file.id && (
                      <div className="absolute top-8 right-0 w-40 bg-card rounded-xl border border-border shadow-lg z-10 animate-fade-in text-left">
                        <div className="p-1.5">
                          <button onClick={(e) => { e.stopPropagation(); handleView(file); }} className="w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 font-medium">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            View
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 font-medium">
                            <Download className="w-4 h-4 text-muted-foreground" />
                            Download
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteStatus(file); }} className="w-full px-3 py-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 font-medium">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
                    {getFileIcon(file.type)}
                  </div>
                  <p className="font-semibold text-xs truncate leading-snug" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                </div>
              ))}

              {/* Upload Drop Card */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="dashboard-card p-4 border-2 border-dashed flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50 min-h-[130px] group">
                <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-medium text-xs text-muted-foreground group-hover:text-primary transition-colors">Upload</p>
              </button>
            </div>
          ) : (
            <div className="dashboard-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                      <th className="text-left px-5 py-3.5">Name</th>
                      <th className="text-left px-5 py-3.5">Owner</th>
                      <th className="text-left px-5 py-3.5">Modified</th>
                      <th className="text-left px-5 py-3.5">Size</th>
                      <th className="text-right px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-10 text-center text-sm text-muted-foreground">No files found</td>
                      </tr>
                    )}
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-muted/30 transition-colors group">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            {getFileIcon(file.type)}
                          </div>
                          <span className="font-semibold text-sm truncate max-w-[200px]" title={file.name}>{file.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{file.owner_name}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(file.created_at)}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatBytes(file.size)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleView(file)} title="View" className="p-2 rounded-xl hover:bg-muted transition-colors">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDownload(file)} title="Download" className="p-2 rounded-xl hover:bg-muted transition-colors">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDeleteStatus(file)} title="Delete" className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
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
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file{" "}
              <span className="font-semibold text-foreground">
                "{fileToDelete?.name}"
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white">
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
