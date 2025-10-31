import { Button } from '@/components/ui/button';
import { Plus, Menu, Search, Pencil, Share2, Archive, Trash2, MoreVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { SavedChat } from '@/types/chat';

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
}: ChatSidebarProps) {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-2 sm:px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            className="w-full pl-7 sm:pl-9 h-8 sm:h-9 bg-background border-border/50 rounded-lg text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* New chat button */}
      <div className="px-2 sm:px-3 pb-2">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start gap-1.5 sm:gap-2 h-8 sm:h-9 font-normal text-foreground bg-background hover:bg-muted/50 rounded-lg transition-colors text-xs sm:text-sm"
          variant="ghost"
        >
          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="truncate">New chat</span>
        </Button>
      </div>

      {/* Chats section */}
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
                className={`group relative rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 mb-1 transition-colors hover:bg-muted/70 min-h-[32px] sm:min-h-[36px] flex items-center ${
                  currentChatId === chat.id ? 'bg-muted/50' : ''
                }`}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                <div className="flex items-center justify-between w-full gap-1.5 sm:gap-2">
                  <span
                    onClick={() => onSelectChat(chat.id)}
                    className="text-xs sm:text-sm font-medium text-foreground block truncate flex-1 cursor-pointer"
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
                            className="absolute right-0 top-7 sm:top-8 z-50 w-36 sm:w-40 rounded-md border border-border bg-background shadow-md"
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
                                className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded-sm hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Share
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameChat?.(chat.id);
                                  setOpenDropdownId(null);
                                  setHoveredChatId(null);
                                }}
                                className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded-sm hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onArchiveChat?.(chat.id);
                                  setOpenDropdownId(null);
                                  setHoveredChatId(null);
                                }}
                                className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded-sm hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Archive
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat?.(chat.id);
                                  setOpenDropdownId(null);
                                  setHoveredChatId(null);
                                }}
                                className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded-sm hover:bg-muted transition-colors cursor-pointer text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Delete
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 lg:w-64 bg-sidebar flex-col border-r border-border/50">
        {/* Top section with ChatFlow logo */}
        <div className="p-2 sm:p-3">
          <h1 className="text-base lg:text-lg font-semibold text-sidebar-foreground">ChatFlow</h1>
        </div>

        <SidebarContent />
      </div>

      {/* Mobile Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-64 p-0 bg-sidebar">
          {/* Top section with ChatFlow logo */}
          <div className="p-2 sm:p-3 border-b">
            <h1 className="text-base sm:text-lg font-semibold text-sidebar-foreground">ChatFlow</h1>
            <SheetTitle className="sr-only">ChatFlow</SheetTitle>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
