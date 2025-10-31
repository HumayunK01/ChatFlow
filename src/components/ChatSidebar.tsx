import { Button } from '@/components/ui/button';
import { Plus, Menu, Search, Pencil, Share2, Archive, Trash2, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, PanelRight, X, MessageCircle, SquarePen, Images, Download, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { SavedChat } from '@/types/chat';
import { Logo } from './Logo';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

interface ChatSidebarProps {
  chats: SavedChat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onShareChat?: (chatId: string) => void;
  onRenameChat?: (chatId: string) => void;
  onArchiveChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  apiKeyNames: string[];
  selectedKeyName: string;
  onSelectKeyName: (name: string) => void;
  mobileSidebarOpen?: boolean;
  onMobileSidebarChange?: (open: boolean) => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onShareChat,
  onRenameChat,
  onArchiveChat,
  onDeleteChat,
  apiKeyNames,
  selectedKeyName,
  onSelectKeyName,
  mobileSidebarOpen = false,
  onMobileSidebarChange,
}: ChatSidebarProps) {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('user-name') || '';
  });
  const [nameDialogOpen, setNameDialogOpen] = useState(() => {
    const saved = localStorage.getItem('user-name');
    return !saved; // Open dialog if no name is saved
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdownElement = dropdownRefs.current[openDropdownId];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      const fullName = nameInput.trim();
      setUserName(fullName);
      localStorage.setItem('user-name', fullName);
      setNameDialogOpen(false);
      setNameInput('');
      setIsEditingName(false);
    }
  };

  const getFirstLetter = () => {
    return userName ? userName.charAt(0).toUpperCase() : '';
  };

  // Group chats by date (Today, Yesterday, Previous 7 Days)
  const groupChatsByDate = (chats: SavedChat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const todayChats: SavedChat[] = [];
    const yesterdayChats: SavedChat[] = [];
    const previousChats: SavedChat[] = [];

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt || chat.createdAt);
      
      if (chatDate >= today) {
        todayChats.push(chat);
      } else if (chatDate >= yesterday) {
        yesterdayChats.push(chat);
      } else if (chatDate >= sevenDaysAgo) {
        previousChats.push(chat);
      }
    });

    return {
      today: todayChats,
      yesterday: yesterdayChats,
      previous: previousChats,
    };
  };

  // Filter chats based on search query
  const filterChats = (chats: SavedChat[], query: string) => {
    if (!query.trim()) return chats;
    
    const lowerQuery = query.toLowerCase();
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(lowerQuery)
    );
  };

  // Get filtered and grouped chats for search modal
  const getFilteredGroupedChats = () => {
    const filtered = filterChats(chats, searchQuery);
    return groupChatsByDate(filtered);
  };

  // Extract all images from all chats
  const getAllGeneratedImages = () => {
    const imageUrls: Array<{ url: string; chatId: string; chatTitle: string; timestamp: number }> = [];
    
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        // Only look at assistant messages
        if (message.role === 'assistant') {
          const content = message.content;
          
          // Extract markdown images: ![alt](url)
          const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
          let match;
          while ((match = markdownImageRegex.exec(content)) !== null) {
            const url = match[2];
            // Only add if it's a valid image URL (http/https or data URI)
            if (url.startsWith('http') || url.startsWith('data:image')) {
              imageUrls.push({
                url,
                chatId: chat.id,
                chatTitle: chat.title,
                timestamp: message.timestamp,
              });
            }
          }
          
          // Also check for direct image URLs (standalone http URLs)
          const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
          let urlMatch;
          while ((urlMatch = urlRegex.exec(content)) !== null) {
            const url = urlMatch[0];
            // Avoid duplicates from markdown images
            if (!content.includes(`![`) || !content.includes(`](${url})`)) {
              imageUrls.push({
                url,
                chatId: chat.id,
                chatTitle: chat.title,
                timestamp: message.timestamp,
              });
            }
          }
        }
      });
    });
    
    // Sort by timestamp (newest first)
    return imageUrls.sort((a, b) => b.timestamp - a.timestamp);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Collapsed sidebar buttons */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2 pt-3 px-2">
          {/* New chat button */}
          <Button 
            onClick={onNewChat} 
            className="w-full justify-center px-0 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors"
            variant="ghost"
            title="New chat"
          >
            <SquarePen className="h-4 w-4 flex-shrink-0" />
          </Button>
          {/* Search button */}
          <Button 
            onClick={() => {
              setSearchModalOpen(true);
            }}
            className="w-full justify-center px-0 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors"
            variant="ghost"
            title="Search chats"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
          </Button>
          {/* Library button */}
          <Button 
            onClick={() => {
              setLibraryModalOpen(true);
            }}
            className="w-full justify-center px-0 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors"
            variant="ghost"
            title="Library"
          >
            <Images className="h-4 w-4 flex-shrink-0" />
          </Button>
          {/* Upgrade button - mobile only */}
          <Link to="/pricing" className="w-full md:hidden" onClick={() => onMobileSidebarChange?.(false)}>
            <Button 
              className="w-full justify-center px-0 h-8 sm:h-9 font-normal bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl transition-colors gap-2"
              variant="default"
              title="Upgrade"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0" />
            </Button>
          </Link>
        </div>
      ) : (
        /* Expanded sidebar - New chat and Search buttons */
        <div className="px-2 sm:px-3 pt-3 pb-2 space-y-1.5">
          <Button 
            onClick={onNewChat} 
            className="w-full justify-start gap-1.5 sm:gap-2 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors text-xs sm:text-sm"
            variant="ghost"
          >
            <SquarePen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">New chat</span>
          </Button>
          <Button 
            onClick={() => {
              setSearchModalOpen(true);
            }}
            className="w-full justify-start gap-1.5 sm:gap-2 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors text-xs sm:text-sm"
            variant="ghost"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Search chats</span>
          </Button>
          <Button 
            onClick={() => {
              setLibraryModalOpen(true);
            }}
            className="w-full justify-start gap-1.5 sm:gap-2 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-xl transition-colors text-xs sm:text-sm"
            variant="ghost"
          >
            <Images className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Library</span>
          </Button>
          {/* Upgrade button - mobile only */}
          <Link to="/pricing" className="w-full md:hidden" onClick={() => onMobileSidebarChange?.(false)}>
            <Button 
              className="w-full justify-start gap-1.5 sm:gap-2 h-8 sm:h-9 font-normal bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl transition-colors text-xs sm:text-sm"
              variant="default"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Upgrade</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Chats section */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 pt-2">
          {chats.length > 0 && (
            <>
              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                Chats
              </div>
              
              {/* Chat entries */}
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 mb-1 transition-colors hover:bg-muted/70 min-h-[32px] sm:min-h-[36px] flex items-center ${
                    currentChatId === chat.id ? 'bg-muted/50' : ''
                  }`}
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  <div className="flex items-center justify-between w-full gap-1.5 sm:gap-2">
                    <span
                      onClick={() => onSelectChat(chat.id)}
                      className="text-xs sm:text-sm text-foreground block truncate flex-1 cursor-pointer"
                    >
                      {chat.title}
                    </span>
                    
                    {/* Always reserve space for the button to prevent height changes */}
                    <div className="relative flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6">
                      {(hoveredChatId === chat.id || openDropdownId === chat.id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6 absolute"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === chat.id ? null : chat.id);
                            }}
                          >
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          
                          {/* Dropdown menu */}
                          {openDropdownId === chat.id && (
                            <div 
                              ref={(el) => {
                                dropdownRefs.current[chat.id] = el;
                              }}
                              className="absolute right-0 top-7 sm:top-8 z-50 w-36 sm:w-40 rounded-lg border border-border bg-background shadow-md"
                              onMouseEnter={() => setHoveredChatId(chat.id)}
                              onMouseLeave={() => {
                                setHoveredChatId(null);
                              }}
                            >
                              <div className="p-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onShareChat?.(chat.id);
                                    setOpenDropdownId(null);
                                    setHoveredChatId(null);
                                  }}
                                  className="w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="flex-1 text-left">Share</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRenameChat?.(chat.id);
                                    setOpenDropdownId(null);
                                    setHoveredChatId(null);
                                  }}
                                  className="w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="flex-1 text-left">Rename</span>
                                </button>
                                {/* Divider */}
                                <div className="h-px bg-border my-1 mx-2" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onArchiveChat?.(chat.id);
                                    setOpenDropdownId(null);
                                    setHoveredChatId(null);
                                  }}
                                  className="w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Archive className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="flex-1 text-left">Archive</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat?.(chat.id);
                                    setOpenDropdownId(null);
                                    setHoveredChatId(null);
                                  }}
                                  className="w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="flex-1 text-left">Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Profile Section at bottom */}
      {!isCollapsed && (
        <div className="mt-auto border-t border-border/50 p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Avatar */}
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm sm:text-base font-semibold text-primary">
                {getFirstLetter()}
              </span>
            </div>
            
            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                {userName || 'User'}
              </div>
            </div>

            {/* Edit name button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
              onClick={() => {
                setNameInput(userName);
                setIsEditingName(true);
                setNameDialogOpen(true);
              }}
              title="Edit name"
            >
              <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed sidebar - just avatar */}
      {isCollapsed && (
        <div className="mt-auto p-2 flex justify-center border-t border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {getFirstLetter()}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex ${isCollapsed ? 'w-16' : 'w-56 lg:w-64'} bg-sidebar flex-col border-r border-border/50 transition-all duration-300 relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top section with ChatFlow logo and collapse button */}
        <div className={`p-2 sm:p-3 ${isCollapsed ? 'flex flex-col items-center gap-2 relative' : 'flex items-center justify-between gap-2'}`}>
          {!isCollapsed ? (
            <>
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-7 w-7 flex-shrink-0 hover:bg-muted/50"
                title="Collapse sidebar"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="relative w-full flex justify-center">
              {/* Logo - hidden on hover */}
              <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <Logo showText={false} />
              </div>
              {/* Expand button - shown on hover in same position */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className={`absolute h-7 w-7 flex-shrink-0 hover:bg-muted/50 transition-opacity duration-200 ${
                  isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                title="Expand sidebar"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <SidebarContent />
      </div>

      {/* Mobile Sheet - controlled from parent */}
      <Sheet open={mobileSidebarOpen} onOpenChange={onMobileSidebarChange}>
        <SheetContent side="left" className="w-[280px] sm:w-64 p-0 bg-sidebar">
          {/* Top section with ChatFlow logo */}
          <div className="p-2 sm:p-3 border-b">
            <Logo />
            <SheetTitle className="sr-only">ChatFlow</SheetTitle>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Name Setup/Edit Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={(open) => {
        setNameDialogOpen(open);
        if (!open) {
          setIsEditingName(false);
          setNameInput('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingName ? 'Edit Name' : 'Welcome to ChatFlow'}</DialogTitle>
            <DialogDescription>
              {isEditingName
                ? "Update your name. We'll use the first letter as your avatar."
                : "Please enter your name to get started. We'll use the first letter as your avatar."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) {
                  handleSaveName();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveName}
              disabled={!nameInput.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={(open) => {
        setSearchModalOpen(open);
        if (!open) {
          setSearchQuery('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-9 pr-9 h-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* New chat option */}
            <button
              onClick={() => {
                onNewChat();
                setSearchModalOpen(false);
                setSearchQuery('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
            >
              <SquarePen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">New chat</span>
            </button>

            {/* Chat groups */}
            {(() => {
              const { today, yesterday, previous } = getFilteredGroupedChats();
              const hasAnyChats = today.length > 0 || yesterday.length > 0 || previous.length > 0;

              if (!hasAnyChats) {
                return (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Today */}
                  {today.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                        Today
                      </div>
                      <div className="space-y-1">
                        {today.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              onSelectChat(chat.id);
                              setSearchModalOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                          >
                            <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate flex-1">{chat.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday */}
                  {yesterday.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                        Yesterday
                      </div>
                      <div className="space-y-1">
                        {yesterday.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              onSelectChat(chat.id);
                              setSearchModalOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                          >
                            <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate flex-1">{chat.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous 7 Days */}
                  {previous.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                        Previous 7 Days
                      </div>
                      <div className="space-y-1">
                        {previous.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              onSelectChat(chat.id);
                              setSearchModalOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                          >
                            <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate flex-1">{chat.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Modal - Image Gallery */}
      <Dialog open={libraryModalOpen} onOpenChange={setLibraryModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Library</h2>
            <p className="text-sm text-muted-foreground mt-1">All generated images</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {(() => {
              const allImages = getAllGeneratedImages();
              
              if (allImages.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <Images className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No images found</p>
                    <p className="text-xs mt-1">Generated images will appear here</p>
                  </div>
                );
              }

              const handleDownloadImage = (url: string, chatTitle: string) => {
                // Create a temporary anchor element to trigger download
                const link = document.createElement('a');
                link.href = url;
                
                // Get file extension from URL or default to png
                let extension = 'png';
                if (url.includes('.')) {
                  const urlParts = url.split('.');
                  const potentialExt = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
                  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(potentialExt)) {
                    extension = potentialExt;
                  }
                }
                
                // Create a safe filename from chat title
                const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
                link.download = `${safeTitle || 'image'}_${Date.now()}.${extension}`;
                
                // For data URLs or same-origin images, this works directly
                // For cross-origin images, we need to fetch and convert to blob
                if (url.startsWith('data:') || url.startsWith(window.location.origin)) {
                  link.click();
                } else {
                  // Fetch the image and convert to blob for download
                  fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                      const blobUrl = URL.createObjectURL(blob);
                      link.href = blobUrl;
                      link.click();
                      // Clean up the blob URL
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                    })
                    .catch(() => {
                      // Fallback: try direct download
                      link.click();
                    });
                }
              };

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allImages.map((imageData, index) => (
                    <div
                      key={`${imageData.chatId}-${index}`}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors bg-muted/30"
                    >
                      <img
                        src={imageData.url}
                        alt={`Generated image from ${imageData.chatTitle}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken images
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <p className="text-xs text-white text-center px-2 truncate w-full">
                          {imageData.chatTitle}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(imageData.url, imageData.chatTitle);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-foreground rounded-md transition-colors text-xs font-medium"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
