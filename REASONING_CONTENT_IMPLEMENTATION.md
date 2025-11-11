# Reasoning Content Implementation Guide

## Overview

The `reasoning_content` field is a special feature of Kimi K2 thinking models that exposes the AI's internal thought process during problem-solving.

## Key Facts from Research

### 1. Model Requirements
- **Only available in:** `kimi-k2-thinking` and `kimi-k2-thinking-turbo`
- **NOT available in:** `kimi-k2-0905-preview` and `kimi-k2-turbo-preview`

### 2. Required Parameters
```typescript
{
  model: "kimi-k2-thinking" | "kimi-k2-thinking-turbo",
  temperature: 1.0,  // MUST be 1.0 for best performance
  max_tokens: 16000, // MUST be ≥ 16000 to avoid truncation
  stream: true       // Recommended for large responses
}
```

### 3. Response Structure

**In Streaming Mode:**
```json
{
  "choices": [{
    "delta": {
      "reasoning_content": "Step 1: Analyze the problem...",  // Appears FIRST
      "content": "Here is my answer..."                         // Appears AFTER
    },
    "finish_reason": null | "stop" | "tool_calls"
  }]
}
```

**Key Properties:**
- `reasoning_content` ALWAYS appears BEFORE `content`
- Both fields stream incrementally
- When `content` starts appearing, reasoning is complete
- Both count toward `max_tokens` limit

### 4. Implementation Challenges

**Python vs JavaScript:**
- Python docs show: `hasattr()` and `getattr()` for checking field existence
- JavaScript/TypeScript: Use optional chaining `?.` or property checks

**Our Approach:**
```typescript
// Check if reasoning_content exists in the delta
if (chunk.choices[0].delta.reasoning_content) {
  const reasoning = chunk.choices[0].delta.reasoning_content;
  // Accumulate reasoning content
  setReasoningContent(prev => prev + reasoning);
}

// Check for regular content
if (chunk.choices[0].delta.content) {
  const content = chunk.choices[0].delta.content;
  // Accumulate regular content
  setResult(prev => prev + content);
}
```

## Implementation Plan

### Phase 1: Update API Streaming Handler

**File:** `src/lib/api-streaming.ts`

**Changes Needed:**
1. Pass `selectedModel` and `modelParams` to streaming function
2. Add reasoning content callback
3. Handle `reasoning_content` field in streaming loop

```typescript
export async function queryKimiK2Streaming(
  query: string,
  model: string,  // NEW
  params: { temperature: number; max_tokens: number },  // NEW
  onUpdate: (update: StreamUpdate) => void
): Promise<string>
```

**StreamUpdate Type:**
```typescript
interface StreamUpdate {
  thinking?: string;
  reasoningContent?: string;  // NEW
  toolCall?: ToolCall;
  result?: string;
}
```

### Phase 2: Update App.tsx

**Changes:**
1. Pass model and params to API function
2. Handle reasoning content updates
3. Display reasoning content in UI

```typescript
// In handleSubmit
await queryKimiK2Streaming(
  query,
  selectedModel,      // Pass selected model
  _modelParams,       // Pass model parameters
  (update) => {
    // Handle reasoning content
    if (update.reasoningContent) {
      setReasoningContent(prev => prev + update.reasoningContent);
    }
    
    // ... existing handlers
  }
);
```

### Phase 3: Create Reasoning Panel Component

**File:** `src/components/ReasoningPanel.tsx`

**Features:**
- Collapsible panel
- Real-time streaming display
- Syntax highlighting for structured thinking
- Copy button
- Show/hide based on model type

**UI Design:**
```
┌─────────────────────────────────────────┐
│ 🧠 AI Reasoning Process          [▼] [📋]│
├─────────────────────────────────────────┤
│                                         │
│ Let me break down this problem:        │
│                                         │
│ 1. First, I need to search for Russian │
│    rivers to gather comprehensive data  │
│    about water quality and fish species │
│                                         │
│ 2. Then I'll search for US rivers for  │
│    comparison purposes                  │
│                                         │
│ 3. I'll analyze the water quality       │
│    metrics and compare them             │
│                                         │
│ [Streaming content appears here...]     │
│                                         │
└─────────────────────────────────────────┘
```

### Phase 4: Update UI Layout

**Current:** 3-panel layout (Thinking | Tool Calls | Results)

**New:** 4-panel layout when thinking model selected:
- Thinking Process (existing)
- **Reasoning Process (NEW)** ← Shows reasoning_content
- Tool Calls
- Results

**Responsive:**
- Desktop: 4 columns (or 2x2 grid)
- Tablet/Mobile: Stack vertically

### Phase 5: Update Export Functions

**Add reasoning content to exports:**
- PDF: New section "AI Reasoning Process"
- Markdown: New section with reasoning
- Text: Include reasoning before results

## Technical Implementation Details

### 1. Streaming Handler Update

```typescript
// In api-streaming.ts
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;
  
  // Handle reasoning content (thinking models only)
  if (delta?.reasoning_content) {
    onUpdate({ reasoningContent: delta.reasoning_content });
  }
  
  // Handle regular content
  if (delta?.content) {
    onUpdate({ result: delta.content });
  }
  
  // ... existing tool call handling
}
```

