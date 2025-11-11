# Phase 8: Official Tools Research

**Research Date:** 2025-11-11  
**Source:** https://platform.moonshot.ai/docs/guide/use-official-tools  
**Status:** 🔍 IN PROGRESS

---

## Overview

Moonshot AI provides **12 official tools** that can be freely integrated into applications. These tools are currently **free to use** (with potential rate limiting when capacity is reached).

---

## Official Tools List

| Tool Name | Tool Description | Status in Kimi Cyber |
|-----------|------------------|---------------------|
| `convert` | Unit conversion tool (length, mass, volume, temperature, area, time, energy, pressure, speed, currency) | ✅ Already Integrated |
| `web-search` | Real-time information and internet search tool (charged) | ✅ Already Integrated |
| `rethink` | Intelligent reasoning tool | ❌ NOT Integrated |
| `random-choice` | Random selection tool | ❌ NOT Integrated |
| `mew` | Random cat meowing and blessing tool | ❌ NOT Integrated |
| `memory` | Memory storage and retrieval system tool (persistent conversation history and user preferences) | ❌ NOT Integrated |
| `excel` | Excel and CSV file analysis tool | ✅ Already Integrated |
| `date` | Date and time processing tool | ✅ Already Integrated |
| `base64` | base64 encoding and decoding tool | ✅ Already Integrated |
| `fetch` | URL content extraction markdown formatting tool | ✅ Already Integrated |
| `quickjs` | QuickJS engine security execution JavaScript code tool | ✅ Already Integrated |
| `code_runner` | Python code execution tool | ✅ Already Integrated |

---

## Tools Already Integrated (8/12)

Kimi Cyber already has 8 of the 12 official tools integrated:

1. ✅ `convert` - Unit conversion
2. ✅ `web-search` - Web search (paid)
3. ✅ `excel` - Excel/CSV analysis
4. ✅ `date` - Date/time processing
5. ✅ `base64` - Base64 encoding/decoding
6. ✅ `fetch` - URL content extraction
7. ✅ `quickjs` - JavaScript execution
8. ✅ `code_runner` - Python code execution

---

## Missing Tools (4/12)

### High Priority Tools

#### 1. `memory` - Memory Storage and Retrieval System ⭐⭐⭐⭐⭐
**Priority:** HIGHEST  
**Value:** Extremely High

**Description:**
- Persistent storage of conversation history
- User preferences storage
- Cross-session memory
- Enables personalized experiences

**Use Cases:**
- Remember user preferences across sessions
- Store important facts from previous conversations
- Build long-term context
- Personalized AI assistant

**Implementation Complexity:** Medium-High
**User Value:** Very High

---

#### 2. `rethink` - Intelligent Reasoning Tool ⭐⭐⭐⭐
**Priority:** HIGH  
**Value:** High

**Description:**
- Intelligent reasoning capabilities
- Enhanced problem-solving
- Likely complements thinking models

**Use Cases:**
- Complex problem analysis
- Multi-step reasoning
- Decision support
- Strategic planning

**Implementation Complexity:** Medium
**User Value:** High (especially with thinking models)

---

### Low Priority Tools

#### 3. `random-choice` - Random Selection Tool ⭐⭐
**Priority:** LOW  
**Value:** Low

**Description:**
- Random selection from options
- Simple utility tool

**Use Cases:**
- Decision making when options are equal
- Random sampling
- Game mechanics

**Implementation Complexity:** Low
**User Value:** Low

---

#### 4. `mew` - Random Cat Meowing and Blessing Tool ⭐
**Priority:** VERY LOW  
**Value:** Entertainment Only

**Description:**
- Random cat meowing
- Blessing messages
- Fun/entertainment tool

**Use Cases:**
- Entertainment
- Easter egg feature
- User delight

**Implementation Complexity:** Very Low
**User Value:** Entertainment only

---

## Integration Architecture

### Current Implementation

Kimi Cyber uses a custom tool integration approach:

**File Structure:**
- `/src/lib/tools.ts` - Tool definitions
- `/src/lib/tool-executors.ts` - Tool execution logic
- `/src/lib/api-streaming.ts` - Tool call orchestration

**Current Tools:**
```typescript
const tools = [
  web_search,
  code_runner,
  quickjs,
  convert,
  fetch,
  excel,
  date,
  base64,
  // ... custom tools
];
```

### Official Tools Integration Method

According to Moonshot AI documentation, official tools use a **Formula API** approach:

**Formula URI Format:**
```
moonshot/{tool-name}:latest
```

**Examples:**
- `moonshot/memory:latest`
- `moonshot/rethink:latest`
- `moonshot/random-choice:latest`
- `moonshot/mew:latest`

