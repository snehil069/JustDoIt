import React, { useState } from 'react';
import { Topic, PracticeSession } from '@shared/types/index';
import { PracticeEngine } from '../practice/PracticeEngine';
import { ShieldAlert, Users, ArrowRight } from 'lucide-react';

interface RealLifeModeProps {
  topic: Topic;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
}

export const RealLifeMode: React.FC<RealLifeModeProps> = ({
  topic,
  onEvaluationComplete,
  onCancel,
}) => {
  return (
    <PracticeEngine
      topic={topic}
      mode="real-life"
      onEvaluationComplete={onEvaluationComplete}
      onCancel={onCancel}
    />
  );
};
