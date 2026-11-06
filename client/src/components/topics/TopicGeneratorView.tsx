import React, { useState, useEffect } from 'react';
import {
  Category,
  Difficulty,
  PromptFormat,
  PracticeMode,
  Topic,
} from '@shared/types/index';
import { api } from '../../services/api';
import {
  Sparkles,
  Filter,
  RefreshCw,
  Play,
  Lightbulb,
  Clock,
  Layers,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface TopicGeneratorViewProps {
  onStartSession: (topic: Topic, mode: PracticeMode) => void;
}

export const TopicGeneratorView: React.FC<TopicGeneratorViewProps> = ({
  onStartSession,
}) => {
  const [categories, setCategories] = useState<{ id: Category; label: string; description: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<PromptFormat | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('impromptu');

  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
    fetchNextTopic();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const fetchNextTopic = async () => {
    setIsLoading(true);
    try {
      const topic = await api.getRandomTopic({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
        format: selectedFormat === 'all' ? undefined : selectedFormat,
        mode: selectedMode,
      });
      setCurrentTopic(topic);
    } catch (e) {
      console.error('Failed to fetch topic:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWithAi = async () => {
    setIsAiGenerating(true);
    try {
      const topic = await api.generateAITopic({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
        format: selectedFormat === 'all' ? undefined : selectedFormat,
        mode: selectedMode,
      });
      setCurrentTopic(topic);
    } catch (e) {
      console.error('AI topic generation failed:', e);
      // Fallback
      fetchNextTopic();
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Curated Topic Bank & AI Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore over 100+ curated prompts across 10 categories or synthesize a novel AI speaking challenge.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Configure Filters</span>
        </div>

        {/* Category Pills */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setSelectedCategory('all');
                fetchNextTopic();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  fetchNextTopic();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === c.id
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty & Prompt Format Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Difficulty Level
            </label>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`flex-1 py-1.5 rounded-md font-medium capitalize transition-colors ${
                    selectedDifficulty === d
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prompt Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="all">Any Format</option>
              <option value="random-word">Random Word Challenge</option>
              <option value="open-question">Open-Ended Question</option>
              <option value="hypothetical-situation">Hypothetical Situation</option>
            </select>
          </div>

          {/* Practice Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="impromptu">Impromptu Speaking</option>
              <option value="research">Research & Speak</option>
              <option value="debate">Debate Mode</option>
              <option value="interview">Interview Mode</option>
              <option value="explain-simply">Explain Simply</option>
              <option value="real-life">Real-Life Situations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated / Selected Topic Card */}
      {currentTopic ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider">
                {currentTopic.category.replace('-', ' ')}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium capitalize">
                {currentTopic.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium capitalize">
                {currentTopic.format.replace('-', ' ')}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Source: {currentTopic.source}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchNextTopic}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Next Curated</span>
              </button>

              <button
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>AI Synthesize</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentTopic.title}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-slate-50 dark:bg-slate-850 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {currentTopic.question}
            </p>
          </div>

          {currentTopic.taskExplanation && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
              Coach Note: {currentTopic.taskExplanation}
            </p>
          )}

          {currentTopic.hints && currentTopic.hints.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Angles & Subtopics</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {currentTopic.hints.map((hint, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Launch practice button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              onClick={() => onStartSession(currentTopic, selectedMode)}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Practice with This Challenge</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Sparkles className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading challenge...</p>
        </div>
      )}
    </div>
  );
};
