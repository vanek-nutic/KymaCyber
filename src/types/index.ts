/**
 * Type Definitions for Kimi Cyber
 * Based on comprehensive research of Moonshot AI API and OpenAI streaming patterns
 */

// ============================================================================
// Tool Call Types (Based on OpenAI-compatible format)
// ============================================================================

/**
 * Tool call structure that accumulates during streaming
 * IMPORTANT: During streaming, these fields build up incrementally
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
  status?: 'pending' | 'success' | 'error';
  result?: string;
  timestamp?: number;
}

/**
 * Tool definition from Moonshot Formula API
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      required?: string[];
      properties: Record<string, unknown>;
    };
  };
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

// ============================================================================
// Thinking Process Types
// ============================================================================

export interface ThinkingStep {
  id: string;
  content: string;
  timestamp: number;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface Metrics {
  thinkingTokens: number;
  toolCalls: number;
  elapsedTime: number;
  inputTokens: number;
  outputTokens: number;
}

// ============================================================================
// Stream Event Types
// ============================================================================

export type StreamEvent =
  | { type: 'thinking'; data: { content: string } }
  | { type: 'content'; data: { content: string } }
  | { type: 'tool_call'; data: ToolCall }
  | { type: 'metrics'; data: Partial<Metrics> }
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };

// ============================================================================
// File Upload Types
// ============================================================================

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  content?: string; // For text files
}

// ============================================================================
// Chat History Types
// ============================================================================

export interface ChatHistoryItem {
  id: string;
  timestamp: number;
  query: string;
  result: string;
  metrics: Metrics;
  thinkingSteps: number;
  toolCallsExecuted: string[];
}
