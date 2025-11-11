# Conversation Continuity & Code Save Investigation

Date: November 11, 2025

## Issues Reported

### Issue 1: Conversation Context Lost
**Problem:** When AI asks a question and user replies, clicking Submit starts a NEW query instead of continuing the conversation.

**User Experience:**
1. User asks: "Analyze my data"
2. AI responds: "I need more information. What columns should I focus on?"
3. User types: "Focus on sales and profit"
4. User clicks Submit
5. **BUG:** System treats this as a new query, loses previous context

**Expected Behavior:**
- System should maintain conversation history
- New query should include previous Q&A as context
- AI should understand it's a follow-up response

### Issue 2: No "Save As" for Code Blocks
**Problem:** AI provides HTML/JS/CSS code with copy button, but no way to save as a file.

**Current Behavior:**
- Code blocks have "Copy" button
- User must manually create file and paste

**Desired Behavior:**
- Add "Save As" button next to Copy
- One-click download as .html, .js, .css, etc.
- Automatic file extension detection

---

## Investigation Findings

### Issue 1: Conversation Context

**Current Implementation:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  // Reset state - THIS CLEARS EVERYTHING!
  setReasoningContent('');
  setToolCalls([]);
  setResult('');  // ← Previous result is cleared!
  // ...
  
  // API call with ONLY current query
  await queryKimiK2Streaming(query, selectedModel, _modelParams, filesForAPI, ...);
}
```

**Problem:** No conversation history is maintained or sent to API.

**Root Cause:**
1. Each submit clears previous results
2. API is called with only the current query
3. No message history array
4. AI has no context of previous exchanges

**Solution Needed:**
1. Maintain conversation history array
2. Include previous messages in API calls
3. Display conversation thread in UI
4. Don't clear previous results on new query

---

### Issue 2: Code Block Save Functionality

**Current Implementation:**
- MarkdownRenderer component renders code blocks
- No save functionality exists
- Only copy button available

**What Needs to Be Added:**
1. Detect code block language (html, js, css, python, etc.)
2. Add "Save As" button to code blocks
3. Generate filename based on language
4. Trigger download with proper extension

---

## Solution Design

### Solution 1: Conversation History

**Data Structure:**
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
```

**Implementation Steps:**
1. Add conversation history state
2. Append user query to history before API call
3. Append AI response to history after completion
4. Send full history to API (last N messages)
5. Update UI to show conversation thread
6. Add "Clear Conversation" button

**API Integration:**
```typescript
// Build messages array with history
const messages = [
  ...conversationHistory.slice(-10),  // Last 10 messages for context
  { role: 'user', content: query }
];

await queryKimiK2Streaming(messages, ...);
```

---

### Solution 2: Code Block Save As

**Implementation Steps:**
1. Update MarkdownRenderer to detect code blocks
2. Add "Save As" button component
3. Create download utility for code blocks
4. Auto-detect file extension from language
5. Generate default filename

**Code Block Component:**
```typescript
<div className="code-block-header">
  <span className="language-label">{language}</span>
  <button onClick={() => copyCode(code)}>📋 Copy</button>
  <button onClick={() => saveCode(code, language)}>💾 Save As</button>
</div>
<pre><code className={`language-${language}`}>{code}</code></pre>
```

**File Extension Mapping:**
```typescript
const extensionMap = {
  html: '.html',
  javascript: '.js',
  typescript: '.ts',
  css: '.css',
  python: '.py',
  json: '.json',
  // ...
};
```

---

## Implementation Priority

### High Priority
1. ✅ Code Block Save As - Quick win, high user value
2. ⚠️ Conversation History - More complex, requires API changes

### Approach
1. **Phase 1:** Implement Code Block Save As (simpler, immediate value)
2. **Phase 2:** Implement Conversation History (more complex)

---

## Technical Challenges

### Challenge 1: API Message Format
- Need to check if Moonshot API supports conversation history
- May need to format messages differently
- Token limits may restrict history length

### Challenge 2: UI Layout
- Conversation thread needs space
- May need collapsible previous messages
- Balance between context and clutter

### Challenge 3: State Management
- Conversation history needs to persist across queries
- Clear button should reset history
- History should be saved to localStorage?

---

## Next Steps

1. Implement Code Block Save As feature
2. Test with HTML, CSS, JS code blocks
3. Implement Conversation History
4. Test conversation continuity
5. Deploy and verify both features
