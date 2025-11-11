# API Limitation Discovery

## Critical Finding

**Date:** November 11, 2025  
**Issue:** Moonshot API has a 4MB total message size limit

## Test Results

### What Worked ✅
1. **File Upload to IndexedDB:** Successfully uploaded 5.56MB CSV file
2. **Storage:** File stored in IndexedDB without issues
3. **UI Display:** File displayed correctly in "My Files"
4. **Loading from IndexedDB:** File successfully loaded from IndexedDB

### What Failed ❌
1. **Sending to API:** API rejected request with error:
   ```
   Invalid request: total message size 5833714 exceeds limit 4194304
   ```

## Analysis

**API Limits:**
- **Maximum message size:** 4,194,304 bytes (4MB)
- **File size attempted:** 5,833,714 bytes (5.56MB)
- **Exceeded by:** 1,639,410 bytes (1.56MB)

**Root Cause:**
The Moonshot Chat API has a hard limit of 4MB for the total message size, including:
- User query text
- File content
- System prompts
- Tool definitions

This means files larger than ~3.5MB (accounting for other message content) cannot be sent directly via the API.

## Impact

**Current Implementation:**
- ✅ Can upload files up to 100MB to IndexedDB
- ✅ Files persist across sessions
- ❌ **Cannot send files > 3.5MB to AI**

**User Experience:**
- Users can upload large files (misleading)
- Files appear to be saved successfully
- But AI cannot analyze them (confusing error)

## Solutions

### Option 1: File Chunking (Recommended)
**Approach:** Split large files into chunks < 3MB and process sequentially

**Pros:**
- Works within API limits
- Can process files of any size
- Transparent to user

**Cons:**
- More complex implementation
- Multiple API calls required
- May lose context between chunks

**Implementation:**
1. Detect if file > 3MB
2. Split file into chunks
3. Send chunks sequentially with context
4. Aggregate results

### Option 2: Client-Side Processing
**Approach:** Process files in browser, send only summaries/results

**Pros:**
- No API limit issues
- Faster for large files
- Reduces API costs

**Cons:**
- Limited analysis capabilities
- Requires implementing analysis logic
- May not work for all file types

### Option 3: File Size Limit + Warning
**Approach:** Limit file uploads to 3.5MB and show clear warning

**Pros:**
- Simple implementation
- Clear user expectations
- No API errors

**Cons:**
- Cannot handle large files
- Poor user experience
- Defeats purpose of 100MB limit

## Recommendation

**Implement Option 1 (File Chunking) with Option 3 (Warning) as fallback:**

1. **Short-term (Immediate):**
   - Add warning when file > 3.5MB
   - Show estimated chunk count
   - Ask user to confirm chunked processing

2. **Long-term (Next Sprint):**
   - Implement automatic chunking
   - Smart chunk boundaries (e.g., by rows for CSV)
   - Progress indicator for multi-chunk processing
   - Result aggregation

## Action Items

- [ ] Add file size check before sending to API
- [ ] Show warning dialog for files > 3.5MB
- [ ] Implement chunking strategy
- [ ] Add progress indicator
- [ ] Test with various file sizes
- [ ] Update documentation

## Testing Notes

**Test File:** test_10mb.csv (5.56MB)
- **Upload:** ✅ Success
- **Storage:** ✅ Success (IndexedDB)
- **API Send:** ❌ Failed (exceeds 4MB limit)

**Conclusion:**
IndexedDB implementation works perfectly. The limitation is in the Moonshot API, not our code.
