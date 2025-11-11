import React, { useState, useEffect } from 'react';
import { formulaClient } from '../lib/formula-api';
import './MemoryPanel.css';

interface Memory {
  key: string;
  value: string;
  timestamp: number;
}

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = () => {
    try {
      // Load memories from localStorage (cached)
      const cached = localStorage.getItem('kimi_memories');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Sort by timestamp descending (newest first)
        parsed.sort((a: Memory, b: Memory) => b.timestamp - a.timestamp);
        setMemories(parsed);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      showMessage('error', 'Failed to load memories');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const saveMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      showMessage('error', 'Please enter both key and value');
      return;
    }

    setIsLoading(true);
    try {
      // Save via Formula API
      await formulaClient.callTool(
        'moonshot/memory:latest',
        'memory',
        {
          action: 'store',
          key: newKey.trim(),
          value: newValue.trim()
        }
      );

      // Update local cache
      const memory: Memory = {
        key: newKey.trim(),
        value: newValue.trim(),
        timestamp: Date.now()
      };

      const updated = [...memories];
      const existingIndex = updated.findIndex(m => m.key === memory.key);
      
      if (existingIndex >= 0) {
        updated[existingIndex] = memory;
      } else {
        updated.unshift(memory); // Add to beginning
      }

      setMemories(updated);
      localStorage.setItem('kimi_memories', JSON.stringify(updated));

      // Clear form
      setNewKey('');
      setNewValue('');
      
      showMessage('success', 'Memory saved successfully!');
    } catch (error) {
      console.error('Error saving memory:', error);
      showMessage('error', 'Failed to save memory');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = (key: string) => {
    if (!confirm(`Delete memory "${key}"?`)) return;

    const updated = memories.filter(m => m.key !== key);
    setMemories(updated);
    localStorage.setItem('kimi_memories', JSON.stringify(updated));
    showMessage('success', 'Memory deleted');
  };

  const filteredMemories = memories.filter(m =>
    m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="memory-panel-overlay" onClick={onClose}>
      <div className="memory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="memory-panel-header">
          <h2>💾 AI Memory Storage</h2>
          <button onClick={onClose} className="close-button" title="Close">
            ✕
          </button>
        </div>

        {message && (
          <div className={`memory-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="memory-panel-content">
          {/* Add New Memory */}
          <div className="memory-form">
            <h3>Add New Memory</h3>
            <input
              type="text"
              placeholder="Key (e.g., user_name, preferred_format)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={isLoading}
            />
            <textarea
              placeholder="Value (e.g., John Smith, PDF)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <button 
              onClick={saveMemory} 
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Saving...' : '💾 Save Memory'}
            </button>
          </div>

          {/* Search Memories */}
          <div className="memory-search">
            <input
              type="text"
              placeholder="🔍 Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Memory List */}
          <div className="memory-list">
            <h3>Stored Memories ({filteredMemories.length})</h3>
            {filteredMemories.length === 0 ? (
              <p className="no-memories">
                {searchQuery ? 'No memories found' : 'No memories stored yet'}
              </p>
            ) : (
              filteredMemories.map((memory) => (
                <div key={memory.key} className="memory-item">
                  <div className="memory-key">🔑 {memory.key}</div>
                  <div className="memory-value">{memory.value}</div>
                  <div className="memory-actions">
                    <span className="memory-timestamp">
                      {new Date(memory.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteMemory(memory.key)}
                      className="delete-button"
                      title="Delete memory"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
