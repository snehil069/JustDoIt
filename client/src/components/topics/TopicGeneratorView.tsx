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
  ArrowRight,
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
      fetchNextTopic();
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Repository</span>
            <span className="text-[#E5E5E5]">•</span>
            <span className="text-xs text-[#666666]">100+ Benchmark Prompts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            Curated Practice Library
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-2xl leading-relaxed pt-1">
            Filter rigorous challenges by dialectical category, difficulty, and format, or synthesize custom scenarios with generative AI.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-[#929292] border border-[#E5E5E5] px-3 py-1.5 rounded-lg bg-[#F5F5F4] self-start md:self-auto">
          <span>Target Module: {selectedMode.toUpperCase()}</span>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-5">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#929292]">
          <Filter className="w-3.5 h-3.5 text-[#252525]" />
          <span>Analytical Parameters</span>
        </div>

        {/* Category Pills */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#252525] block">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setSelectedCategory('all');
                fetchNextTopic();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#252525] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666] hover:bg-[#F5F5F4]'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-[#252525] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666] hover:bg-[#F5F5F4]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#252525] block">
              Complexity Level
            </label>
            <div className="flex rounded-lg border border-[#E5E5E5] bg-[#F5F5F4] p-1 text-xs">
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`flex-1 py-1.5 rounded font-medium capitalize transition-colors ${
                    selectedDifficulty === d
                      ? 'bg-[#FFFFFF] text-[#252525] border border-[#E5E5E5] font-semibold'
                      : 'text-[#666666] hover:text-[#252525]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#252525] block">
              Prompt Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full py-2 px-3 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-xs text-[#252525] font-medium focus:outline-none focus:border-[#252525]"
            >
              <option value="all">Any Format</option>
              <option value="random-word">Random Word Challenge</option>
              <option value="open-question">Open-Ended Question</option>
              <option value="hypothetical-situation">Hypothetical Situation</option>
            </select>
          </div>

          {/* Practice Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#252525] block">
              Training Mode Destination
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="w-full py-2 px-3 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-xs text-[#252525] font-medium focus:outline-none focus:border-[#252525]"
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

      {/* Selected Challenge Card */}
      {currentTopic ? (
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded border border-[#E5E5E5] bg-[#F5F5F4] text-[#252525] font-mono text-[10px] uppercase tracking-wider">
                {currentTopic.category.replace('-', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded border border-[#E5E5E5] bg-[#F5F5F4] text-[#666666] font-mono text-[10px] capitalize">
                {currentTopic.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded border border-[#E5E5E5] bg-[#F5F5F4] text-[#666666] font-mono text-[10px] capitalize">
                {currentTopic.format.replace('-', ' ')}
              </span>
              <span className="text-[11px] text-[#929292] font-mono pl-2">
                Source: {currentTopic.source}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNextTopic}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-[#252525] hover:bg-[#F5F5F4] text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Next Curated</span>
              </button>

              <button
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating}
                className="px-3.5 py-1.5 rounded-lg border border-[#252525] bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>AI Synthesize</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#252525] tracking-tight">
              {currentTopic.title}
            </h2>
            <div className="bg-[#F5F5F4] p-5 rounded-lg border border-[#E5E5E5]">
              <p className="text-base sm:text-lg text-[#252525] font-normal leading-relaxed">
                {currentTopic.question}
              </p>
            </div>
          </div>

          {currentTopic.taskExplanation && (
            <p className="text-xs text-[#666666] italic leading-relaxed">
              Coach Note: {currentTopic.taskExplanation}
            </p>
          )}

          {currentTopic.hints && currentTopic.hints.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#252525]" />
                <span>Recommended Dialectical Angles</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {currentTopic.hints.map((hint, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-[#F5F5F4] border border-[#E5E5E5] text-[#666666] text-xs font-mono"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Launch practice CTA */}
          <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
            <span className="text-xs text-[#666666]">
              Target: 1–5 min continuous articulation audit
            </span>
            <button
              onClick={() => onStartSession(currentTopic, selectedMode)}
              className="px-5 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Launch Practice Module</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#FFFFFF] rounded-lg border border-[#E5E5E5]">
          <RefreshCw className="w-5 h-5 text-[#252525] animate-spin mx-auto" />
          <p className="text-xs text-[#929292] mt-2 font-mono">Fetching challenge...</p>
        </div>
      )}
    </div>
  );
};
