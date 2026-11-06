import React, { useState, useEffect } from 'react';
import {
  Topic,
  PracticeMode,
  PracticeSession,
  ProviderSettings,
  UserProgress,
} from '@shared/types/index';
import { storageService, DEFAULT_SETTINGS, DEFAULT_PROGRESS } from './services/storage';
import { api } from './services/api';
import { Navbar } from './components/common/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ModeSelectorView } from './components/modes/ModeSelectorView';
import { TopicGeneratorView } from './components/topics/TopicGeneratorView';
import { PracticeEngine } from './components/practice/PracticeEngine';
import { ResearchMode } from './components/modes/ResearchMode';
import { DebateRoom } from './components/modes/DebateRoom';
import { InterviewRoom } from './components/modes/InterviewRoom';
import { ExplainSimplyMode } from './components/modes/ExplainSimplyMode';
import { RealLifeMode } from './components/modes/RealLifeMode';
import { EvaluationReportView } from './components/evaluation/EvaluationReportView';
import { ProgressView } from './components/progress/ProgressView';
import { HistoryView } from './components/progress/HistoryView';
import { SettingsView } from './components/settings/SettingsView';

export function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<Topic | null>(null);

  // Active Practice State
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeMode, setActiveMode] = useState<PracticeMode>('impromptu');
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('speakup_theme') === 'dark' ||
      (!('speakup_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('speakup_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('speakup_theme', 'light');
    }
  }, [darkMode]);

  // Load initial data
  useEffect(() => {
    const loadedSettings = storageService.getSettings();
    const loadedProgress = storageService.getProgress();
    const loadedSessions = storageService.getSessions();

    setSettings(loadedSettings);
    setProgress(loadedProgress);
    setSessions(loadedSessions);

    // Sync with Supabase if configured
    storageService.syncWithSupabase().then((data) => {
      if (data) {
        setSessions(data.sessions);
        setProgress(data.progress);
      }
    });

    // Check server settings for optional sync
    fetch('/api/settings')
      .then((res) => res.json())
      .catch(() => {});

    // Fetch daily challenge
    api.getRandomTopic({ category: 'everyday-life', difficulty: 'medium' })
      .then((t) => setDailyChallenge(t))
      .catch((e) => console.warn('Failed to load daily challenge:', e));

    // Sync settings to server
    api.updateServerSettings({
      geminiApiKey: loadedSettings.geminiApiKey,
      deepgramApiKey: loadedSettings.deepgramApiKey,
      defaultAiProvider: loadedSettings.preferredAiProvider,
      defaultSttProvider: loadedSettings.preferredSttProvider,
    }).catch(() => {});
  }, []);

  const refreshUserData = () => {
    setProgress(storageService.getProgress());
    setSessions(storageService.getSessions());
  };

  const handleStartPractice = async (mode: PracticeMode, topic?: Topic) => {
    setActiveMode(mode);
    if (topic) {
      setActiveTopic(topic);
    } else {
      try {
        const generated = await api.getRandomTopic({ mode });
        setActiveTopic(generated);
      } catch (e) {
        console.error('Failed to get topic for practice:', e);
      }
    }
    setCurrentView('practice');
  };

  const handleEvaluationComplete = (session: PracticeSession) => {
    setActiveSession(session);
    refreshUserData();
    setCurrentView('evaluation');
  };

  const handleOpenHistoricalSession = (session: PracticeSession) => {
    setActiveSession(session);
    setCurrentView('evaluation');
  };

  const handlePracticeAgain = async (sameTopic?: Topic, mode?: PracticeMode) => {
    const nextMode = mode || activeMode || 'impromptu';
    if (sameTopic) {
      handleStartPractice(nextMode, sameTopic);
    } else {
      try {
        const nextTopic = await api.getRandomTopic({ mode: nextMode });
        handleStartPractice(nextMode, nextTopic);
      } catch (e) {
        handleStartPractice(nextMode);
      }
    }
  };

  const handleSkipTopic = async () => {
    try {
      const nextTopic = await api.getRandomTopic({ mode: activeMode });
      setActiveTopic(nextTopic);
    } catch (e) {
      console.warn('Failed to skip topic:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#252525] flex flex-col font-sans selection:bg-[#252525] selection:text-[#FFFFFF]">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        streakDays={progress.currentStreakDays}
        settings={settings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'dashboard' && (
          <DashboardView
            progress={progress}
            dailyChallenge={dailyChallenge}
            onStartPractice={handleStartPractice}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'modes' && (
          <ModeSelectorView onSelectMode={(mode) => handleStartPractice(mode)} />
        )}

        {currentView === 'topics' && (
          <TopicGeneratorView
            onStartSession={(topic, mode) => handleStartPractice(mode, topic)}
          />
        )}

        {currentView === 'practice' && activeTopic && (
          <>
            {activeMode === 'impromptu' && (
              <PracticeEngine
                topic={activeTopic}
                mode="impromptu"
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
                onSkipTopic={handleSkipTopic}
              />
            )}
            {activeMode === 'research' && (
              <ResearchMode
                topic={activeTopic}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
            {activeMode === 'debate' && (
              <DebateRoom
                topic={activeTopic}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
            {activeMode === 'interview' && (
              <InterviewRoom
                topic={activeTopic}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
            {activeMode === 'explain-simply' && (
              <ExplainSimplyMode
                topic={activeTopic}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
            {activeMode === 'real-life' && (
              <RealLifeMode
                topic={activeTopic}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}
          </>
        )}

        {currentView === 'evaluation' && activeSession && (
          <EvaluationReportView
            session={activeSession}
            onPracticeAgain={handlePracticeAgain}
            onNavigateHome={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'progress' && (
          <ProgressView
            progress={progress}
            onNavigateHome={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            sessions={sessions}
            onOpenSession={handleOpenHistoricalSession}
            onRefresh={refreshUserData}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
