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

// Configure your API keys here
// Option 1: Use environment variables (recommended)
// Create a .env file in the root directory and add:
// VITE_API_KEY_1_NAME=Primary
// VITE_API_KEY_1=your_actual_api_key_here
//
// Option 2: Add them directly in the array below (less secure)
// Note: Only API keys with actual values will be used to fetch models
export const API_KEYS: Omit<ApiKeyConfig, 'models' | 'createdAt' | 'id'>[] = 
  getApiKeysFromEnv();