**Integration Steps:**

1. **Get Tool Definition:**
```javascript
GET /formulas/{formula_uri}/tools
```

2. **Call Tool:**
```javascript
POST /formulas/{formula_uri}/fibers
{
  "name": function_name,
  "arguments": JSON.stringify(args)
}
```

3. **Get Result:**
```javascript
{
  "status": "succeeded",
  "context": {
    "output": "tool result"
  }
}
```

---

## Key Differences: Custom vs Official Tools

### Custom Tools (Current Implementation)
- Defined in `tools.ts`
- Executed locally in `tool-executors.ts`
- Full control over implementation
- No external API calls for execution
- Examples: web_search, code_runner, quickjs

### Official Tools (Formula API)
- Defined via Formula API
- Executed on Moonshot servers
- Managed by Moonshot AI
- External API calls required
- Examples: memory, rethink

---

## Implementation Plan for Missing Tools

### Phase 1: Memory Tool (Highest Priority)

**Why Memory is Critical:**
1. **Personalization** - Remember user preferences
2. **Context Continuity** - Maintain conversation context across sessions
3. **User Experience** - Users don't have to repeat information
4. **Competitive Advantage** - Most AI assistants lack persistent memory
5. **Synergy with Thinking Models** - Memory + reasoning = powerful combination

**Technical Requirements:**
1. Integrate Formula API client
2. Add memory tool definition
3. Implement memory storage UI
4. Add memory retrieval logic
5. Update chat history to use memory
6. Add memory management interface

**User Interface Needs:**
- Memory panel showing stored facts
- "Remember this" button
- Memory search/filter
- Memory edit/delete
- Memory export

---

### Phase 2: Rethink Tool (High Priority)

**Why Rethink is Valuable:**
1. **Enhanced Reasoning** - Complements thinking models
2. **Problem Solving** - Better analysis capabilities
3. **Quality Improvement** - Self-correction and refinement
4. **Unique Feature** - Not available in most AI tools

**Technical Requirements:**
1. Add rethink tool definition
2. Integrate with reasoning panel
3. Add UI indicator when rethink is used
4. Update export to include rethink steps

---

### Phase 3: Random-Choice (Optional)

**Low priority utility tool.**

**Use Cases:**
- Decision making
- Random sampling
- Simple games

---

### Phase 4: Mew (Optional)

**Very low priority entertainment tool.**

**Use Cases:**
- Easter egg
- User delight
- Fun feature

---

## Formula API Integration Code Structure

### 1. Create Formula Client

```typescript
// /src/lib/formula-api.ts

export class FormulaClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1';
    this.apiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
  }
  
  async getTools(formulaUri: string) {
    const response = await fetch(`${this.baseUrl}/formulas/${formulaUri}/tools`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    return response.json();
  }
  
  async callTool(formulaUri: string, functionName: string, args: any) {
    const response = await fetch(`${this.baseUrl}/formulas/${formulaUri}/fibers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: functionName,
        arguments: JSON.stringify(args)
      })
    });
    
    const fiber = await response.json();
    
    if (fiber.status === 'succeeded') {
      return fiber.context.output || fiber.context.encrypted_output;
    }
    
    throw new Error(fiber.error || 'Unknown error');
  }
}
```

### 2. Add Official Tools to Tool List

```typescript
// /src/lib/tools.ts

// Import Formula API client
import { FormulaClient } from './formula-api';

// Add official tools
export const officialTools = {
  memory: {
    type: 'function',
    function: {
      name: 'memory',
      description: 'Memory storage and retrieval system for persistent conversation history',
      parameters: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['store', 'retrieve', 'search'],
            description: 'Action to perform: store, retrieve, or search'
          },
          key: {
            type: 'string',
            description: 'Key for storage/retrieval'
          },
          value: {
            type: 'string',
            description: 'Value to store'
          },
          query: {
            type: 'string',
            description: 'Search query'
          }
        }
      }
    }
  },
  rethink: {
    type: 'function',
    function: {
      name: 'rethink',
      description: 'Intelligent reasoning tool for enhanced problem-solving',
      parameters: {
        type: 'object',
        required: ['problem'],
        properties: {
          problem: {
            type: 'string',
            description: 'Problem or question to analyze'
          },
          context: {
            type: 'string',
            description: 'Additional context for reasoning'
          }
        }
      }
    }
  }
};
```

### 3. Update Tool Executor

```typescript
// /src/lib/tool-executors.ts

import { FormulaClient } from './formula-api';

const formulaClient = new FormulaClient();

