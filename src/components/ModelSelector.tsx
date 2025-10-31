import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpenRouterModel } from '@/types/chat';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ models, selectedModel, onModelChange }: ModelSelectorProps) {
  // Helper function to remove "(free)" from model names
  const removeFree = (name: string) => {
    return name.replace(/\s*\(free\)/gi, '');
  };

  return (
    <div className="w-full">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full bg-background/50 border-sidebar-border hover:bg-background/70 transition-colors text-sm font-medium">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-sm font-medium">
              {removeFree(model.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
