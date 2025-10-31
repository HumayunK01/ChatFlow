import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatSidebar } from '@/components/ChatSidebar';
import { Message, ApiKeyConfig, SavedChat } from '@/types/chat';
import { API_KEYS } from '@/config/apiKeys';
import {
  getChatList,
  saveChat,
  deleteChat,
  archiveChat,
  renameChat,
  getChatById,
  generateChatTitle,
  saveSelectedModel,
  loadSelectedModel,
} from '@/lib/localStorage';
import { fetchAvailableModels } from '@/lib/openrouter';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<SavedChat | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<SavedChat | null>(null);
  const [isChangingModel, setIsChangingModel] = useState(false);
  const { toast } = useToast();

  // Initialize API keys from config
  useEffect(() => {
    const initializeApiKeys = async () => {
      setIsLoadingModels(true);
      const initializedKeys: ApiKeyConfig[] = [];

      // Only process API keys that are actually configured (not placeholders)
      if (API_KEYS.length === 0) {
        toast({
          title: 'No API Keys Found',
          description: 'Please add your OpenRouter API key to the .env file. See .env.example for format.',
          variant: 'destructive',
        });
        setIsLoadingModels(false);
        return;
      }

      for (const configKey of API_KEYS) {
        try {
          const models = await fetchAvailableModels(configKey.key);
          if (models && models.length > 0) {
            initializedKeys.push({
              id: Date.now().toString() + Math.random(),
              name: configKey.name,
              key: configKey.key,
              models,
              createdAt: Date.now(),
            });
          }
        } catch (error) {
          console.error(`Failed to fetch models for ${configKey.name}:`, error);
          toast({
            title: 'Error',
            description: `Failed to load models for ${configKey.name}. Please check your API key in .env file.`,
            variant: 'destructive',
          });
        }
      }

      setApiKeys(initializedKeys);
      if (initializedKeys.length > 0) {
        setSelectedKeyName(initializedKeys[0].name);
      } else {
        toast({
          title: 'No Models Available',
          description: 'No models could be loaded. Please check your API keys in the .env file.',
          variant: 'destructive',
        });
      }
      setIsLoadingModels(false);
    };

    initializeApiKeys();
  }, [toast]);

  // Load chat list
  useEffect(() => {
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    setCurrentChatId(chatList.currentChatId);
    
    // Load current chat if exists
    if (chatList.currentChatId) {
      const chat = getChatById(chatList.currentChatId);
      if (chat) {
        setMessages(chat.messages);
        setCurrentModel(chat.currentModel);
      }
    } else {
      // Load selected model if no chat
      const storedModel = loadSelectedModel();
      if (storedModel) {
        setCurrentModel(storedModel);
      }
    }
  }, []);

  // Auto-select first model when key changes
  useEffect(() => {
    if (apiKeys.length === 0) return;
    if (isChangingModel) return; // Skip if model change is in progress
    
    const selectedKey = apiKeys.find(k => k.name === selectedKeyName);
    if (selectedKey && selectedKey.models.length > 0) {
      const currentModelExists = selectedKey.models.some(m => m.id === currentModel);
      if (!currentModelExists && currentModel) {
        // Only auto-select if current model doesn't exist in new key's models
        setIsChangingModel(true);
        setCurrentModel(selectedKey.models[0].id);
        setTimeout(() => setIsChangingModel(false), 300);
      } else if (!currentModel) {
        // Only set if no model is currently selected
        setIsChangingModel(true);
        setCurrentModel(selectedKey.models[0].id);
        setTimeout(() => setIsChangingModel(false), 300);
      }
    }
  }, [selectedKeyName, apiKeys, currentModel, isChangingModel]);

  // Save chat when messages change (debounced to avoid excessive saves)
  useEffect(() => {
    // Skip saving if we're currently changing models to prevent unnecessary operations
    if (isChangingModel) return;
    
    // Only save if messages actually changed (not just model change)
    const timeoutId = setTimeout(() => {
      if (messages.length > 0 && currentModel) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const title = generateChatTitle(firstUserMessage.content);
          const chatId = currentChatId || Date.now().toString();
          
          // Get existing chat to preserve createdAt
          const existingChat = currentChatId ? getChatById(currentChatId) : null;
          
          const chat: SavedChat = {
            id: chatId,
            title,
            messages,
            currentModel,
            createdAt: existingChat?.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
          
          saveChat(chat);
          setCurrentChatId(chatId);
          
          // Update saved chats list
          const chatList = getChatList();
          setSavedChats(chatList.chats);
        }
      } else if (messages.length === 0 && currentChatId) {
        // Clear current chat if messages are empty
        setCurrentChatId(null);
      }
    }, 500); // Increased debounce to 500ms to avoid excessive saves

    return () => clearTimeout(timeoutId);
  }, [messages, currentModel, currentChatId, isChangingModel]);

  const handleModelChange = (modelId: string) => {
    // Prevent changing to the same model
    if (modelId === currentModel) return;
    
    // Prevent rapid model changes
    if (isChangingModel) return;
    
    setIsChangingModel(true);
    setCurrentModel(modelId);
    saveSelectedModel(modelId);
    
    const selectedKey = apiKeys.find(k => k.name === selectedKeyName);
    const model = selectedKey?.models.find(m => m.id === modelId);
    
    toast({
      title: 'Model Changed',
      description: `Switched to ${model?.name || modelId}`,
    });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsChangingModel(false);
    }, 500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    toast({
      title: 'New Chat Started',
      description: 'Starting a new conversation',
    });
  };

  const handleSelectChat = (chatId: string) => {
    // Prevent switching chats while changing models
    if (isChangingModel) return;
    
    const chat = getChatById(chatId);
    if (chat) {
      // Prevent unnecessary updates if selecting the same chat
      if (chatId === currentChatId) return;
      
      setIsChangingModel(true);
      setMessages(chat.messages);
      setCurrentModel(chat.currentModel);
      setCurrentChatId(chatId);
      
      // Update current chat ID in storage
      const chatList = getChatList();
      chatList.currentChatId = chatId;
      saveChatList(chatList);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsChangingModel(false);
      }, 300);
    }
  };

  const handleSelectKeyName = (name: string) => {
    setSelectedKeyName(name);
  };

  const handleChatDeleted = () => {
    // Refresh the saved chats list after deletion
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    // Clear current chat if it was deleted
    if (currentChatId && !chatList.chats.find(c => c.id === currentChatId)) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleChatArchived = () => {
    // Refresh the saved chats list after archiving
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    // Clear current chat if it was archived
    if (currentChatId && !chatList.chats.find(c => c.id === currentChatId)) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleShareChat = (chatId: string) => {
    const chat = getChatById(chatId);
    if (chat && chat.messages.length > 0) {
      const chatText = chat.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      navigator.clipboard.writeText(chatText).then(() => {
        toast({
          title: 'Copied',
          description: 'Chat conversation copied to clipboard',
        });
      }).catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy chat',
          variant: 'destructive',
        });
      });
    } else {
      toast({
        title: 'Nothing to share',
        description: 'This chat has no messages',
      });
    }
  };

  const handleRenameChat = (chatId: string) => {
    const chat = getChatById(chatId);
    if (!chat) return;
    
    setChatToRename(chat);
    setRenameInput(chat.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (!chatToRename) return;
    
    const newTitle = renameInput.trim();
    if (newTitle && newTitle !== '' && newTitle !== chatToRename.title) {
      renameChat(chatToRename.id, newTitle);
      const chatList = getChatList();
      setSavedChats(chatList.chats);
      toast({
        title: 'Renamed',
        description: 'Chat has been renamed',
      });
      setRenameDialogOpen(false);
      setChatToRename(null);
      setRenameInput('');
    }
  };

  const handleArchiveChat = (chatId: string) => {
    archiveChat(chatId);
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
    
    toast({
      title: 'Archived',
      description: 'Chat has been archived',
    });
  };

  const handleDeleteChat = (chatId: string) => {
    const chat = getChatById(chatId);
    if (!chat) return;
    
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!chatToDelete) return;
    
    deleteChat(chatToDelete.id);
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    
    if (currentChatId === chatToDelete.id) {
      setCurrentChatId(null);
      setMessages([]);
    }
    
    toast({
      title: 'Deleted',
      description: 'Chat has been deleted',
    });
    
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Get current API key and available models
  const selectedKey = apiKeys.find(k => k.name === selectedKeyName);
  const currentApiKey = selectedKey?.key || null;
  const availableModels = selectedKey?.models || [];

  if (isLoadingModels) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg">Loading models...</p>
          <p className="text-sm text-muted-foreground">Fetching available models from OpenRouter</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Rename Chat</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter a new name for this chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Chat name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                }
              }}
              autoFocus
              className="text-sm sm:text-base"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setChatToRename(null);
                setRenameInput('');
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!renameInput.trim() || renameInput.trim() === chatToRename?.title}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[90vw] max-w-lg mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{chatToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setChatToDelete(null);
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-sm sm:text-base"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex h-screen w-full bg-background">
        <ChatSidebar
          chats={savedChats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onShareChat={handleShareChat}
          onRenameChat={handleRenameChat}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
          apiKeyNames={apiKeys.map(k => k.name)}
          selectedKeyName={selectedKeyName}
          onSelectKeyName={handleSelectKeyName}
        />

      <div className="flex-1 flex flex-col">
        {currentApiKey && availableModels.length > 0 ? (
          <ChatInterface
            messages={messages}
            onMessagesChange={setMessages}
            currentModel={currentModel}
            apiKey={currentApiKey}
            models={availableModels}
            onModelChange={handleModelChange}
            onNewChat={handleNewChat}
            currentChatId={currentChatId}
            onChatDeleted={handleChatDeleted}
            onChatArchived={handleChatArchived}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Configure your API key in src/config/apiKeys.ts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Index;
