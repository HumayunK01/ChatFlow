import { Share2, MoreVertical, Archive, Flag, Trash2, Menu, MessageCircleDashed } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { OpenRouterModel } from '@/types/chat';

interface ChatTopBarProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onArchive?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  hasMessages?: boolean;
  onOpenMobileSidebar?: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
}

export function ChatTopBar({ models, selectedModel, onArchive, onReport, onDelete, onShare, hasMessages = false, onOpenMobileSidebar, isTemporaryChat = false, onToggleTemporaryChat }: ChatTopBarProps) {
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

      {/* Right: Temporary chat, Share and More menu */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
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