export async function executeTool(toolName: string, args: any): Promise<string> {
  // Check if it's an official Formula tool
  const officialTools = ['memory', 'rethink', 'random-choice', 'mew'];
  
  if (officialTools.includes(toolName)) {
    const formulaUri = `moonshot/${toolName}:latest`;
    return await formulaClient.callTool(formulaUri, toolName, args);
  }
  
  // Existing custom tool execution
  switch (toolName) {
    case 'web_search':
      return await executeWebSearch(args);
    // ... other tools
  }
}
```

---

## Memory Tool Deep Dive

### Memory Tool Capabilities

Based on the documentation, the memory tool supports:

1. **Store** - Save information persistently
2. **Retrieve** - Get stored information
3. **Search** - Find relevant memories

### Potential Memory Schema

```typescript
interface Memory {
  id: string;
  key: string;
  value: string;
  timestamp: number;
  category?: string;
  tags?: string[];
}
```

### UI Components Needed

#### 1. Memory Panel
```
┌─────────────────────────────────────────┐
│ 💾 AI Memory Storage          [+] [🔍] │
├─────────────────────────────────────────┤
│                                         │
│ 📌 User Preferences                     │
│   • Preferred export format: PDF       │
│   • Favorite topics: AI, Technology    │
│                                         │
│ 📚 Stored Facts                         │
│   • Russia's cleanest rivers research  │
│   • User works in data analysis        │
│                                         │
│ 🔖 Recent Memories (5)                  │
│   1. Query about Russian rivers        │
│   2. Interest in water quality data    │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. Memory Actions
- "Remember this" button in results
- Auto-save important findings
- Manual memory entry
- Memory search
- Memory export

---

## Rethink Tool Deep Dive

### Rethink Tool Purpose

The "rethink" tool appears to be an **intelligent reasoning enhancement** that:

1. Analyzes problems more deeply
2. Provides alternative perspectives
3. Self-corrects reasoning
4. Enhances decision quality

### Potential Use Cases

1. **Complex Problem Solving**
   - Multi-step analysis
   - Trade-off evaluation
   - Risk assessment

2. **Quality Assurance**
   - Double-check reasoning
   - Identify logical flaws
   - Improve answer quality

3. **Alternative Perspectives**
   - Consider different angles
   - Challenge assumptions
   - Explore edge cases

### Integration with Reasoning Panel

The rethink tool could be displayed in the **Reasoning Process panel**:

```
🧠 AI Reasoning Process

Initial Reasoning:
[First pass reasoning...]

🔄 Rethink Analysis:
[Deeper analysis, alternative perspectives...]

Final Conclusion:
[Refined answer based on rethinking...]
```

---

## Cost Considerations

### Free Tools
All official tools are currently **free** except:

### Paid Tools
- `web-search` - Currently charged (see Web Search Price)

### Rate Limiting
- When tool load reaches capacity, temporary rate limiting may apply
- Need to handle rate limit errors gracefully

---

## Next Steps

### Immediate Actions

1. ✅ Research official tools (this document)
2. ⏭️ Decide which tools to implement
3. ⏭️ Create Formula API client
4. ⏭️ Implement memory tool (highest priority)
5. ⏭️ Implement rethink tool (high priority)
6. ⏭️ Test integration
7. ⏭️ Update UI for new tools
8. ⏭️ Deploy and test

### Recommended Priority

**Phase 8A: Memory Tool** (Implement First)
- Highest user value
- Unique differentiator
- Enables personalization
- Synergy with existing features

**Phase 8B: Rethink Tool** (Implement Second)
- Complements thinking models
- Enhances reasoning quality
- Unique capability

**Phase 8C: Random-Choice & Mew** (Optional)
- Low priority
- Entertainment value only
- Can be added later if desired

---

## Questions to Resolve

1. **Memory Persistence:** How long does memory persist? Session-based or permanent?
2. **Memory Scope:** Is memory per-user or global?
3. **Memory Limits:** Are there storage limits for memory?
4. **Rethink Behavior:** What exactly does rethink do? Need more documentation.
5. **API Keys:** Do Formula tools use the same API key?
6. **Error Handling:** How to handle Formula API errors?
7. **Rate Limits:** What are the rate limits for free tools?

---

## Research Sources

1. **Primary:** https://platform.moonshot.ai/docs/guide/use-official-tools
2. **Code Example:** Python implementation provided in documentation
3. **Tool List:** 12 official tools identified
4. **Integration Method:** Formula API with URIs

---

**Status:** ✅ Research Complete  
**Next Phase:** Decision & Implementation Planning  
**Recommendation:** Implement Memory Tool (Phase 8A) first, then Rethink Tool (Phase 8B)


---

## Additional Findings from kimi-k2-thinking Documentation

