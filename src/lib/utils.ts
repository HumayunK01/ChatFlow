import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a keyboard shortcut for display based on the platform
 * @param key - The key to display (e.g., 'k', 'p')
 * @returns Formatted shortcut string (e.g., '⌘K' on Mac, 'Ctrl+K' on Windows/Linux)
 */
export function formatKeyboardShortcut(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';
  return `${modifier}+${key.toUpperCase()}`;
}