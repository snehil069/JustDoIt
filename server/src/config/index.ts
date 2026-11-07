import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepgramApiKey: string;
  defaultAiProvider: 'gemini' | 'grok' | 'demo';
  defaultSttProvider: 'browser-webspeech' | 'deepgram' | 'gemini';
}

function decodeKey(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || decodeKey('QVEuQWI4Uk42SXROclFWVWlsZ1dkUHY5bTBDcVlBaDl1VmQ3UXdFb1ZIVlk0bXhFNlQ1aGc='),
  grokApiKey: process.env.GROK_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || decodeKey('NmQyZjdlODE1MDE5YTA4ZGZiZjlkN2I5OTdhMDY1NjA0OTFmZjI2NA=='),
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER as any) || 'gemini',
  defaultSttProvider: (process.env.DEFAULT_STT_PROVIDER as any) || 'deepgram',
};

// Allows client settings to update runtime keys during current server session
export function updateRuntimeConfig(updates: Partial<ServerConfig>) {
  if (updates.geminiApiKey !== undefined) config.geminiApiKey = updates.geminiApiKey;
  if (updates.grokApiKey !== undefined) config.grokApiKey = updates.grokApiKey;
  if (updates.deepgramApiKey !== undefined) config.deepgramApiKey = updates.deepgramApiKey;
  if (updates.defaultAiProvider !== undefined) config.defaultAiProvider = updates.defaultAiProvider;
  if (updates.defaultSttProvider !== undefined) config.defaultSttProvider = updates.defaultSttProvider;
}
