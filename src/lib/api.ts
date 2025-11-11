/**
 * Kimi Cyber API - Non-Streaming Implementation
 * Starting simple with just web-search tool to verify functionality
 * Based on Moonshot documentation: https://platform.moonshot.ai/docs/guide/use-kimi-api-to-complete-tool-calls
 */

import type { ToolCall, ToolDefinition, Message } from '../types';

const API_BASE_URL = 'https://api.moonshot.ai/v1';
const API_KEY = import.meta.env.VITE_MOONSHOT_API_KEY || 'sk-UousIBehzfnqFSVL3UHD7vr1uesytwg9P2vop9x53LNmJsyW';

// Debug: Check if API key is loaded
console.log('API_KEY loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT LOADED');
console.log('Using env var:', import.meta.env.VITE_MOONSHOT_API_KEY ? 'YES' : 'NO (using fallback)');

/**
 * Define web-search tool using JSON Schema format
 * This is a custom tool definition - we'll implement the search ourselves
 */
function getWebSearchToolDefinition(): ToolDefinition {
  return {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the internet for current information, news, or facts.',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the internet',
          },
        },
      },
    },
  };
}

/**
 * Execute web search using Tavily API
 */
async function executeWebSearch(query: string): Promise<string> {
  const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Format results
    const results = {
      answer: data.answer || '',
      results: data.results?.slice(0, 3).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content?.substring(0, 200),
      })) || [],
    };

    return JSON.stringify(results, null, 2);
  } catch (error) {
    console.error('Web search error:', error);
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
}

/**
 * Query Kimi K2 with tool support (non-streaming)
 * This is a simple implementation to verify the basic flow works
 */
export async function queryKimiK2(
  query: string,
  onProgress?: (update: {
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
    // Step 1: Define tools
    const tools = [getWebSearchToolDefinition()];
    
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

    // Step 3: Loop until no more tool calls
    while (finish_reason === null || finish_reason === 'tool_calls') {
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      finish_reason = choice.finish_reason;
      const assistantMessage = choice.message;

      // Update metrics
      if (data.usage) {
        totalInputTokens += data.usage.prompt_tokens || 0;
        totalOutputTokens += data.usage.completion_tokens || 0;
        
        if (onProgress) {
          onProgress({
            metrics: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
            },
          });
        }
      }

      // Step 4: Check if there are tool calls
      if (finish_reason === 'tool_calls' && assistantMessage.tool_calls) {
        // CRITICAL: Append assistant message to messages array
        messages.push(assistantMessage);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          // Report tool call as pending
          if (onProgress) {
            onProgress({
              toolCall: {
                ...toolCall,
                status: 'pending',
                timestamp: Date.now(),
              },
            });
          }

          try {
            // Parse arguments
            const args = JSON.parse(toolCall.function.arguments);
            
            // Execute the tool
            let result: string;
            if (toolCall.function.name === 'web_search') {
              result = await executeWebSearch(args.query);
            } else {
              result = JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
            }

            // Report success
            if (onProgress) {
              onProgress({
                toolCall: {
                  ...toolCall,
                  status: 'success',
                  result,
                  timestamp: Date.now(),
                },
              });
            }

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
            if (onProgress) {
              onProgress({
                toolCall: {
                  ...toolCall,
                  status: 'error',
                  result: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: Date.now(),
                },
              });
            }

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
        finalResponse = assistantMessage.content || '';
        
        if (onProgress && finalResponse) {
          onProgress({
            content: finalResponse,
          });
        }
      }
    }

    return finalResponse || 'No response generated';
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
