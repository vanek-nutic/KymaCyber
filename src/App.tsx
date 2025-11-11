import { useState, useRef, useCallback, useEffect } from 'react';
import './styles/globals.css';
import './App.css';
import { queryKimiK2 } from './lib/api';
import { queryKimiK2Streaming } from './lib/api-streaming';
import type { ToolCall, Metrics } from './types';
import { FileUpload, type UploadedFile } from './components/FileUpload';
import { ChatHistory, type ChatHistoryHandle } from './components/ChatHistory';
import { ModelSelector } from './components/ModelSelector';
import { ReasoningPanel } from './components/ReasoningPanel';
import { MemoryPanel } from './components/MemoryPanel';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { downloadAsMarkdown, downloadAsText, downloadComprehensivePDF, generateFilename, detectGeneratedFiles } from './lib/export-utils';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const chatHistoryRef = useRef<ChatHistoryHandle>(null);
  const [query, setQuery] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [_uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>('kimi-k2-turbo-preview');
  const [_modelParams, setModelParams] = useState({ temperature: 0.6, max_tokens: 32000 });
  
  // State for panels
  const [_reasoningContent, setReasoningContent] = useState<string>(''); // For thinking models
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

  // State for memory panel
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);

  // Auto-adjust parameters when model changes
  useEffect(() => {
    if (selectedModel.includes('thinking')) {
      setModelParams({ temperature: 1.0, max_tokens: 16000 });
    } else {
      setModelParams({ temperature: 0.6, max_tokens: 32000 });
    }
  }, [selectedModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    // Reset state
    setReasoningContent('');
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
    let finalResult = '';
    let finalToolCallsCount = 0;

    try {
      // Load files from IndexedDB
      const { loadFiles } = await import('./lib/file-storage');
      const loadedFiles = await loadFiles();
      const filesForAPI = loadedFiles.map((f) => ({
        name: f.name,
        content: f.content
      }));
      
      if (useStreaming) {
        await queryKimiK2Streaming(query, selectedModel, _modelParams, filesForAPI, (update) => {
        // Update reasoning content (thinking models only)
        if (update.reasoningContent) {
          setReasoningContent((prev) => prev + update.reasoningContent);
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
          finalToolCallsCount++;
          setMetrics((prev) => ({
            ...prev,
            toolCalls: prev.toolCalls + 1,
          }));
        }

        // Update content
        if (update.content) {
          finalResult += update.content;
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
      } else {
        // Non-streaming mode (fallback)
        const response = await queryKimiK2(query, filesForAPI, (update) => {
          if (update.toolCall) {
            setToolCalls((prev) => {
              const existingIndex = prev.findIndex((tc) => tc.id === update.toolCall!.id);
              if (existingIndex >= 0) {
                const newToolCalls = [...prev];
                newToolCalls[existingIndex] = update.toolCall!;
                return newToolCalls;
              } else {
                return [...prev, update.toolCall!];
              }
            });
            finalToolCallsCount++;
            setMetrics((prev) => ({ ...prev, toolCalls: prev.toolCalls + 1 }));
          }
          if (update.content) {
            finalResult += update.content;
            setResult((prev) => prev + update.content);
          }
          if (update.metrics) {
            setMetrics((prev) => ({ ...prev, ...update.metrics }));
          }
          setMetrics((prev) => ({
            ...prev,
            elapsedTime: Math.floor((Date.now() - startTime) / 1000),
          }));
        });
        finalResult = response;
      }
    } catch (error) {
      console.error('Query failed:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      const finalElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setMetrics((prev) => ({
        ...prev,
        elapsedTime: finalElapsedTime,
      }));
      
      // Detect if AI mentioned generating files
      if (finalResult) {
        const detectedFiles = detectGeneratedFiles(finalResult);
        if (detectedFiles.length > 0) {
          console.log('Detected generated files:', detectedFiles);
          toast(
            `AI mentioned creating ${detectedFiles.length} file(s). Use export buttons to download the results!`,
            {
              duration: 5000,
              position: 'bottom-right',
              icon: '📁',
            }
          );
        }
      }
      
      // Save to chat history if we have a result
      if (finalResult && chatHistoryRef.current) {
        chatHistoryRef.current.saveMessage({
          query,
          result: finalResult,
          toolCalls: finalToolCallsCount,
          elapsedTime: finalElapsedTime,
        });
      }
    }
  };

  const handleLoadQuery = (loadedQuery: string) => {
    setQuery(loadedQuery);
    toast.success('Query loaded from history', {
      duration: 2000,
      position: 'bottom-right',
    });
  };

  const handleClear = useCallback(() => {
    setQuery('');
    setToolCalls([]);
    setResult('');
    setMetrics({
      thinkingTokens: 0,
      toolCalls: 0,
      elapsedTime: 0,
      inputTokens: 0,
      outputTokens: 0,
    });
    toast.success('Cleared all fields', {
      duration: 1500,
      position: 'bottom-right',
    });
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSubmit: () => {
      if (query.trim() && !isLoading) {
        handleSubmit(new Event('submit') as any);
      }
    },
    onClear: handleClear,
    onEscape: () => {
      // Blur active element
      (document.activeElement as HTMLElement)?.blur();
    },
  });

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
            <button
              type="button"
              className={`toggle-button ${useStreaming ? 'active' : ''}`}
              onClick={() => setUseStreaming(!useStreaming)}
              disabled={isLoading}
              title={useStreaming ? 'Streaming: ON' : 'Streaming: OFF'}
            >
              {useStreaming ? '⚡ Streaming' : '📦 Non-Streaming'}
            </button>
            <ChatHistory ref={chatHistoryRef} onLoadQuery={handleLoadQuery} />
            <button
              className="memory-button"
              onClick={() => setIsMemoryPanelOpen(true)}
              title="Open Memory Storage"
            >
              💾 Memory
            </button>
          </div>
          
          {/* Model Selection */}
          <div className="model-selection-row">
            <label className="model-label">🤖 AI Model:</label>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
          
          {/* File Upload */}
          <FileUpload onFilesChange={setUploadedFiles} />
        </form>
      </section>

      {/* Dynamic Panel Layout (2 or 3 panels based on model) */}
      <main className={`panels-container ${selectedModel.includes('thinking') ? 'three-panel' : 'two-panel'}`}>
        {/* Panel 1: Reasoning Content (only for thinking models) */}
        {selectedModel.includes('thinking') && (
          <div className="panel reasoning-panel-wrapper">
            <ReasoningPanel content={_reasoningContent} isStreaming={isLoading} />
          </div>
        )}

        {/* Panel 2: Tool Calls */}
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

        {/* Panel 3: Results */}
        <div className="panel results-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="panel-icon">📄</span>
              Results
            </h2>
            {result && (
              <div className="export-buttons">
                <button
                  className="export-btn copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success('Result copied to clipboard!', {
                      duration: 2000,
                      position: 'bottom-right',
                    });
                  }}
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
                <button
                  className="export-btn pdf-btn"
                  onClick={() => {
                    downloadComprehensivePDF(
                      query,
                      _reasoningContent,
                      toolCalls,
                      result,
                      metrics,
                      generateFilename('kimi-cyber-comprehensive-report', 'pdf')
                    );
                    toast.success('Comprehensive PDF report downloaded!', {
                      duration: 3000,
                      position: 'bottom-right',
                    });
                  }}
                  title="Download comprehensive PDF report with all research data"
                >
                  📥 PDF
                </button>
                <button
                  className="export-btn md-btn"
                  onClick={() => {
                    downloadAsMarkdown(result, generateFilename('kimi-cyber-report', 'md'));
                    toast.success('Markdown downloaded!', {
                      duration: 2000,
                      position: 'bottom-right',
                    });
                  }}
                  title="Download as Markdown"
                >
                  📝 MD
                </button>
                <button
                  className="export-btn txt-btn"
                  onClick={() => {
                    downloadAsText(result, generateFilename('kimi-cyber-report', 'txt'));
                    toast.success('Text file downloaded!', {
                      duration: 2000,
                      position: 'bottom-right',
                    });
                  }}
                  title="Download as Text"
                >
                  📄 TXT
                </button>
              </div>
            )}
          </div>
          <div className="panel-content">
            {result ? (
              <div className="result-content">
                <MarkdownRenderer content={result} />
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

      {/* Toast Notifications */}
      <Toaster />

      {/* Memory Panel */}
      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />
    </div>
  );
}

export default App;
