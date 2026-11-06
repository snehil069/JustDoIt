import React from 'react';

interface WaveformVisualizerProps {
  isRecording: boolean;
  volume: number; // 0.0 to 1.0
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
  volume,
  barCount = 28,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 px-4 py-2 bg-slate-900/5 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
      {Array.from({ length: barCount }).map((_, i) => {
        // Natural curved shape taller in center
        const centerOffset = Math.abs(i - barCount / 2) / (barCount / 2);
        const curveWeight = 1 - centerOffset * 0.45;

        let heightPercent = 15;
        if (isRecording) {
          // Dynamic jitter based on index and real volume
          const jitter = Math.sin(i * 0.8 + Date.now() * 0.005) * 0.2 + 0.8;
          heightPercent = Math.min(100, Math.max(15, volume * 100 * curveWeight * jitter));
        }

        return (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              isRecording
                ? volume > 0.05
                  ? 'bg-brand-500 dark:bg-brand-400'
                  : 'bg-slate-300 dark:bg-slate-600'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
};
