# AI Clarification Popup - Technical Breakdown
## Fix #3: Detailed Implementation Guide

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Design](#component-design)
3. [State Management](#state-management)
4. [API Integration](#api-integration)
5. [Streaming Flow](#streaming-flow)
6. [Code Implementation](#code-implementation)
7. [Edge Cases](#edge-cases)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Future Enhancements](#future-enhancements)

---

## 1. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────────────┐    │
│  │   App.tsx    │◄────────┤ AIClarificationDialog│    │
│  │              │         │      Component        │    │
│  │ - State Mgmt │         └──────────────────────┘    │
│  │ - API Calls  │                                       │
│  └──────┬───────┘                                       │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              Streaming Handler Layer                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  queryKimiK2Streaming()                          │  │
│  │  - Parse SSE events                              │  │
│  │  - Detect clarification requests                 │  │
│  │  - Pause/Resume stream                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────┬────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │ Kimi K2 API      │    │ Clarification Endpoint   │  │
│  │ - Streaming      │    │ - Resume with answer     │  │
│  │ - SSE Events     │    │ - Session management     │  │
│  └──────────────────┘    └──────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Query
    │
    ▼
┌─────────────────┐
│ Start Streaming │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Events │◄─────────┐
    └───┬────┘          │
        │               │
        ├─ Content      │ Loop
        ├─ Tool Call    │
        ├─ Metrics      │
        └─ Clarification Request
           │            │
           ▼            │
    ┌──────────────┐   │
    │ Pause Stream │   │
    └──────┬───────┘   │
           │            │
           ▼            │
    ┌──────────────┐   │
    │ Show Dialog  │   │
    └──────┬───────┘   │
           │            │
           ▼            │
    ┌──────────────┐   │
    │ User Input   │   │
    └──────┬───────┘   │
           │            │
           ├─ Cancel → End
           │            │
           └─ Send ─────┘
              │
              ▼
       ┌─────────────┐
       │ Resume API  │
       └─────────────┘
```

---

## 2. Component Design

### Component Structure

```typescript
// AIClarificationDialog.tsx

import { useState, useEffect, useRef } from 'react';
import './AIClarificationDialog.css';

interface AIClarificationDialogProps {
  isOpen: boolean;
  question: string;
  context?: string;              // Optional context from AI
  placeholder?: string;          // Input placeholder
  onResponse: (answer: string) => void;
  onCancel: () => void;
  isLoading?: boolean;           // Show loading state while processing
  maxLength?: number;            // Max characters for response
  required?: boolean;            // Require non-empty response
}

export function AIClarificationDialog({
  isOpen,
  question,
  context,
  placeholder = "Type your response here...",
  onResponse,
  onCancel,
  isLoading = false,
  maxLength = 1000,
  required = true
}: AIClarificationDialogProps) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setAnswer('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Validation
    if (required && !answer.trim()) {
      setError('Please provide a response');
      return;
    }

    if (answer.length > maxLength) {
      setError(`Response too long (max ${maxLength} characters)`);
      return;
    }

    onResponse(answer.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="clarification-overlay" onClick={onCancel}>
      <div 
        className="clarification-dialog" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="clarification-header">
          <h3>🤖 AI Needs Your Input</h3>
          <button 
            className="close-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="clarification-body">
          {/* AI Question */}
          <div className="ai-question">
            <div className="question-label">The AI has a question:</div>
            <div className="question-text">{question}</div>
          </div>

          {/* Optional Context */}
          {context && (
            <div className="question-context">
              <div className="context-label">Context:</div>
              <div className="context-text">{context}</div>
            </div>
          )}

          {/* User Input */}
          <div className="user-response">
            <label className="response-label">Your response:</label>
            <textarea
              ref={textareaRef}
              className="response-input"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              maxLength={maxLength}
              rows={4}
            />
            <div className="input-footer">
              <span className="char-count">
                {answer.length} / {maxLength}
              </span>
              {error && <span className="error-text">{error}</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="clarification-footer">
          <button 
            className="cancel-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isLoading || (required && !answer.trim())}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              'Send Response'
            )}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="keyboard-hint">
          Press <kbd>Ctrl+Enter</kbd> to send, <kbd>Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
}
```

### CSS Styling

```css
/* AIClarificationDialog.css */

.clarification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000; /* Higher than other modals */
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(4px);
}

.clarification-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #00ff88;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 255, 136, 0.4);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

/* Header */
.clarification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.05);
}

.clarification-header h3 {
  margin: 0;
  color: #00ff88;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: 2px solid #ff4444;
  color: #ff4444;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.close-btn:hover:not(:disabled) {
  background: #ff4444;
  color: white;
  transform: rotate(90deg);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Body */
.clarification-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* AI Question */
.ai-question {
  margin-bottom: 1.5rem;
}

.question-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-text {
  background: rgba(0, 255, 136, 0.1);
  border-left: 3px solid #00ff88;
  padding: 1rem;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Context */
.question-context {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.context-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.context-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* User Response */
.user-response {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.response-label {
  color: #00ff88;
  font-size: 0.875rem;
  font-weight: 600;
}

.response-input {
  width: 100%;
  background: rgba(0, 255, 136, 0.05);
  border: 2px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: white;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;
}

.response-input:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
}

.response-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.response-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.char-count {
  color: rgba(255, 255, 255, 0.5);
}

.error-text {
  color: #ff4444;
  font-weight: 600;
}

/* Footer */
.clarification-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 255, 136, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.cancel-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.submit-btn {
  background: #00ff88;
  border-color: #00ff88;
  color: #1a1a2e;
}

.submit-btn:hover:not(:disabled) {
  background: #00dd77;
  border-color: #00dd77;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Keyboard Hint */
.keyboard-hint {
  padding: 0.75rem 1.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 255, 136, 0.1);
}

.keyboard-hint kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  font-family: monospace;
  font-size: 0.875em;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .clarification-dialog {
    width: 95%;
    max-height: 90vh;
  }

  .clarification-header,
  .clarification-body,
  .clarification-footer {
    padding: 1rem;
  }

  .clarification-footer {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
    justify-content: center;
  }
}
```

---

## 3. State Management

### App.tsx State Structure

```typescript
// In App.tsx

interface ClarificationState {
  isOpen: boolean;
  question: string;
  context?: string;
  sessionId?: string;          // Track which API session
  streamController?: AbortController; // To pause/resume
  pendingResponse?: string;    // Store response temporarily
}

const [clarification, setClarification] = useState<ClarificationState>({
  isOpen: false,
  question: '',
  context: undefined,
  sessionId: undefined,
  streamController: undefined,
  pendingResponse: undefined
});

const [isProcessingClarification, setIsProcessingClarification] = useState(false);
```

### State Transitions

```typescript
// State Machine
type ClarificationStatus = 
  | 'idle'              // No clarification needed
  | 'requested'         // AI requested clarification
  | 'waiting_user'      // Waiting for user input
  | 'processing'        // Sending response to API
  | 'resuming'          // Resuming stream with answer
  | 'error';            // Error occurred

const [clarificationStatus, setClarificationStatus] = 
  useState<ClarificationStatus>('idle');

// Transition functions
const requestClarification = (question: string, context?: string) => {
  setClarificationStatus('requested');
  setClarification({
    isOpen: true,
    question,
    context,
    sessionId: currentSessionId,
    streamController: currentController
  });
  setClarificationStatus('waiting_user');
};

const submitClarification = async (answer: string) => {
  setClarificationStatus('processing');
  setIsProcessingClarification(true);
  
  try {
    await resumeStreamWithAnswer(answer);
    setClarificationStatus('resuming');
  } catch (error) {
    setClarificationStatus('error');
    // Handle error
  } finally {
    setIsProcessingClarification(false);
    setClarification({ isOpen: false, question: '' });
    setClarificationStatus('idle');
  }
};

const cancelClarification = () => {
  setClarificationStatus('idle');
  setClarification({ isOpen: false, question: '' });
  // Optionally end the stream
  clarification.streamController?.abort();
};
```

---

## 4. API Integration

### API Response Format

#### Option A: SSE Event-Based (Recommended)

```typescript
// Streaming API sends special event for clarification

// Normal events:
data: {"type": "content", "content": "Some text..."}
data: {"type": "tool_call", "tool": {...}}

// Clarification event:
data: {
  "type": "clarification_request",
  "question": "Which dataset should I analyze first?",
  "context": "I found two datasets: sales_2023.csv and customers_2023.csv",
  "session_id": "sess_abc123",
  "options": ["sales_2023.csv", "customers_2023.csv"], // Optional
  "timeout": 300 // Optional timeout in seconds
}
```

#### Option B: Polling-Based

```typescript
// API pauses and returns a special status

POST /api/query/continue
{
  "session_id": "sess_abc123",
  "status": "needs_clarification",
  "clarification": {
    "question": "Which dataset?",
    "context": "...",
    "options": [...]
  }
}
```

### Resume Endpoint

```typescript
// Send user's answer back to API

POST /api/query/clarification
{
  "session_id": "sess_abc123",
  "answer": "Analyze sales_2023.csv first"
}

// Response: Resume streaming
data: {"type": "content", "content": "Analyzing sales_2023.csv..."}
```

### Integration Code

```typescript
// In api-streaming.ts

export async function queryKimiK2Streaming(
  query: string,
  model: string,
  params: any,
  files: any[],
  onUpdate: (update: StreamUpdate) => void,
  onClarificationRequest?: (request: ClarificationRequest) => Promise<string>
) {
  const controller = new AbortController();
  
  try {
    const response = await fetch('/api/query/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model, params, files }),
      signal: controller.signal
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          // Handle clarification request
          if (data.type === 'clarification_request') {
            if (onClarificationRequest) {
              // Pause stream, wait for user response
              const answer = await onClarificationRequest({
                question: data.question,
                context: data.context,
                sessionId: data.session_id,
                options: data.options
              });

              // Resume with answer
              await resumeStreamWithAnswer(data.session_id, answer, reader, decoder, onUpdate);
            }
            continue;
          }

          // Handle normal updates
          onUpdate(data);
        }
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw error;
    }
  }

  return controller;
}

async function resumeStreamWithAnswer(
  sessionId: string,
  answer: string,
  reader: ReadableStreamDefaultReader,
  decoder: TextDecoder,
  onUpdate: (update: StreamUpdate) => void
) {
  // Send answer to API
  await fetch('/api/query/clarification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, answer })
  });

  // Continue reading stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        onUpdate(data);
      }
    }
  }
}
```

---

## 5. Streaming Flow

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Initial Query                                       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
User submits query
    │
    ▼
App.tsx: handleSubmit()
    │
    ├─ Set isLoading = true
    ├─ Clear previous results
    └─ Call queryKimiK2Streaming()
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Streaming Events                                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
    Receive SSE events
        │
        ├─ type: "content" → Update result
        ├─ type: "tool_call" → Update tool calls
        ├─ type: "metrics" → Update metrics
        └─ type: "clarification_request"
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Clarification Request Detected                      │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
    onClarificationRequest() callback invoked
            │
            ├─ Extract question, context, sessionId
            ├─ Store stream controller
            └─ Return Promise<string>
                │
                ▼
    App.tsx: Show dialog
            │
            ├─ setClarification({ isOpen: true, ... })
            ├─ Pause stream (implicit - waiting for Promise)
            └─ Render <AIClarificationDialog />
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: User Interaction                                    │
└─────────────────────────────────────────────────────────────┘
                │
                ▼
    User types response in dialog
                │
                ├─ Validation (required, maxLength)
                ├─ Error handling
                └─ Submit or Cancel
                    │
                    ├─ Cancel → Reject Promise → End stream
                    │
                    └─ Submit
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Resume Stream                                       │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
    onResponse(answer) called
                        │
                        ├─ Resolve Promise with answer
                        ├─ Close dialog
                        └─ Return answer to streaming function
                            │
                            ▼
    resumeStreamWithAnswer()
                            │
                            ├─ POST /api/query/clarification
                            ├─ sessionId + answer
                            └─ Continue reading stream
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Continue Normal Streaming                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
    Receive more SSE events
                                │
                                ├─ type: "content"
                                ├─ type: "tool_call"
                                └─ type: "done"
                                    │
                                    ▼
                            Stream complete
                                    │
                                    └─ Set isLoading = false
```

