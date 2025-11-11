# Phase 9: Memory Tool Implementation Plan

**Date:** 2025-11-11  
**Goal:** Integrate Moonshot AI's Memory Tool for persistent conversation history and user preferences  
**Priority:** HIGH - Unique competitive advantage

---

## Overview

The Memory Tool enables Kimi Cyber to:
- Remember user preferences across sessions
- Store important facts from conversations
- Build long-term context
- Provide personalized experiences

---

## Implementation Steps

### Step 1: Create Formula API Client

**File:** `/src/lib/formula-api.ts`

**Purpose:** Handle communication with Moonshot Formula API

**Implementation:**
```typescript
export class FormulaClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1';
    this.apiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
  }
  
  async getTools(formulaUri: string) {
    const response = await fetch(
      `${this.baseUrl}/formulas/${formulaUri}/tools`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get tools: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.tools || [];
  }
  
  async callTool(formulaUri: string, functionName: string, args: any): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/formulas/${formulaUri}/fibers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: functionName,
          arguments: JSON.stringify(args)
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to call tool: ${response.statusText}`);
    }
    
    const fiber = await response.json();
    
    if (fiber.status === 'succeeded') {
      return fiber.context.output || fiber.context.encrypted_output || '';
    }
    
    if (fiber.error) {
      throw new Error(fiber.error);
    }
    
    if (fiber.context?.error) {
      throw new Error(fiber.context.error);
    }
    
    throw new Error('Unknown error calling tool');
  }
}

// Export singleton instance
export const formulaClient = new FormulaClient();
```

---

### Step 2: Add Memory Tool Definition

**File:** `/src/lib/tools.ts`

**Purpose:** Define memory tool for AI model

**Implementation:**
```typescript
export const memoryTool = {
  type: 'function',
  function: {
    name: 'memory',
    description: 'Memory storage and retrieval system for persistent conversation history and user preferences. Use this to remember important information across sessions.',
    parameters: {
      type: 'object',
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['store', 'retrieve', 'search'],
          description: 'Action to perform: store (save information), retrieve (get specific information), or search (find relevant memories)'
        },
        key: {
          type: 'string',
          description: 'Key for storage/retrieval (required for store and retrieve actions)'
        },
        value: {
          type: 'string',
          description: 'Value to store (required for store action)'
        },
        query: {
          type: 'string',
          description: 'Search query (required for search action)'
        }
      }
    }
  }
};

// Add to tools array
export const tools = [
  web_search,
  code_runner,
  quickjs,
  convert,
  fetch,
  excel,
  date,
  base64,
  memoryTool, // NEW
  // ... other tools
];
```

---

### Step 3: Update Tool Executor

**File:** `/src/lib/tool-executors.ts`

**Purpose:** Execute memory tool calls via Formula API

**Implementation:**
```typescript
import { formulaClient } from './formula-api';

