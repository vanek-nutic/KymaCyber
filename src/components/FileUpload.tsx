import React, { useState, useRef, useEffect } from 'react';
import './FileUpload.css';
import {
  saveFiles,
  loadFiles,
  deleteFile as deleteFileFromDB,
  checkQuota,
  formatBytes,
  migrateFromLocalStorage,
} from '../lib/file-storage';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [justUploadedCount, setJustUploadedCount] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; total: number; percentage: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files from IndexedDB on mount
  useEffect(() => {
    async function init() {
      try {
        // Migrate from localStorage if needed
        await migrateFromLocalStorage();

        // Load files from IndexedDB
        const loadedFiles = await loadFiles();
        setFiles(loadedFiles);
        onFilesChange(loadedFiles);

        // Update quota info
        await updateQuotaInfo();
      } catch (error) {
        console.error('Error loading files:', error);
        setUploadError('Failed to load saved files');
      }
    }
    init();
  }, []);

  const updateQuotaInfo = async () => {
    try {
      const quota = await checkQuota();
      setQuotaInfo({
        used: quota.used,
        total: quota.total,
        percentage: quota.percentage,
      });
    } catch (error) {
      console.error('Error checking quota:', error);
    }
  };

  const handleFileRead = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          uploadedAt: new Date(),
        });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFiles = async (fileList: FileList) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Check quota first
      const quota = await checkQuota();
      let totalNewSize = 0;
      for (let i = 0; i < fileList.length; i++) {
        totalNewSize += fileList[i].size;
      }

      if (totalNewSize > quota.available) {
        throw new Error(
          `Not enough storage space. Need ${formatBytes(totalNewSize)}, but only ${formatBytes(quota.available)} available.`
        );
      }

      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Check file type
        const validTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'application/json',
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|txt|json)$/i)) {
          console.warn(`File type not supported: ${file.name}`);
          continue;
        }

        // Check file size (max 3.5MB due to API limit)
        // Note: IndexedDB can store up to 100MB, but Moonshot API has 4MB message limit
        // We use 3.5MB to account for other message content (query, prompts, etc.)
        const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File too large: ${file.name} (${formatBytes(file.size)}). ` +
            `Maximum size is ${formatBytes(MAX_FILE_SIZE)} due to API limitations. ` +
            `Please split large files into smaller chunks.`
          );
        }

        try {
          const uploadedFile = await handleFileRead(file);
          newFiles.push(uploadedFile);
        } catch (error) {
          console.error('Error reading file:', file.name, error);
          throw new Error(`Error reading file: ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];

        // Save to IndexedDB
        await saveFiles(updatedFiles);

        // Update state
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        // Update quota info
        await updateQuotaInfo();

        // Show success message
        setUploadSuccess(true);
        setJustUploadedCount(newFiles.length);
        setTimeout(() => {
          setUploadSuccess(false);
          setJustUploadedCount(0);
        }, 8000); // Show for 8 seconds
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      setUploadError(error.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = async (id: string) => {
    try {
      setUploadError(null);

      // Delete from IndexedDB
      await deleteFileFromDB(id);

      // Update state
      const updatedFiles = files.filter((f) => f.id !== id);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      // Update quota info
      await updateQuotaInfo();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setUploadError(error.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    return formatBytes(bytes);
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-buttons">
        <button onClick={handleUploadClick} className="upload-btn" disabled={isUploading}>
          {isUploading ? '⏳ Uploading...' : '📤 Upload File'}
        </button>
        <button onClick={() => setShowFiles(!showFiles)} className="files-btn">
          📁 My Files ({files.length})
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.txt,.json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="upload-loading">
          <div className="spinner"></div>
          <p>Uploading and saving files...</p>
        </div>
      )}

      {uploadError && (
        <div className="upload-error">
          <p>❌ {uploadError}</p>
          <button onClick={() => setUploadError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="upload-success">
          <div className="success-header">
            <p>✅ Successfully uploaded {justUploadedCount} file{justUploadedCount > 1 ? 's' : ''}!</p>
          </div>
          <div className="next-steps">
            <h4>📋 Next Steps:</h4>
            <ol>
              <li>Your file{justUploadedCount > 1 ? 's are' : ' is'} now available in "My Files"</li>
              <li>Enter your query in the text area above</li>
              <li>The AI will automatically analyze your uploaded file{justUploadedCount > 1 ? 's' : ''}</li>
              <li>Click "Submit Query" to get insights</li>
            </ol>
          </div>
          <button onClick={() => setUploadSuccess(false)} className="dismiss-btn">
            Got it!
          </button>
        </div>
      )}

      {quotaInfo && (
        <div className="quota-info">
          <p>
            Storage: {formatBytes(quotaInfo.used)} / {formatBytes(quotaInfo.total)} used (
            {quotaInfo.percentage.toFixed(1)}%)
          </p>
        </div>
      )}

      {showFiles && (
        <div className="files-panel">
          <h3>Uploaded Files</h3>
          {files.length === 0 ? (
            <p className="no-files">No files uploaded yet</p>
          ) : (
            <div className="files-list">
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="delete-btn"
                    title="Delete file"
                    disabled={isUploading}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDragging && (
        <div
          className="drop-overlay"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-message">📁 Drop files here to upload</div>
        </div>
      )}

      <div className="upload-hint">
        💡 Tip: Upload CSV, Excel, TXT, or JSON files (max 3.5MB) for AI analysis
      </div>
    </div>
  );
};
