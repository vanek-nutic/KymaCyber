/**
 * Reasoning Panel Component
 * Displays AI's internal reasoning process for thinking models
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReasoningPanelProps {
  content: string;
  isStreaming: boolean;
}

export function ReasoningPanel({ content, isStreaming }: ReasoningPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    // Could add toast notification here
  };

  return (
    <div className="reasoning-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🧠</span>
          <span>AI Reasoning Process</span>
          {isStreaming && <span className="streaming-indicator">●</span>}
        </div>
        <div className="panel-actions">
          <button
            className="icon-button"
            onClick={handleCopy}
            title="Copy reasoning"
            disabled={!content}
          >
            📋
          </button>
          <button
            className="icon-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          {content ? (
            <div className="reasoning-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state">
              <p>Reasoning process will appear here when using thinking models...</p>
              <p className="hint">
                💡 Select <strong>kimi-k2-thinking</strong> or{' '}
                <strong>kimi-k2-thinking-turbo</strong> to see the AI's internal thought process
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
