import { useState, useRef, useEffect } from 'react';
import { Message, OpenRouterModel } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatTopBar } from './ChatTopBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Plus, X, Mic } from 'lucide-react';
import { sendChatMessage } from '@/lib/openrouter';
import { useToast } from '@/hooks/use-toast';
import { deleteChat, archiveChat } from '@/lib/localStorage';
import { Logo } from './Logo';

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
  onOpenMobileSidebar?: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
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
  onOpenMobileSidebar,
  isTemporaryChat = false,
  onToggleTemporaryChat,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentModelRef = useRef<string>(currentModel);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Detect theme changes similar to Logo component
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Keep currentModelRef in sync with currentModel prop - update immediately on mount and when prop changes
  useEffect(() => {
    if (currentModelRef.current !== currentModel) {
      currentModelRef.current = currentModel;
    }
  }, [currentModel]);

  // Also ensure ref is set on mount
  useEffect(() => {
    if (currentModel && !currentModelRef.current) {
      currentModelRef.current = currentModel;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid File',
        description: 'Please select image files only.',
        variant: 'destructive',
      });
      return;
    }

    // Limit to 5 images at once
    const remainingSlots = 5 - selectedImages.length;
    if (imageFiles.length > remainingSlots) {
      toast({
        title: 'Too Many Images',
        description: `You can only upload up to ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''}.`,
        variant: 'destructive',
      });
    }

    const imagesToAdd = imageFiles.slice(0, remainingSlots);
    
    imagesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Speech Recognition setup
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        // Add final transcript to input
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
        });
      } else if (interimTranscript && !finalTranscript) {
        // Show interim results while speaking (optional - can be removed)
        // This provides real-time feedback, but might be distracting
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        // User stopped speaking, stop recognition
        recognition.stop();
        setIsListening(false);
      } else if (event.error === 'audio-capture') {
        toast({
          title: 'Microphone Error',
          description: 'No microphone found. Please check your microphone settings.',
          variant: 'destructive',
        });
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        toast({
          title: 'Permission Denied',
          description: 'Microphone permission denied. Please enable microphone access.',
          variant: 'destructive',
        });
        setIsListening(false);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition as SpeechRecognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleStartDictation = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        setIsListening(false);
      }
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!input.trim() && selectedImages.length === 0) return;
    if (isLoading) return;

    // Get the latest model value - always use ref first, then fallback to prop
    // The ref should always be up-to-date due to the useEffect above
    const modelToUse = currentModelRef.current || currentModel;
    
    if (!modelToUse) {
      toast({
        title: 'Error',
        description: 'No model selected. Please select a model.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Check if trying to generate image
    const messageText = input.trim().toLowerCase();
    const imageGenerationKeywords = [
      'generate image',
      'create image',
      'draw image',
      'make image',
      'produce image',
      'generate a image',
      'create a image',
      'draw a image',
      'make a image',
      'produce a image',
      'generate an image',
      'create an image',
      'draw an image',
      'make an image',
      'produce an image',
      'image generation',
      'generate picture',
      'create picture',
      'draw picture',
      'make picture',
      'generate a picture',
      'create a picture',
      'draw a picture',
      'make a picture',
      'generate an picture',
      'create an picture',
      'draw an picture',
      'make an picture',
    ];
    
    const isImageGenerationRequest = imageGenerationKeywords.some(keyword => 
      messageText.includes(keyword)
    );
    
    if (isImageGenerationRequest) {
      // Check if model is MiniMax M2 (allow variations in naming)
      const modelIdLower = modelToUse.toLowerCase();
      const isMiniMaxM2 = modelIdLower.includes('minimax') && modelIdLower.includes('m2');
      
      if (!isMiniMaxM2) {
        toast({
          title: 'Image Generation Restricted',
          description: 'Images can only be generated using MiniMax M2. Please switch to MiniMax M2 model to generate images.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Also check if trying to generate image with VITE_MODEL_5 (legacy check for text-only models)
    const viteModel5 = import.meta.env.VITE_MODEL_5;
    if (viteModel5 && modelToUse === viteModel5.trim() && isImageGenerationRequest) {
      toast({
        title: 'Image Generation Not Supported',
        description: 'I am a text-based AI and do not have the ability to generate images.',
        variant: 'destructive',
      });
      return;
    }

    // Build message content with images
    let messageContent = input.trim();
    if (selectedImages.length > 0) {
      const imageMarkdown = selectedImages.map((img, idx) => `\n![Image ${idx + 1}](${img})`).join('\n');
      messageContent = messageContent ? `${messageContent}${imageMarkdown}` : imageMarkdown;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    onMessagesChange(newMessages);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      await sendChatMessage(
        newMessages,
        modelToUse,
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
              model: modelToUse,
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
    // Copy the chat URL to clipboard
    if (messages.length > 0 && currentChatId) {
      const chatUrl = `${window.location.origin}${window.location.pathname}?chat=${currentChatId}`;
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
      // Use ref to ensure we always use the latest model value
      const modelToUse = currentModelRef.current || currentModel;
      await sendChatMessage(
        messagesBeforeRegenerate,
        modelToUse,
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
              model: modelToUse,
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
        onDelete={handleDelete}
        onArchive={handleArchive}
        onReport={handleReport}
        onShare={handleShare}
        hasMessages={messages.length > 0}
        onOpenMobileSidebar={onOpenMobileSidebar}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={onToggleTemporaryChat}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px] px-4">
              {isTemporaryChat ? (
                // Temporary Chat UI
                <div className="text-center space-y-6 w-full max-w-md">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Temporary Chat
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                    This chat won't appear in history, use or
                    update ChatFlow's memory, or be used to
                    train our models.
                  </p>
                  
                  {/* Model Selector */}
                  <div className="pt-4 max-w-xs mx-auto">
                    <label className="block text-sm text-foreground mb-2">
                      Select Model
                    </label>
                    <Select value={currentModel} onValueChange={onModelChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => {
                          const modelName = model.name.replace(/\s*\(free\)/gi, '');
                          return (
                            <SelectItem key={model.id} value={model.id} className="pl-8">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={isDark ? '/whitelogo.png' : '/blacklogo.png'}
                                  alt="ChatFlow Logo" 
                                  className="h-4 w-4 flex-shrink-0 object-contain"
                                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                                />
                                <span>{modelName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                // Regular New Chat UI
                <div className="text-center space-y-4 w-full max-w-md">
                  <Logo 
                    className="justify-center" 
                    textClassName="text-2xl sm:text-3xl font-semibold tracking-tight"
                  />
                  <p className="text-muted-foreground text-xs sm:text-sm">Powered by OpenRouter</p>
                  
                  {/* Model Selector */}
                  <div className="pt-4 max-w-xs mx-auto">
                    <label className="block text-sm text-foreground mb-2">
                      Select Model
                    </label>
                    <Select value={currentModel} onValueChange={onModelChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => {
                          const modelName = model.name.replace(/\s*\(free\)/gi, '');
                          return (
                            <SelectItem key={model.id} value={model.id} className="pl-8">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={isDark ? '/whitelogo.png' : '/blacklogo.png'}
                                  alt="ChatFlow Logo" 
                                  className="h-4 w-4 flex-shrink-0 object-contain"
                                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                                />
                                <span>{modelName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
                    <div className="rounded-3xl px-3 py-2 sm:px-4 sm:py-2.5 bg-muted/50 text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '200ms' }}></span>
                        <span className="h-2 w-2 rounded-full bg-foreground/60 animate-thinking-dot" style={{ animationDelay: '400ms' }}></span>
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
      <div className="fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-5xl mx-auto w-full py-3 sm:py-4 px-2 sm:px-4">
          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={`relative flex items-center border border-border/50 rounded-3xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm ${
            isTemporaryChat ? 'bg-gray-300 dark:bg-gray-700' : 'bg-secondary/50'
          }`}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Plus button on the left */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full hover:bg-transparent p-0 mr-1 sm:mr-2"
              onClick={handlePlusClick}
              type="button"
              disabled={isLoading}
              title="Upload images"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
            </Button>

            {/* Input */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 h-auto bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-sm placeholder:text-muted-foreground/60 py-0"
              disabled={isLoading}
            />

            {/* Microphone button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full hover:bg-transparent p-0 ml-1 sm:ml-2 ${isListening ? 'text-red-500 dark:text-red-400' : ''}`}
              onClick={handleStartDictation}
              type="button"
              disabled={isLoading}
              title={isListening ? 'Stop dictation' : 'Start dictation'}
            >
              <Mic className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>

            {/* Send button on the right */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-full hover:bg-transparent p-0 ml-1 sm:ml-2 disabled:opacity-30"
              onClick={handleSend}
              disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
              )}
             </Button>
           </div>
         </div>
       </div>
    </div>
  );
}
