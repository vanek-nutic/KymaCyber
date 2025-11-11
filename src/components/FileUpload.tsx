import React, { useState, useRef } from 'react';
import './FileUpload.css';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert(`File type not supported: ${file.name}`);
        continue;
      }
      
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert(`File too large: ${file.name} (max 100MB)`);
        continue;
      }
      
      try {
        const uploadedFile = await handleFileRead(file);
        newFiles.push(uploadedFile);
      } catch (error) {
        console.error('Error reading file:', file.name, error);
        alert(`Error reading file: ${file.name}`);
      }
    }
    
    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      
      // Save to localStorage
      localStorage.setItem('kimi-cyber-files', JSON.stringify(updatedFiles));
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

  const handleDeleteFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    localStorage.setItem('kimi-cyber-files', JSON.stringify(updatedFiles));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Load files from localStorage on mount
  React.useEffect(() => {
    const savedFiles = localStorage.getItem('kimi-cyber-files');
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles);
        onFilesChange(parsedFiles);
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, []);

  return (
    <div className="file-upload-container">
      <div className="file-upload-buttons">
        <button onClick={handleUploadClick} className="upload-btn">
          📤 Upload File
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
      />

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
          <div className="drop-message">
            📁 Drop files here to upload
          </div>
        </div>
      )}

      <div className="upload-hint">
        💡 Tip: Upload CSV, Excel, TXT, or JSON files for AI analysis
      </div>
    </div>
  );
};