export async function executeTool(toolName: string, args: any): Promise<string> {
  try {
    // Handle memory tool via Formula API
    if (toolName === 'memory') {
      return await executeMemoryTool(args);
    }
    
    // Existing tool execution
    switch (toolName) {
      case 'web_search':
        return await executeWebSearch(args);
      // ... other tools
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

async function executeMemoryTool(args: any): Promise<string> {
  const { action, key, value, query } = args;
  
  // Validate arguments
  if (!action) {
    throw new Error('Memory tool requires action parameter');
  }
  
  if (action === 'store' && (!key || !value)) {
    throw new Error('Memory store requires key and value parameters');
  }
  
  if (action === 'retrieve' && !key) {
    throw new Error('Memory retrieve requires key parameter');
  }
  
  if (action === 'search' && !query) {
    throw new Error('Memory search requires query parameter');
  }
  
  // Call Formula API
  const result = await formulaClient.callTool(
    'moonshot/memory:latest',
    'memory',
    args
  );
  
  return result;
}
```

---

### Step 4: Create Memory Panel Component

**File:** `/src/components/MemoryPanel.tsx`

**Purpose:** Display and manage stored memories

**Implementation:**
```typescript
import React, { useState, useEffect } from 'react';
import './MemoryPanel.css';

interface Memory {
  key: string;
  value: string;
  timestamp: number;
}

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);
  
  const loadMemories = async () => {
    try {
      // Load memories from localStorage (cached)
      const cached = localStorage.getItem('kimi_memories');
      if (cached) {
        setMemories(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  };
  
  const saveMemory = async () => {
    if (!newKey || !newValue) return;
    
    try {
      // Save via Formula API
      await formulaClient.callTool(
        'moonshot/memory:latest',
        'memory',
        {
          action: 'store',
          key: newKey,
          value: newValue
        }
      );
      
      // Update local cache
      const memory: Memory = {
        key: newKey,
        value: newValue,
        timestamp: Date.now()
      };
      
      const updated = [...memories, memory];
      setMemories(updated);
      localStorage.setItem('kimi_memories', JSON.stringify(updated));
      
      // Clear form
      setNewKey('');
      setNewValue('');
      
      alert('Memory saved successfully!');
    } catch (error) {
      console.error('Error saving memory:', error);
      alert('Failed to save memory');
    }
  };
  
  const deleteMemory = (key: string) => {
    const updated = memories.filter(m => m.key !== key);
    setMemories(updated);
    localStorage.setItem('kimi_memories', JSON.stringify(updated));
  };
  
  const filteredMemories = memories.filter(m =>
    m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.value.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (!isOpen) return null;
  
  return (
    <div className="memory-panel-overlay">
      <div className="memory-panel">
        <div className="memory-panel-header">
          <h2>💾 AI Memory Storage</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="memory-panel-content">
          {/* Add New Memory */}
          <div className="memory-form">
            <h3>Add New Memory</h3>
            <input
              type="text"
              placeholder="Key (e.g., user_name)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <textarea
              placeholder="Value (e.g., John Smith)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={3}
            />
            <button onClick={saveMemory} className="save-button">
              💾 Save Memory
            </button>
          </div>
          
          {/* Search Memories */}
          <div className="memory-search">
            <input
              type="text"
              placeholder="🔍 Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Memory List */}
          <div className="memory-list">
            <h3>Stored Memories ({filteredMemories.length})</h3>
            {filteredMemories.length === 0 ? (
              <p className="no-memories">No memories stored yet</p>
            ) : (
              filteredMemories.map((memory) => (
                <div key={memory.key} className="memory-item">
                  <div className="memory-key">🔑 {memory.key}</div>
                  <div className="memory-value">{memory.value}</div>
                  <div className="memory-actions">
                    <span className="memory-timestamp">
                      {new Date(memory.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteMemory(memory.key)}
                      className="delete-button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### Step 5: Create Memory Panel CSS

**File:** `/src/components/MemoryPanel.css`

**Purpose:** Style memory panel with cyber theme

**Implementation:**
```css
.memory-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.memory-panel {
  background: #1a1a2e;
  border: 2px solid #00ff88;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
}

.memory-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #00ff88;
}

.memory-panel-header h2 {
  margin: 0;
  color: #00ff88;
  font-size: 24px;
}

.close-button {
  background: none;
  border: 2px solid #00ff88;
  color: #00ff88;
  font-size: 24px;
  cursor: pointer;
  padding: 5px 15px;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-button:hover {
  background: #00ff88;
  color: #1a1a2e;
}

.memory-panel-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.memory-form {
  background: #16213e;
  border: 1px solid #00ff88;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.memory-form h3 {
  margin-top: 0;
  color: #00ff88;
}

.memory-form input,
.memory-form textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background: #0f1419;
  border: 1px solid #00ff88;
  border-radius: 4px;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.save-button {
  background: #00ff88;
  color: #1a1a2e;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.save-button:hover {
  background: #00cc6f;
  transform: scale(1.05);
}

.memory-search {
  margin-bottom: 20px;
}

.memory-search input {
  width: 100%;
  padding: 10px;
  background: #16213e;
  border: 1px solid #00ff88;
  border-radius: 4px;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.memory-list h3 {
  color: #00ff88;
  margin-bottom: 15px;
}

.no-memories {
  color: #888;
  text-align: center;
  padding: 20px;
}

.memory-item {
  background: #16213e;
  border: 1px solid #00ff88;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.memory-item:hover {
  border-color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.memory-key {
  color: #00ff88;
  font-weight: bold;
  margin-bottom: 5px;
}

.memory-value {
  color: #ffffff;
  margin-bottom: 10px;
  word-wrap: break-word;
}

.memory-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memory-timestamp {
  color: #888;
  font-size: 12px;
}

.delete-button {
  background: #ff4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-button:hover {
  background: #cc0000;
}
```

---

### Step 6: Integrate Memory Panel into App

**File:** `/src/App.tsx`

**Purpose:** Add memory panel button and state management

**Implementation:**
```typescript
import { MemoryPanel } from './components/MemoryPanel';

function App() {
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  
  // ... existing code
  
  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <h1>⚡ Kimi Cyber</h1>
        <p>AI Extended Thinking with Multi-Tool Orchestration</p>
      </header>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Input Section */}
        <div className="input-section">
          {/* ... existing input fields ... */}
          
          {/* Add Memory Button */}
          <button
            onClick={() => setIsMemoryPanelOpen(true)}
            className="memory-button"
            title="Open Memory Storage"
          >
            💾 Memory
          </button>
        </div>
        
        {/* ... rest of app ... */}
      </div>
      
      {/* Memory Panel */}
      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />
    </div>
  );
}
```

---

### Step 7: Add Memory Button Styling

**File:** `/src/App.css`

**Purpose:** Style memory button

**Implementation:**
```css
.memory-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid #00ff88;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  margin-left: 10px;
}

.memory-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
}
```

---

### Step 8: Auto-Save Important Information

**File:** `/src/lib/memory-auto-save.ts`

**Purpose:** Automatically save important information from conversations

**Implementation:**
```typescript
import { formulaClient } from './formula-api';

export async function autoSaveMemory(key: string, value: string) {
  try {
    await formulaClient.callTool(
      'moonshot/memory:latest',
      'memory',
      {
        action: 'store',
        key,
        value
      }
    );
    
    // Update local cache
    const cached = localStorage.getItem('kimi_memories');
    const memories = cached ? JSON.parse(cached) : [];
    
    memories.push({
      key,
      value,
      timestamp: Date.now()
    });
    
    localStorage.setItem('kimi_memories', JSON.stringify(memories));
    
    return true;
  } catch (error) {
    console.error('Error auto-saving memory:', error);
    return false;
  }
}

// Extract important information from AI responses
export function extractImportantInfo(response: string): Array<{key: string, value: string}> {
  const important: Array<{key: string, value: string}> = [];
  
  // Example: Extract user preferences
  if (response.includes('prefer') || response.includes('like')) {
    // Parse and extract preferences
    // This is a simple example - could be more sophisticated
  }
  
  return important;
}
```

---

## Testing Plan

### Unit Tests

1. **Formula API Client**
   - Test getTools() with valid URI
   - Test callTool() with valid parameters
   - Test error handling

2. **Memory Tool Executor**
   - Test store action
   - Test retrieve action
   - Test search action
   - Test error cases

3. **Memory Panel Component**
   - Test rendering
   - Test add memory
   - Test delete memory
   - Test search functionality

### Integration Tests

1. **End-to-End Memory Flow**
   - User saves memory via panel
   - AI retrieves memory in conversation
   - Memory persists across sessions

2. **Tool Call Integration**
   - AI decides to use memory tool
   - Memory tool executes successfully
   - Result returned to AI

### Manual Tests

1. **UI/UX Testing**
   - Open memory panel
   - Add new memory
   - Search memories
   - Delete memory
   - Close panel

2. **Conversation Testing**
   - Ask AI to remember something
   - Start new session
   - Ask AI to recall information
   - Verify memory works

---

## Success Criteria

✅ Formula API client works correctly  
✅ Memory tool integrated into tool list  
✅ Memory tool executor handles all actions  
✅ Memory panel displays and functions properly  
✅ Memories persist across sessions  
✅ AI can store and retrieve memories  
✅ UI is intuitive and cyber-themed  
✅ No errors in console  
✅ Build succeeds  
✅ Deployed to production  

---

## Timeline

**Estimated Time:** 2-3 hours

1. Create Formula API client (30 min)
2. Add memory tool definition (15 min)
3. Update tool executor (30 min)
4. Create memory panel component (45 min)
5. Integrate into app (15 min)
6. Testing (30 min)
7. Bug fixes and polish (15 min)
8. Deploy (10 min)

---

## Potential Issues & Solutions

### Issue 1: Formula API Authentication
**Problem:** API key not working  
**Solution:** Verify VITE_MOONSHOT_API_KEY is set correctly

### Issue 2: Memory Persistence
**Problem:** Memories not persisting  
**Solution:** Use localStorage as cache, Formula API as source of truth

### Issue 3: Rate Limiting
**Problem:** Too many memory calls  
**Solution:** Implement caching and batch operations

### Issue 4: Memory Scope
**Problem:** Unclear if memory is per-user or global  
**Solution:** Test and document behavior

---

## Future Enhancements

1. **Memory Categories**
   - User preferences
   - Facts
   - Conversations
   - Tasks

2. **Memory Search**
   - Full-text search
   - Tag-based filtering
   - Date range filtering

3. **Memory Export**
   - Export all memories as JSON
   - Import memories from file

4. **Memory Analytics**
   - Most accessed memories
   - Memory usage statistics
   - Memory growth over time

5. **Smart Memory Suggestions**
   - AI suggests what to remember
   - Auto-categorization
   - Duplicate detection

---

**Status:** 📝 Plan Complete - Ready for Implementation  
**Next:** Begin Step 1 - Create Formula API Client
