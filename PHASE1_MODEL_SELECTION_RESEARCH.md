# Phase 1 Research: Model Selection & Reasoning Content

## Official Documentation Summary

**Sources:**
- https://platform.moonshot.ai/docs/guide/kimi-k2-quickstart
- https://platform.moonshot.ai/docs/guide/use-kimi-k2-thinking-model

## Available Kimi K2 Models

### 1. kimi-k2-0905-preview
**Type:** Standard flagship model  
**Context:** 256K tokens  
**Speed:** Standard  
**Best for:** General-purpose tasks, balanced performance

**Parameters:**
- `temperature`: 0.6 (default)
- `max_tokens`: 32000 (recommended)

### 2. kimi-k2-turbo-preview ⚡ (CURRENTLY USING)
**Type:** High-speed model  
**Context:** 256K tokens  
**Speed:** 60-100 tokens/s  
**Best for:** Enterprise applications, high-responsiveness agents

**Parameters:**
- `temperature`: 0.6 (default)
- `max_tokens`: 32000 (recommended)

### 3. kimi-k2-thinking 🧠 (NEW - REASONING MODEL)
**Type:** Long-term thinking model with reasoning exposure  
**Context:** 256K tokens  
**Speed:** Standard  
**Best for:** Complex problems requiring deep reasoning

**Special Features:**
- ✅ Exposes `reasoning_content` field
- ✅ Multi-step tool usage with reasoning
- ✅ Shows HOW the AI thinks

**Parameters:**
- `temperature`: **1.0** (REQUIRED for best performance)
- `max_tokens`: **≥ 16,000** (REQUIRED to avoid truncation)

**Key Difference:** Has `reasoning_content` field in API response!

### 4. kimi-k2-thinking-turbo 🧠⚡ (NEW - FAST REASONING)
**Type:** High-speed reasoning model  
**Context:** 256K tokens  
**Speed:** 60-100 tokens/s  
**Best for:** Complex problems + fast responses

**Special Features:**
- ✅ All features of kimi-k2-thinking
- ✅ 60-100 tokens/s output speed
- ✅ Exposes `reasoning_content` field

**Parameters:**
- `temperature`: **1.0** (REQUIRED)
- `max_tokens`: **≥ 16,000** (REQUIRED)

## Reasoning Content Feature

### What is reasoning_content?

The `reasoning_content` field exposes the AI's **internal thought process** - showing HOW it arrives at conclusions, not just the final answer.

**Example:**
```
reasoning_content: "Let me break down this problem:
1. First, I need to search for Russian rivers
2. Then search for US rivers  
3. Compare water quality metrics
4. Analyze fish diversity
5. Create a comprehensive report"

content: "Here is the comparison report..."
```

### Accessing reasoning_content

**In OpenAI SDK (Python):**
```python
# reasoning_content is NOT a direct attribute
# Must use hasattr() and getattr()

if hasattr(chunk.choices[0].delta, "reasoning_content"):
    reasoning = getattr(chunk.choices[0].delta, "reasoning_content")
    print(reasoning)
```

**In HTTP API / Other Frameworks:**
```json
{
  "choices": [{
    "delta": {
      "reasoning_content": "My thinking process...",
      "content": "Final answer..."
    }
  }]
}
```

### Key Properties

1. **Streaming Order:** `reasoning_content` ALWAYS appears BEFORE `content`
2. **Token Counting:** Both fields count toward `max_tokens` limit
3. **Completion Detection:** When `content` starts appearing, reasoning is finished
4. **Truncation Risk:** If `max_tokens` too small, reasoning may be cut off

### Usage Notes for kimi-k2-thinking

**MUST DO:**
- ✅ Set `temperature = 1.0` (best performance)
- ✅ Set `max_tokens ≥ 16,000` (avoid truncation)
- ✅ Use `stream = True` (handle large responses)
- ✅ Check for `reasoning_content` field existence
- ✅ Use `hasattr()` and `getattr()` in Python

**OPTIONAL:**
- Include previous `reasoning_content` in context for continuity

## Model Comparison Table

| Model | Speed | Reasoning | Context | Best For | Temperature | max_tokens |
|-------|-------|-----------|---------|----------|-------------|------------|
| kimi-k2-0905-preview | Standard | ❌ | 256K | General | 0.6 | 32000 |
| kimi-k2-turbo-preview | Fast (60-100 t/s) | ❌ | 256K | Enterprise | 0.6 | 32000 |
| kimi-k2-thinking | Standard | ✅ | 256K | Complex | **1.0** | **≥16000** |
| kimi-k2-thinking-turbo | Fast (60-100 t/s) | ✅ | 256K | Complex+Fast | **1.0** | **≥16000** |

## Implementation Plan for Kimi Cyber

### Phase 1: Model Selection UI