### Code Flow in App.tsx

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!query.trim() || isLoading) return;

  setIsLoading(true);
  setResult('');
  setToolCalls([]);

  try {
    // Start streaming with clarification handler
    await queryKimiK2Streaming(
      query,
      selectedModel,
      modelParams,
      uploadedFiles,
      // Normal update handler
      (update) => {
        if (update.content) {
          setResult(prev => prev + update.content);
        }
        if (update.toolCall) {
          setToolCalls(prev => [...prev, update.toolCall]);
        }
        if (update.metrics) {
          setMetrics(prev => ({ ...prev, ...update.metrics }));
        }
      },
      // Clarification handler (returns Promise)
      async (request) => {
        return new Promise<string>((resolve, reject) => {
          setClarification({
            isOpen: true,
            question: request.question,
            context: request.context,
            sessionId: request.sessionId,
            streamController: undefined, // Already paused
            pendingResponse: undefined
          });

          // Store resolve/reject for later
          clarificationResolveRef.current = resolve;
          clarificationRejectRef.current = reject;
        });
      }
    );
  } catch (error) {
    console.error('Query failed:', error);
    setResult(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

// Handle user's response
const handleClarificationResponse = (answer: string) => {
  if (clarificationResolveRef.current) {
    clarificationResolveRef.current(answer);
    clarificationResolveRef.current = null;
  }
  setClarification({ isOpen: false, question: '' });
};

// Handle cancellation
const handleClarificationCancel = () => {
  if (clarificationRejectRef.current) {
    clarificationRejectRef.current(new Error('User cancelled clarification'));
    clarificationRejectRef.current = null;
  }
  setClarification({ isOpen: false, question: '' });
  setIsLoading(false);
};
```

---

## 6. Code Implementation

### Complete Integration Example

```typescript
// App.tsx additions

import { AIClarificationDialog } from './components/AIClarificationDialog';

// Add refs for Promise resolution
const clarificationResolveRef = useRef<((answer: string) => void) | null>(null);
const clarificationRejectRef = useRef<((error: Error) => void) | null>(null);

// Add state
const [clarification, setClarification] = useState({
  isOpen: false,
  question: '',
  context: undefined as string | undefined
});

// In JSX, add the dialog component
return (
  <>
    {/* Existing components */}
    
    {/* AI Clarification Dialog */}
    <AIClarificationDialog
      isOpen={clarification.isOpen}
      question={clarification.question}
      context={clarification.context}
      onResponse={handleClarificationResponse}
      onCancel={handleClarificationCancel}
      isLoading={isProcessingClarification}
      maxLength={1000}
      required={true}
    />
    
    {/* Rest of app */}
  </>
);
```

---

## 7. Edge Cases

### 1. **User Closes Browser During Clarification**
```typescript
// Solution: Session timeout on server
// After 5 minutes, auto-cancel clarification request
// Return error: "Clarification timeout"
```

### 2. **Multiple Clarification Requests in Sequence**
```typescript
// Solution: Queue system
const [clarificationQueue, setClarificationQueue] = useState<ClarificationRequest[]>([]);

// Process one at a time
useEffect(() => {
  if (clarificationQueue.length > 0 && !clarification.isOpen) {
    const next = clarificationQueue[0];
    showClarification(next);
    setClarificationQueue(prev => prev.slice(1));
  }
}, [clarificationQueue, clarification.isOpen]);
```

### 3. **Network Error During Response Submission**
```typescript
// Solution: Retry logic with exponential backoff
const submitWithRetry = async (answer: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await resumeStreamWithAnswer(sessionId, answer);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

### 4. **User Submits Empty Response**
```typescript
// Solution: Validation in component
if (required && !answer.trim()) {
  setError('Please provide a response');
  return;
}
```

### 5. **API Doesn't Support Clarification**
```typescript
// Solution: Fallback to restart query
const fallbackClarification = async (question: string) => {
  const answer = await showDialog(question);
  // Restart query with appended context
  const newQuery = `${originalQuery}\n\nNote: ${question}\nAnswer: ${answer}`;
  await queryKimiK2Streaming(newQuery, ...);
};
```

### 6. **Concurrent Queries**
```typescript
// Solution: Disable submit while clarification is open
<button
  type="submit"
  disabled={isLoading || clarification.isOpen}
>
  Submit Query
</button>
```

### 7. **Dialog Appears Behind Other Elements**
```css
/* Solution: High z-index */
.clarification-overlay {
  z-index: 3000; /* Higher than all other modals */
}
```

---

## 8. Testing Strategy

### Unit Tests

```typescript
// AIClarificationDialog.test.tsx

describe('AIClarificationDialog', () => {
  it('should render when open', () => {
    render(
      <AIClarificationDialog
        isOpen={true}
        question="Test question?"
        onResponse={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('Test question?')).toBeInTheDocument();
  });

  it('should call onResponse with answer', () => {
    const onResponse = jest.fn();
    render(
      <AIClarificationDialog
        isOpen={true}
        question="Test?"
        onResponse={onResponse}
        onCancel={jest.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText(/Type your response/);
    fireEvent.change(input, { target: { value: 'My answer' } });
    
    const submitBtn = screen.getByText('Send Response');
    fireEvent.click(submitBtn);
    
    expect(onResponse).toHaveBeenCalledWith('My answer');
  });

  it('should validate required field', () => {
    render(
      <AIClarificationDialog
        isOpen={true}
        question="Test?"
        onResponse={jest.fn()}
        onCancel={jest.fn()}
        required={true}
      />
    );
    
    const submitBtn = screen.getByText('Send Response');
    fireEvent.click(submitBtn);
    
    expect(screen.getByText('Please provide a response')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', () => {
    const onResponse = jest.fn();
    render(
      <AIClarificationDialog
        isOpen={true}
        question="Test?"
        onResponse={onResponse}
        onCancel={jest.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText(/Type your response/);
    fireEvent.change(input, { target: { value: 'Answer' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    
    expect(onResponse).toHaveBeenCalledWith('Answer');
  });
});
```

### Integration Tests

```typescript
// App.integration.test.tsx

describe('Clarification Flow', () => {
  it('should handle full clarification flow', async () => {
    // Mock API that returns clarification request
    mockAPI.onPost('/api/query/stream').reply(200, () => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue('data: {"type":"clarification_request","question":"Which?"}\n\n');
        }
      });
    });

    render(<App />);
    
    // Submit query
    const input = screen.getByPlaceholderText(/Enter your research query/);
    fireEvent.change(input, { target: { value: 'Test query' } });
    fireEvent.click(screen.getByText('Submit Query'));
    
    // Wait for clarification dialog
    await waitFor(() => {
      expect(screen.getByText('🤖 AI Needs Your Input')).toBeInTheDocument();
    });
    
    // Respond to clarification
    const clarificationInput = screen.getByPlaceholderText(/Type your response/);
    fireEvent.change(clarificationInput, { target: { value: 'Option A' } });
    fireEvent.click(screen.getByText('Send Response'));
    
    // Verify API was called with answer
    await waitFor(() => {
      expect(mockAPI.history.post).toContainEqual(
        expect.objectContaining({
          url: '/api/query/clarification',
          data: expect.objectContaining({ answer: 'Option A' })
        })
      );
    });
  });
});
```

### Manual Testing Checklist

- [ ] Dialog appears when clarification requested
- [ ] Dialog is centered and properly styled
- [ ] Textarea is auto-focused
- [ ] Character count updates correctly
- [ ] Validation works (required, maxLength)
- [ ] Submit button is disabled when empty (if required)
- [ ] Ctrl+Enter submits
- [ ] Escape cancels
- [ ] Click outside cancels
- [ ] Loading state shows spinner
- [ ] Response is sent to API
- [ ] Stream resumes after response
- [ ] Multiple clarifications work in sequence
- [ ] Error handling works
- [ ] Mobile responsive

---

## 9. Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
```typescript
// Only load dialog component when needed
const AIClarificationDialog = lazy(() => 
  import('./components/AIClarificationDialog')
);
```

2. **Memoization**
```typescript
const MemoizedDialog = memo(AIClarificationDialog, (prev, next) => {
  return prev.isOpen === next.isOpen && 
         prev.question === next.question;
});
```

3. **Debounce Character Count**
```typescript
const debouncedCharCount = useMemo(
  () => debounce((value: string) => {
    setCharCount(value.length);
  }, 100),
  []
);
```

4. **Virtual Scrolling for Long Context**
```typescript
// If context is very long, use virtual scrolling
import { FixedSizeList } from 'react-window';
```

### Memory Management

```typescript
// Clean up on unmount
useEffect(() => {
  return () => {
    clarificationResolveRef.current = null;
    clarificationRejectRef.current = null;
  };
}, []);
```

---

## 10. Future Enhancements

### 1. **Multiple Choice Options**
```typescript
interface ClarificationRequest {
  question: string;
  type: 'text' | 'choice' | 'multi-choice';
  options?: string[];
}

// Render radio buttons or checkboxes for choices
```

### 2. **Rich Text Input**
```typescript
// Allow markdown formatting in response
import ReactMarkdown from 'react-markdown';
```

### 3. **Voice Input**
```typescript
// Add microphone button for speech-to-text
const startVoiceInput = () => {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = (event) => {
    setAnswer(event.results[0][0].transcript);
  };
  recognition.start();
};
```

### 4. **Suggested Responses**
```typescript
// Show quick reply buttons
<div className="quick-replies">
  {suggestedResponses.map(response => (
    <button onClick={() => setAnswer(response)}>
      {response}
    </button>
  ))}
</div>
```

### 5. **History of Clarifications**
```typescript
// Show previous clarifications in session
const [clarificationHistory, setClarificationHistory] = useState<Array<{
  question: string;
  answer: string;
  timestamp: Date;
}>>([]);
```

### 6. **Timeout Warning**
```typescript
// Show countdown timer
const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

useEffect(() => {
  if (clarification.isOpen && timeRemaining > 0) {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }
}, [clarification.isOpen, timeRemaining]);
```

### 7. **Collaborative Clarification**
```typescript
// Multiple users can respond (for team accounts)
// Show who's typing
// Real-time updates via WebSocket
```

---

## 📊 Summary

### Implementation Complexity: **Medium-High**

**Estimated Time:**
- Component creation: 2-3 hours
- API integration: 3-4 hours
- Testing: 2-3 hours
- Edge cases: 2-3 hours
- **Total: 9-13 hours**

### Dependencies:
- ✅ React 18+
- ✅ TypeScript
- ✅ SSE/Streaming API support
- ⚠️ Backend API must support clarification endpoint

### Risk Assessment:
- **Low Risk:** Component UI and basic functionality
- **Medium Risk:** State management and Promise handling
- **High Risk:** API integration (depends on backend support)

### Recommendation:
Start with **mock implementation** to validate UX, then integrate with real API once backend support is confirmed.

---

**Ready to implement?** This detailed breakdown should provide everything needed for a production-ready AI Clarification Popup feature! 🚀
