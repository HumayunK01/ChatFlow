import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatSidebar } from '@/components/ChatSidebar';
import { Message, ApiKeyConfig, SavedChat, ChatFolder } from '@/types/chat';
import { API_KEYS } from '@/config/apiKeys';
import {
  getChatList,
  saveChatList,
  saveChat,
  deleteChat,
  archiveChat,
  renameChat,
  getChatById,
  generateChatTitle,
  generateChatId,
  saveSelectedModel,
  loadSelectedModel,
  createFolder,
  updateFolder,
  deleteFolder,
  moveChatToFolder,
  addTagToChat,
  removeTagFromChat,
} from '@/lib/localStorage';
import { fetchAvailableModels } from '@/lib/openrouter';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<SavedChat | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<SavedChat | null>(null);
  const [isChangingModel, setIsChangingModel] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
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

  // Load chat list and handle URL params on initial mount
  useEffect(() => {
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    setFolders(chatList.folders || []);
    
    // Check URL for chat ID - only load if URL explicitly has a chat ID
    const chatIdFromUrl = searchParams.get('chat');
    
    if (chatIdFromUrl) {
      // Load chat from URL (when sharing or direct link)
      const chat = getChatById(chatIdFromUrl);
      if (chat) {
        setMessages(chat.messages);
        setCurrentModel(chat.currentModel);
        setCurrentChatId(chatIdFromUrl);
        // Update storage to match URL
        chatList.currentChatId = chatIdFromUrl;
        saveChatList(chatList);
      } else {
        // Chat not found, remove from URL
        setSearchParams({}, { replace: true });
        setCurrentChatId(null);
        setMessages([]);
      }
    } else {
      // No URL param - start with new chat window
      // Clear any stored currentChatId to ensure fresh start
      setCurrentChatId(null);
      setMessages([]);
      
      // Load selected model if available
      const storedModel = loadSelectedModel();
      if (storedModel) {
        setCurrentModel(storedModel);
      }
      
      // Clear chat ID from storage on page load to start fresh
      chatList.currentChatId = null;
      saveChatList(chatList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to URL changes (e.g., browser back/forward, direct URL access)
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chat');
    
    // Only react if URL chat ID is different from current chat ID
    if (chatIdFromUrl !== currentChatId) {
      if (chatIdFromUrl) {
        const chat = getChatById(chatIdFromUrl);
        if (chat) {
          setMessages(chat.messages);
          setCurrentModel(chat.currentModel);
          setCurrentChatId(chatIdFromUrl);
          // Update storage to match URL
          const chatList = getChatList();
          chatList.currentChatId = chatIdFromUrl;
          saveChatList(chatList);
          setSavedChats(chatList.chats);
        } else {
          // Chat not found, remove from URL
          setSearchParams({}, { replace: true });
          setCurrentChatId(null);
          setMessages([]);
        }
      } else if (currentChatId) {
        // URL cleared but we have a current chat - clear it
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  }, [searchParams, currentChatId, setSearchParams]);

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
    // Skip saving if this is a temporary chat
    if (isTemporaryChat) return;
    
    // Skip saving if we're currently changing models to prevent unnecessary operations
    if (isChangingModel) return;
    
    // Only save if messages actually changed (not just model change)
    const timeoutId = setTimeout(() => {
      if (messages.length > 0 && currentModel) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const title = generateChatTitle(firstUserMessage.content);
          const chatId = currentChatId || generateChatId();
          
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
          
          // Update URL with chat ID
          setSearchParams({ chat: chatId }, { replace: true });
          
          // Update saved chats list
          const chatList = getChatList();
          setSavedChats(chatList.chats);
          setFolders(chatList.folders || []);
        }
      } else if (messages.length === 0 && currentChatId) {
        // Clear current chat if messages are empty
        setCurrentChatId(null);
        // Remove chat ID from URL
        setSearchParams({}, { replace: true });
      }
    }, 500); // Increased debounce to 500ms to avoid excessive saves

    return () => clearTimeout(timeoutId);
  }, [messages, currentModel, currentChatId, isChangingModel, isTemporaryChat]);

  const handleModelChange = (modelId: string) => {
    // Prevent changing to the same model
    if (modelId === currentModel) return;
    
    // Prevent rapid model changes
    if (isChangingModel) return;
    
    // Validate that the model exists in available models
    const selectedKey = apiKeys.find(k => k.name === selectedKeyName);
    const model = selectedKey?.models.find(m => m.id === modelId);
    
    if (!model) {
      toast({
        title: 'Model Not Available',
        description: `The model "${modelId}" is not available with your current API key.`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsChangingModel(true);
    
    // Update the model state first
    setCurrentModel(modelId);
    saveSelectedModel(modelId);
    
    // If there's an existing chat with messages, update the chat's model immediately
    if (currentChatId && messages.length > 0) {
      const existingChat = getChatById(currentChatId);
      if (existingChat) {
        const updatedChat: SavedChat = {
          ...existingChat,
          messages,
          currentModel: modelId, // Ensure we use the new model
          updatedAt: Date.now(),
        };
        saveChat(updatedChat);
        
        // Update saved chats list
        const chatList = getChatList();
        setSavedChats(chatList.chats);
      }
    }
    
    toast({
      title: 'Model Changed',
      description: `Switched to ${model.name}`,
    });
    
    // Reset the flag after a short delay to allow state to settle
    setTimeout(() => {
      setIsChangingModel(false);
    }, 600);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsTemporaryChat(false); // Clear temporary mode when starting new chat
    // Remove chat ID from URL
    setSearchParams({}, { replace: true });
    toast({
      title: 'New Chat Started',
      description: 'Starting a new conversation',
    });
  };

  const handleToggleTemporaryChat = () => {
    setIsTemporaryChat(prev => {
      const newValue = !prev;
      if (newValue) {
        // When enabling temporary mode, clear current chat and messages
        setMessages([]);
        setCurrentChatId(null);
        setSearchParams({}, { replace: true });
        toast({
          title: 'Temporary Chat Mode',
          description: 'This chat will not be saved',
        });
      } else {
        // When disabling temporary mode, clear messages and reset to new chat interface
        // This prevents saving the temporary chat when toggling off
        setMessages([]);
        setCurrentChatId(null);
        setSearchParams({}, { replace: true });
        toast({
          title: 'Regular Chat Mode',
          description: 'Starting a new chat',
        });
      }
      return newValue;
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
      setIsTemporaryChat(false); // Disable temporary mode when selecting a saved chat
      setMessages(chat.messages);
      setCurrentModel(chat.currentModel);
      setCurrentChatId(chatId);
      
      // Update current chat ID in storage
      const chatList = getChatList();
      chatList.currentChatId = chatId;
      saveChatList(chatList);
      
      // Update URL with chat ID
      setSearchParams({ chat: chatId }, { replace: true });
      
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
      // Remove chat ID from URL
      setSearchParams({}, { replace: true });
    }
  };

  const handleChatArchived = () => {
    // Refresh the saved chats list after archiving
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    setFolders(chatList.folders || []);
    // Clear current chat if it was archived
    if (currentChatId && !chatList.chats.find(c => c.id === currentChatId)) {
      setCurrentChatId(null);
      setMessages([]);
      // Remove chat ID from URL
      setSearchParams({}, { replace: true });
    }
  };

  // Folder handlers
  const handleCreateFolder = (name: string, color?: string) => {
    const folder = createFolder(name, color);
    const chatList = getChatList();
    setFolders(chatList.folders || []);
    toast({
      title: 'Folder Created',
      description: `Folder "${name}" has been created`,
    });
  };

  const handleUpdateFolder = (folderId: string, updates: Partial<ChatFolder>) => {
    updateFolder(folderId, updates);
    const chatList = getChatList();
    setFolders(chatList.folders || []);
    toast({
      title: 'Folder Updated',
      description: 'Folder has been updated',
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    const chatList = getChatList();
    setFolders(chatList.folders || []);
    setSavedChats(chatList.chats);
    toast({
      title: 'Folder Deleted',
      description: 'Folder has been deleted',
    });
  };

  const handleMoveChatToFolder = (chatId: string, folderId: string | null) => {
    moveChatToFolder(chatId, folderId);
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    toast({
      title: 'Moved',
      description: folderId ? 'Chat moved to folder' : 'Chat removed from folder',
    });
  };

  const handleAddTagToChat = (chatId: string, tag: string) => {
    addTagToChat(chatId, tag);
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    toast({
      title: 'Tag Added',
      description: `Tag "${tag}" has been added`,
    });
  };

  const handleRemoveTagFromChat = (chatId: string, tag: string) => {
    removeTagFromChat(chatId, tag);
    const chatList = getChatList();
    setSavedChats(chatList.chats);
    toast({
      title: 'Tag Removed',
      description: `Tag "${tag}" has been removed`,
    });
  };

  const handleShareChat = (chatId: string) => {
    const chat = getChatById(chatId);
    if (chat && chat.messages.length > 0) {
      // Copy the chat URL to clipboard
      const chatUrl = `${window.location.origin}${window.location.pathname}?chat=${chatId}`;
      navigator.clipboard.writeText(chatUrl).then(() => {
        toast({
          title: 'Copied',
          description: 'Chat URL copied to clipboard',
        });
      }).catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy chat URL',
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onSearch: () => setSearchModalOpen(true),
    onClose: () => {
      // Close all open modals/dialogs
      setSearchModalOpen(false);
      setRenameDialogOpen(false);
      setDeleteDialogOpen(false);
      setMobileSidebarOpen(false);
    },
    enabled: true,
  });

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
          folders={folders}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onShareChat={handleShareChat}
          onRenameChat={handleRenameChat}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
          onMoveChatToFolder={handleMoveChatToFolder}
          onAddTagToChat={handleAddTagToChat}
          onRemoveTagFromChat={handleRemoveTagFromChat}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
          apiKeyNames={apiKeys.map(k => k.name)}
          selectedKeyName={selectedKeyName}
          onSelectKeyName={handleSelectKeyName}
          mobileSidebarOpen={mobileSidebarOpen}
          onMobileSidebarChange={setMobileSidebarOpen}
          searchModalOpen={searchModalOpen}
          onSearchModalChange={setSearchModalOpen}
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
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            isTemporaryChat={isTemporaryChat}
            onToggleTemporaryChat={handleToggleTemporaryChat}
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
