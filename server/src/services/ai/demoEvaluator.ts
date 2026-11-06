import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
  GrammarCorrection,
  FactualClaimFlag,
} from '../../../../shared/types/index.js';

export class DemoEvaluator {
  public evaluate(params: {
    sessionId: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    audioMetrics?: AudioDeliveryMetrics;
  }): EvaluationReport {
    const { sessionId, topic, mode, transcript, durationSec, audioMetrics } = params;
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Rule-based heuristic evaluations
    const fillerRegex = /\b(um|uh|erm|like|you know|actually|basically)\b/gi;
    const fillerMatches = transcript.match(fillerRegex) || [];
    const fillerCount = fillerMatches.length;

    // Detect real common spoken English errors
    const corrections: GrammarCorrection[] = [];
    const testCases: Array<{ regex: RegExp; replacement: string; explanation: string }> = [
      {
        regex: /\b(did(?:n't| not) (?:knew|went|saw|took|made|spoke))\b/i,
        replacement: 'did not + base verb (e.g., did not know / did not go)',
        explanation: 'After the auxiliary "did", always use the base form of the verb, not the past tense.',
      },
      {
        regex: /\b(discuss about)\b/i,
        replacement: 'discuss',
        explanation: 'The verb "discuss" is transitive and takes a direct object; "about" is redundant.',
      },
      {
        regex: /\b(informations)\b/i,
        replacement: 'information / pieces of information',
        explanation: '"Information" is an uncountable noun and does not take a plural "-s".',
      },
      {
        regex: /\b(one of my friend)\b/i,
        replacement: 'one of my friends',
        explanation: 'The phrase "one of" requires a plural noun because you are selecting one from a group.',
      },
      {
        regex: /\b(every students|each students)\b/i,
        replacement: 'every student / each student',
        explanation: '"Every" and "each" modify singular countable nouns.',
      },
      {
        regex: /\b(he don't|she don't|it don't)\b/i,
        replacement: "he doesn't / she doesn't",
        explanation: 'Third-person singular subjects take "doesn\'t", not "don\'t" (subject-verb agreement).',
      },
      {
        regex: /\b(cope up with)\b/i,
        replacement: 'cope with',
        explanation: 'The correct idiom is "cope with"; "cope up with" is an unnatural colloquial redundancy.',
      },
    ];

    for (const test of testCases) {
      const match = transcript.match(test.regex);
      if (match) {
        corrections.push({
          whatSaid: match[0],
          correctVersion: test.replacement,
          explanation: test.explanation,
        });
      }
    }

    // Calibrated scoring based on real speech characteristics
    let contentScore = 14;
    let reasoningScore = 10;
    let orgScore = 10;
    let clarityScore = 11;
    let grammarScore = 11;
    let vocabScore = 7;
    let fluencyScore = 7;

    // Handle very short or empty response
    if (wordCount < 15) {
      contentScore = 3;
      reasoningScore = 2;
      orgScore = 3;
      clarityScore = 4;
      grammarScore = 6;
      vocabScore = 3;
      fluencyScore = 4;
    } else if (wordCount < 40) {
      contentScore = 9;
      reasoningScore = 6;
      orgScore = 7;
      clarityScore = 8;
      grammarScore = 9;
      vocabScore = 5;
      fluencyScore = 6;
    } else {
      // Adjust grammar score based on detected errors
      grammarScore = Math.max(5, 14 - corrections.length * 3);

      // Adjust fluency based on fillers
      fluencyScore = Math.max(3, 10 - Math.floor(fillerCount / 2));

      // Adjust reasoning if question keywords appear
      const lower = transcript.toLowerCase();
      const hits = (topic.keywords || []).filter((kw) => lower.includes(kw.toLowerCase()));
      if (hits.length > 1) {
        contentScore = Math.min(18, contentScore + 3);
        reasoningScore = Math.min(14, reasoningScore + 2);
      }
    }

    const totalScore =
      contentScore + reasoningScore + orgScore + clarityScore + grammarScore + vocabScore + fluencyScore;

    let performanceLevel: EvaluationReport['performanceLevel'] = 'Competent';
    if (totalScore < 45) performanceLevel = 'Needs Immediate Focus';
    else if (totalScore < 65) performanceLevel = 'Developing';
    else if (totalScore < 80) performanceLevel = 'Competent';
    else if (totalScore < 90) performanceLevel = 'Strong';
    else performanceLevel = 'Exceptional';

    const factualClaims: FactualClaimFlag[] = [];
    if (wordCount > 30) {
      factualClaims.push({
        claim: 'General statements on broad student or technological behavior',
        flag: 'unsupported',
        explanation:
          'Broad assertions were made without citing empirical research, surveys, or measurable case studies.',
        suggestedSourceOrCheck: 'Refer to peer-reviewed student surveys or published industry whitepapers.',
      });
    }

    return {
      id: `eval-demo-${Date.now()}`,
      sessionId,
      transcriptScore: totalScore,
      performanceLevel,
      mainTakeaway:
        wordCount < 20
          ? 'Response was too brief to develop structured arguments. Aim for at least 150-200 words.'
          : `Delivered a ${wordCount}-word response. Core ideas were communicated, but deeper reasoning and fewer fillers will improve clarity.`,
      dimensionScores: {
        contentRelevance: {
          score: contentScore,
          max: 20,
          feedback:
            wordCount < 20
              ? 'Insufficient content provided to assess prompt coverage.'
              : 'Addressed the core subject of the prompt with relevant thoughts.',
          evidence: transcript.substring(0, 80) + '...',
        },
        reasoningEvidence: {
          score: reasoningScore,
          max: 15,
          feedback: 'Reasoning relies on personal impression rather than concrete evidence or structured causal chains.',
          evidence: transcript.length > 60 ? transcript.substring(20, 100) : transcript,
        },
        organizationStructure: {
          score: orgScore,
          max: 15,
          feedback: 'Flow lacks explicit signposting (e.g. "Firstly...", "Furthermore...", "In conclusion...").',
          evidence: 'Sentence transitions show spontaneous thought rather than planned grouping.',
        },
        clarityConstruction: {
          score: clarityScore,
          max: 15,
          feedback: 'Sentences are generally understandable, though some ideas run on without pauses.',
          evidence: transcript.substring(0, 50),
        },
        grammar: {
          score: grammarScore,
          max: 15,
          feedback:
            corrections.length > 0
              ? `Identified ${corrections.length} specific grammatical improvement area(s).`
              : 'No glaring grammatical errors detected in the sample.',
          evidence: corrections.length > 0 ? corrections[0].whatSaid : 'Standard sentence syntax.',
        },
        vocabularyChoice: {
          score: vocabScore,
          max: 10,
          feedback: 'Everyday vocabulary used. Substituting informal phrases with precise terminology will elevate impact.',
          evidence: 'Common vocabulary pool.',
        },
        fluencyFillers: {
          score: fluencyScore,
          max: 10,
          feedback:
            fillerCount > 0
              ? `Detected ${fillerCount} filler word(s) (${fillerMatches.slice(0, 4).join(', ')}). Practice intentional pausing.`
              : 'Speech showed steady pacing without excessive vocalized fillers.',
          evidence: fillerCount > 0 ? `Fillers detected: ${fillerMatches.slice(0, 3).join(', ')}` : 'Clean verbal flow',
        },
      },
      strengths: [
        wordCount > 30 ? 'Attempted to address the challenge promptly without long hesitation' : 'Started speaking promptly',
        'Maintained understandable tone throughout the response',
        'Demonstrated willingness to articulate independent thoughts',
      ],
      improvementAreas: [
        fillerCount > 2 ? `Reduce reliance on filler words (found ${fillerCount})` : 'Provide more concrete evidence for claims',
        'Structure response with clear opening thesis, body arguments, and conclusion',
        'Deepen explanation with specific real-world examples rather than general statements',
      ],
      corrections,
      reasoningFeedback: {
        strongestArgument: wordCount > 20 ? 'Initial point setting the context of the prompt' : 'Prompt initiation',
        weakestArgument: 'Unsubstantiated generalization about how "everyone" acts or feels',
        missingPoint: 'Did not address potential counterarguments or alternative perspectives',
        unsupportedClaims: factualClaims,
        betterExample: 'Cite a specific case study, college scenario, or numerical indicator to anchor your claim.',
      },
      betterWaysToSayIt: [
        {
          original: transcript.substring(0, Math.min(80, transcript.length)),
          refined: 'To address this issue effectively, we must weigh both the practical advantages and the underlying risks.',
          whyBetter: 'Direct, confident thesis statement that establishes a structured analytical framework.',
        },
      ],
      deliveryMetrics: audioMetrics,
      deliveryScore: audioMetrics?.wordsPerMinute
        ? {
            score: Math.min(95, Math.max(40, 85 - (audioMetrics.fillerCount || 0) * 3)),
            confidence: 'medium',
            coverageNotes: 'Computed from local signal metrics and transcript word-density calculation.',
          }
        : undefined,
      personalizedExercises: [
        {
          title: '3-Part Argument Drill',
          description: 'Practice speaking for 60 seconds with this exact formula: Point -> Evidence -> Consequence.',
          targetIssue: 'Structure and evidence backing',
          durationMinutes: 3,
        },
        {
          title: 'Silent Pause Challenge',
          description: 'When you feel an "um" or "like" coming, close your mouth and pause silently for 1 second instead.',
          targetIssue: 'Filler word reduction',
          durationMinutes: 2,
        },
        {
          title: 'Counterargument Defense',
          description: 'State your opinion, then immediately say "However, critics argue that..." and refute it.',
          targetIssue: 'Critical thinking and debate depth',
          durationMinutes: 4,
        },
      ],
      recommendedNextChallenge: {
        category: topic.category,
        difficulty: topic.difficulty,
        suggestedPrompt: 'Repeat this challenge or try an Open-Ended Question with focused structure.',
        rationale: 'Solidifies structural improvements before advancing to harder abstract topics.',
      },
      isDemoMode: true,
      evaluationVersion: 'speakup-heuristic-engine-v1',
      createdAt: new Date().toISOString(),
    };
  }
}

export const demoEvaluator = new DemoEvaluator();
