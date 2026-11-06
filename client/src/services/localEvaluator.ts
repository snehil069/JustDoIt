import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
} from '@shared/types/index';
import { CURATED_TOPICS } from '@shared/topics/topicBank';

export class LocalEvaluator {
  public static evaluate(params: {
    sessionId?: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    audioMetrics?: AudioDeliveryMetrics;
    researchNotes?: string;
  }): EvaluationReport {
    const { sessionId, topic, mode, transcript, durationSec, audioMetrics, researchNotes } = params;
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const effectiveDuration = Math.max(1, durationSec);
    const calculatedWpm = Math.round((wordCount / effectiveDuration) * 60);
    const wpm = audioMetrics?.wordsPerMinute || calculatedWpm;

    // Detect filler words
    const fillerRegex = /\b(um|uh|erm|like|you know|basically|actually|sort of|kind of|i mean)\b/gi;
    const fillerMatches = transcript.match(fillerRegex) || [];
    const fillerCount = fillerMatches.length;
    const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

    // Transition & structural markers
    const transitionWords = [
      'furthermore', 'however', 'moreover', 'on the other hand',
      'in addition', 'for example', 'for instance', 'specifically',
      'consequently', 'therefore', 'in contrast', 'firstly', 'secondly',
      'finally', 'in summary', 'to conclude', 'ultimately'
    ];
    const foundTransitions = transitionWords.filter((w) =>
      transcript.toLowerCase().includes(w)
    );

    // Topic keyword overlap
    const lowerTranscript = transcript.toLowerCase();
    const matchedKeywords = (topic.keywords || []).filter((kw) =>
      lowerTranscript.includes(kw.toLowerCase())
    );

    // Sentences
    const sentences = transcript
      .split(/[.?!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // Calibrate Dimension Scores
    let contentScore = 14;
    let reasoningScore = 10;
    let organizationScore = 10;
    let clarityScore = 11;
    let grammarScore = 11;
    let vocabularyScore = 7;
    let fluencyScore = 8;

    // Penalty for extremely short answers
    if (wordCount < 20) {
      contentScore = 4;
      reasoningScore = 3;
      organizationScore = 3;
      clarityScore = 5;
      grammarScore = 6;
      vocabularyScore = 3;
      fluencyScore = 4;
    } else if (wordCount < 50) {
      contentScore = 9;
      reasoningScore = 6;
      organizationScore = 6;
      clarityScore = 8;
      grammarScore = 8;
      vocabularyScore = 5;
      fluencyScore = 6;
    } else {
      // Content & Keywords
      if (matchedKeywords.length >= 2) contentScore = Math.min(20, contentScore + 3);
      if (researchNotes && researchNotes.length > 20) contentScore = Math.min(20, contentScore + 2);

      // Structure
      if (foundTransitions.length >= 2) organizationScore = Math.min(15, organizationScore + 3);
      if (sentences.length >= 4) organizationScore = Math.min(15, organizationScore + 1);

      // Fluency
      if (fillerRatio > 0.08) fluencyScore = Math.max(3, fluencyScore - 4);
      else if (fillerRatio > 0.04) fluencyScore = Math.max(5, fluencyScore - 2);

      // WPM pace penalty
      if (wpm < 95 || wpm > 175) {
        clarityScore = Math.max(5, clarityScore - 2);
        fluencyScore = Math.max(4, fluencyScore - 2);
      }
    }

    const totalScore = Math.min(
      100,
      contentScore +
        reasoningScore +
        organizationScore +
        clarityScore +
        grammarScore +
        vocabularyScore +
        fluencyScore
    );

    let performanceLevel: EvaluationReport['performanceLevel'] = 'Competent';
    if (totalScore >= 85) performanceLevel = 'Exceptional';
    else if (totalScore >= 75) performanceLevel = 'Strong';
    else if (totalScore >= 60) performanceLevel = 'Competent';
    else if (totalScore >= 45) performanceLevel = 'Developing';
    else performanceLevel = 'Needs Immediate Focus';

    // Build corrections from sentences with fillers or run-ons
    const corrections: EvaluationReport['corrections'] = [];
    const betterWays: EvaluationReport['betterWaysToSayIt'] = [];

    sentences.forEach((s) => {
      if (corrections.length < 3 && /\b(um|uh|like|basically)\b/i.test(s)) {
        const cleaned = s.replace(/\b(um|uh|like|basically)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
        corrections.push({
          whatSaid: s,
          correctVersion: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
          explanation: 'Spoken filler words weaken listener authority. Pause briefly instead of verbalizing hesitation.',
          naturalAlternative: cleaned,
        });
      }
    });

    if (sentences.length > 0 && betterWays.length === 0) {
      const targetSentence = sentences[0];
      betterWays.push({
        original: targetSentence,
        refined: `To address the core question directly: ${targetSentence.replace(/^(so|well|i think that|basically)\s*/i, '')}`,
        whyBetter: 'Leads with clear thesis positioning and eliminates initial conversational filler.',
      });
    }

    // Strengths
    const strengths: string[] = [];
    if (wordCount >= 60) strengths.push(`Sustained speaking output for ${effectiveDuration}s with ${wordCount} total words delivered.`);
    if (foundTransitions.length > 0) strengths.push(`Used transitional signposts ("${foundTransitions[0]}") to guide the argument.`);
    if (matchedKeywords.length > 0) strengths.push(`Engaged directly with core topic concepts: "${matchedKeywords.slice(0, 2).join('", "')}".`);
    if (strengths.length === 0) strengths.push('Clear audible attempt on the topic prompt.');

    // Improvements
    const improvementAreas: string[] = [];
    if (wordCount < 40) improvementAreas.push('Elaboration depth: Expand beyond surface statements by adding a concrete real-world example.');
    if (fillerCount >= 3) improvementAreas.push(`Filler vocalization: Detected ${fillerCount} filler occurrences ("${fillerMatches.slice(0, 2).join('", "')}"). Practice intentional silence.`);
    if (foundTransitions.length < 2) improvementAreas.push('Argument structure: Link your points with clear contrast connectors like "however", "consequently", or "for instance".');
    if (wpm < 100) improvementAreas.push(`Delivery cadence: Speaking pace was ${wpm} WPM (target: 120-150 WPM). Aim for a more energetic momentum.`);
    if (improvementAreas.length === 0) improvementAreas.push('Refine concluding summary to cement your primary takeaway for the listener.');

    // Find next recommended challenge
    const nextTopic = CURATED_TOPICS.find((t) => t.id !== topic.id && t.category === topic.category) || CURATED_TOPICS[0];

    return {
      id: `report-${Date.now()}`,
      sessionId: sessionId || `session-${Date.now()}`,
      isDemoMode: true,
      evaluationVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      transcriptScore: totalScore,
      performanceLevel,
      mainTakeaway:
        wordCount < 25
          ? 'Response was too brief to demonstrate structured depth. Aim to speak for at least 60-90 seconds with clear supporting points.'
          : `Demonstrated ${performanceLevel.toLowerCase()} communication with a speaking rate of ${wpm} WPM. Focus on structuring supporting evidence and reducing conversational fillers.`,
      dimensionScores: {
        contentRelevance: {
          score: contentScore,
          max: 20,
          feedback: matchedKeywords.length > 0 ? `Addressed the central prompt themes (${matchedKeywords.join(', ')}).` : 'Ensure every sentence connects back to the core question prompt.',
          evidence: sentences[0] || transcript.slice(0, 60),
        },
        reasoningEvidence: {
          score: reasoningScore,
          max: 15,
          feedback: wordCount > 60 ? 'Points made were understandable, but would benefit from a specific real-world case study or personal observation.' : 'Support your thesis with concrete causal explanations ("this happens because...").',
          evidence: sentences[1] || sentences[0] || transcript.slice(0, 50),
        },
        organizationStructure: {
          score: organizationScore,
          max: 15,
          feedback: foundTransitions.length > 0 ? `Good use of structural connectives: ${foundTransitions.join(', ')}.` : 'Use a 3-part framework: (1) Direct thesis, (2) Two supporting reasons with examples, (3) One-sentence summary.',
          evidence: foundTransitions[0] || (sentences.length > 2 ? sentences[2] : 'Sequential flow'),
        },
        clarityConstruction: {
          score: clarityScore,
          max: 15,
          feedback: 'Sentences were largely intelligible. Keep sentences under 25 words to prevent trailing thoughts.',
          evidence: sentences[0] || transcript.slice(0, 40),
        },
        grammar: {
          score: grammarScore,
          max: 15,
          feedback: 'Natural grammatical flow without major disruptive syntax barriers.',
          evidence: sentences.length > 1 ? sentences[1] : transcript.slice(0, 40),
        },
        vocabularyChoice: {
          score: vocabularyScore,
          max: 10,
          feedback: 'Accessible vocabulary. Aim to use domain-precise terminology instead of generic descriptors like "good" or "bad".',
          evidence: words.slice(0, 5).join(' '),
        },
        fluencyFillers: {
          score: fluencyScore,
          max: 10,
          feedback: fillerCount > 0 ? `Recorded ${fillerCount} filler sounds. Replace verbal fillers with a clean, calm 1-second pause.` : 'Clean cadence with minimal vocalized hesitation.',
          evidence: fillerCount > 0 ? fillerMatches.slice(0, 3).join(', ') : 'No distracting fillers detected',
        },
      },
      strengths,
      improvementAreas,
      corrections,
      reasoningFeedback: {
        strongestArgument: sentences.length > 0 ? `Initial statement: "${sentences[0]}"` : 'Direct attempt at tackling the prompt.',
        weakestArgument: wordCount < 40 ? 'Limited elaboration on the second half of the question.' : 'Premature conclusion before exploring opposing viewpoints.',
        missingPoint: 'Did not address potential counterarguments or alternative interpretations of the scenario.',
        betterExample: 'You could cite a specific observed collegiate or professional scenario where this principle created measurable impact.',
      },
      betterWaysToSayIt: betterWays,
      personalizedExercises: [
        {
          title: 'The 2-Second Silent Pause Drill',
          description: 'Whenever you feel the urge to say "um", "like", or "basically", close your lips and take a silent 2-second breath before resuming.',
          targetIssue: 'Eliminating filler words',
          durationMinutes: 3,
        },
        {
          title: 'PREP Structure Walkthrough',
          description: 'Practice answering 3 quick questions using Point, Reason, Example, Point.',
          targetIssue: 'Structure & clear reasoning',
          durationMinutes: 5,
        },
      ],
      recommendedNextChallenge: {
        category: nextTopic.category,
        difficulty: nextTopic.difficulty,
        suggestedPrompt: `${nextTopic.title} — ${nextTopic.question}`,
        rationale: 'Builds your ability to structure logical arguments under timed pressure.',
      },
    };
  }
}
