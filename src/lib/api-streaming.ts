/**
 * Kimi Cyber API - Streaming Implementation
 * Real-time updates for better UX
 * Based on Moonshot SSE streaming documentation
 */

import type { ToolCall, Message } from '../types';
import { getAllToolDefinitions } from './tools';
import { executeTool } from './tool-executors';

const API_BASE_URL = 'https://api.moonshot.ai/v1';
const API_KEY = import.meta.env.VITE_MOONSHOT_API_KEY || 'sk-UousIBehzfnqFSVL3UHD7vr1uesytwg9P2vop9x53LNmJsyW';

// Tool definitions are now imported from tools.ts

// Tool execution is now handled by tool-executors.ts

/**
 * Parse Server-Sent Events (SSE) stream
 */
async function* parseSSEStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            yield JSON.parse(data);
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Query Kimi K2 with streaming and tool support
 */
export async function queryKimiK2Streaming(
  query: string,
  onProgress: (update: {
    thinking?: string;
    toolCall?: ToolCall;
    content?: string;
    metrics?: {
      thinkingTokens?: number;
      toolCalls?: number;
      inputTokens?: number;
      outputTokens?: number;
    };
  }) => void
): Promise<string> {
  try {
    // Step 1: Get all available tools
    const tools = getAllToolDefinitions();
    console.log(`[Multi-Tool] Using ${tools.length} tools:`, tools.map(t => t.function.name));
    
    // Step 2: Create messages array
    const messages: Message[] = [
      {
        role: 'user',
        content: query,
      },
    ];

    let finish_reason: string | null = null;
    let finalResponse = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let iteration = 0;
    const MAX_ITERATIONS = 10;

    // Step 3: Loop until no more tool calls
    while ((finish_reason === null || finish_reason === 'tool_calls') && iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`[Streaming] Iteration ${iteration}, messages count: ${messages.length}`);

      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kimi-k2-turbo-preview',
          messages,
          tools,
          temperature: 0.3,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      // Parse streaming response
      let contentBuffer = '';
      let currentToolCalls: any[] = [];
      let assistantMessage: any = null;

      for await (const chunk of parseSSEStream(response)) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        
        // Handle content streaming
        if (delta.content) {
          contentBuffer += delta.content;
          onProgress({ content: delta.content });
        }

        // Handle tool calls streaming
        // Tool calls come in chunks with an index
        if (delta.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index;
            
            // Initialize tool call if needed
            if (!currentToolCalls[index]) {
              currentToolCalls[index] = {
                id: toolCallDelta.id || '',
                type: 'function',
                function: {
                  name: '',
                  arguments: '',
                },
              };
            }

            // Accumulate tool call data
            if (toolCallDelta.id) {
              currentToolCalls[index].id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              currentToolCalls[index].function.name += toolCallDelta.function.name;
            }
            if (toolCallDelta.function?.arguments) {
              currentToolCalls[index].function.arguments += toolCallDelta.function.arguments;
            }
          }
        }

        // Check finish reason
        if (choice.finish_reason) {
          finish_reason = choice.finish_reason;
        }

        // Update metrics
        if (chunk.usage) {
          totalInputTokens += chunk.usage.prompt_tokens || 0;
          totalOutputTokens += chunk.usage.completion_tokens || 0;
          
          onProgress({
            metrics: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              toolCalls: currentToolCalls.filter(tc => tc).length,
            },
          });
        }
      }

      // Build assistant message from accumulated data
      assistantMessage = {
        role: 'assistant',
        content: contentBuffer || null,
      };

      if (currentToolCalls.length > 0) {
        assistantMessage.tool_calls = currentToolCalls.filter(tc => tc);
      }

      console.log('[Streaming] Finish reason:', finish_reason);
      console.log('[Streaming] Tool calls:', assistantMessage.tool_calls?.length || 0);

      // Step 4: Handle tool calls
      if (finish_reason === 'tool_calls' && assistantMessage.tool_calls) {
        // CRITICAL: Append assistant message to messages array
        messages.push(assistantMessage);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          // Report tool call as pending
          onProgress({
            toolCall: {
              ...toolCall,
              status: 'pending',
              timestamp: Date.now(),
            },
          });

          try {
            // Parse arguments
            const args = JSON.parse(toolCall.function.arguments);
            
            // Execute the tool using the unified executor
            const result = await executeTool(toolCall.function.name, args);

            // Report success
            onProgress({
              toolCall: {
                ...toolCall,
                status: 'success',
                result,
                timestamp: Date.now(),
              },
            });

            // CRITICAL: Append tool result message
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: result,
            });
          } catch (error) {
            console.error('Tool execution error:', error);
            
            // Report error
            onProgress({
              toolCall: {
                ...toolCall,
                status: 'error',
                result: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
              },
            });

            // Still append error result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            });
          }
        }
      } else {
        // No more tool calls, this is the final response
        finalResponse = contentBuffer;
      }
    }

    return finalResponse || 'No response generated';
  } catch (error) {
    console.error('Streaming API Error:', error);
    throw error;
  }
}
