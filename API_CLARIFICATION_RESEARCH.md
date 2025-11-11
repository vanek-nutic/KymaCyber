# API Clarification Support Research

## Investigation Results

**Date:** November 11, 2025  
**API:** Moonshot AI / Kimi K2  
**Documentation Reviewed:** Streaming API, Tool Calls, Multi-turn Chat

---

## ❌ Finding: No Native Clarification Support

After reviewing the Moonshot AI API documentation and current implementation, **the API does NOT natively support clarification requests** during streaming.

### What the API Supports:
✅ **Streaming output** (SSE format)  
✅ **Tool calls** (function calling)  
✅ **Multi-turn chat** (conversation history)  
✅ **Reasoning content** (thinking models)  
✅ **Web search tool**  
✅ **File-based Q&A**

### What the API Does NOT Support:
❌ **Pausing streams for user input**  
❌ **Clarification request events**  
❌ **Interactive prompts during reasoning**  
❌ **Resume stream with user answer**

---

## 🔄 Alternative Implementation Strategy

Since the API doesn't support native clarification, we'll implement a **client-side fallback approach**:

### Approach: "Simulated Clarification"

1. **Detect Need for Clarification** (Client-side logic)
   - Monitor AI responses for clarification patterns
   - Keywords: "Which", "Please specify", "Would you like", "Choose", etc.
   - Or: Manual trigger by user

2. **Pause Current Query**
   - Stop displaying results
   - Show clarification dialog

3. **Collect User Response**
   - User provides answer in dialog

4. **Restart Query with Context**
   - Append clarification to conversation history
   - Format: "Previous question: [original query]\nClarification needed: [AI question]\nUser answer: [user response]"
   - Submit as new query

### Example Flow

**Original Query:**
```
"Analyze my sales data"
```

**AI Response (incomplete):**
```
"I found two files: sales_2023.csv and sales_2024.csv. 
Which one would you like me to analyze first?"
```

**Client detects clarification pattern** → Show dialog

**User responds:**
```
"Analyze sales_2024.csv"
```

**New Query (automatically constructed):**
```
"Analyze my sales data

[Previous context]
You asked: Which file should I analyze first?
My answer: Analyze sales_2024.csv

Please continue with the analysis."
```

---

## 📊 Implementation Details

### Detection Methods

#### Method 1: Pattern Matching (Simple)
```typescript
const clarificationPatterns = [
  /which (one|file|option|dataset)/i,
  /please (specify|clarify|choose|select)/i,
  /would you like (me to|to)/i,
  /do you want (me to|to)/i,
  /should i (analyze|use|process)/i,
  /\?$/  // Ends with question mark
];

function detectsClarificationNeed(text: string): boolean {
  return clarificationPatterns.some(pattern => pattern.test(text));
}
```

#### Method 2: Manual Trigger (Recommended)
```typescript
// Add "Ask AI a Question" button
// User clicks when they want to provide clarification
// More reliable than pattern matching
```

#### Method 3: Streaming Interruption
```typescript
// Allow user to interrupt stream at any time
// Provide input
// Resume with context
```

---

## 🎯 Recommended Implementation

### Phase 1: Manual Clarification (Simple, Reliable)

**Add UI Button:**
```
[🤖 Ask AI a Question]
```

**When clicked:**
1. Pause current stream (if active)
2. Show clarification dialog
3. User types question/clarification
4. Append to conversation history
5. Continue or restart query

**Benefits:**
- ✅ Simple to implement
- ✅ No pattern matching needed
- ✅ User has full control
- ✅ Works with any query

### Phase 2: Auto-Detection (Advanced, Optional)

**Monitor AI responses for:**
- Questions ending with "?"
- Multiple options presented
- Uncertainty phrases

**Show dialog automatically when detected**

**Benefits:**
- ✅ More seamless UX
- ✅ Proactive assistance
- ⚠️ Risk of false positives

---

## 💻 Code Structure

### Component: AIClarificationDialog

**Match existing tool call modal style:**
- Dark background with green accents
- Code-style formatting
- SUCCESS/ERROR badges
- Cyber theme

**Props:**
```typescript
interface AIClarificationDialogProps {
  isOpen: boolean;
  context?: string;        // Optional: AI's question
  placeholder?: string;
  onSubmit: (input: string) => void;
  onCancel: () => void;
}
```

### Integration with App.tsx

```typescript
// State
const [clarificationDialog, setClarificationDialog] = useState({
  isOpen: false,
  context: ''
});

// Handler
const handleClarificationSubmit = (input: string) => {
  // Append to conversation history
  const updatedQuery = `${query}\n\n[Clarification]\n${input}`;
  
  // Restart query with context
  handleSubmit(updatedQuery);
  
  // Close dialog
  setClarificationDialog({ isOpen: false, context: '' });
};

// Manual trigger
const handleAskAI = () => {
  setClarificationDialog({
    isOpen: true,
    context: result // Current AI response
  });
};
```

---

## 🎨 UI Design (Match Tool Call Modal)

### Existing Tool Call Modal Style:
```
┌─────────────────────────────────────────┐
│ code_runner                    SUCCESS  │
├─────────────────────────────────────────┤
│ Arguments:                               │
│ {"code": "import pandas..."}            │
│                                          │
│ Result:                                  │
│ {"error":"Code execution failed"...}    │
└─────────────────────────────────────────┘
```

### New Clarification Dialog (Same Style):
```
┌─────────────────────────────────────────┐
│ 🤖 AI Question                          │
├─────────────────────────────────────────┤
│ Context:                                 │
│ "I found two files. Which should I      │
│  analyze first?"                         │
│                                          │
│ Your Response:                           │
│ ┌─────────────────────────────────────┐ │
│ │ [Text input]                         │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Cancel]              [Send Response]   │
└─────────────────────────────────────────┘
```

**CSS Classes to Reuse:**
- `.tool-call-item` (container)
- `.tool-name` (header)
- `.tool-status` (badge)
- `.tool-result` (content area)
- Cyber theme colors and borders

---

## ✅ Implementation Plan

### Step 1: Create Component
- [x] Research API capabilities
- [ ] Create `AIClarificationDialog.tsx`
- [ ] Match existing modal styling
- [ ] Add input validation

### Step 2: Add Manual Trigger
- [ ] Add "Ask AI" button to UI
- [ ] Connect to dialog
- [ ] Test basic flow

### Step 3: Conversation Context
- [ ] Append clarification to history
- [ ] Format properly for AI
- [ ] Test with real queries

### Step 4: Optional Auto-Detection
- [ ] Implement pattern matching
- [ ] Test with various responses
- [ ] Add toggle to enable/disable

---

## 🎯 Conclusion

**Recommendation:** Implement **Manual Clarification** (Phase 1) first.

**Rationale:**
- ✅ Simple and reliable
- ✅ No API limitations
- ✅ User has full control
- ✅ Can add auto-detection later

**Next Steps:**
1. Create clarification dialog component
2. Match existing tool call modal style
3. Add manual trigger button
4. Test with conversation flow
5. Deploy and gather feedback

---

**Status:** Ready to implement Phase 1 (Manual Clarification)
