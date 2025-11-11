# File Download Issue - Investigation

## Problem Statement

The AI generates CSV files (e.g., `organized_cogs_final.csv`) and mentions them in the response, but users cannot download or access these files.

## Root Cause

The `code_runner` tool is currently a **stub implementation** that doesn't actually execute Python code:

```typescript
async function executeCodeRunner(args: { code: string }): Promise<string> {
  // For now, we'll simulate some basic Python execution
  // In production, this would call a sandboxed Python execution API
  
  return JSON.stringify({
    info: 'Python code execution requires a backend service.',
    note: 'In production, this would execute in a sandboxed environment.',
    code_received: args.code.substring(0, 100),
  });
}
```

**What's happening:**
1. AI generates Python code to create CSV files
2. `code_runner` tool receives the code but doesn't execute it
3. Files are never actually created
4. AI assumes files were created and mentions them in response
5. User sees file names but has no way to download them

## Why This Happens

The current implementation is a **demo/stub** because:
- Real Python execution requires a backend server
- Security concerns (sandboxed execution needed)
- Current app is frontend-only (no backend)

## Possible Solutions

### Option 1: Use Moonshot's Official code_runner ❌ NOT VIABLE

**Approach:** Use Moonshot's built-in code_runner via Formula API

**Problems:**
- Moonshot's code_runner executes in their sandbox
- Files created there are not accessible to our app
- No API to retrieve generated files
- Same problem as current situation

### Option 2: Implement Backend Python Execution ❌ TOO COMPLEX

**Approach:** Create a backend service to execute Python code

**Requirements:**
- Backend server (Node.js/Python)
- Sandboxed Python environment (Docker/PyPy)
- File storage system
- Security measures
- Deployment infrastructure

**Problems:**
- Requires complete backend architecture
- Security risks (code injection)
- Hosting costs
- Maintenance overhead
- Out of scope for current project

### Option 3: Client-Side JavaScript Execution ⭐ RECOMMENDED

**Approach:** Parse AI's intent and execute equivalent logic in JavaScript

**How it works:**
1. AI generates Python code to create CSV
2. Detect file creation intent in tool result
3. Extract data from AI's response
4. Generate CSV in JavaScript
5. Create downloadable blob
6. Show download link to user

**Advantages:**
- ✅ No backend needed
- ✅ Secure (controlled execution)
- ✅ Fast (client-side)
- ✅ Free (no hosting)
- ✅ Works immediately

**Limitations:**
- Only works for data the AI already has
- Cannot execute arbitrary Python code
- Limited to CSV/JSON/TXT generation

### Option 4: AI-Generated Data Extraction ⭐⭐ BEST SOLUTION

**Approach:** Ask AI to provide data in downloadable format

**How it works:**
1. Detect when AI mentions creating files
2. Parse AI's response for structured data
3. Extract data from markdown tables/code blocks
4. Generate downloadable files from extracted data
5. Add download buttons automatically

**Advantages:**
- ✅ No code execution needed
- ✅ Works with current architecture
- ✅ Secure
- ✅ Flexible (CSV, JSON, TXT, etc.)
- ✅ AI already has the data

**Implementation:**
```typescript
// Detect file mentions in AI response
const filePattern = /✅\s+(\w+\.csv)\s+-\s+(.+)/g;

// Extract data from markdown tables
const tableData = extractMarkdownTable(response);

// Generate CSV
const csv = convertToCSV(tableData);

// Create download link
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
```

## Recommended Solution

**Hybrid Approach (Option 3 + 4):**

1. **Detect file creation intent** in AI responses
2. **Extract structured data** from AI's output (tables, JSON blocks)
3. **Generate files client-side** using JavaScript
4. **Add download buttons** automatically
5. **Fallback:** Ask AI to provide data in code block if not found

## Implementation Plan

### Phase 1: Response Parser
- Detect file mentions (regex patterns)
- Extract markdown tables
- Extract JSON/CSV code blocks
- Identify file types

### Phase 2: File Generator
- Convert markdown tables → CSV
- Convert JSON blocks → JSON files
- Convert text blocks → TXT files
- Generate downloadable blobs

### Phase 3: UI Integration
- Add download buttons to Results panel
- Style buttons to match cyber theme
- Show file size and type
- Handle multiple files

### Phase 4: Enhancement
- Auto-generate files when detected
- Show preview before download
- Support Excel format (XLSX)
- Add "Download All" button

## Technical Details

### File Detection Patterns

```typescript
// Pattern 1: Explicit file mentions
const pattern1 = /✅\s+(\w+\.\w+)\s+-/g;

// Pattern 2: "exported" or "saved" mentions
const pattern2 = /(exported|saved|created)\s+(\w+\.\w+)/gi;

// Pattern 3: Code block with filename comment
const pattern3 = /```\w*\n#\s*(\w+\.\w+)\n/g;
```

### Data Extraction

```typescript
// Extract markdown table
function extractMarkdownTable(text: string): string[][] {
  const lines = text.split('\n');
  const tableLines = lines.filter(line => line.includes('|'));
  return tableLines.map(line => 
    line.split('|').map(cell => cell.trim()).filter(Boolean)
  );
}

// Convert to CSV
function convertToCSV(data: string[][]): string {
  return data.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
```

### Download Implementation

```typescript
function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

## Next Steps

1. ✅ Create response parser utility
2. ✅ Implement file generators (CSV, JSON, TXT)
3. ✅ Add download button component
4. ✅ Integrate into Results panel
5. ✅ Test with sample data
6. ✅ Deploy and verify

## Expected Outcome

**Before:**
```
📦 Files Exported
✅ organized_cogs_final.csv - Complete organized table
✅ cogs_pivot_table.csv - Pivot view
✅ structured_cogs_output.csv - Clean structured format
```
(No way to download)

**After:**
```
📦 Files Exported
✅ organized_cogs_final.csv - Complete organized table [📥 Download]
✅ cogs_pivot_table.csv - Pivot view [📥 Download]
✅ structured_cogs_output.csv - Clean structured format [📥 Download]
```
(Clickable download links)
