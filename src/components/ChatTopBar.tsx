import { ChevronDown, Share2, MoreVertical, Archive, Flag, Trash2, Check } from 'lucide-react';
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
  onModelChange: (modelId: string) => void;
  onArchive?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function ChatTopBar({ models, selectedModel, onModelChange, onArchive, onReport, onDelete, onShare }: ChatTopBarProps) {
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

  return (
    <div className="relative h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-2 sm:px-4">
      {/* Left: ChatFlow with model selection dropdown */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-1 sm:p-2 font-semibold text-sm sm:text-base hover:bg-transparent truncate max-w-[150px] sm:max-w-none">
              <span className="truncate">{models.find(m => m.id === selectedModel)?.name || 'ChatFlow'}</span>
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 opacity-70 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 sm:w-64 max-h-[400px] overflow-y-auto">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="flex-1 truncate">{model.name}</span>
                {selectedModel === model.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Share and More menu */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
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
      </div>
    </div>
  );
}

