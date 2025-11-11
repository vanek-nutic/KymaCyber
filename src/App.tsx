import { useState } from 'react';
import './styles/globals.css';
import './App.css';
import { queryKimiK2 } from './lib/api';
import type { ToolCall, Metrics } from './types';

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for panels
  const [thinking, setThinking] = useState<string>('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [result, setResult] = useState<string>('');
  
  // State for metrics
  const [metrics, setMetrics] = useState<Metrics>({
    thinkingTokens: 0,
    toolCalls: 0,
    elapsedTime: 0,
    inputTokens: 0,
    outputTokens: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    // Reset state
    setThinking('');
    setToolCalls([]);
    setResult('');
    setMetrics({
      thinkingTokens: 0,
      toolCalls: 0,
      elapsedTime: 0,
      inputTokens: 0,
      outputTokens: 0,
    });
    
    setIsLoading(true);
    const startTime = Date.now();

    try {
      await queryKimiK2(query, (update) => {
        // Update thinking
        if (update.thinking) {
          setThinking((prev) => prev + update.thinking);
        }

        // Update tool calls
        if (update.toolCall) {
          setToolCalls((prev) => {
            // Check if this tool call already exists
            const existingIndex = prev.findIndex((tc) => tc.id === update.toolCall!.id);
            if (existingIndex >= 0) {
              // Update existing tool call
              const newToolCalls = [...prev];
              newToolCalls[existingIndex] = update.toolCall!;
              return newToolCalls;
            } else {
              // Add new tool call
              return [...prev, update.toolCall!];
            }
          });

          // Update tool calls count
          setMetrics((prev) => ({
            ...prev,
            toolCalls: prev.toolCalls + 1,
          }));
        }

        // Update content
        if (update.content) {
          setResult((prev) => prev + update.content);
        }

        // Update metrics
        if (update.metrics) {
          setMetrics((prev) => ({
            ...prev,
            ...update.metrics,
          }));
        }

        // Update elapsed time
        setMetrics((prev) => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - startTime) / 1000),
        }));
      });
    } catch (error) {
      console.error('Query failed:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setMetrics((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - startTime) / 1000),
      }));
    }
  };

  const handleClear = () => {
    setQuery('');
    setThinking('');
    setToolCalls([]);
    setResult('');
    setMetrics({
      thinkingTokens: 0,
      toolCalls: 0,
      elapsedTime: 0,
      inputTokens: 0,
      outputTokens: 0,
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">⚡</div>
            <h1 className="app-title">Kimi Cyber</h1>
          </div>
          <p className="app-subtitle">
            AI Extended Thinking with Multi-Tool Orchestration
          </p>
        </div>
      </header>

      {/* Input Section */}
      <section className="input-section">
        <form onSubmit={handleSubmit} className="query-form">
          <textarea
            className="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research query... (Ctrl+Enter to submit)"
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit(e);
              }
            }}
          />
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Submit Query
                </>
              )}
            </button>
            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Three-Panel Layout */}
      <main className="panels-container">
        {/* Left Panel: AI Thinking */}
        <div className="panel thinking-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-icon">🧠</span>
              AI Thinking Process
            </h2>
          </div>
          <div className="panel-content">
            {thinking ? (
              <div className="thinking-content">
                <pre>{thinking}</pre>
              </div>
            ) : (
              <div className="empty-state">
                <p>No thinking steps recorded</p>
                <span className="empty-hint">
                  Submit a query to see the AI's reasoning process
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Tool Calls */}
        <div className="panel tools-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-icon">🔧</span>
              Tool Calls
            </h2>
          </div>
          <div className="panel-content">
            {toolCalls.length > 0 ? (
              <div className="tool-calls-list">
                {toolCalls.map((toolCall) => (
                  <div key={toolCall.id} className="tool-call-item">
                    <div className="tool-call-header">
                      <span className="tool-name">{toolCall.function?.name || 'Unknown Tool'}</span>
                      <span className={`tool-status status-${toolCall.status || 'pending'}`}>
                        {toolCall.status || 'pending'}
                      </span>
                    </div>
                    {toolCall.function?.arguments && (
                      <div className="tool-arguments">
                        <strong>Arguments:</strong>
                        <pre>{toolCall.function.arguments}</pre>
                      </div>
                    )}
                    {toolCall.result && (
                      <div className="tool-result">
                        <strong>Result:</strong>
                        <pre>{toolCall.result.substring(0, 200)}...</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Waiting for tool calls...</p>
                <span className="empty-hint">
                  The AI will use tools to gather information
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="panel results-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-icon">📄</span>
              Results
            </h2>
          </div>
          <div className="panel-content">
            {result ? (
              <div className="result-content">
                <div className="markdown-content">{result}</div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Waiting for results...</p>
                <span className="empty-hint">
                  Final results will appear here
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Metrics Bar */}
      <footer className="metrics-bar">
        <div className="metric">
          <span className="metric-label">Thinking Tokens:</span>
          <span className="metric-value">{metrics.thinkingTokens}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Tool Calls:</span>
          <span className="metric-value">{metrics.toolCalls}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Elapsed Time:</span>
          <span className="metric-value">{metrics.elapsedTime}s</span>
        </div>
        <div className="metric">
          <span className="metric-label">Input Tokens:</span>
          <span className="metric-value">{metrics.inputTokens}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Output Tokens:</span>
          <span className="metric-value">{metrics.outputTokens}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
