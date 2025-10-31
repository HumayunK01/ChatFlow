export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatHistory {
  messages: Message[];
  currentModel: string;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  currentModel: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatList {
  chats: SavedChat[];
  archivedChats: SavedChat[];
  currentChatId: string | null;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  models: OpenRouterModel[];
  createdAt: number;
}
