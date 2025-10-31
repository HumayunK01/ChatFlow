import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNewChat?: () => void;
  onSearch?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard shortcuts
 * @param shortcuts - Object containing callback functions for shortcuts
 */
export function useKeyboardShortcuts({
  onNewChat,
  onSearch,
  onClose,
  enabled = true,
}: KeyboardShortcuts) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target as HTMLElement).closest('[contenteditable="true"]') !== null;

      // Check for modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd+K or Ctrl+K - New chat
      if ((event.key === 'k' || event.key === 'K') && metaKey && !event.shiftKey && !event.altKey) {
        // Only prevent default if we have a handler
        if (onNewChat && !isInputElement) {
          event.preventDefault();
          onNewChat();
        }
      }

      // Cmd+P or Ctrl+P - Search (open search modal)
      if ((event.key === 'p' || event.key === 'P') && metaKey && !event.shiftKey && !event.altKey) {
        if (onSearch && !isInputElement) {
          event.preventDefault();
          onSearch();
        }
      }

      // Escape - Close modals/sidebar
      // Note: We don't prevent default here to allow dialogs to handle their own escape behavior
      // The onClose callback should handle closing any open modals
      if (event.key === 'Escape' && !isInputElement) {
        if (onClose) {
          // Only prevent default if we're actually closing something
          // Let dialogs handle their own escape first
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNewChat, onSearch, onClose, enabled]);
}

