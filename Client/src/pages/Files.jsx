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
          <p className="text-muted-foreground mt-1">
            Manage and organize your documents
          </p>
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
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Files"}
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
         <div className="text-center text-muted-foreground py-12">Loading files...</div>
      ) : (
        <>
          {/* Files Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="dashboard-card p-4 text-center hover:border-primary/30 cursor-pointer relative group">
                  <div className="absolute top-2 right-2" ref={showMenu === file.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === file.id ? null : file.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted transition-all">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {showMenu === file.id && (
                      <div className="absolute top-8 right-0 w-40 bg-card rounded-xl border border-border shadow-soft-lg z-10 animate-fade-in text-left">
                        <div className="p-2">
                          <button onClick={(e) => { e.stopPropagation(); handleView(file); }} className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="w-full p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteStatus(file); }} className="w-full p-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-muted rounded-xl">
                    {getFileIcon(file.type)}
                  </div>
                  <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                </div>
              ))}

              {/* Upload Card */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="dashboard-card p-4 border-dashed border-2 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50">
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
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-muted-foreground">No files found</td>
                      </tr>
                    )}
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <span className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">{file.owner_name}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-muted-foreground">{formatBytes(file.size)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleView(file)} title="View" className="p-2 rounded-lg hover:bg-muted transition-colors">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDownload(file)} title="Download" className="p-2 rounded-lg hover:bg-muted transition-colors">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDeleteStatus(file)} title="Delete" className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
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
