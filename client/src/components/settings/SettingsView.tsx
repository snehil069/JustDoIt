import React, { useState } from 'react';
import { ProviderSettings } from '@shared/types/index';
import { storageService } from '../../services/storage';
import { api } from '../../services/api';
import {
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Cpu,
  Mic,
  Save,
  Shield,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ProviderSettings;
  onUpdateSettings: (newSettings: ProviderSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [form, setForm] = useState<ProviderSettings>({ ...settings });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showDeepgramKey, setShowDeepgramKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success?: boolean;
    model?: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await api.testGeminiConnection(form.geminiApiKey || undefined);
      setGeminiTestResult(res);
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        error: err?.message || 'Connection test failed',
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.saveSettings(form);
    onUpdateSettings(updated);

    try {
      await api.updateServerSettings({
        geminiApiKey: form.geminiApiKey,
        deepgramApiKey: form.deepgramApiKey,
        grokApiKey: form.grokApiKey,
        defaultAiProvider: form.preferredAiProvider,
        defaultSttProvider: form.preferredSttProvider,
      });
    } catch (e) {
      console.warn('Failed to sync settings with server:', e);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearData = () => {
    if (confirm('Permanently delete all saved practice sessions and progress? This cannot be undone.')) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">System Configuration</span>
            <span className="text-[#E5E5E5]">•</span>
            <span className="text-xs text-[#666666]">API Engines & Privacy Controls</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            Provider & Diagnostic Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-2xl leading-relaxed pt-1">
            Manage your AI evaluation key, live speech-to-text pipeline, and client-side storage policies.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-[#929292] border border-[#E5E5E5] px-3 py-1.5 rounded-lg bg-[#F5F5F4] self-start md:self-auto">
          <span>Storage: Browser LocalStorage</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AI Reasoning Engine Card */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-5">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#252525]" />
            <h2 className="text-sm font-semibold text-[#252525] uppercase tracking-wider font-mono">
              AI Evaluation & Synthesis Engine
            </h2>
          </div>

          <p className="text-xs text-[#666666] leading-relaxed">
            SpeakUp natively connects to <strong>Google Gemini</strong> for real-time generative feedback, dialectical scrutiny, and topic generation. When unconfigured, the application runs on calibrated <strong>Demo Mode</strong> with local heuristic analysis.
          </p>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-[#252525]">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#252525] underline hover:text-[#666666] font-mono text-[11px]"
              >
                Get Gemini API key →
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={form.geminiApiKey}
                  onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                  placeholder="AQ... or AIzaSy..."
                  className="w-full py-2.5 px-3 pr-10 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] text-xs font-mono text-[#252525] placeholder-[#929292] focus:outline-none focus:border-[#252525]"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-2.5 text-[#929292] hover:text-[#252525]"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] hover:bg-[#F5F5F4] text-[#252525] text-xs font-medium flex items-center space-x-1.5 transition-colors self-start whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingGemini ? 'animate-spin' : ''}`} />
                <span>{testingGemini ? 'Verifying...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Test Connection Result */}
            {geminiTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  geminiTestResult.success
                    ? 'bg-[#F5F5F4] border-[#252525] text-[#252525]'
                    : 'bg-[#F5F5F4] border-[#E5E5E5] text-[#666666]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {geminiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#252525]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#666666]" />
                  )}
                  <span>
                    {geminiTestResult.success
                      ? `Verified: Active Model [${geminiTestResult.model}] (${geminiTestResult.latencyMs}ms)`
                      : `Connection Error: ${geminiTestResult.error}`}
                  </span>
                </div>
                <span className="text-[10px] text-[#929292]">Google Developer API</span>
              </div>
            )}
          </div>

          {/* Demo Mode Switch */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
            <div>
              <span className="text-xs font-medium text-[#252525] block">
                Operate in Demo Mode
              </span>
              <span className="text-[11px] text-[#666666] block">
                Force local rule-based heuristic evaluator without sending requests to external APIs.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDemoMode}
                onChange={(e) => setForm({ ...form, isDemoMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#E5E5E5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#252525]"></div>
            </label>
          </div>
        </div>

        {/* 2. STT Provider Section */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-5">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-[#252525]" />
            <h2 className="text-sm font-semibold text-[#252525] uppercase tracking-wider font-mono">
              Speech-to-Text (STT) Provider
            </h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#252525] block">
              Active Transcription Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setForm({ ...form, preferredSttProvider: 'browser-webspeech' })}
                className={`p-4 rounded-lg border cursor-pointer transition-all space-y-1 ${
                  form.preferredSttProvider === 'browser-webspeech'
                    ? 'bg-[#F5F5F4] border-[#252525]'
                    : 'bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#252525]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#252525]">
                    Browser Web Speech API
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      form.preferredSttProvider === 'browser-webspeech' ? 'bg-[#252525]' : 'bg-[#E5E5E5]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Native speech recognition in Chrome, Edge, and Brave. Zero setup required.
                </p>
              </div>

              <div
                onClick={() => setForm({ ...form, preferredSttProvider: 'deepgram' })}
                className={`p-4 rounded-lg border cursor-pointer transition-all space-y-1 ${
                  form.preferredSttProvider === 'deepgram'
                    ? 'bg-[#F5F5F4] border-[#252525]'
                    : 'bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#252525]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#252525]">
                    Deepgram Nova-2 Live WebSocket
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      form.preferredSttProvider === 'deepgram' ? 'bg-[#252525]' : 'bg-[#E5E5E5]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Real-time streaming speech recognition with high accuracy and filler word detection.
                </p>
              </div>
            </div>
          </div>

          {form.preferredSttProvider === 'deepgram' && (
            <div className="space-y-1.5 animate-fadeIn pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[#252525]">
                  Deepgram API Key
                </label>
                <a
                  href="https://console.deepgram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#252525] underline hover:text-[#666666] font-mono text-[11px]"
                >
                  Deepgram Console →
                </a>
              </div>
              <div className="relative">
                <input
                  type={showDeepgramKey ? 'text' : 'password'}
                  value={form.deepgramApiKey}
                  onChange={(e) => setForm({ ...form, deepgramApiKey: e.target.value })}
                  placeholder="Deepgram key..."
                  className="w-full py-2.5 px-3 pr-10 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] text-xs font-mono text-[#252525] placeholder-[#929292] focus:outline-none focus:border-[#252525]"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepgramKey(!showDeepgramKey)}
                  className="absolute right-3 top-2.5 text-[#929292] hover:text-[#252525]"
                >
                  {showDeepgramKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Audio Retention & Data Management */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-5">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#252525]" />
            <h2 className="text-sm font-semibold text-[#252525] uppercase tracking-wider font-mono">
              Privacy & Local Data Management
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#252525] block">
                Retain Audio Recordings for Playback
              </span>
              <span className="text-[11px] text-[#666666] block">
                Preserve spoken audio blobs in browser memory so you can listen back to your speech on the report.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.retainAudioRecordings}
                onChange={(e) => setForm({ ...form, retainAudioRecordings: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#E5E5E5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#252525]"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
            <div className="text-xs text-[#666666]">
              Clear cached transcripts and scores
            </div>
            <button
              type="button"
              onClick={handleClearData}
              className="px-3.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] hover:bg-[#F5F5F4] text-[#252525] text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Data</span>
            </button>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          {saveSuccess && (
            <span className="text-xs font-medium text-[#252525] flex items-center space-x-1 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration successfully saved</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
