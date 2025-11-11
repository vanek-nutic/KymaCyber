# CSV Download Research - Key Findings

## Client-Side CSV Generation

### Method 1: Blob + URL.createObjectURL()

```javascript
// Create CSV data
const csvData = "header1,header2\nvalue1,value2";

// Create Blob
const blob = new Blob([csvData], { type: 'text/csv' });

// Create URL
const url = URL.createObjectURL(blob);

// Create download link
const a = document.createElement('a');
a.href = url;
a.download = 'filename.csv';
a.click();

// Clean up
URL.revokeObjectURL(url);
```

### Method 2: Data URI (for small files)

```javascript
const csvData = "header1,header2\nvalue1,value2";
const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);

const a = document.createElement('a');
a.href = dataUri;
a.download = 'filename.csv';
a.click();
```

## Converting Data to CSV

### From JavaScript Object

```javascript
function objectToCSV(obj) {
  const headers = Object.keys(obj);
  const values = Object.values(obj);
  return [headers.join(','), values.join(',')].join('\n');
}
```

### From Array of Objects

```javascript
function arrayToCSV(data) {
  const csvRows = [];
  
  // Get headers
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}
```

### From Markdown Table

```javascript
function markdownTableToCSV(markdown) {
  const lines = markdown.split('\n');
  const tableLines = lines.filter(line => line.trim().startsWith('|'));
  
  return tableLines
    .map(line => {
      // Remove leading/trailing pipes and split
      const cells = line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell && !cell.match(/^[-:]+$/)); // Skip separator line
      
      // Escape and quote cells
      return cells.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');
    })
    .filter(line => line) // Remove empty lines
    .join('\n');
}
```

## Detecting File Mentions in AI Response

### Pattern 1: Explicit file mentions with checkmarks

```javascript
const pattern1 = /✅\s+(\w+\.\w+)\s+-\s+(.+)/g;
```

Example matches:
- ✅ organized_cogs_final.csv - Complete organized table
- ✅ cogs_pivot_table.csv - Pivot view

### Pattern 2: File creation verbs

```javascript
const pattern2 = /(exported|saved|created|generated)\s+(\w+\.\w+)/gi;
```

Example matches:
- "exported organized_cogs.csv"
- "saved data.json"

### Pattern 3: Code blocks with filenames

```javascript
const pattern3 = /```\w*\n#\s*(\w+\.\w+)\n/g;
```

Example matches:
```python
# data.csv
header1,header2
value1,value2
```

## Extracting Data from AI Response

### From Markdown Tables

```javascript
function extractMarkdownTables(text) {
  const tables = [];
  const lines = text.split('\n');
  let currentTable = [];
  let inTable = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      inTable = true;
      currentTable.push(line);
    } else if (inTable) {
      if (currentTable.length > 0) {
        tables.push(currentTable.join('\n'));
        currentTable = [];
      }
      inTable = false;
    }
  }
  
  if (currentTable.length > 0) {
    tables.push(currentTable.join('\n'));
  }
  
  return tables;
}
```

### From Code Blocks

```javascript
function extractCodeBlocks(text) {
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      content: match[2]
    });
  }
  
  return blocks;
}
```

## Implementation Strategy

1. **Parse AI Response**
   - Detect file mentions
   - Extract markdown tables
   - Extract code blocks
   - Identify data structures

2. **Generate Files**
   - Convert markdown tables to CSV
   - Extract CSV from code blocks
   - Generate JSON files
   - Create text files

3. **Create Download Links**
   - Generate Blob URLs
   - Create clickable links
   - Style with cyber theme
   - Add file size info

4. **Clean Up**
   - Revoke Blob URLs when done
   - Handle multiple files
   - Support "Download All" option

## Best Practices

1. **CSV Escaping**
   - Wrap values in quotes
   - Escape quotes by doubling them
   - Handle newlines in values
   - Use UTF-8 encoding

2. **Performance**
   - Use Blob for large files (>1MB)
   - Use Data URI for small files (<100KB)
   - Revoke URLs to prevent memory leaks
   - Limit number of simultaneous downloads

3. **User Experience**
   - Show file size
   - Indicate file type
   - Provide preview option
   - Support batch download

4. **Error Handling**
   - Validate data before conversion
   - Handle missing data gracefully
   - Show error messages
   - Provide fallback options
