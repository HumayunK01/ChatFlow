import { Message, OpenRouterModel } from '@/types/chat';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export async function sendChatMessage(
  messages: Message[],
  model: string,
  apiKey: string,
  onChunk: (text: string) => void
): Promise<void> {
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'ChatFlow',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    
    // Handle specific status codes
    if (response.status === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
    } else if (response.status === 401) {
      errorMessage = 'Invalid API key. Please check your API key in the .env file.';
    } else if (response.status === 403) {
      errorMessage = 'Access forbidden. Please check your API key permissions.';
    } else {
      // Try to get detailed error message from response
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorData.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch {
        // If we can't read the error, use default message
        errorMessage = `API error: ${response.status}`;
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

export async function fetchAvailableModels(apiKey: string): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ChatFlow',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    
    // Get all models first
    const allModels = data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description,
      pricing: model.pricing ? {
        prompt: model.pricing.prompt,
        completion: model.pricing.completion,
      } : undefined,
    }));

    // Check if specific models are configured in .env
    const configuredModelIds: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const modelId = import.meta.env[`VITE_MODEL_${i}`];
      if (modelId && modelId.trim() !== '') {
        configuredModelIds.push(modelId.trim());
      }
    }

    // If models are specified in .env, filter to only show those that exist in the API response
    if (configuredModelIds.length > 0) {
      const filteredModels = allModels.filter((model: OpenRouterModel) => 
        configuredModelIds.includes(model.id)
      );
      
      // Log missing models for debugging
      const foundModelIds = filteredModels.map(m => m.id);
      const missingModels = configuredModelIds.filter(id => !foundModelIds.includes(id));
      if (missingModels.length > 0) {
        console.warn('Some configured models were not found in OpenRouter API:', missingModels);
      }
      
      return filteredModels;
    }

    // Otherwise, return all models
    return allModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}
