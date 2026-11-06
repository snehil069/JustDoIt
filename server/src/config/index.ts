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

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  grokApiKey: process.env.GROK_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER as any) || 'gemini',
  defaultSttProvider: (process.env.DEFAULT_STT_PROVIDER as any) || 'browser-webspeech',
};

// Allows client settings to update runtime keys during current server session
export function updateRuntimeConfig(updates: Partial<ServerConfig>) {
  if (updates.geminiApiKey !== undefined) config.geminiApiKey = updates.geminiApiKey;
  if (updates.grokApiKey !== undefined) config.grokApiKey = updates.grokApiKey;
  if (updates.deepgramApiKey !== undefined) config.deepgramApiKey = updates.deepgramApiKey;
  if (updates.defaultAiProvider !== undefined) config.defaultAiProvider = updates.defaultAiProvider;
  if (updates.defaultSttProvider !== undefined) config.defaultSttProvider = updates.defaultSttProvider;
}
