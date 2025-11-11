/**
 * File Download Utilities
 * Handles extraction of data from AI responses and generation of downloadable files
 */

export interface DownloadableFile {
  filename: string;
  content: string;
  type: 'csv' | 'json' | 'txt';
  size: number;
  description?: string;
}

/**
 * Detect file mentions in AI response
 */
export function detectFileMentions(text: string): Array<{ filename: string; description: string }> {
  const mentions: Array<{ filename: string; description: string }> = [];
  
  // Pattern 1: ✅ filename.ext - description
  const pattern1 = /✅\s+([a-zA-Z0-9_-]+\.[a-z]+)\s+-\s+(.+?)(?:\n|$)/g;
  let match;
  
  while ((match = pattern1.exec(text)) !== null) {
    mentions.push({
      filename: match[1],
      description: match[2].trim()
    });
  }
  
  // Pattern 2: **File:** `filename.ext` or **File name:** `filename.ext`
  const pattern2 = /\*\*File(?:\s+name)?:\*\*\s+`([a-zA-Z0-9_-]+\.[a-z]+)`/gi;
  while ((match = pattern2.exec(text)) !== null) {
    const filename = match[1];
    if (!mentions.find(m => m.filename === filename)) {
      mentions.push({
        filename,
        description: ''
      });
    }
  }
  
  // Pattern 3: File: sales_data.csv (without backticks)
  const pattern3 = /\*\*File(?:\s+name)?:\*\*\s+([a-zA-Z0-9_-]+\.[a-z]+)/gi;
  while ((match = pattern3.exec(text)) !== null) {
    const filename = match[1];
    if (!mentions.find(m => m.filename === filename)) {
      mentions.push({
        filename,
        description: ''
      });
    }
  }
  
  // Pattern 4: exported/saved/created/generated filename.ext
  const pattern4 = /(exported|saved|created|generated)\s+([a-zA-Z0-9_-]+\.[a-z]+)/gi;
  while ((match = pattern4.exec(text)) !== null) {
    const filename = match[2];
    if (!mentions.find(m => m.filename === filename)) {
      mentions.push({
        filename,
        description: ''
      });
    }
  }
  
  return mentions;
}

/**
 * Extract markdown tables from text
 */
export function extractMarkdownTables(text: string): string[] {
  const tables: string[] = [];
  const lines = text.split('\n');
  let currentTable: string[] = [];
  let inTable = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      inTable = true;
      currentTable.push(line);
    } else if (inTable && currentTable.length > 0) {
      // End of table
      tables.push(currentTable.join('\n'));
      currentTable = [];
      inTable = false;
    }
  }
  
  // Add last table if exists
  if (currentTable.length > 0) {
    tables.push(currentTable.join('\n'));
  }
  
  return tables;
}

/**
 * Convert markdown table to CSV
 */
export function markdownTableToCSV(markdown: string): string {
  const lines = markdown.split('\n');
  const csvLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    
    // Split by pipe and clean
    const cells = trimmed
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    // Skip separator lines (e.g., |---|---|)
    if (cells.every(cell => /^[-:]+$/.test(cell))) {
      continue;
    }
    
    // Escape and quote cells
    const escapedCells = cells.map(cell => {
      // Remove markdown formatting
      const cleaned = cell
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '')   // Remove italic
        .replace(/`/g, '')    // Remove code
        .trim();
      
      // Escape quotes and wrap in quotes
      return `"${cleaned.replace(/"/g, '""')}"`;
    });
    
    csvLines.push(escapedCells.join(','));
  }
  
  return csvLines.join('\n');
}

/**
 * Extract code blocks from text
 */
export function extractCodeBlocks(text: string): Array<{ language: string; content: string }> {
  const blocks: Array<{ language: string; content: string }> = [];
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      content: match[2].trim()
    });
  }
  
  return blocks;
}

/**
 * Generate downloadable files from AI response
 */
export function generateDownloadableFiles(text: string): DownloadableFile[] {
  const files: DownloadableFile[] = [];
  const mentions = detectFileMentions(text);
  
  // Extract markdown tables
  const tables = extractMarkdownTables(text);
  
  // Extract code blocks
  const codeBlocks = extractCodeBlocks(text);
  
  // Match tables with file mentions
  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i];
    const ext = mention.filename.split('.').pop()?.toLowerCase();
    
    let content = '';
    let type: 'csv' | 'json' | 'txt' = 'txt';
    
    // Try to find corresponding data
    if (ext === 'csv') {
      type = 'csv';
      
      // Try to find a table near this mention
      if (tables.length > i) {
        content = markdownTableToCSV(tables[i]);
      } else if (tables.length > 0) {
        // Use first available table
        content = markdownTableToCSV(tables[0]);
      } else {
        // Try to find CSV in code blocks
        const csvBlock = codeBlocks.find(b => 
          b.language === 'csv' || b.content.includes(',')
        );
        if (csvBlock) {
          content = csvBlock.content;
        }
      }
    } else if (ext === 'json') {
      type = 'json';
      
      // Try to find JSON in code blocks
      const jsonBlock = codeBlocks.find(b => 
        b.language === 'json' || (b.content.startsWith('{') || b.content.startsWith('['))
      );
      if (jsonBlock) {
        content = jsonBlock.content;
      }
    } else {
      type = 'txt';
      
      // Use first available code block
      if (codeBlocks.length > i) {
        content = codeBlocks[i].content;
      } else if (codeBlocks.length > 0) {
        content = codeBlocks[0].content;
      }
    }
    
    // Only add file if we have content
    if (content) {
      files.push({
        filename: mention.filename,
        content,
        type,
        size: new Blob([content]).size,
        description: mention.description
      });
    }
  }
  
  return files;
}

/**
 * Download a file
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get MIME type for file extension
 */
export function getMimeType(type: 'csv' | 'json' | 'txt'): string {
  const mimeTypes = {
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain'
  };
  return mimeTypes[type];
}
