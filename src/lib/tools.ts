/**
 * Kimi Cyber - Tool Definitions
 * Comprehensive tool definitions for Moonshot AI capabilities
 */

import type { ToolDefinition } from '../types';

/**
 * Get all available tool definitions
 * Based on Moonshot documentation and common tool patterns
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return [
    // 1. Web Search - Already working
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the internet for current information, news, facts, or real-time data. Use this when you need up-to-date information that may not be in your training data.',
        parameters: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              description: 'The search query to look up on the internet. Be specific and include relevant keywords.',
            },
          },
        },
      },
    },

    // 2. Code Runner - Python execution
    {
      type: 'function',
      function: {
        name: 'code_runner',
        description: 'Execute Python code in a sandboxed environment. Use for calculations, data analysis, algorithms, or any computational task. Returns the output or any errors.',
        parameters: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'The Python code to execute. Can include imports, functions, and print statements. Output will be captured.',
            },
          },
        },
      },
    },

    // 3. QuickJS - JavaScript execution
    {
      type: 'function',
      function: {
        name: 'quickjs',
        description: 'Execute JavaScript code for simple calculations, string manipulations, or JSON processing. Lightweight and fast for basic operations.',
        parameters: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'The JavaScript code to execute. Returns the result of the last expression or console.log output.',
            },
          },
        },
      },
    },

    // 4. Fetch - URL content retrieval
    {
      type: 'function',
      function: {
        name: 'fetch',
        description: 'Fetch and retrieve content from a specific URL. Returns the HTML, text, or structured content from the webpage.',
        parameters: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              description: 'The full URL to fetch content from (must include http:// or https://)',
            },
          },
        },
      },
    },

    // 5. Convert - Unit conversions
    {
      type: 'function',
      function: {
        name: 'convert',
        description: 'Convert between different units of measurement (temperature, distance, weight, time, etc.)',
        parameters: {
          type: 'object',
          required: ['value', 'from_unit', 'to_unit'],
          properties: {
            value: {
              type: 'number',
              description: 'The numeric value to convert',
            },
            from_unit: {
              type: 'string',
              description: 'The source unit (e.g., "celsius", "miles", "kg")',
            },
            to_unit: {
              type: 'string',
              description: 'The target unit (e.g., "fahrenheit", "km", "lbs")',
            },
          },
        },
      },
    },

    // 6. Date - Date/time calculations
    {
      type: 'function',
      function: {
        name: 'date',
        description: 'Perform date and time calculations, conversions, or formatting operations.',
        parameters: {
          type: 'object',
          required: ['operation'],
          properties: {
            operation: {
              type: 'string',
              description: 'The date operation to perform (e.g., "add_days", "format", "diff", "parse")',
            },
            date: {
              type: 'string',
              description: 'The date to operate on (ISO format or natural language)',
            },
            value: {
              type: 'string',
              description: 'Additional value for the operation (e.g., number of days, format string)',
            },
          },
        },
      },
    },

    // 7. Base64 - Encoding/decoding
    {
      type: 'function',
      function: {
        name: 'base64',
        description: 'Encode or decode data using Base64 encoding.',
        parameters: {
          type: 'object',
          required: ['operation', 'data'],
          properties: {
            operation: {
              type: 'string',
              description: 'Either "encode" or "decode"',
              enum: ['encode', 'decode'],
            },
            data: {
              type: 'string',
              description: 'The data to encode or decode',
            },
          },
        },
      },
    },

    // 8. Memory - Persistent storage and retrieval
    {
      type: 'function',
      function: {
        name: 'memory',
        description: 'Memory storage and retrieval system for persistent conversation history and user preferences. Use this to remember important information across sessions, store user preferences, or recall previously saved facts.',
        parameters: {
          type: 'object',
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: ['store', 'retrieve', 'search'],
              description: 'Action to perform: store (save information), retrieve (get specific information by key), or search (find relevant memories by query)',
            },
            key: {
              type: 'string',
              description: 'Key for storage/retrieval (required for store and retrieve actions). Use descriptive keys like "user_name", "preferred_format", etc.',
            },
            value: {
              type: 'string',
              description: 'Value to store (required for store action). Can be any text information to remember.',
            },
            query: {
              type: 'string',
              description: 'Search query to find relevant memories (required for search action)',
            },
          },
        },
      },
    },

    // 9. Random Choice - Random selection
    {
      type: 'function',
      function: {
        name: 'random_choice',
        description: 'Make a random selection from a list of options or generate random numbers.',
        parameters: {
          type: 'object',
          required: ['options'],
          properties: {
            options: {
              type: 'array',
              description: 'Array of options to choose from',
              items: {
                type: 'string',
              },
            },
            count: {
              type: 'number',
              description: 'Number of items to select (default: 1)',
            },
          },
        },
      },
    },
  ];
}

/**
 * Get tool definition by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return getAllToolDefinitions().find(
    (tool) => tool.function.name === name
  );
}

/**
 * Get list of all tool names
 */
export function getAllToolNames(): string[] {
  return getAllToolDefinitions().map((tool) => tool.function.name);
}
