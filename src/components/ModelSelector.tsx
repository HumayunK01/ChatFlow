import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { OpenRouterModel } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ models, selectedModel, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  // Helper function to remove "(free)" from model names
  const removeFree = (name: string) => {
    return name.replace(/\s*\(free\)/gi, '');
  };

  const selectedModelName = models.find(m => m.id === selectedModel)?.name || 'Select model';
  const displayName = removeFree(selectedModelName);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setOpen(false);
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        className="w-full bg-background/50 border-sidebar-border hover:bg-background/70 transition-colors text-sm font-medium justify-between"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{displayName}</span>
        <svg
          className="ml-2 h-4 w-4 shrink-0 opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-w-[90vw] max-h-[60vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Model</DialogTitle>
            <DialogDescription>
              Choose an AI model to use for this conversation.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {models.map((model) => {
                const modelName = removeFree(model.name);
                const isSelected = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="truncate flex-1">{modelName}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
