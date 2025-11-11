import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSubmit?: () => void;
  onClear?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSubmit, onClear, onEscape }: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Submit query
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
      }

      // Ctrl+K or Cmd+K: Clear
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onClear?.();
      }

      // Escape: Close modals or clear focus
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit, onClear, onEscape]);
}

export default useKeyboardShortcuts;
