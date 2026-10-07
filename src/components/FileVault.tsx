import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Lock, 
  HardDrive,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { UserFile } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const FileVault: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<string>('damage_photo');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getFiles();
      setFiles(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed loading user files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    } else {
      setFiles([]);
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!previewFile || !previewFile.mimeType.startsWith('image/')) {
      setPreviewUrl(null);
      setIsLoadingPreview(false);
      setPreviewError(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    setPreviewUrl(null);
    setPreviewError(null);
    setIsLoadingPreview(true);

    api.downloadFile(previewFile.id)
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((error: any) => {
        if (active) setPreviewError(error.message || 'Failed to load image preview.');
      })
      .finally(() => {
        if (active) setIsLoadingPreview(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const uploaded = await api.uploadFile(selected, uploadCategory);
      setFiles(prev => [uploaded, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      await api.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (previewFile?.id === id) setPreviewFile(null);
    } catch (err: any) {
      alert(err.message || 'Failed deleting file');
    }
  };

  const handleDownload = async (file: UserFile) => {
    try {
      const blob = await api.downloadFile(file.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed downloading file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'damage_photo': return 'Component Damage Photo';
      case 'error_code': return 'Digital Error Code';
      case 'invoice_receipt': return 'Mechanic Estimate / Invoice';
      case 'model_plate': return 'Appliance Rating Plate';
      default: return 'Diagnostic Document';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 bg-store-grid">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-mono text-xs uppercase tracking-wider font-bold">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Encrypted Workshop Records · Isolated Technical Vault</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mech">
            Diagnostic File Vault & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Store photos of malfunctioning parts, control board fault codes, nameplate model tags, and mechanic repair receipts.
            Files are strictly restricted to your authenticated account.
          </p>
        </div>

        <button
          onClick={fetchFiles}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors self-start md:self-center font-mech uppercase tracking-wider"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {errorMessage}
        </div>
      )}

      {!user && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-950">Sign in to upload and view files in your private vault.</p>
          <button
            onClick={onOpenAuth}
            className="px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Sign In / Demo
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-3 pb-2 border-b border-slate-100">
          Upload Diagnostic Evidence or Repair Invoices
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">File Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="damage_photo">Fault / Damage Photo</option>
              <option value="error_code">Error Display Screenshot</option>
              <option value="invoice_receipt">Technician Repair Invoice</option>
              <option value="model_plate">Model Plate / Serial Tag</option>
              <option value="other">General Technical Spec</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select File (PNG, JPG, PDF, TXT up to 15MB)</label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading || !user}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg"
              />
              {isUploading && (
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono px-3">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Files List / Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Your Uploaded Records ({files.length})
            </h2>
          </div>
          <div className="text-[11px] font-mono text-slate-500 font-semibold">
            Total Vault Size: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            Loading storage catalog...
          </div>
        ) : files.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm font-mech">No files stored yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload photos of broken appliance components or vendor invoices above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {files.map((file) => {
              const isImage = file.mimeType.startsWith('image/');
              return (
                <div
                  key={file.id}
                  className="bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl p-4 flex flex-col justify-between transition-all shadow-2xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span 
                          title={file.originalName}
                          className="text-xs font-bold text-slate-900 truncate font-mech group-hover:text-blue-700"
                        >
                          {file.originalName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(file.id, file.originalName)}
                        title="Delete file"
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                      <span>{getCategoryLabel(file.category)}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-slate-800 font-semibold">{formatFileSize(file.size)}</span>
                    </div>

                    <div className="mt-1 text-[10px] font-mono text-slate-400">
                      {new Date(file.uploadedAt).toLocaleDateString()} at{' '}
                      {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-bold font-mech uppercase tracking-wider"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-mono font-medium hover:underline"
                    >
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-slate-900 truncate max-w-md">
                  {previewFile.originalName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {formatFileSize(previewFile.size)} · {previewFile.mimeType}
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100/60">
              {previewFile.mimeType.startsWith('image/') ? (
                <>
                  {isLoadingPreview && <p className="text-xs text-slate-500">Loading image preview...</p>}
                  {previewError && <p className="text-xs text-red-700">{previewError}</p>}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={previewFile.originalName}
                      className="max-h-[60vh] max-w-full object-contain rounded-lg border border-slate-200 shadow-xs"
                    />
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-600">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-medium">Non-image file format</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewFile)}
                    className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider font-mech shadow-xs"
                  >
                    Open / Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
