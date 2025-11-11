import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './ChatHistory.css';
import { ConfirmDialog } from './ConfirmDialog';

export interface ChatMessage {
  id: string;
  timestamp: number;
  query: string;
  result: string;
  toolCalls: number;
  elapsedTime: number;
}

interface ChatHistoryProps {
  onLoadQuery: (query: string) => void;
  onRestoreConversation?: (message: ChatMessage) => void;
}

export interface ChatHistoryHandle {
  saveMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

export const ChatHistory = forwardRef<ChatHistoryHandle, ChatHistoryProps>(
  ({ onLoadQuery, onRestoreConversation }, ref) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Load history from localStorage on mount
    useEffect(() => {
      const savedHistory = localStorage.getItem('kimi_cyber_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to load history:', e);
        }
      }
    }, []);

    // Save a new chat message
    const saveMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      const updatedHistory = [newMessage, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('kimi_cyber_history', JSON.stringify(updatedHistory));
    };

    // Expose saveMessage to parent via ref
    useImperativeHandle(ref, () => ({
      saveMessage,
    }));

    // Clear all history
    const clearHistory = () => {
      setConfirmDialog({
        isOpen: true,
        title: '🗑️ Clear All History',
        message: 'Are you sure you want to clear all chat history? This action cannot be undone.',
        onConfirm: () => {
          setHistory([]);
          localStorage.removeItem('kimi_cyber_history');
        },
      });
    };

    // Delete a single message
    const deleteMessage = (id: string) => {
      setConfirmDialog({
        isOpen: true,
        title: '🗑️ Delete Message',
        message: 'Are you sure you want to delete this message from history?',
        onConfirm: () => {
          const updatedHistory = history.filter((msg) => msg.id !== id);
          setHistory(updatedHistory);
          localStorage.setItem('kimi_cyber_history', JSON.stringify(updatedHistory));
        },
      });
    };

    // Export history as JSON
    const exportHistory = () => {
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kimi-cyber-history-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    // Filter history based on search term
    const filteredHistory = history.filter(
      (msg) =>
        msg.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.result.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Format timestamp
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    // Format elapsed time
    const formatElapsed = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    };

    return (
      <>
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          danger={true}
          confirmText="Delete"
          cancelText="Cancel"
        />
        
        <button
          className="history-toggle"
          onClick={() => setIsOpen(!isOpen)}
          title="View Chat History"
        >
          📜 History ({history.length})
        </button>

        {isOpen && (
          <div className="history-modal">
            <div className="history-content">
              <div className="history-header">
                <h2>💬 Chat History</h2>
                <button onClick={() => setIsOpen(false)} className="close-btn">
                  ✕
                </button>
              </div>

              <div className="history-actions">
                <input
                  type="text"
                  placeholder="🔍 Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button onClick={exportHistory} className="action-btn">
                  📥 Export
                </button>
                <button onClick={clearHistory} className="action-btn danger">
                  🗑️ Clear All
                </button>
              </div>

              <div className="history-list">
                {filteredHistory.length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? (
                      <p>No messages found matching "{searchTerm}"</p>
                    ) : (
                      <p>No chat history yet. Start a conversation!</p>
                    )}
                  </div>
                ) : (
                  filteredHistory.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="history-item clickable"
                      onClick={() => {
                        if (onRestoreConversation) {
                          onRestoreConversation(msg);
                          setIsOpen(false);
                        }
                      }}
                      title="Click to restore this conversation"
                    >
                      <div className="history-item-header">
                        <span className="history-time">{formatTime(msg.timestamp)}</span>
                        <div className="history-item-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadQuery(msg.query);
                              setIsOpen(false);
                            }}
                            className="load-btn"
                            title="Load query only"
                          >
                            📝
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg.id);
                            }}
                            className="delete-btn"
                            title="Delete this message"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="history-query">
                        <strong>Query:</strong> {msg.query}
                      </div>

                      <div className="history-result">
                        <strong>Result:</strong>{' '}
                        {msg.result.length > 200
                          ? msg.result.substring(0, 200) + '...'
                          : msg.result}
                      </div>

                      <div className="history-meta">
                        <span>🔧 {msg.toolCalls} tool calls</span>
                        <span>⏱️ {formatElapsed(msg.elapsedTime)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ChatHistory.displayName = 'ChatHistory';

export default ChatHistory;
