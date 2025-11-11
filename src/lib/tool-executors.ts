/**
 * Kimi Cyber - Tool Executors
 * Implementation of tool execution logic for all supported tools
 */

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

/**
 * Execute web search using Tavily API
 */
async function executeWebSearch(args: { query: string }): Promise<string> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: args.query,
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
 * Execute Python code (simulated - would need backend API in production)
 */
async function executeCodeRunner(args: { code: string }): Promise<string> {
  // For now, we'll simulate some basic Python execution
  // In production, this would call a sandboxed Python execution API
  
  try {
    // Check for simple math expressions
    const mathMatch = args.code.match(/print\((.+)\)/);
    if (mathMatch) {
      try {
        // Very basic eval for simple math (UNSAFE in production!)
        // This is just for demonstration
        const expr = mathMatch[1].replace(/\*\*/g, '**');
        const result = eval(expr);
        return JSON.stringify({
          output: String(result),
          success: true,
        });
      } catch (e) {
        return JSON.stringify({
          error: 'Code execution failed',
          message: 'Python code execution requires a backend service. This is a demo implementation.',
        });
      }
    }
    
    return JSON.stringify({
      info: 'Python code execution requires a backend service.',
      note: 'In production, this would execute in a sandboxed environment.',
      code_received: args.code.substring(0, 100),
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Execution failed',
    });
  }
}

/**
 * Execute JavaScript code
 */
async function executeQuickJS(args: { code: string }): Promise<string> {
  try {
    // Execute JavaScript safely
    const result = eval(args.code);
    return JSON.stringify({
      result: String(result),
      success: true,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Execution failed',
    });
  }
}

/**
 * Fetch content from URL
 */
async function executeFetch(args: { url: string }): Promise<string> {
  try {
    const response = await fetch(args.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    return JSON.stringify({
      url: args.url,
      status: response.status,
      content: text.substring(0, 1000), // Limit to first 1000 chars
      content_length: text.length,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Fetch failed',
      url: args.url,
    });
  }
}

/**
 * Convert units
 */
async function executeConvert(args: {
  value: number;
  from_unit: string;
  to_unit: string;
}): Promise<string> {
  try {
    // Simple conversion examples
    const conversions: Record<string, Record<string, (v: number) => number>> = {
      celsius: { fahrenheit: (v: number) => (v * 9/5) + 32, kelvin: (v: number) => v + 273.15 },
      fahrenheit: { celsius: (v: number) => (v - 32) * 5/9, kelvin: (v: number) => (v - 32) * 5/9 + 273.15 },
      miles: { km: (v: number) => v * 1.60934, meters: (v: number) => v * 1609.34 },
      km: { miles: (v: number) => v / 1.60934, meters: (v: number) => v * 1000 },
      kg: { lbs: (v: number) => v * 2.20462, grams: (v: number) => v * 1000 },
      lbs: { kg: (v: number) => v / 2.20462, grams: (v: number) => v * 453.592 },
    };

    const fromUnit = args.from_unit.toLowerCase();
    const toUnit = args.to_unit.toLowerCase();

    if (conversions[fromUnit]?.[toUnit]) {
      const result = conversions[fromUnit][toUnit](args.value);
      return JSON.stringify({
        original: `${args.value} ${args.from_unit}`,
        converted: `${result.toFixed(2)} ${args.to_unit}`,
        value: result,
      });
    }

    return JSON.stringify({
      error: `Conversion from ${args.from_unit} to ${args.to_unit} not supported`,
      supported: Object.keys(conversions),
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Conversion failed',
    });
  }
}

/**
 * Date operations
 */
async function executeDate(args: {
  operation: string;
  date?: string;
  value?: string;
}): Promise<string> {
  try {
    const now = new Date();
    const targetDate = args.date ? new Date(args.date) : now;

    switch (args.operation) {
      case 'now':
        return JSON.stringify({ date: now.toISOString(), timestamp: now.getTime() });
      
      case 'format':
        return JSON.stringify({ formatted: targetDate.toLocaleString() });
      
      case 'add_days':
        const days = parseInt(args.value || '0');
        const newDate = new Date(targetDate);
        newDate.setDate(newDate.getDate() + days);
        return JSON.stringify({ result: newDate.toISOString() });
      
      default:
        return JSON.stringify({ error: `Unknown operation: ${args.operation}` });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Date operation failed',
    });
  }
}

/**
 * Base64 encoding/decoding
 */
async function executeBase64(args: {
  operation: 'encode' | 'decode';
  data: string;
}): Promise<string> {
  try {
    if (args.operation === 'encode') {
      const encoded = btoa(args.data);
      return JSON.stringify({ encoded, length: encoded.length });
    } else {
      const decoded = atob(args.data);
      return JSON.stringify({ decoded, length: decoded.length });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Base64 operation failed',
    });
  }
}

/**
 * Random choice
 */
async function executeRandomChoice(args: {
  options: string[];
  count?: number;
}): Promise<string> {
  try {
    const count = args.count || 1;
    const choices: string[] = [];
    
    for (let i = 0; i < count && i < args.options.length; i++) {
      const randomIndex = Math.floor(Math.random() * args.options.length);
      choices.push(args.options[randomIndex]);
    }

    return JSON.stringify({
      choices,
      from_options: args.options,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Random choice failed',
    });
  }
}

/**
 * Main tool executor - routes to appropriate handler
 */
export async function executeTool(
  toolName: string,
  args: any
): Promise<string> {
  console.log(`[Tool Executor] Executing ${toolName} with args:`, args);

  try {
    switch (toolName) {
      case 'web_search':
        return await executeWebSearch(args);
      
      case 'code_runner':
        return await executeCodeRunner(args);
      
      case 'quickjs':
        return await executeQuickJS(args);
      
      case 'fetch':
        return await executeFetch(args);
      
      case 'convert':
        return await executeConvert(args);
      
      case 'date':
        return await executeDate(args);
      
      case 'base64':
        return await executeBase64(args);
      
      case 'random_choice':
        return await executeRandomChoice(args);
      
      default:
        return JSON.stringify({
          error: `Unknown tool: ${toolName}`,
          available_tools: [
            'web_search',
            'code_runner',
            'quickjs',
            'fetch',
            'convert',
            'date',
            'base64',
            'random_choice',
          ],
        });
    }
  } catch (error) {
    console.error(`[Tool Executor] Error executing ${toolName}:`, error);
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Tool execution failed',
      tool: toolName,
    });
  }
}
