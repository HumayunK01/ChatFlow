import { Share2, MoreVertical, Archive, Flag, Trash2, Menu, MessageCircleDashed, Moon, Sun, Sparkles, Download, FileText, FileJson, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { OpenRouterModel } from '@/types/chat';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ChatTopBarProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onArchive?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: (format: 'pdf' | 'markdown' | 'json') => void;
  hasMessages?: boolean;
  onOpenMobileSidebar?: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
}

export function ChatTopBar({ models, selectedModel, onArchive, onReport, onDelete, onShare, onExport, hasMessages = false, onOpenMobileSidebar, isTemporaryChat = false, onToggleTemporaryChat }: ChatTopBarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleArchive = () => {
    onArchive?.();
  };

  const handleReport = () => {
    onReport?.();
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const handleShare = () => {
    onShare?.();
  };

  // Helper function to remove "(free)" from model names
  const removeFree = (name: string) => {
    return name.replace(/\s*\(free\)/gi, '');
  };

  return (
    <div className="relative h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-2 sm:px-4">
      {/* Left: Mobile menu button and ChatFlow - model name */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 flex-shrink-0"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
          {removeFree(models.find(m => m.id === selectedModel)?.name || 'ChatFlow')}
        </span>
      </div>

      {/* Center: Upgrade to Go button - hidden on mobile */}
      <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 flex-shrink-0">
        <Link to="/pricing">
          <Button
            className="h-8 sm:h-9 px-3 sm:px-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full font-medium text-sm sm:text-base gap-2 flex-shrink-0"
            variant="default"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Upgrade</span>
          </Button>
        </Link>
      </div>

      {/* Right: Theme toggle, Temporary chat, Share and More menu */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Temporary Chat button - only show when no messages or in temporary mode */}
        {(!hasMessages || isTemporaryChat) && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 sm:h-9 sm:w-9 ${isTemporaryChat ? 'bg-muted' : ''}`}
            onClick={onToggleTemporaryChat}
            title={isTemporaryChat ? 'Temporary chat (not saved)' : 'Start temporary chat'}
          >
            <MessageCircleDashed className={`h-4 w-4 ${isTemporaryChat ? 'text-primary' : ''}`} />
          </Button>
        )}

        {/* Share and More menu - only show when there are messages */}
        {hasMessages && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 font-medium"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onExport && (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => onExport('pdf')}>
                          <File className="h-4 w-4 mr-2" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('markdown')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('json')}>
                          <FileJson className="h-4 w-4 mr-2" />
                          JSON
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}