### 2. State Management

```typescript
// In App.tsx
const [reasoningContent, setReasoningContent] = useState<string>('');

// Reset on new query
const handleSubmit = () => {
  setReasoningContent('');
  // ... other resets
};

// Update during streaming
onUpdate: (update) => {
  if (update.reasoningContent) {
    setReasoningContent(prev => prev + update.reasoningContent);
  }
}
```

### 3. Conditional Rendering

```typescript
// Only show reasoning panel for thinking models
const isThinkingModel = selectedModel.includes('thinking');

return (
  <div className={`panels-container ${isThinkingModel ? 'four-panel' : 'three-panel'}`}>
    {/* Existing panels */}
    
    {isThinkingModel && (
      <ReasoningPanel content={reasoningContent} />
    )}
  </div>
);
```

## Benefits

### For Users
1. **Transparency** - See HOW the AI arrives at conclusions
2. **Trust** - Understand the reasoning process
3. **Learning** - Learn problem-solving approaches
4. **Debugging** - Identify where AI reasoning may be flawed
5. **Validation** - Verify AI's approach before accepting results

### For Kimi Cyber
1. **Differentiation** - Unique feature vs competitors
2. **Educational Value** - Teaches AI reasoning
3. **Professional Image** - Shows advanced capabilities
4. **User Engagement** - More interesting than just seeing results

## Example Reasoning Content

**Query:** "Compare cleanest rivers in Russia vs US"

**Reasoning Content:**
```
Let me approach this systematically:

1. First, I'll search for information about the cleanest rivers in Russia
   - Focus on water quality metrics
   - Look for biodiversity data
   - Check for environmental protection status

2. Then I'll search for comparable US rivers
   - Same metrics as Russia for fair comparison
   - Consider geographic diversity
   - Check federal protection programs

3. I'll need to compare:
   - Water quality scores (pH, dissolved oxygen, pollutants)
   - Fish species diversity
   - Ecosystem health indicators
   - Recreational use and accessibility

4. For the PDF report, I should include:
   - Title page with methodology
   - Data tables for each country
   - Comparison charts
   - Detailed analysis section
   - Conclusions with supporting evidence

Let me start with the Russian rivers search...
```

**Regular Content (Result):**
```
Here is a comprehensive comparison of the cleanest rivers...
[Final synthesized answer]
```

## Testing Plan

### Test Cases

1. **Standard Model** (kimi-k2-turbo-preview)
   - ✅ No reasoning panel shown
   - ✅ 3-panel layout
   - ✅ Normal operation

2. **Thinking Model** (kimi-k2-thinking)
   - ✅ Reasoning panel appears
   - ✅ 4-panel layout
   - ✅ Reasoning content streams in real-time
   - ✅ Regular content appears after reasoning
   - ✅ Both contents are complete

3. **Complex Query with Tools**
   - ✅ Reasoning shows tool usage strategy
   - ✅ Tool calls execute as planned
   - ✅ Final result incorporates tool outputs
   - ✅ Reasoning explains synthesis process

4. **Export Functions**
   - ✅ PDF includes reasoning section
   - ✅ Markdown export has reasoning
   - ✅ Text export includes reasoning
   - ✅ Proper formatting maintained

## Potential Issues & Solutions

### Issue 1: reasoning_content field not present
**Cause:** Using non-thinking model  
**Solution:** Only show reasoning panel for thinking models

### Issue 2: Truncated reasoning
**Cause:** max_tokens too low  
**Solution:** Ensure max_tokens ≥ 16000 for thinking models

### Issue 3: Poor reasoning quality
**Cause:** Wrong temperature  
**Solution:** Set temperature = 1.0 for thinking models

### Issue 4: Reasoning and content mixed up
**Cause:** Not handling streaming order correctly  
**Solution:** reasoning_content always comes first, handle separately

## Success Criteria

✅ Reasoning panel appears only for thinking models  
✅ Reasoning content streams in real-time  
✅ Content is complete and not truncated  
✅ UI is responsive and looks professional  
✅ Export functions include reasoning  
✅ Copy functionality works for reasoning  
✅ Performance is acceptable (no lag)  
✅ Mobile layout works well  

## Timeline

- **Phase 1 (API Update):** 30 minutes
- **Phase 2 (App Integration):** 30 minutes
- **Phase 3 (Reasoning Panel):** 45 minutes
- **Phase 4 (Layout Update):** 30 minutes
- **Phase 5 (Export Update):** 30 minutes
- **Testing:** 30 minutes

**Total:** ~3 hours

## Next Steps

1. ✅ Research complete
2. ⏭️ Update StreamUpdate interface
3. ⏭️ Modify api-streaming.ts
4. ⏭️ Create ReasoningPanel component
5. ⏭️ Update App.tsx integration
6. ⏭️ Update CSS for 4-panel layout
7. ⏭️ Update export functions
8. ⏭️ Test thoroughly
9. ⏭️ Deploy to production

---

**Status:** ✅ Research Complete  
**Ready for Implementation:** Yes  
**Blockers:** None  
**Priority:** High (unique differentiator)
