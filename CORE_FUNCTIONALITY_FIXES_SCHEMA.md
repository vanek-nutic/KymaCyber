# Core Functionality Fixes - Visual Schema

## 📋 Overview

Three critical fixes needed:
1. **Save As Dialog** - Show proper save dialog with file extension
2. **Remove Non-functional Export Buttons** - Clean up Results panel
3. **AI Clarification Popup** - Interactive dialog for AI questions

---

## 🔧 Fix #1: Save As Button (Code Blocks)

### Current Behavior
```
User clicks "💾 Save As" → File downloads instantly as "code_xxx.txt"
                          ❌ No save dialog
                          ❌ Wrong extension
```

### Expected Behavior
```
User clicks "💾 Save As" → Browser "Save As" dialog appears
                          → User chooses location & filename
                          → File saves with correct extension
                          ✅ .html, .js, .css, .py, etc.
```

### Technical Implementation

**Current Code (MarkdownRenderer.tsx):**
```typescript
// Creates blob and downloads immediately
const blob = new Blob([codeText], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename; // ← Downloads instantly
a.click();
```

**Fixed Code:**
```typescript
// Use proper MIME type and let browser handle save dialog
const mimeType = getMimeType(language); // e.g., 'text/html', 'text/javascript'
const blob = new Blob([codeText], { type: mimeType });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename; // Browser will show save dialog
a.click();
```

**Extension Mapping:**
- HTML → `.html` (text/html)
- JavaScript → `.js` (text/javascript)
- Python → `.py` (text/x-python)
- CSS → `.css` (text/css)
- JSON → `.json` (application/json)
- etc.

---

## 🗑️ Fix #2: Remove Non-functional Export Buttons

### Current UI (Results Panel)
```
┌─────────────────────────────────────────────┐
│ 📄 Results                                  │
│ [📋 Copy] [📥 PDF] [📝 MD] [📄 TXT]       │ ← Remove these
└─────────────────────────────────────────────┘
```

### New UI (Cleaned)
```
┌─────────────────────────────────────────────┐
│ 📄 Results                                  │
│ (No export buttons - removed)               │
└─────────────────────────────────────────────┘
```

### Reasoning
- These buttons are not functional
- Code blocks have their own Save As
- Cleaner, less confusing interface
- Users can still copy text manually

### Code Changes
**File:** `/src/App.tsx`

**Remove this section:**
```tsx
{result && (
  <div className="export-buttons">
    <button className="export-btn copy-btn">📋 Copy</button>
    <button className="export-btn pdf-btn">📥 PDF</button>
    <button className="export-btn md-btn">📝 MD</button>
    <button className="export-btn txt-btn">📄 TXT</button>
  </div>
)}
```

---

## 💬 Fix #3: AI Clarification Popup

### Use Case
```
AI is reasoning → Needs clarification → Shows popup → User responds → AI continues
```

### Visual Design

#### Popup Appearance
```
┌─────────────────────────────────────────────────────┐
│  🤖 AI Needs Your Input                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  The AI has a question during the reasoning         │
│  process:                                            │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ "Which dataset would you like me to        │   │
│  │  analyze first: sales_2023.csv or          │   │
│  │  customers_2023.csv?"                      │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  Your response:                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ [Text input box]                            │   │
│  │                                              │   │
│  │                                              │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  [Cancel]                    [Send Response] ←──── │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Component Structure

**New Component:** `AIClarificationDialog.tsx`

```typescript
interface AIClarificationDialogProps {
  isOpen: boolean;
  question: string;
  onResponse: (answer: string) => void;
  onCancel: () => void;
}
```

### Workflow Diagram

```
┌─────────────┐
│ AI Reasoning│
│   Process   │
└──────┬──────┘
       │
       ├─ No questions → Continue normally
       │
       └─ Has question
          │
          ▼
   ┌──────────────┐
   │ Pause Stream │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Show Popup Dialog│
   │ with AI question │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ User Types Answer│
   └──────┬───────────┘
          │
          ├─ Cancel → Resume with no answer
          │
          └─ Send Response
             │
             ▼
      ┌─────────────┐
      │ Send to API │
      └─────┬───────┘
            │
            ▼
      ┌─────────────┐
      │ AI Continues│
      │  Reasoning  │
      └─────────────┘
