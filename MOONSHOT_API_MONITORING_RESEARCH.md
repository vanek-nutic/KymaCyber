# Moonshot API Monitoring Research

## Date: November 11, 2025

## Research Question
How can we monitor the status of the K2 Thinking model to know when server overload issues are resolved?

---

## Key Findings

### 1. No Official Moonshot AI Status Page

**Moonshot AI does NOT provide a public status page** for their API services at platform.moonshot.ai.

- ❌ No status.moonshot.ai
- ❌ No system status section in platform.moonshot.ai
- ❌ No official service health dashboard

### 2. Together AI Status Page (Third-Party)

**Together AI** (a third-party provider that resells Moonshot models) has a status page:
- **URL:** https://status.together.ai/
- **Models tracked:**
  - Moonshot Kimi K2 Instruct (99.120% uptime today)
  - Moonshot Kimi K2 Instruct (0905) (99.750% uptime today)

**Limitations:**
- ❌ Does NOT track `kimi-k2-thinking` model
- ❌ Does NOT track `kimi-k2-thinking-turbo` model
- ✅ Only tracks standard K2 Instruct models
- ⚠️ This is for Together AI's infrastructure, not Moonshot's direct API

### 3. StatusGator (Third-Party Aggregator)

**StatusGator** tracks Together AI services:
- **URL:** https://statusgator.com/services/together-ai/moonshot-kimi-k2-instruct
- Updates every 15 minutes
- Shows historical outages

**Limitations:**
- Same as Together AI - doesn't track thinking models
- Only aggregates Together AI's status, not Moonshot direct

---

## Current Situation Analysis

### Why K2 Thinking Shows "engine_overloaded_error"

**Evidence:**
- ✅ K2 Standard - Works
- ✅ K2 Turbo - Works  
- ❌ K2 Thinking - "engine_overloaded_error"
- ✅ K2 Thinking Turbo - Works

**Conclusion:**
This is a **specific capacity issue with the `kimi-k2-thinking` model** on Moonshot's servers. The error is legitimate - the model is genuinely overloaded.

### Why No Public Status Page?

Moonshot AI is a Chinese company and their primary market is China. They may have:
- Internal monitoring only
- Chinese-language status updates (not found in English search)
- Different communication channels (WeChat, Weibo, etc.)

---

## Monitoring Solutions

### Option 1: Manual API Health Check ⭐ RECOMMENDED

**Approach:** Periodically test the model with a minimal request

**Implementation:**
```javascript
async function checkModelHealth(modelName) {
  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    if (response.ok) {
      return { status: 'healthy', model: modelName };
    } else {
      const error = await response.json();
      return { 
        status: 'unhealthy', 
        model: modelName,
        error: error.error?.type 
      };
    }
  } catch (error) {
    return { status: 'error', model: modelName, error: error.message };
  }
}
```

**Pros:**
- ✅ Direct test of actual model availability
- ✅ Works for all models (including thinking variants)
- ✅ Real-time status
- ✅ Can be automated

**Cons:**
- ❌ Consumes API credits (minimal)
- ❌ Requires periodic polling

### Option 2: Error-Based Retry with Exponential Backoff

**Approach:** Automatically retry when "engine_overloaded_error" is detected

**Implementation:**
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.type === 'engine_overloaded_error' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

**Pros:**
- ✅ Automatic recovery
- ✅ User doesn't need to manually retry
- ✅ No additional API calls when working

**Cons:**
- ❌ Delays response time
- ❌ May still fail after retries

### Option 3: Model Fallback

**Approach:** Automatically switch to K2 Thinking Turbo when K2 Thinking fails

**Implementation:**
```javascript
async function queryWithFallback(query, preferredModel, fallbackModel) {
  try {
    return await queryKimiK2(query, preferredModel);
  } catch (error) {
    if (error.type === 'engine_overloaded_error') {
      console.log(`${preferredModel} overloaded, falling back to ${fallbackModel}`);
      return await queryKimiK2(query, fallbackModel);
    }
    throw error;
  }
}
```

**Pros:**
- ✅ Seamless user experience
- ✅ Always get a response
- ✅ Similar quality (both are thinking models)

**Cons:**
- ❌ User may not know which model was used
- ❌ Thinking Turbo may have different behavior

### Option 4: Status Badge in UI

**Approach:** Show real-time model status in the UI

**Implementation:**
- Add status indicator next to each model in dropdown
- Green dot = healthy
- Yellow dot = degraded
- Red dot = unavailable
- Check status every 5 minutes

**Pros:**
- ✅ User knows before selecting
- ✅ Transparency
- ✅ Can guide model selection

**Cons:**
- ❌ Requires background polling
- ❌ Consumes API credits
- ❌ May show stale data

---

## Recommended Implementation

### Hybrid Approach (Best of All Options)

1. **Automatic Fallback** (Option 3)
   - If K2 Thinking fails with "engine_overloaded_error"
   - Automatically retry with K2 Thinking Turbo
   - Show notification to user

2. **Manual Retry Button** (User Control)
   - If fallback also fails
   - Show "Retry with K2 Thinking" button
   - Let user decide when to retry

3. **Error Message Enhancement**
   - Show clear message: "K2 Thinking is currently overloaded"
   - Suggest: "Switched to K2 Thinking Turbo automatically"
   - Provide: "Click here to retry with K2 Thinking"

### Code Example

```javascript
async function handleQuery(query, selectedModel) {
  try {
    return await queryKimiK2(query, selectedModel);
  } catch (error) {
    if (error.type === 'engine_overloaded_error') {
      // Show notification
      toast.warning(
        `${selectedModel} is currently overloaded. Switching to ${fallbackModel}...`,
        { duration: 5000 }
      );
      
      // Automatic fallback
      const fallbackModel = 'kimi-k2-thinking-turbo';
      try {
        const result = await queryKimiK2(query, fallbackModel);
        toast.success(`Successfully used ${fallbackModel} instead`);
        return result;
      } catch (fallbackError) {
        // Both failed
        toast.error(
          'Both models are currently unavailable. Please try again in a few minutes.',
          { 
            duration: 10000,
            action: {
              label: 'Retry',
              onClick: () => handleQuery(query, selectedModel)
            }
          }
        );
        throw fallbackError;
      }
    }
    throw error;
  }
}
```

---

## Conclusion

**There is NO official way to monitor Moonshot API model status** because:
1. No public status page exists
2. Third-party status pages don't track thinking models
3. Moonshot AI doesn't provide health check endpoints

**Best solution:**
- Implement **automatic fallback** from K2 Thinking to K2 Thinking Turbo
- Add **retry logic** with exponential backoff
- Show **clear error messages** to users
- Provide **manual retry option**

This gives users the best experience without requiring external monitoring.

---

## Implementation Priority

1. ✅ **Automatic Fallback** (High Priority)
   - Immediate user value
   - No manual intervention needed
   - 5-10 minutes to implement

2. ✅ **Enhanced Error Messages** (High Priority)
   - Better UX
   - User understands what happened
   - 5 minutes to implement

3. ⭐ **Retry Button** (Medium Priority)
   - User control
   - Optional feature
   - 10 minutes to implement

4. ⚠️ **Status Badge** (Low Priority)
   - Nice to have
   - Requires ongoing API calls
   - 30+ minutes to implement
   - May not be worth the cost

**Recommended:** Implement #1 and #2 immediately, #3 if time permits, skip #4.
