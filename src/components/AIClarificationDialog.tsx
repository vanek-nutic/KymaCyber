import { useState, useEffect, useRef } from 'react';
import './AIClarificationDialog.css';

interface AIClarificationDialogProps {
  isOpen: boolean;
  context?: string;
  placeholder?: string;
  onSubmit: (input: string) => void;
  onCancel: () => void;
}

export function AIClarificationDialog({
  isOpen,
  context,
  placeholder = "Type your response here...",
  onSubmit,
  onCancel
}: AIClarificationDialogProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset input when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setInput('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="clarification-overlay" onClick={onCancel}>
      <div 
        className="clarification-dialog tool-call-item" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching tool call style */}
        <div className="tool-call-header">
          <span className="tool-name">🤖 AI Question</span>
          <button 
            className="close-btn" 
            onClick={onCancel}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Context section */}
        {context && (
          <div className="clarification-section">
            <div className="section-label">Context:</div>
            <div className="tool-result">
              <pre>{context}</pre>
            </div>
          </div>
        )}

        {/* Input section */}
        <div className="clarification-section">
          <div className="section-label">Your Response:</div>
          <textarea
            ref={textareaRef}
            className="clarification-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={4}
          />
          <div className="input-hint">
            Press <kbd>Ctrl+Enter</kbd> to send, <kbd>Esc</kbd> to cancel
          </div>
        </div>

        {/* Footer buttons */}
        <div className="clarification-footer">
          <button 
            className="cancel-btn" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            Send Response
          </button>
        </div>
      </div>
    </div>
  );
}
