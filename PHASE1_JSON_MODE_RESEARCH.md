# Phase 1 Research: JSON Mode

## Official Documentation Summary

**Source:** https://platform.moonshot.ai/docs/guide/use-json-mode-feature-of-kimi-api

### What is JSON Mode?

JSON Mode forces the Kimi model to output **valid, parsable JSON** instead of text with JSON embedded in it.

### The Problem It Solves

**Without JSON Mode:**
- Model might add extra text: "Here is the JSON document you requested..."
- JSON might be malformed (trailing commas, missing brackets)
- Unreliable for programmatic parsing

**With JSON Mode:**
- Guaranteed valid JSON Object
- No extra text
- Parsable every time

### Implementation Details

#### 1. Parameter Format
```python
response_format={"type": "json_object"}
```

**Default:** `{"type": "text"}` (no formatting constraints)

#### 2. Requirements

**MUST DO:**
- ✅ Include JSON format specification in system or user prompt
- ✅ Provide example JSON structure
- ✅ Explain field names and types
- ✅ Only request JSON Object (not JSON Array)

**Example System Prompt:**
```
Please output your reply in the following JSON format:

{
    "text": "Text information",
    "image": "Image URL",
    "url": "Link URL"
}

Note: Place text in `text` field, images as links in `image` field, regular links in `url` field.
```

#### 3. Parsing the Response

```python
# message.content is a serialized JSON Object string
content = json.loads(completion.choices[0].message.content)

# Access fields
if "text" in content:
    print(content["text"])
```

### Important Limitations

1. **Only JSON Object** - Cannot generate JSON Arrays or other types
2. **Requires clear prompt** - Must specify exact format in prompt
3. **May truncate** - If `max_tokens` too small, JSON will be incomplete
4. **Check finish_reason** - If `finish_reason == "length"`, output was truncated

### Best Practices

1. **Always provide example** - Show exact JSON structure
2. **Set adequate max_tokens** - Based on expected JSON size
3. **Check finish_reason** - Verify complete output
4. **Validate JSON** - Use try/catch when parsing

### Use Cases

✅ **Good for:**
- Data extraction (articles, products, contacts)
- Structured reports
- Form filling
- API integrations
- Multi-format responses (text + images + links)

❌ **Not good for:**
- Generating arrays of items
- Free-form text responses
- When format flexibility is needed

### Implementation Steps for Kimi Cyber

1. **Add UI Toggle**
   - Checkbox: "Enable JSON Mode"
   - Show/hide JSON format input field

2. **Add Format Input**
   - Textarea for users to specify JSON structure
   - Provide templates (article summary, data extraction, etc.)

3. **Update API Call**
   - Add `response_format` parameter when enabled
   - Inject format specification into system prompt

4. **Add JSON Validation**
   - Try to parse response as JSON
   - Show formatted JSON with syntax highlighting
   - Show error if invalid

5. **Handle Truncation**
   - Check `finish_reason`
   - Warn user if truncated
   - Suggest increasing max_tokens

### Example Implementation

```typescript
// In API call
const requestBody = {
  model: selectedModel,
  messages: messages,
  temperature: 0.6,
  stream: true,
  // Add JSON mode
  ...(jsonModeEnabled && {
    response_format: { type: "json_object" }
  })
};

// In system prompt
if (jsonModeEnabled && jsonFormat) {
  systemPrompt += `\n\nPlease output your response in the following JSON format:\n${jsonFormat}`;
}

// In response handling
if (jsonModeEnabled) {
  try {
    const parsed = JSON.parse(result);
    // Display formatted JSON
    setFormattedResult(JSON.stringify(parsed, null, 2));
  } catch (e) {
    // Show error
    setError("Invalid JSON received");
  }
}
```

### UI Design

**New Controls in Input Section:**

```
┌─────────────────────────────────────┐
│ [✓] Enable JSON Mode                │
│                                     │
│ JSON Format Template:               │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "title": "string",            │ │
│ │   "summary": "string",          │ │
│ │   "data": {}                    │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Quick Templates ▼]                 │
│ - Article Summary                   │
│ - Contact Extraction                │
│ - Product Info                      │
│ - Custom...                         │
└─────────────────────────────────────┘
```

**Results Display:**

When JSON Mode enabled, show formatted JSON with:
- Syntax highlighting
- Collapsible sections
- Copy button
- Download as .json button

### Complexity Assessment

**Implementation Complexity:** ⭐⭐ (Low-Medium)

**Time Estimate:** 1-2 hours
- UI components: 30 min
- API integration: 30 min
- JSON validation: 30 min
- Testing: 30 min

**Dependencies:**
- None (pure API feature)

**Risks:**
- Low - well-documented feature
- Need to handle truncation edge case

### Next Steps

1. ✅ Research complete
2. ⏭️ Move to implementation phase
3. Create UI components
4. Update API call
5. Add validation
6. Test with various JSON structures

---

**Status:** ✅ Research Complete  
**Ready for Implementation:** Yes  
**Blockers:** None