```

### State Management

```typescript
// In App.tsx
const [clarificationDialog, setClarificationDialog] = useState({
  isOpen: false,
  question: '',
  onResponse: (answer: string) => {}
});

// During streaming
if (update.needsClarification) {
  // Pause stream
  setClarificationDialog({
    isOpen: true,
    question: update.clarificationQuestion,
    onResponse: (answer) => {
      // Resume stream with answer
      continueStreamingWithAnswer(answer);
    }
  });
}
```

### API Integration

**Current API Response:**
```json
{
  "content": "...",
  "toolCall": {...},
  "metrics": {...}
}
```

**Enhanced API Response (if clarification needed):**
```json
{
  "needsClarification": true,
  "clarificationQuestion": "Which dataset should I analyze first?",
  "pauseStreaming": true
}
```

**Resume Endpoint:**
```typescript
// Continue with user's answer
await continueQuery(sessionId, userAnswer);
```

---

## 🎨 Visual Comparison

### Before Fixes
```
┌─────────────────────────────────────────────┐
│ Code Block                                   │
│ [📋 Copy] [💾 Save As] ← Downloads as .txt  │
├─────────────────────────────────────────────┤
│ console.log("Hello");                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Results                                  │
│ [📋 Copy] [📥 PDF] [📝 MD] [📄 TXT] ← Broken│
├─────────────────────────────────────────────┤
│ Result content here...                       │
└─────────────────────────────────────────────┘

AI needs input → ❌ No way to respond
```

### After Fixes
```
┌─────────────────────────────────────────────┐
│ Code Block                                   │
│ [📋 Copy] [💾 Save As] ← Shows save dialog  │
├─────────────────────────────────────────────┤
│ console.log("Hello");                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📄 Results                                  │
│ (Clean - no broken buttons)                 │
├─────────────────────────────────────────────┤
│ Result content here...                       │
└─────────────────────────────────────────────┘

AI needs input → ✅ Popup dialog appears
                → User responds
                → AI continues
```

---

## 📝 Implementation Checklist

### Fix #1: Save As Dialog
- [ ] Add MIME type mapping function
- [ ] Update `saveAsFile` in MarkdownRenderer.tsx
- [ ] Test with different file types (HTML, JS, CSS, Python)
- [ ] Verify browser save dialog appears
- [ ] Verify correct file extension

### Fix #2: Remove Export Buttons
- [ ] Remove export buttons from Results panel
- [ ] Remove related CSS
- [ ] Clean up unused imports
- [ ] Test UI looks clean

### Fix #3: AI Clarification Popup
- [ ] Create `AIClarificationDialog.tsx` component
- [ ] Create `AIClarificationDialog.css` styles
- [ ] Add state management in App.tsx
- [ ] Update API streaming handler
- [ ] Add pause/resume logic
- [ ] Test with mock clarification
- [ ] Integrate with real API (if supported)

---

## 🔄 API Considerations

### Current API Support
Need to check if Kimi API supports:
- Pausing streaming
- Sending clarification responses
- Resuming with context

### Fallback Strategy
If API doesn't support interactive clarification:
1. Show dialog with AI's question
2. User responds
3. Restart query with answer appended to original query
4. Show in UI: "AI asked: [question], You answered: [answer]"

---

## 🎯 Priority Order

1. **Fix #2 (Remove buttons)** - Easiest, immediate cleanup
2. **Fix #1 (Save As)** - Medium difficulty, high impact
3. **Fix #3 (Clarification)** - Complex, requires API investigation

---

## 🚀 Expected Outcomes

### User Experience
- ✅ Save As shows proper dialog with correct extension
- ✅ Clean Results panel without broken buttons
- ✅ Interactive AI conversations with clarifications
- ✅ Professional, polished interface
- ✅ All features work as expected

### Technical Quality
- ✅ Proper MIME types for downloads
- ✅ Clean code without dead buttons
- ✅ Reusable clarification dialog component
- ✅ Proper state management
- ✅ Error handling for edge cases

---

**Ready to implement?** Let me know if this schema looks good, and I'll proceed with the fixes!