**Add Model Selector:**
```
┌─────────────────────────────────────┐
│ Model Selection:                    │
│                                     │
│ ○ kimi-k2-0905-preview             │
│   Standard - Balanced performance   │
│                                     │
│ ● kimi-k2-turbo-preview (Current)  │
│   Fast - 60-100 tokens/s           │
│                                     │
│ ○ kimi-k2-thinking 🧠              │
│   Reasoning - Shows AI thinking     │
│                                     │
│ ○ kimi-k2-thinking-turbo 🧠⚡      │
│   Fast Reasoning - Best of both     │
└─────────────────────────────────────┘
```

**Auto-adjust Parameters:**
- When thinking model selected → Set temp=1.0, max_tokens=16000
- When standard model selected → Set temp=0.6, max_tokens=32000

### Phase 2: Reasoning Content Display

**Add 4th Panel (when thinking model selected):**

```
┌─────────────────────────────────────┐
│ 🧠 AI Reasoning Process             │
├─────────────────────────────────────┤
│ Let me break down this problem:    │
│                                     │
│ 1. First, I'll search for Russian  │
│    rivers to gather data...        │
│                                     │
│ 2. Then I'll search for US rivers  │
│    for comparison...               │
│                                     │
│ 3. I'll analyze water quality...   │
│                                     │
│ [Real-time streaming of thinking]  │
└─────────────────────────────────────┘
```

**Features:**
- Shows reasoning in real-time during streaming
- Collapsible panel
- Syntax highlighting for structured thinking
- Copy button for reasoning content
- Include in PDF export

### Implementation Steps

**Step 1: Add Model Selection (30 min)**
1. Create model selector dropdown/radio buttons
2. Store selected model in state
3. Update API call to use selected model

**Step 2: Auto-adjust Parameters (15 min)**
1. Detect if thinking model selected
2. Auto-set temperature and max_tokens
3. Show parameter values in UI

**Step 3: Add Reasoning Content Handling (45 min)**
1. Add `reasoningContent` state
2. Check for `reasoning_content` in streaming
3. Use `hasattr()` and `getattr()` properly
4. Accumulate reasoning content separately

**Step 4: Add Reasoning Display Panel (30 min)**
1. Create ReasoningPanel component
2. Show/hide based on model selection
3. Stream reasoning content in real-time
4. Add styling and animations

**Step 5: Update Export (30 min)**
1. Include reasoning in PDF export
2. Add "Export Reasoning" button
3. Include in comprehensive reports

### Technical Implementation

**State Management:**
```typescript
const [selectedModel, setSelectedModel] = useState<string>("kimi-k2-turbo-preview");
const [reasoningContent, setReasoningContent] = useState<string>("");
const [modelParams, setModelParams] = useState({
  temperature: 0.6,
  max_tokens: 32000
});

// Auto-adjust parameters when model changes
useEffect(() => {
  if (selectedModel.includes("thinking")) {
    setModelParams({ temperature: 1.0, max_tokens: 16000 });
  } else {
    setModelParams({ temperature: 0.6, max_tokens: 32000 });
  }
}, [selectedModel]);
```

**Streaming Handler:**
```typescript
// In streaming loop
if (hasattr(chunk.choices[0].delta, "reasoning_content")) {
  const reasoning = getattr(chunk.choices[0].delta, "reasoning_content");
  setReasoningContent(prev => prev + reasoning);
}

if (chunk.choices[0].delta.content) {
  const content = chunk.choices[0].delta.content;
  setResult(prev => prev + content);
}
```

**API Call:**
```typescript
const requestBody = {
  model: selectedModel,
  messages: messages,
  temperature: modelParams.temperature,
  max_tokens: modelParams.max_tokens,
  stream: true
};
```

## Complexity Assessment

**Model Selection:**
- Complexity: ⭐ (Very Low)
- Time: 30-45 minutes
- Dependencies: None
- Risks: None

**Reasoning Content Display:**
- Complexity: ⭐⭐⭐ (Medium)
- Time: 1.5-2 hours
- Dependencies: Model selection must be implemented first
- Risks: 
  - hasattr/getattr may not work in TypeScript (need alternative)
  - Streaming order must be handled correctly
  - Token limits may cause truncation

## Benefits

### For Users

1. **Transparency** - See HOW the AI thinks
2. **Trust** - Understand reasoning process
3. **Learning** - Learn problem-solving approaches
4. **Debugging** - Identify where AI went wrong
5. **Choice** - Pick model for their needs

### For Kimi Cyber

1. **Differentiation** - Unique feature vs competitors
2. **Educational** - Teaches AI reasoning
3. **Professional** - Shows advanced capabilities
4. **Flexibility** - Users choose speed vs depth

## Next Steps

1. ✅ Research complete for both features
2. ⏭️ Ready to implement
3. Start with Model Selection (quick win)
4. Then add Reasoning Display (high value)

---

**Status:** ✅ Research Complete  
**Ready for Implementation:** Yes  
**Estimated Total Time:** 2.5-3 hours  
**Blockers:** None  
**Priority:** High (unique differentiator)
