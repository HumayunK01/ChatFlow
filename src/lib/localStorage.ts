import { ChatHistory, Message, SavedChat, ChatList } from '@/types/chat';

const CHAT_HISTORY_KEY = 'chatgpt-clone-history';
const CHAT_LIST_KEY = 'chatflow-chat-list';
const MODEL_STORAGE = 'selected-model';

// Legacy support - keep for backward compatibility
export const saveChatHistory = (messages: Message[], model: string): void => {
  const history: ChatHistory = {
    messages,
    currentModel: model,
  };
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

export const loadChatHistory = (): ChatHistory | null => {
  const stored = localStorage.getItem(CHAT_HISTORY_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearChatHistory = (): void => {
  localStorage.removeItem(CHAT_HISTORY_KEY);
};

// New multi-chat functions
export const getChatList = (): ChatList => {
  const stored = localStorage.getItem(CHAT_LIST_KEY);
  if (!stored) return { chats: [], archivedChats: [], currentChatId: null };
  
  try {
    const parsed = JSON.parse(stored);
    // Ensure archivedChats exists for backward compatibility
    return {
      chats: parsed.chats || [],
      archivedChats: parsed.archivedChats || [],
      currentChatId: parsed.currentChatId || null,
    };
  } catch {
    return { chats: [], archivedChats: [], currentChatId: null };
  }
};

export const saveChatList = (chatList: ChatList): void => {
  localStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList));
};

/**
 * Generates a random, URL-safe ID for chats
 * Uses crypto.randomUUID() if available, otherwise falls back to a custom generator
 */
export const generateChatId = (): string => {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate a random string using timestamp and random characters
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
};

export const generateChatTitle = (firstMessage: string): string => {
  // Clean and normalize the message
  let text = firstMessage.trim();
  
  // Remove markdown code blocks if present
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]*`/g, '');
  
  // Remove extra whitespace and newlines
  text = text.replace(/\s+/g, ' ').trim();
  
  // If the message is already short, return it
  if (text.length <= 50) return text;
  
  // Try to get the first sentence
  const firstSentence = text.match(/^[^.!?]+[.!?]/)?.[0];
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence.trim();
  }
  
  // Extract key words and create a summary
  // Remove common stop words for a better summary
  const stopWords = /\b(a|an|and|are|as|at|be|by|for|from|has|he|in|is|it|its|of|on|that|the|to|was|will|with)\b/gi;
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.test(word)
  );
  
  // Take first meaningful words up to 50 characters
  let summary = '';
  for (const word of words) {
    if ((summary + ' ' + word).length > 47) break;
    summary += (summary ? ' ' : '') + word;
  }
  
  // If we have a meaningful summary, return it
  if (summary.length > 10) {
    return summary + '...';
  }
  
  // Fallback: just truncate first line
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= 50) return firstLine;
  
  return firstLine.substring(0, 47) + '...';
};

export const saveChat = (chat: SavedChat): void => {
  const chatList = getChatList();
  const existingIndex = chatList.chats.findIndex(c => c.id === chat.id);
  
  if (existingIndex >= 0) {
    // Update existing chat
    chatList.chats[existingIndex] = chat;
  } else {
    // Add new chat
    chatList.chats.push(chat);
    // Sort by updatedAt (newest first)
    chatList.chats.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  chatList.currentChatId = chat.id;
  saveChatList(chatList);
};

export const deleteChat = (chatId: string): void => {
  const chatList = getChatList();
  // Remove from both chats and archived chats
  chatList.chats = chatList.chats.filter(c => c.id !== chatId);
  chatList.archivedChats = chatList.archivedChats.filter(c => c.id !== chatId);
  
  if (chatList.currentChatId === chatId) {
    chatList.currentChatId = chatList.chats.length > 0 ? chatList.chats[0].id : null;
  }
  
  saveChatList(chatList);
};

export const archiveChat = (chatId: string): void => {
  const chatList = getChatList();
  const chatToArchive = chatList.chats.find(c => c.id === chatId);
  
  if (chatToArchive) {
    // Remove from active chats
    chatList.chats = chatList.chats.filter(c => c.id !== chatId);
    
    // Add to archived chats (avoid duplicates)
    if (!chatList.archivedChats.some(c => c.id === chatId)) {
      chatList.archivedChats.push(chatToArchive);
      chatList.archivedChats.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    
    // If this was the current chat, switch to another or clear
    if (chatList.currentChatId === chatId) {
      chatList.currentChatId = chatList.chats.length > 0 ? chatList.chats[0].id : null;
    }
    
    saveChatList(chatList);
  }
};

export const renameChat = (chatId: string, newTitle: string): void => {
  const chatList = getChatList();
  
  // Update in active chats
  const activeChatIndex = chatList.chats.findIndex(c => c.id === chatId);
  if (activeChatIndex >= 0) {
    chatList.chats[activeChatIndex].title = newTitle;
    chatList.chats[activeChatIndex].updatedAt = Date.now();
  }
  
  // Update in archived chats
  const archivedChatIndex = chatList.archivedChats.findIndex(c => c.id === chatId);
  if (archivedChatIndex >= 0) {
    chatList.archivedChats[archivedChatIndex].title = newTitle;
    chatList.archivedChats[archivedChatIndex].updatedAt = Date.now();
  }
  
  saveChatList(chatList);
};

export const getChatById = (chatId: string): SavedChat | null => {
  const chatList = getChatList();
  // Check both active and archived chats
  return chatList.chats.find(c => c.id === chatId) || 
         chatList.archivedChats.find(c => c.id === chatId) || 
         null;
};

export const saveSelectedModel = (modelId: string): void => {
  localStorage.setItem(MODEL_STORAGE, modelId);
};

export const loadSelectedModel = (): string | null => {
  return localStorage.getItem(MODEL_STORAGE);
};
