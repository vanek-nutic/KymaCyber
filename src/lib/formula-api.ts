/**
 * Formula API Client
 * 
 * Handles communication with Moonshot AI's Formula API for official tools
 * like memory, rethink, etc.
 */

export class FormulaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1';
    this.apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';
  }

  /**
   * Get tool definitions from Formula API
   * @param formulaUri - Formula URI (e.g., "moonshot/memory:latest")
   * @returns Array of tool definitions
   */
  async getTools(formulaUri: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/formulas/${formulaUri}/tools`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get tools: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('Error getting tools from Formula API:', error);
      throw error;
    }
  }

  /**
   * Call an official tool via Formula API
   * @param formulaUri - Formula URI (e.g., "moonshot/memory:latest")
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @returns Tool execution result
   */
  async callTool(formulaUri: string, functionName: string, args: any): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/formulas/${formulaUri}/fibers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: functionName,
            arguments: JSON.stringify(args)
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to call tool: ${response.status} ${response.statusText}`);
      }

      const fiber = await response.json();

      // Check if execution succeeded
      if (fiber.status === 'succeeded') {
        return fiber.context?.output || fiber.context?.encrypted_output || '';
      }

      // Handle errors
      if (fiber.error) {
        throw new Error(fiber.error);
      }

      if (fiber.context?.error) {
        throw new Error(fiber.context.error);
      }

      throw new Error('Unknown error calling tool');
    } catch (error) {
      console.error('Error calling tool via Formula API:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const formulaClient = new FormulaClient();
