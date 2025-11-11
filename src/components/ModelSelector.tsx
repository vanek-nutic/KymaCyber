import { useState } from 'react';
import './ModelSelector.css';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
}

const models: ModelInfo[] = [
  {
    id: 'kimi-k2-0905-preview',
    name: 'K2 Standard',
    description: 'Balanced performance for general tasks',
    icon: '⚡',
  },
  {
    id: 'kimi-k2-turbo-preview',
    name: 'K2 Turbo',
    description: 'Fast responses (60-100 tokens/s)',
    icon: '🚀',
    badge: 'FAST',
  },
  {
    id: 'kimi-k2-thinking',
    name: 'K2 Thinking',
    description: 'Deep reasoning with thought process',
    icon: '🧠',
    badge: 'REASONING',
  },
  {
    id: 'kimi-k2-thinking-turbo',
    name: 'K2 Thinking Turbo',
    description: 'Fast reasoning (60-100 tokens/s)',
    icon: '🧠⚡',
    badge: 'BEST',
  },
];

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelInfo = models.find((m) => m.id === selectedModel) || models[1];

  return (
    <div className="model-selector">
      <button
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="model-icon">{selectedModelInfo.icon}</span>
        <span className="model-name">{selectedModelInfo.name}</span>
        {selectedModelInfo.badge && (
          <span 
            className={`model-badge badge-${selectedModelInfo.badge.toLowerCase()}`}
            title={selectedModelInfo.badge === 'FAST' ? '60-100 tokens/s' : selectedModelInfo.badge === 'REASONING' ? 'Shows thought process' : 'Fast reasoning with thought process'}
          >
            {selectedModelInfo.badge}
          </span>
        )}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {models.map((model) => (
            <button
              key={model.id}
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              type="button"
            >
              <div className="model-option-header">
                <span className="model-icon">{model.icon}</span>
                <span className="model-name">{model.name}</span>
                {model.badge && (
                  <span 
                    className={`model-badge badge-${model.badge.toLowerCase()}`}
                    title={model.badge === 'FAST' ? '60-100 tokens/s' : model.badge === 'REASONING' ? 'Shows thought process' : 'Fast reasoning with thought process'}
                  >
                    {model.badge}
                  </span>
                )}
                {selectedModel === model.id && <span className="checkmark">✓</span>}
              </div>
              <div className="model-description">{model.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
