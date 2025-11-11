import { useState, useRef, useCallback, useEffect } from 'react';
import './styles/globals.css';
import './App.css';
import './components/SplineScene.css';
import { queryKimiK2 } from './lib/api';
import { queryKimiK2Streaming } from './lib/api-streaming';
import type { ToolCall, Metrics } from './types';
import { FileUpload, type UploadedFile } from './components/FileUpload';
import { ChatHistory, type ChatHistoryHandle } from './components/ChatHistory';
import { ModelSelector } from './components/ModelSelector';
import { ReasoningPanel } from './components/ReasoningPanel';
import { MemoryPanel } from './components/MemoryPanel';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { RobotSidebar } from './components/RobotSidebar';
import './components/RobotSidebar.css';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AIClarificationDialog } from './components/AIClarificationDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { detectGeneratedFiles } from './lib/export-utils';
import { generateDownloadableFiles, downloadFile, getMimeType, formatFileSize, type DownloadableFile } from './lib/file-download';
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

  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState<DownloadableFile[]>([]);

  // State for memory panel
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);

  // State for conversation history
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // State for confirmation dialogs
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // State for AI clarification dialog
  const [clarificationDialog, setClarificationDialog] = useState({
    isOpen: false,
    context: ''
  });

  // State for cumulative stats
  const [cumulativeStats, setCumulativeStats] = useState({
    totalQueries: 0,
    totalToolCalls: 0,
    totalTime: 0,
  });

  // Detect downloadable files after streaming completes
  useEffect(() => {
    if (!isLoading && result) {
      console.log('[File Download] Detecting files in result...');
      const files = generateDownloadableFiles(result);
      console.log('[File Download] Files detected:', files);
      setDownloadableFiles(files);
    } else if (!result) {
      setDownloadableFiles([]);
    }
  }, [isLoading, result]);

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
    
    // Save current query to conversation history
    const currentQuery = query;
    setConversationHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
    
    // Reset state for new response
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

    // Load files from IndexedDB (outside try block for fallback access)
    const { loadFiles } = await import('./lib/file-storage');
    const loadedFiles = await loadFiles();
    console.log('[DEBUG] Loaded files from IndexedDB:', loadedFiles.length, 'files');
    const filesForAPI = loadedFiles.map((f) => ({
        name: f.name,
        content: f.content
      }));
      console.log('[DEBUG] Files for API:', filesForAPI.length, 'files', filesForAPI.map(f => `${f.name} (${f.content.length} chars)`));
      
    // Build query with conversation history
    let queryWithHistory = currentQuery;
    if (conversationHistory.length > 0) {
      // Include last 5 exchanges (10 messages) for context
      const recentHistory = conversationHistory.slice(-10);
      const historyContext = recentHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      queryWithHistory = `Previous conversation:\n${historyContext}\n\n---\n\nUser's current message: ${currentQuery}`;
      console.log('[Conversation] Including', recentHistory.length, 'previous messages for context');
    }
      
    try {
      if (useStreaming) {
        await queryKimiK2Streaming(queryWithHistory, selectedModel, _modelParams, filesForAPI, (update) => {
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
        const response = await queryKimiK2(queryWithHistory, filesForAPI, (update) => {
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
      
      // Check if K2 Thinking is overloaded and fallback to K2 Thinking Turbo
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isEngineOverloaded = errorMessage.includes('engine_overloaded_error') || errorMessage.includes('currently overloaded');
      const isK2Thinking = selectedModel === 'kimi-k2-thinking';
      
      if (isEngineOverloaded && isK2Thinking) {
        // Automatic fallback to K2 Thinking Turbo
        const fallbackModel = 'kimi-k2-thinking-turbo';
        setResult(`⚠️ K2 Thinking is currently overloaded. Automatically switching to K2 Thinking Turbo...\n\n`);
        
        try {
          // Retry with fallback model
          let fallbackResult = '';
          
          if (useStreaming) {
            await queryKimiK2Streaming(queryWithHistory, fallbackModel, _modelParams, filesForAPI, (update) => {
              if (update.reasoningContent) {
                setReasoningContent((prev) => prev + update.reasoningContent);
              }
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
                fallbackResult += update.content;
                setResult((prev) => prev + update.content);
              }
            });
          } else {
            const response = await queryKimiK2(queryWithHistory, filesForAPI);
            fallbackResult = response;
            setResult((prev) => prev + response);
          }
          
          // Success message
          console.log(`✅ Successfully used ${fallbackModel} as fallback`);
          
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setResult(`Error: Both K2 Thinking and K2 Thinking Turbo are currently unavailable.\n\n${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}\n\nPlease try again in a few minutes.`);
        }
      } else {
        // Enhanced error handling with user-friendly messages
        let userFriendlyMessage = errorMessage;
        
        // Network errors
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
          userFriendlyMessage = '🚫 Network Error: Unable to connect to the AI service. Please check your internet connection and try again.';
          toast.error('Network connection failed', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        // Rate limit errors
        else if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
          userFriendlyMessage = '⏱️ Rate Limit: Too many requests. Please wait a moment and try again.';
          toast.error('Rate limit exceeded', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        // Authentication errors
        else if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
          userFriendlyMessage = '🔒 Authentication Error: API key issue. Please contact support.';
          toast.error('Authentication failed', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        // Timeout errors
        else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          userFriendlyMessage = '⏰ Timeout Error: The request took too long. Please try again with a simpler query.';
          toast.error('Request timed out', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        // Server errors
        else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
          userFriendlyMessage = '🔧 Server Error: The AI service is temporarily unavailable. Please try again in a few minutes.';
          toast.error('Server error', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        // Generic error with retry suggestion
        else {
          toast.error('Query failed', {
            duration: 4000,
            position: 'bottom-right',
          });
        }
        
        setResult(`❌ **Error**\n\n${userFriendlyMessage}\n\n**What you can try:**\n- Check your internet connection\n- Try a simpler query\n- Wait a moment and retry\n- Contact support if the issue persists\n\n*Technical details: ${errorMessage}*`);
      }
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
      
      // Save assistant response to conversation history
      if (finalResult) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: finalResult }]);
      }
      
      // Save to chat history if we      // Save to chat history
      if (chatHistoryRef.current) {
        chatHistoryRef.current.saveMessage({
          query: currentQuery,
          result: finalResult,
          toolCalls: finalToolCallsCount,
          elapsedTime: finalElapsedTime,
        });
      }

      // Update cumulative stats
      setCumulativeStats(prev => ({
        totalQueries: prev.totalQueries + 1,
        totalToolCalls: prev.totalToolCalls + finalToolCallsCount,
        totalTime: prev.totalTime + finalElapsedTime,
      }));
    }
  };

  const handleLoadQuery = (loadedQuery: string) => {
    setQuery(loadedQuery);
    toast.success('Query loaded from history', {
      duration: 2000,
      position: 'bottom-right',
    });
  };

  const handleRestoreConversation = (message: any) => {
    setQuery(message.query);
    setResult(message.result);
    setMetrics({
      thinkingTokens: 0,
      toolCalls: message.toolCalls || 0,
      elapsedTime: message.elapsedTime || 0,
      inputTokens: 0,
      outputTokens: 0,
    });
    toast.success('Conversation restored!', {
      duration: 2000,
      position: 'bottom-right',
      icon: '🔄',
    });
  };

  const handleClearConfirmed = useCallback(() => {
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
    setConversationHistory([]);
    toast.success('Cleared!', {
      duration: 1500,
      position: 'bottom-right',
    });
  }, []);

  const handleClear = useCallback(() => {
    if (result || query) {
      setShowClearConfirm(true);
    }
  }, [result, query]);

  // Handle AI clarification submission
  const handleClarificationSubmit = useCallback((input: string) => {
    // Append clarification to query and restart
    const clarificationContext = `${query}\n\n[User Clarification]\n${input}`;
    setQuery(clarificationContext);
    setClarificationDialog({ isOpen: false, context: '' });
    
    // Auto-submit with the clarification
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
    
    toast.success('Clarification sent to AI', {
      duration: 2000,
      position: 'bottom-right',
    });
  }, [query]);

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
    <>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="🧹 Clear All"
        message="Are you sure you want to clear the query, results, and conversation history?"
        onConfirm={handleClearConfirmed}
        onCancel={() => setShowClearConfirm(false)}
        danger={true}
        confirmText="Clear All"
        cancelText="Cancel"
      />

      {/* Robot Sidebar - Fixed on right */}
      <RobotSidebar />
      
      {/* Main Content Area */}
      <div className="main-content-area">
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
            {/* Primary Actions Group */}
            <div className="button-group primary-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading || !query.trim()}
                title="Submit query (Ctrl+Enter)"
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
                title="Clear all fields (Ctrl+K)"
              >
                🧹 Clear
              </button>
              <button
                type="button"
                className="ask-ai-button"
                onClick={() => setClarificationDialog({ isOpen: true, context: result })}
                disabled={isLoading}
                title="Ask AI a question or provide clarification"
              >
                🤖 Ask AI
              </button>
            </div>

            {/* Secondary Actions Group */}
            <div className="button-group secondary-actions">
              <ChatHistory 
                ref={chatHistoryRef} 
                onLoadQuery={handleLoadQuery}
                onRestoreConversation={handleRestoreConversation}
              />
              <button
                className="memory-button"
                onClick={() => setIsMemoryPanelOpen(true)}
                title="Open Memory Storage"
              >
                💾 Memory
              </button>
            </div>

            {/* Settings Group */}
            <div className="button-group settings-actions">
              <button
                type="button"
                className={`toggle-button ${useStreaming ? 'active' : ''}`}
                onClick={() => setUseStreaming(!useStreaming)}
                disabled={isLoading}
                title={useStreaming ? 'Streaming: ON (faster responses)' : 'Streaming: OFF'}
              >
                {useStreaming ? '⚡ Streaming' : '📦 Non-Streaming'}
              </button>
            </div>
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

          </div>
          <div className="panel-content">
            {result ? (
              <>
                <div className="result-content">
                  <MarkdownRenderer content={result} />
                </div>
                {downloadableFiles.length > 0 && (
                  <div className="downloadable-files-section">
                    <h3 className="downloadable-files-title">📦 Generated Files</h3>
                    <div className="downloadable-files-list">
                      {downloadableFiles.map((file, index) => (
                        <div key={index} className="downloadable-file-item">
                          <div className="file-info">
                            <button
                              className="file-name-btn"
                              onClick={() => {
                                downloadFile(file.filename, file.content, getMimeType(file.type));
                                toast.success(`Downloaded ${file.filename}!`, {
                                  duration: 2000,
                                  position: 'bottom-right',
                                });
                              }}
                              title={`Click to download ${file.filename}`}
                            >
                              📥 {file.filename}
                            </button>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                          </div>
                          {file.description && (
                            <div className="file-description">{file.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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

      {/* Metrics Bar - Only show when there's activity */}
      {(isLoading || result) && (
        <footer className={`metrics-bar ${isLoading ? 'active' : ''}`}>
          <div className="metrics-section current-query">
            <h4 className="section-title">🔍 Current Query</h4>
            <div className="metrics-row">
              <div className="metric" title="Reasoning tokens used by thinking models">
                <span className="metric-label">Thinking:</span>
                <span className="metric-value">{metrics.thinkingTokens}</span>
              </div>
              <div className="metric" title="Number of tools called">
                <span className="metric-label">Tools:</span>
                <span className="metric-value">{metrics.toolCalls}</span>
              </div>
              <div className="metric" title="Time elapsed for current query">
                <span className="metric-label">Time:</span>
                <span className="metric-value">{metrics.elapsedTime}s</span>
              </div>
              <div className="metric" title="Input tokens sent to AI">
                <span className="metric-label">Input:</span>
                <span className="metric-value">{metrics.inputTokens}</span>
              </div>
              <div className="metric" title="Output tokens received from AI">
                <span className="metric-label">Output:</span>
                <span className="metric-value">{metrics.outputTokens}</span>
              </div>
            </div>
          </div>
          
          {cumulativeStats.totalQueries > 0 && (
            <div className="metrics-section cumulative-stats">
              <h4 className="section-title">📊 Session Stats</h4>
              <div className="metrics-row">
                <div className="metric" title="Total queries in this session">
                  <span className="metric-label">Queries:</span>
                  <span className="metric-value">{cumulativeStats.totalQueries}</span>
                </div>
                <div className="metric" title="Total tool calls in this session">
                  <span className="metric-label">Total Tools:</span>
                  <span className="metric-value">{cumulativeStats.totalToolCalls}</span>
                </div>
                <div className="metric" title="Total time spent in this session">
                  <span className="metric-label">Total Time:</span>
                  <span className="metric-value">{Math.floor(cumulativeStats.totalTime / 60)}m {cumulativeStats.totalTime % 60}s</span>
                </div>
              </div>
            </div>
          )}
        </footer>
      )}

      {/* Toast Notifications */}
      <Toaster />

      {/* Memory Panel */}
      <MemoryPanel
        isOpen={isMemoryPanelOpen}
        onClose={() => setIsMemoryPanelOpen(false)}
      />

      {/* AI Clarification Dialog */}
      <AIClarificationDialog
        isOpen={clarificationDialog.isOpen}
        context={clarificationDialog.context}
        placeholder="Type your response or clarification here..."
        onSubmit={handleClarificationSubmit}
        onCancel={() => setClarificationDialog({ isOpen: false, context: '' })}
      />
    </div>
    </div>
    </>
  );
}

export default App;
