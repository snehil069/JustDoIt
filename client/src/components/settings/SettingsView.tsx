import React, { useState } from 'react';
import { ProviderSettings } from '@shared/types/index';
import { storageService } from '../../services/storage';
import { api } from '../../services/api';
import {
  Settings,
  Key,
  Shield,
  Volume2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Cpu,
  Mic,
  Save,
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
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.saveSettings(form);
    onUpdateSettings(updated);

    // Sync keys with backend server runtime
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
    if (confirm('Are you sure you want to delete all saved practice sessions and progress? This cannot be undone.')) {
      storageService.clearAllData();
      alert('All local sessions and progress have been deleted.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application & Provider Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure external AI models, real-time speech providers, and local privacy preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Provider Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AI Reasoning & Evaluation Engine
            </h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            SpeakUp supports <strong>Google Gemini</strong> for topic synthesis, debate arguments, and calibrated speech evaluation. When no key is entered, SpeakUp operates in verified <strong>Demo Mode</strong>.
          </p>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline text-[11px]"
              >
                Get free Gemini API key →
              </a>
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={form.geminiApiKey}
                onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full py-2.5 px-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Operate in Demo Mode
              </span>
              <p className="text-[11px] text-slate-500">
                Uses local rule-based heuristic evaluator with zero external API calls.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDemoMode}
                onChange={(e) => setForm({ ...form, isDemoMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Speech-to-Text Provider Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Speech-to-Text (STT) Provider
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Transcription Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setForm({ ...form, preferredSttProvider: 'browser-webspeech' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  form.preferredSttProvider === 'browser-webspeech'
                    ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Browser Web Speech API
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Built-in zero-config speech recognition in Chrome, Edge, and Brave. Zero setup required.
                </p>
              </div>

              <div
                onClick={() => setForm({ ...form, preferredSttProvider: 'deepgram' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  form.preferredSttProvider === 'deepgram'
                    ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Deepgram Nova-2 Live
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  High-accuracy model tuned for Indian English accents and technical vocabulary.
                </p>
              </div>
            </div>
          </div>

          {form.preferredSttProvider === 'deepgram' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Deepgram API Key</span>
                <a
                  href="https://console.deepgram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline text-[11px]"
                >
                  Get Deepgram API Key →
                </a>
              </label>
              <div className="relative">
                <input
                  type={showDeepgramKey ? 'text' : 'password'}
                  value={form.deepgramApiKey}
                  onChange={(e) => setForm({ ...form, deepgramApiKey: e.target.value })}
                  placeholder="Deepgram token..."
                  className="w-full py-2.5 px-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepgramKey(!showDeepgramKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showDeepgramKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Retention & Privacy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Privacy & Local Storage
            </h2>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Retain Audio Recordings for Playback
              </span>
              <p className="text-[11px] text-slate-500">
                When enabled, your audio blob is kept in browser memory so you can listen back to your speech.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.retainAudioRecordings}
                onChange={(e) => setForm({ ...form, retainAudioRecordings: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-rose-600 font-medium">Danger Zone</span>
            <button
              type="button"
              onClick={handleClearData}
              className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History & Data</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
