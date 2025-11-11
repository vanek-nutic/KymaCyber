# File Upload Fix - Implementation Plan

**Goal:** Replace localStorage with IndexedDB to support 100MB files with proper error handling and UX

---

## Solution Architecture

### Core Change: localStorage → IndexedDB

**Why IndexedDB?**
- ✅ Supports 100MB+ files (Chrome: 60GB+, Firefox: 2GB, Safari: 1GB)
- ✅ Asynchronous API (doesn't block UI)
- ✅ Structured storage with indexes
- ✅ Better error handling
- ✅ Quota management API

---

## Implementation Steps

### Step 1: Create IndexedDB Utility Module

**File:** `src/lib/file-storage.ts`

**Functions:**
```typescript
// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase>

// Save files to IndexedDB
async function saveFiles(files: UploadedFile[]): Promise<void>

// Load files from IndexedDB
async function loadFiles(): Promise<UploadedFile[]>

// Delete a file from IndexedDB
async function deleteFile(fileId: string): Promise<void>

// Clear all files
async function clearAllFiles(): Promise<void>

// Check available quota
async function checkQuota(): Promise<{ available: number, used: number, total: number }>
```

**IndexedDB Schema:**
```
Database: kimi-cyber-db
Version: 1
Object Store: files
  - Key: id (string)
  - Indexes: name, uploadedAt
```

---

### Step 2: Update FileUpload Component

**File:** `src/components/FileUpload.tsx`

**Changes:**
1. Add loading state
2. Add error handling
3. Replace localStorage with IndexedDB
4. Add quota checking
5. Add user feedback

**New State:**
```typescript
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState<string | null>(null);
const [quotaInfo, setQuotaInfo] = useState<{ available: number, used: number } | null>(null);
```

**Updated handleFileUpload:**
```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  setIsUploading(true);
  setUploadError(null);
  
  try {
    // Check quota first
    const quota = await checkQuota();
    if (file.size > quota.available) {
      throw new Error(`Not enough storage space. Available: ${formatBytes(quota.available)}`);
    }
    
    // Read file
    const content = await readFileContent(file);
    
    // Create file object
    const newFile: UploadedFile = { ... };
    
    // Save to IndexedDB
    await saveFiles([...uploadedFiles, newFile]);
    
    // Update state
    setUploadedFiles([...uploadedFiles, newFile]);
    onFilesChange([...uploadedFiles, newFile]);
    
  } catch (error) {
    setUploadError(error.message);
    console.error('File upload failed:', error);
  } finally {
    setIsUploading(false);
  }
};
```

---

### Step 3: Update App.tsx

**File:** `src/App.tsx`

**Changes:**
1. Load files from IndexedDB on mount
2. Pass files to API correctly
3. Handle file loading errors

**useEffect for loading files:**
```typescript
useEffect(() => {
  async function loadStoredFiles() {
    try {
      const files = await loadFiles();
      // Update any necessary state
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  }
  loadStoredFiles();
}, []);
```

**handleSubmit update:**
```typescript
const handleSubmit = async () => {
  // ... existing code ...
  
  // Load files from IndexedDB (not localStorage!)
  const filesForAPI = await loadFiles();
  
  // ... rest of code ...
};
```

---

### Step 4: Add Loading UI

**File:** `src/components/FileUpload.tsx`

**Add loading indicator:**
```tsx
{isUploading && (
  <div className="upload-loading">
    <div className="spinner"></div>
    <p>Uploading file...</p>
  </div>
)}
```

**Add error display:**
```tsx
{uploadError && (
  <div className="upload-error">
    <p>❌ {uploadError}</p>
    <button onClick={() => setUploadError(null)}>Dismiss</button>
  </div>
)}
```

**Add quota display:**
```tsx
{quotaInfo && (
  <div className="quota-info">
    <p>Storage: {formatBytes(quotaInfo.used)} / {formatBytes(quotaInfo.available)} used</p>
  </div>
)}
```

---

### Step 5: Add CSS for New UI Elements

**File:** `src/components/FileUpload.css`

**Add styles:**
```css
.upload-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid #00ff00;
  border-radius: 4px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #00ff00;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-error {
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff0000;
  border-radius: 4px;
  color: #ff0000;
}

.quota-info {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}
```

---

### Step 6: Migration Strategy

**Handle existing localStorage data:**

```typescript
// In file-storage.ts
async function migrateFromLocalStorage(): Promise<void> {
  try {
    const oldData = localStorage.getItem('kimi-cyber-files');
    if (oldData) {
      const files = JSON.parse(oldData);
      await saveFiles(files);
      localStorage.removeItem('kimi-cyber-files'); // Clean up
      console.log('Migrated files from localStorage to IndexedDB');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

**Call on app init:**
```typescript
// In App.tsx useEffect
useEffect(() => {
  async function init() {
    await migrateFromLocalStorage();
    const files = await loadFiles();
    // ... rest of init
  }
  init();
}, []);
```

---

## Testing Plan

### Test 1: Small File (1MB)
- ✅ Upload succeeds
- ✅ File saved to IndexedDB
- ✅ File appears in list
- ✅ File sent to AI correctly

### Test 2: Medium File (10MB)
- ✅ Upload succeeds
- ✅ File saved to IndexedDB
- ✅ No QuotaExceededError
- ✅ File sent to AI correctly

### Test 3: Large File (50MB)
- ✅ Upload succeeds
- ✅ File saved to IndexedDB
- ✅ Loading indicator shows
- ✅ File sent to AI correctly

### Test 4: Very Large File (100MB)
- ✅ Upload succeeds
- ✅ File saved to IndexedDB
- ✅ Loading indicator shows
- ✅ File sent to AI correctly

### Test 5: Error Handling
- ✅ Quota exceeded shows error
- ✅ Invalid file shows error
- ✅ Network error shows error
- ✅ User can retry after error

### Test 6: Migration
- ✅ Old localStorage data migrated
- ✅ Old data accessible in new system
- ✅ localStorage cleaned up

### Test 7: Multiple Files
- ✅ Can upload multiple files
- ✅ All files saved correctly
- ✅ All files sent to AI
- ✅ Can delete individual files

### Test 8: Page Refresh
- ✅ Files persist after refresh
- ✅ Files loaded from IndexedDB
- ✅ UI shows correct file count

---

## Success Criteria

✅ **Files up to 100MB can be uploaded**  
✅ **Files persist across page refreshes**  
✅ **Files are sent to AI correctly**  
✅ **Loading indicators show during upload**  
✅ **Error messages show when upload fails**  
✅ **Quota information is displayed**  
✅ **No silent failures**  
✅ **User experience is smooth and informative**

---

## Implementation Order

1. ✅ Create `file-storage.ts` with IndexedDB utilities
2. ✅ Update `FileUpload.tsx` with new logic
3. ✅ Update `App.tsx` to use IndexedDB
4. ✅ Add loading UI components
5. ✅ Add error handling UI
6. ✅ Add CSS for new elements
7. ✅ Add migration logic
8. ✅ Test thoroughly
9. ✅ Deploy

**Estimated Time:** 2-3 hours  
**Priority:** CRITICAL - Blocking user's workflow
