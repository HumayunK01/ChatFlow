import { ApiKeyConfig } from '@/types/chat';

// Read API keys from environment variables
// Environment variables must be prefixed with VITE_ to be exposed in Vite
const getApiKeysFromEnv = (): Omit<ApiKeyConfig, 'models' | 'createdAt' | 'id'>[] => {
  const apiKeys: Omit<ApiKeyConfig, 'models' | 'createdAt' | 'id'>[] = [];
  
  // Check for API keys (supports up to 10 keys)
  for (let i = 1; i <= 10; i++) {
    const keyName = import.meta.env[`VITE_API_KEY_${i}_NAME`];
    const keyValue = import.meta.env[`VITE_API_KEY_${i}`];
    
    // Only include keys that are actually set (not placeholders or empty)
    if (
      keyName && 
      keyValue && 
      keyValue.trim() !== '' &&
      keyValue !== 'YOUR_OPENROUTER_API_KEY_HERE' &&
      !keyValue.startsWith('YOUR_') &&
      keyValue.length > 10 // Basic validation - real API keys are longer
    ) {
      apiKeys.push({
        name: keyName,
        key: keyValue.trim(),
      });
    }
  }
  
  return apiKeys;
};

/**
 * API Keys Configuration
 * 
 * This file automatically reads API keys from environment variables.
 * 
 * SETUP INSTRUCTIONS:
 * ===================
 * 1. Copy .env.example to .env in the root directory
 * 2. Add your OpenRouter API keys in the following format:
 * 
 *    VITE_API_KEY_1_NAME=Primary
 *    VITE_API_KEY_1=your_actual_api_key_here
 *    
 *    VITE_API_KEY_2_NAME=Secondary (optional)
 *    VITE_API_KEY_2=another_api_key_here (optional)
 * 
 * 3. You can add up to 10 API keys (VITE_API_KEY_1 through VITE_API_KEY_10)
 * 
 * 4. Each API key will automatically fetch its available models from OpenRouter
 * 
 * OPTIONAL - Model Filtering:
 * ===========================
 * To show only specific models, add them to your .env file:
 * 
 *    VITE_MODEL_1=openai/gpt-4-turbo
 *    VITE_MODEL_2=anthropic/claude-3-opus
 *    VITE_MODEL_3=google/gemini-pro
 * 
 *    (Supports up to 20 models: VITE_MODEL_1 through VITE_MODEL_20)
 * 
 * If no models are specified, all available models for each API key will be shown.
 * 
 * After updating .env, restart the development server for changes to take effect.
 * 
 * For more information, see .env.example file in the root directory.
 */
export const API_KEYS: Omit<ApiKeyConfig, 'models' | 'createdAt' | 'id'>[] = 
  getApiKeysFromEnv();
