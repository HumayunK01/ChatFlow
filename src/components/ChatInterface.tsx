import { useState, useRef, useEffect } from 'react';
import { Message, OpenRouterModel } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatTopBar } from './ChatTopBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { sendChatMessage } from '@/lib/openrouter';
import { useToast } from '@/hooks/use-toast';
import { deleteChat, archiveChat } from '@/lib/localStorage';

interface ChatInterfaceProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  currentModel: string;
  apiKey: string;
  models: OpenRouterModel[];
  onModelChange: (modelId: string) => void;
  onNewChat?: () => void;
  currentChatId?: string | null;
  onChatDeleted?: () => void;
  onChatArchived?: () => void;
}

export function ChatInterface({ 
  messages, 
  onMessagesChange, 
  currentModel, 
  apiKey, 
  models, 
  onModelChange, 
  onNewChat,
  currentChatId,
  onChatDeleted,
  onChatArchived,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    onMessagesChange(newMessages);
    setInput('');
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      await sendChatMessage(
        newMessages,
        currentModel,
        apiKey,
        (chunk) => {
          assistantContent += chunk;
          
          // Update or add assistant message
          onMessagesChange([
            ...newMessages,
            {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              model: currentModel,
            },
          ]);
        }
      );
    } catch (error) {
      let errorTitle = 'Error';
      let errorDescription = 'Failed to send message';
      
      if (error instanceof Error) {
        errorDescription = error.message;
        
        // Check if it's a rate limit error
        if ((error as any).status === 429) {
          errorTitle = 'Rate Limit Exceeded';
          errorDescription = 'You\'ve sent too many requests. Please wait a moment before trying again.';
        } else if ((error as any).status === 401) {
          errorTitle = 'Authentication Error';
          errorDescription = 'Invalid API key. Please check your API key in the .env file.';
        } else if ((error as any).status === 403) {
          errorTitle = 'Access Denied';
          errorDescription = `Your API key doesn't have permission to access "${currentModel}". Please check if this model is available with your API key.`;
        } else if ((error as any).status === 404) {
          errorTitle = 'Model Not Found';
          errorDescription = `The model "${currentModel}" was not found. Please check if the model ID is correct in your .env file.`;
        } else if (errorDescription.toLowerCase().includes('model') || errorDescription.toLowerCase().includes('not found')) {
          errorTitle = 'Model Error';
          errorDescription = `Error with model "${currentModel}": ${errorDescription}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      });
      
      // Remove the user message on error
      onMessagesChange(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = () => {
    if (currentChatId) {
      // Delete from localStorage
      deleteChat(currentChatId);
      toast({
        title: 'Deleted',
        description: 'Chat has been deleted',
      });
      // Clear messages and notify parent
      onMessagesChange([]);
      onNewChat?.();
      onChatDeleted?.();
    } else {
      // No saved chat, just clear current messages
      onMessagesChange([]);
      onNewChat?.();
      toast({
        title: 'Cleared',
        description: 'Chat cleared',
      });
    }
  };

  const handleArchive = () => {
    if (currentChatId) {
      // Archive the chat
      archiveChat(currentChatId);
      toast({
        title: 'Archived',
        description: 'Chat has been archived',
      });
      // Clear messages and notify parent
      onMessagesChange([]);
      onNewChat?.();
      onChatArchived?.();
    } else {
      toast({
        title: 'Nothing to archive',
        description: 'No chat to archive',
      });
    }
  };

  const handleReport = () => {
    // Report functionality - you can extend this to send report
    const reportData = {
      chatId: currentChatId || 'unsaved',
      messages: messages.length,
      timestamp: Date.now(),
    };
    
    // In a real app, you would send this to a backend
    console.log('Report submitted:', reportData);
    
    toast({
      title: 'Reported',
      description: 'Thank you for your report. We will review it shortly.',
    });
  };

  const handleShare = () => {
    // Share functionality - you can extend this to copy link or share dialog
    if (messages.length > 0) {
      const chatText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      navigator.clipboard.writeText(chatText).then(() => {
        toast({
          title: 'Copied',
          description: 'Chat conversation copied to clipboard',
        });
      }).catch(() => {
        toast({
          title: 'Share',
          description: 'Share functionality available',
        });
      });
    } else {
      toast({
        title: 'Nothing to share',
        description: 'Start a conversation to share it',
      });
    }
  };

  const handleLike = (messageId: string) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        // If already liked, remove feedback; otherwise set to like (removes dislike if present)
        return {
          ...msg,
          feedback: msg.feedback === 'like' ? null : 'like',
        };
      }
      return msg;
    });
    onMessagesChange(updatedMessages as Message[]);
  };

  const handleDislike = (messageId: string) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        // If already disliked, remove feedback; otherwise set to dislike (removes like if present)
        return {
          ...msg,
          feedback: msg.feedback === 'dislike' ? null : 'dislike',
        };
      }
      return msg;
    });
    onMessagesChange(updatedMessages as Message[]);
  };

  const handleRegenerate = async (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    // Get all messages up to (but not including) this assistant message
    const messagesUpToRegenerate = messages.slice(0, messageIndex);
    
    // Find the last user message before this assistant message
    const lastUserMessageIndex = messagesUpToRegenerate.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex === -1) {
      toast({
        title: 'Error',
        description: 'Cannot regenerate: no user message found',
        variant: 'destructive',
      });
      return;
    }

    // Remove the assistant message and all messages after it
    const messagesBeforeRegenerate = messages.slice(0, messageIndex);
    
    setIsLoading(true);
    const assistantMessageId = Date.now().toString();
    let assistantContent = '';

    try {
      await sendChatMessage(
        messagesBeforeRegenerate,
        currentModel,
        apiKey,
        (chunk) => {
          assistantContent += chunk;
          
          // Update messages with new regenerated response
          onMessagesChange([
            ...messagesBeforeRegenerate,
            {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              model: currentModel,
            },
          ]);
        }
      );
      
      toast({
        title: 'Regenerated',
        description: 'Response has been regenerated',
      });
    } catch (error) {
      let errorTitle = 'Error';
      let errorDescription = 'Failed to regenerate response';
      
      if (error instanceof Error) {
        errorDescription = error.message;
        
        // Check if it's a rate limit error
        if ((error as any).status === 429) {
          errorTitle = 'Rate Limit Exceeded';
          errorDescription = 'You\'ve sent too many requests. Please wait a moment before trying again.';
        } else if ((error as any).status === 401) {
          errorTitle = 'Authentication Error';
          errorDescription = 'Invalid API key. Please check your API key in the .env file.';
        } else if ((error as any).status === 403) {
          errorTitle = 'Access Denied';
          errorDescription = `Your API key doesn't have permission to access "${currentModel}". Please check if this model is available with your API key.`;
        } else if ((error as any).status === 404) {
          errorTitle = 'Model Not Found';
          errorDescription = `The model "${currentModel}" was not found. Please check if the model ID is correct in your .env file.`;
        } else if (errorDescription.toLowerCase().includes('model') || errorDescription.toLowerCase().includes('not found')) {
          errorTitle = 'Model Error';
          errorDescription = `Error with model "${currentModel}": ${errorDescription}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <ChatTopBar
        models={models}
        selectedModel={currentModel}
        onModelChange={onModelChange}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onReport={handleReport}
        onShare={handleShare}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px] px-4">
              <div className="text-center space-y-3">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">ChatFlow</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">Powered by OpenRouter</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onRegenerate={handleRegenerate}
                />
              ))}
              {isLoading && (
                <div className="flex gap-2 sm:gap-4 px-2 sm:px-4 py-4 sm:py-6 justify-start">
                  <div className="flex flex-col space-y-2 overflow-hidden min-w-0 items-start max-w-[85%] sm:max-w-[80%]">
                    <div className="rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 bg-muted/50 text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 items-center">
                          <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '0ms' }}></span>
                          <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '200ms' }}></span>
                          <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '400ms' }}></span>
                        </div>
                        <span className="text-sm sm:text-base text-muted-foreground">Thinking</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto w-full py-3 sm:py-4 px-2 sm:px-4">
          <div className="relative flex items-center bg-secondary/50 border border-border/50 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
            {/* Input */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 h-auto bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-sm placeholder:text-muted-foreground/60 py-0"
              disabled={isLoading}
            />

            {/* Send button on the right */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full hover:bg-transparent p-0 ml-1 sm:ml-2 disabled:opacity-30"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
              )}
            </Button>
          </div>

          {/* Disclaimer text */}
          <div className="text-center mt-2 px-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              ChatFlow can make mistakes. Check important info.{' '}
              <button
                className="underline hover:text-foreground transition-colors"
                onClick={() => {
                  // Cookie preferences handler
                  toast({
                    title: 'Cookie Preferences',
                    description: 'Cookie preferences dialog coming soon',
                  });
                }}
              >
                See Cookie Preferences
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
