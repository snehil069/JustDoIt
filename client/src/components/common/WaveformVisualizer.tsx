import React from 'react';

interface WaveformVisualizerProps {
  isRecording: boolean;
  volume: number; // 0.0 to 1.0
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
  volume,
  barCount = 48,
}) => {
  return (
    <div className="w-full h-12 bg-[#FAFAFA] border border-[#E5E5E5] rounded p-2 flex items-center justify-between gap-[3px] overflow-hidden select-none">
      {Array.from({ length: barCount }).map((_, i) => {
        const centerOffset = Math.abs(i - barCount / 2) / (barCount / 2);
        const curveWeight = 1 - centerOffset * 0.4;

        let heightPercent = 14;
        if (isRecording) {
          const jitter = Math.sin(i * 0.7 + Date.now() * 0.006) * 0.25 + 0.75;
          heightPercent = Math.min(100, Math.max(14, volume * 100 * curveWeight * jitter));
        }

        const isPeak = heightPercent > 35;

        return (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-75 ${
              isRecording
                ? isPeak
                  ? 'bg-[#252525]'
                  : 'bg-[#A3A3A3]'
                : 'bg-[#E5E5E5]'
            }`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
};