**Source:** https://platform.moonshot.ai/docs/guide/use-kimi-k2-thinking-model

### Key Points

1. **Multi-Step Tool Calls**
   - `kimi-k2-thinking` is designed for deep reasoning across multiple tool calls
   - Can tackle highly complex tasks
   - Example: "Daily News Report Generation" using `date` + `web_search` tools

2. **Official Tools Integration Pattern**
   ```python
   # Load tool definitions
   tools = client.get_tools(formula_uri)
   
   # Call tool
   result = client.call_tool(formula_uri, function_name, args)
   ```

3. **Formula API Endpoints**
   - `GET /formulas/{formula_uri}/tools` - Get tool definitions
   - `POST /formulas/{formula_uri}/fibers` - Execute tool
   
4. **Tool Response Format**
   ```json
   {
     "status": "succeeded",
     "context": {
       "output": "tool result",
       "encrypted_output": "encrypted result"
     }
   }
   ```

5. **Reasoning Content Preservation**
   - Must include entire `reasoning_content` in context
   - Model decides which parts to forward for further reasoning
   - Reasoning is preserved across tool calls

### Example Flow

```
User Request → Model Reasoning → Tool Call 1 (date) → 
Model Reasoning → Tool Call 2 (web_search) → 
Model Reasoning → Final Answer
```

Each step includes `reasoning_content` showing the AI's thought process.

---

## Implementation Decision

### Recommendation: Focus on Memory Tool Only

After analyzing the documentation and considering implementation complexity vs. user value:

**IMPLEMENT:**
- ✅ **Memory Tool** - High value, unique differentiator, enables personalization

**DO NOT IMPLEMENT (for now):**
- ❌ **Rethink Tool** - Unclear what it does exactly, may be redundant with thinking models
- ❌ **Random-Choice** - Low value utility
- ❌ **Mew** - Entertainment only

### Rationale

1. **Memory Tool is Highest Priority**
   - Persistent storage of conversation history
   - User preferences across sessions
   - Unique competitive advantage
   - Clear use cases and value

2. **Rethink Tool is Unclear**
   - Documentation doesn't explain what it does
   - Thinking models already provide deep reasoning
   - May be redundant with `reasoning_content`
   - Need more research before implementing

3. **Other Tools are Low Priority**
   - Random-choice: Simple utility, low user value
   - Mew: Entertainment only, not essential

### Revised Implementation Plan

**Phase 9: Implement Memory Tool**
1. Create Formula API client
2. Add memory tool definition
3. Implement memory storage UI
4. Add memory retrieval logic
5. Update chat history integration
6. Test thoroughly
7. Deploy

**Future Phases (Optional):**
- Research rethink tool more thoroughly
- Consider random-choice if user requests
- Add mew as easter egg if desired

---

## Memory Tool Implementation Details

### API Integration

```typescript
// Formula API Client
class FormulaClient {
  async getTools(formulaUri: string) {
    const response = await fetch(
      `${this.baseUrl}/formulas/${formulaUri}/tools`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      }
    );
    return response.json();
  }
  
  async callTool(formulaUri: string, functionName: string, args: any) {
    const response = await fetch(
      `${this.baseUrl}/formulas/${formulaUri}/fibers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: functionName,
          arguments: JSON.stringify(args)
        })
      }
    );
    
    const fiber = await response.json();
    
    if (fiber.status === 'succeeded') {
      return fiber.context.output || fiber.context.encrypted_output;
    }
    
    throw new Error(fiber.error || 'Unknown error');
  }
}
```

### Memory Tool Usage

```typescript
// Store memory
await formulaClient.callTool(
  'moonshot/memory:latest',
  'memory',
  {
    action: 'store',
    key: 'user_preference_export_format',
    value: 'PDF'
  }
);

// Retrieve memory
const result = await formulaClient.callTool(
  'moonshot/memory:latest',
  'memory',
  {
    action: 'retrieve',
    key: 'user_preference_export_format'
  }
);

// Search memory
const results = await formulaClient.callTool(
  'moonshot/memory:latest',
  'memory',
  {
    action: 'search',
    query: 'export format'
  }
);
```

---

## Next Steps

1. ✅ Complete Phase 8 research
2. ⏭️ Create Phase 9 implementation plan for Memory Tool
3. ⏭️ Implement Formula API client
4. ⏭️ Add memory tool to Kimi Cyber
5. ⏭️ Create memory UI components
6. ⏭️ Test memory persistence
7. ⏭️ Deploy and validate

---

**Status:** ✅ Phase 8 Research Complete  
**Decision:** Implement Memory Tool in Phase 9  
**Skip:** Rethink, Random-Choice, Mew (low priority)
