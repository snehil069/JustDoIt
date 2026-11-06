import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
  GrammarCorrection,
} from '@shared/types/index';
import { CURATED_TOPICS } from '@shared/topics/topicBank';

interface GrammarRule {
  id: string;
  pattern: RegExp;
  fix: (match: RegExpMatchArray, sentence: string) => { correct: string; explanation: string; natural?: string };
}

// Comprehensive catalog of common grammatical, tense, prepositional, and idiom errors
const GRAMMAR_RULES: GrammarRule[] = [
  // 1. Subject-verb agreement (singular subjects with plural verbs)
  {
    id: 'sva-singular-subject',
    pattern: /\b(he|she|it|this|that|everyone|everybody|nobody|someone)\s+(are|were|have|do|go|want|come|know|take|see|think|make)\b/i,
    fix: (m) => {
      const subject = m[1];
      const verb = m[2].toLowerCase();
      const verbMap: Record<string, string> = {
        are: 'is',
        were: 'was',
        have: 'has',
        do: 'does',
        go: 'goes',
        want: 'wants',
        come: 'comes',
        know: 'knows',
        take: 'takes',
        see: 'sees',
        think: 'thinks',
        make: 'makes',
      };
      const correctVerb = verbMap[verb] || `${verb}s`;
      return {
        correct: `${subject} ${correctVerb}`,
        explanation: `Subject-verb disagreement: '${subject}' is third-person singular and requires '${correctVerb}', not '${verb}'.`,
        natural: `${subject} ${correctVerb}`,
      };
    },
  },

  // 2. Subject-verb agreement (plural subjects with singular verbs)
  {
    id: 'sva-plural-subject',
    pattern: /\b(they|we|you|these|those)\s+(is|was|has|does|goes)\b/i,
    fix: (m) => {
      const subject = m[1];
      const verb = m[2].toLowerCase();
      const verbMap: Record<string, string> = {
        is: 'are',
        was: 'were',
        has: 'have',
        does: 'do',
        goes: 'go',
      };
      const correctVerb = verbMap[verb] || 'are';
      return {
        correct: `${subject} ${correctVerb}`,
        explanation: `Subject-verb disagreement: Plural subject '${subject}' requires '${correctVerb}', not singular '${verb}'.`,
        natural: `${subject} ${correctVerb}`,
      };
    },
  },

  // 3. First person singular errors
  {
    id: 'sva-first-person',
    pattern: /\b(i)\s+(is|are|were|has|does)\b/i,
    fix: (m) => {
      const verb = m[2].toLowerCase();
      const verbMap: Record<string, string> = {
        is: 'am',
        are: 'am',
        were: 'was',
        has: 'have',
        does: 'do',
      };
      const correctVerb = verbMap[verb] || 'am';
      return {
        correct: `I ${correctVerb}`,
        explanation: `Grammar error: 'I' pairs with '${correctVerb}', not '${verb}'.`,
      };
    },
  },

  // 4. "He/She don't"
  {
    id: 'he-dont',
    pattern: /\b(he|she|it|this|that)\s+don't\b/i,
    fix: (m) => ({
      correct: `${m[1]} doesn't`,
      explanation: `Subject-verb disagreement: Third-person singular requires "doesn't", not "don't".`,
      natural: `${m[1]} doesn't`,
    }),
  },

  // 5. Past tense double-marking after "did / didn't"
  {
    id: 'double-past-did',
    pattern: /\b(did|didn't|did not)\s+(went|saw|spoke|ate|ran|bought|thought|came|knew|took|became)\b/i,
    fix: (m) => {
      const aux = m[1];
      const pastVerb = m[2].toLowerCase();
      const baseMap: Record<string, string> = {
        went: 'go',
        saw: 'see',
        spoke: 'speak',
        ate: 'eat',
        ran: 'run',
        bought: 'buy',
        thought: 'think',
        came: 'come',
        knew: 'know',
        took: 'take',
        became: 'become',
      };
      const base = baseMap[pastVerb] || pastVerb;
      return {
        correct: `${aux} ${base}`,
        explanation: `Double past tense error: After auxiliary '${aux}', the following verb must be in its bare infinitive form ('${base}'), not past tense ('${pastVerb}').`,
        natural: `${aux} ${base}`,
      };
    },
  },

  // 6. Perfect tense with simple past participle mismatch (e.g., "have went")
  {
    id: 'have-past-verb',
    pattern: /\b(have|has|had)\s+(went|saw|did|took|wrote|broke|spoke|chose|began)\b/i,
    fix: (m) => {
      const aux = m[1];
      const verb = m[2].toLowerCase();
      const partMap: Record<string, string> = {
        went: 'gone',
        saw: 'seen',
        did: 'done',
        took: 'taken',
        wrote: 'written',
        broke: 'broken',
        spoke: 'spoken',
        chose: 'chosen',
        began: 'begun',
      };
      const participle = partMap[verb] || `${verb}en`;
      return {
        correct: `${aux} ${participle}`,
        explanation: `Tense error: '${aux}' requires the past participle ('${participle}'), not simple past ('${verb}').`,
        natural: `${aux} ${participle}`,
      };
    },
  },

  // 7. Redundant "discuss about"
  {
    id: 'discuss-about',
    pattern: /\bdiscuss\s+about\b/i,
    fix: () => ({
      correct: 'discuss',
      explanation: `'Discuss' is a transitive verb that directly takes an object. Saying 'discuss about' is redundant.`,
      natural: 'discuss or talk about',
    }),
  },

  // 8. Incorrect idiom "cope up with"
  {
    id: 'cope-up-with',
    pattern: /\bcope\s+up\s+with\b/i,
    fix: () => ({
      correct: 'cope with',
      explanation: `Incorrect idiom: The standard English expression is 'cope with'. 'Up' is superfluous and incorrect.`,
      natural: 'cope with or manage',
    }),
  },

  // 9. Redundant "revert back" / "reply back"
  {
    id: 'revert-back',
    pattern: /\b(revert|reply|repeat|return)\s+back\b/i,
    fix: (m) => ({
      correct: m[1],
      explanation: `Tautology / Redundancy: '${m[1]}' already incorporates the concept of returning or replying; adding 'back' is redundant.`,
      natural: m[1],
    }),
  },

  // 10. Repeat again
  {
    id: 'repeat-again',
    pattern: /\brepeat\s+again\b/i,
    fix: () => ({
      correct: 'repeat',
      explanation: `'Repeat' already means to state again. Adding 'again' is redundant.`,
      natural: 'repeat or restate',
    }),
  },

  // 11. "According to me"
  {
    id: 'according-to-me',
    pattern: /\baccording\s+to\s+me\b/i,
    fix: () => ({
      correct: 'in my opinion',
      explanation: `'According to' is conventionally reserved for third-party authorities or external sources. Use 'In my view' or 'From my perspective' when stating your own opinion.`,
      natural: 'in my view / from my perspective',
    }),
  },

  // 12. "Every / Each" with plural noun
  {
    id: 'every-plural',
    pattern: /\b(every|each)\s+(students|people|members|friends|reasons|persons|colleges|problems|years)\b/i,
    fix: (m) => {
      const singular = m[2].endsWith('s') ? m[2].slice(0, -1) : m[2];
      return {
        correct: `${m[1]} ${singular}`,
        explanation: `Quantifier error: '${m[1]}' must be followed by a singular countable noun ('${singular}'), not plural ('${m[2]}').`,
        natural: `${m[1]} ${singular}`,
      };
    },
  },

  // 13. "One of the" with singular noun
  {
    id: 'one-of-the-singular',
    pattern: /\bone\s+of\s+the\s+([a-z]+(?<!s))\b/i,
    fix: (m) => {
      const noun = m[1];
      // Skip if noun is an irregular or non-standard
      if (['best', 'worst', 'most', 'main', 'first', 'last', 'only'].includes(noun.toLowerCase())) {
        return { correct: m[0], explanation: '' };
      }
      return {
        correct: `one of the ${noun}s`,
        explanation: `'One of the' denotes selection from a group and must be followed by a plural noun ('${noun}s'), not singular ('${noun}').`,
        natural: `one of the ${noun}s`,
      };
    },
  },

  // 14. "Much" with countable nouns
  {
    id: 'much-countable',
    pattern: /\bmuch\s+(people|things|friends|problems|reasons|students|mistakes)\b/i,
    fix: (m) => ({
      correct: `many ${m[1]}`,
      explanation: `'Much' is reserved for uncountable mass nouns (e.g., 'much water'). Use 'many' for countable items ('many ${m[1]}').`,
      natural: `many ${m[1]}`,
    }),
  },

  // 15. Double negatives
  {
    id: 'double-negative',
    pattern: /\b(don't|doesn't|didn't|can't|won't)\s+(have|know|see)\s+(no|nothing)\b/i,
    fix: (m) => {
      const aux = m[1];
      const verb = m[2];
      const repl = m[3].toLowerCase() === 'no' ? 'any' : 'anything';
      return {
        correct: `${aux} ${verb} ${repl}`,
        explanation: `Double negative: In formal English, combining '${aux}' with '${m[3]}' cancels the negative meaning. Use '${repl}' instead.`,
        natural: `${aux} ${verb} ${repl}`,
      };
    },
  },

  // 16. Indefinite article "a" before vowel sound
  {
    id: 'article-a-before-vowel',
    pattern: /\ba\s+(hour|honest|honor|apple|engineer|interview|idea|option|issue|answer|example|organization|industry|obstacle|outcome|insight)\b/i,
    fix: (m) => ({
      correct: `an ${m[1]}`,
      explanation: `Article error: Use 'an' before words starting with a vowel sound ('an ${m[1]}'), not 'a'.`,
      natural: `an ${m[1]}`,
    }),
  },

  // 17. Indefinite article "an" before consonant sound
  {
    id: 'article-an-before-consonant',
    pattern: /\ban\s+(university|uniform|user|useful|unique|one-time|student|teacher|problem|person|challenge|career|point)\b/i,
    fix: (m) => ({
      correct: `a ${m[1]}`,
      explanation: `Article error: Use 'a' before consonant sounds (including the 'yu' sound in '${m[1]}'), not 'an'.`,
      natural: `a ${m[1]}`,
    }),
  },
];

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

    // Detect transitional & structural markers
    const transitionWords = [
      'furthermore', 'however', 'moreover', 'on the other hand',
      'in addition', 'for example', 'for instance', 'specifically',
      'consequently', 'therefore', 'in contrast', 'firstly', 'secondly',
      'finally', 'in summary', 'to conclude', 'ultimately', 'because'
    ];
    const foundTransitions = transitionWords.filter((w) =>
      transcript.toLowerCase().includes(w)
    );

    // Topic keyword overlap
    const lowerTranscript = transcript.toLowerCase();
    const matchedKeywords = (topic.keywords || []).filter((kw) =>
      lowerTranscript.includes(kw.toLowerCase())
    );

    // Split into sentences
    const rawSentences = transcript
      .split(/[.?!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // Run Real Grammar Rules
    const corrections: GrammarCorrection[] = [];
    const detectedRuleIds = new Set<string>();

    for (const sentence of rawSentences) {
      for (const rule of GRAMMAR_RULES) {
        if (detectedRuleIds.has(rule.id)) continue;
        const match = sentence.match(rule.pattern);
        if (match) {
          const { correct, explanation, natural } = rule.fix(match, sentence);
          if (explanation) {
            detectedRuleIds.add(rule.id);
            const correctedSentence = sentence.replace(rule.pattern, correct);
            corrections.push({
              whatSaid: sentence,
              correctVersion: correctedSentence,
              explanation,
              naturalAlternative: natural ? sentence.replace(rule.pattern, natural) : undefined,
            });
          }
        }
      }
    }

    // Also flag excessive filler sentences if fewer than 3 grammatical errors
    if (corrections.length < 3) {
      for (const s of rawSentences) {
        if (corrections.length >= 4) break;
        if (corrections.some((c) => c.whatSaid === s)) continue;
        if (/\b(um|uh|like|you know|basically)\b/i.test(s)) {
          const cleaned = s
            .replace(/\b(um|uh|like|you know|basically)\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          if (cleaned.length > 5) {
            corrections.push({
              whatSaid: s,
              correctVersion: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
              explanation: 'Conversational filler habit: Replace spoken vocalized hesitation with an intentional silent pause.',
              naturalAlternative: cleaned,
            });
          }
        }
      }
    }

    // STRICT CALIBRATED SCORING (No inflated scores)
    let contentScore: number;
    let reasoningScore: number;
    let organizationScore: number;
    let clarityScore: number;
    let grammarScore: number;
    let vocabularyScore: number;
    let fluencyScore: number;

    if (wordCount < 15) {
      // Immediate failure / incomplete speech
      contentScore = 3;
      reasoningScore = 2;
      organizationScore = 2;
      clarityScore = 4;
      grammarScore = Math.max(3, 7 - corrections.length * 2);
      vocabularyScore = 2;
      fluencyScore = 3;
    } else if (wordCount < 40) {
      // Extremely brief / underdeveloped
      contentScore = 7;
      reasoningScore = 5;
      organizationScore = 5;
      clarityScore = 6;
      grammarScore = Math.max(4, 9 - corrections.length * 2);
      vocabularyScore = 4;
      fluencyScore = 5;
    } else if (wordCount < 75) {
      // Below average
      contentScore = 11;
      reasoningScore = 8;
      organizationScore = 7;
      clarityScore = 9;
      grammarScore = Math.max(5, 11 - corrections.length * 3);
      vocabularyScore = 5;
      fluencyScore = 6;
    } else {
      // Standard length response (75+ words)
      contentScore = 13;
      reasoningScore = 10;
      organizationScore = 9;
      clarityScore = 10;
      grammarScore = Math.max(5, 14 - corrections.length * 3);
      vocabularyScore = 6;
      fluencyScore = 8;

      // Reward genuine topical relevance
      if (matchedKeywords.length >= 3) contentScore = Math.min(19, contentScore + 4);
      else if (matchedKeywords.length >= 1) contentScore = Math.min(17, contentScore + 2);
      else contentScore = Math.max(6, contentScore - 4); // Off-topic penalty

      // Reward structural connectors
      if (foundTransitions.length >= 3) organizationScore = Math.min(14, organizationScore + 3);
      else if (foundTransitions.length === 0) organizationScore = Math.max(5, organizationScore - 3);

      // Penalize filler word frequency
      if (fillerRatio > 0.08) fluencyScore = Math.max(3, fluencyScore - 4);
      else if (fillerRatio > 0.04) fluencyScore = Math.max(5, fluencyScore - 2);

      // Penalize abnormal pacing
      if (wpm < 95) {
        fluencyScore = Math.max(3, fluencyScore - 3);
        clarityScore = Math.max(5, clarityScore - 2);
      } else if (wpm > 175) {
        fluencyScore = Math.max(4, fluencyScore - 2);
        clarityScore = Math.max(6, clarityScore - 2);
      }
    }

    const totalScore = Math.min(
      100,
      Math.max(
        15,
        contentScore +
          reasoningScore +
          organizationScore +
          clarityScore +
          grammarScore +
          vocabularyScore +
          fluencyScore
      )
    );

    let performanceLevel: EvaluationReport['performanceLevel'] = 'Competent';
    if (totalScore >= 85) performanceLevel = 'Exceptional';
    else if (totalScore >= 72) performanceLevel = 'Strong';
    else if (totalScore >= 58) performanceLevel = 'Competent';
    else if (totalScore >= 42) performanceLevel = 'Developing';
    else performanceLevel = 'Needs Immediate Focus';

    // Build Better Ways to Say It
    const betterWays: EvaluationReport['betterWaysToSayIt'] = [];
    if (rawSentences.length > 0) {
      const s0 = rawSentences[0];
      betterWays.push({
        original: s0,
        refined: `To address this directly: ${s0.replace(/^(so|well|i think that|basically|actually)\s*/i, '').trim()}`,
        whyBetter: 'Eliminates conversational introductory clutter and establishes a confident, definitive opening.',
      });
      if (rawSentences.length > 1) {
        const s1 = rawSentences[1];
        betterWays.push({
          original: s1,
          refined: `Furthermore, ${s1.replace(/^(and|also|so)\s*/i, '').trim()}`,
          whyBetter: 'Replaces weak informal conjunctions with professional connective tissue.',
        });
      }
    }

    // Concrete Strengths
    const strengths: string[] = [];
    if (wordCount >= 60) strengths.push(`Sustained speaking effort: delivered ${wordCount} words over ${effectiveDuration}s (${wpm} WPM).`);
    if (matchedKeywords.length > 0) strengths.push(`Addressed core prompt topics directly: "${matchedKeywords.slice(0, 3).join('", "')}".`);
    if (foundTransitions.length > 0) strengths.push(`Used structural markers ("${foundTransitions[0]}") to link arguments.`);
    if (strengths.length === 0) strengths.push('Clear audible attempt on the topic prompt.');

    // Concrete Improvement Areas
    const improvementAreas: string[] = [];
    if (corrections.length > 0) {
      improvementAreas.push(`Grammatical precision: Detected ${corrections.length} specific grammatical/syntactical violations (${corrections.map((c) => c.explanation.split(':')[0]).slice(0, 2).join(', ')}). Review the corrections table below.`);
    }
    if (wordCount < 40) {
      improvementAreas.push(`Insufficient elaboration: Spoke only ${wordCount} words. You must unpack your point with at least one concrete example or counter-perspective.`);
    }
    if (fillerCount >= 2) {
      improvementAreas.push(`Vocalized hesitations: Used ${fillerCount} filler words ("${fillerMatches.slice(0, 3).join('", "')}"). Practice comfortable silence instead of verbal filling.`);
    }
    if (foundTransitions.length === 0 && wordCount >= 30) {
      improvementAreas.push('Logical structure: Link thoughts using signposts such as "for instance", "consequently", or "on the other hand".');
    }
    if (wpm < 95) {
      improvementAreas.push(`Pacing cadence: Your speaking speed was ${wpm} WPM (ideal target: 125-155 WPM). Increase energy and reduce hesitant pauses.`);
    }
    if (improvementAreas.length === 0) {
      improvementAreas.push('Elevate vocabulary by swapping basic verbs and adjectives for domain-specific terminology.');
    }

    const nextTopic =
      CURATED_TOPICS.find((t) => t.id !== topic.id && t.category === topic.category) ||
      CURATED_TOPICS[0];

    const mainVerdict =
      wordCount < 25
        ? `Critically brief (${wordCount} words). A score of ${totalScore}/100 reflects insufficient content to evaluate reasoning depth. Aim for at least 60-90 seconds.`
        : corrections.length > 0
        ? `Score: ${totalScore}/100 (${performanceLevel}). Identified ${corrections.length} grammatical/phrasing issues that detract from communication authority. Review each item in the corrections table.`
        : `Score: ${totalScore}/100 (${performanceLevel}). Clean delivery at ${wpm} WPM, but needs stronger causal evidence and structural signposting to achieve higher scores.`;

    return {
      id: `report-${Date.now()}`,
      sessionId: sessionId || `session-${Date.now()}`,
      isDemoMode: true,
      evaluationVersion: '2.0.0-calibrated',
      createdAt: new Date().toISOString(),
      transcriptScore: totalScore,
      performanceLevel,
      mainTakeaway: mainVerdict,
      dimensionScores: {
        contentRelevance: {
          score: contentScore,
          max: 20,
          feedback:
            matchedKeywords.length > 0
              ? `Engaged with central prompt keywords (${matchedKeywords.join(', ')}).`
              : 'Weak topic relevance: The transcript showed little direct alignment with the specific challenge prompt.',
          evidence: rawSentences[0] || transcript.slice(0, 60),
        },
        reasoningEvidence: {
          score: reasoningScore,
          max: 15,
          feedback:
            wordCount > 60
              ? 'Explanations were audible, but lacked a concrete verifiable example or cause-and-effect demonstration.'
              : 'Claims were made without explanatory backing. Explain the *why* behind your assertions.',
          evidence: rawSentences[1] || rawSentences[0] || transcript.slice(0, 50),
        },
        organizationStructure: {
          score: organizationScore,
          max: 15,
          feedback:
            foundTransitions.length > 0
              ? `Employed logical transitions: ${foundTransitions.join(', ')}.`
              : 'Speech lacked clear signposting. Follow the PREP framework: Point, Reason, Example, Point.',
          evidence: foundTransitions[0] || (rawSentences.length > 1 ? rawSentences[1] : 'Sequential phrasing'),
        },
        clarityConstruction: {
          score: clarityScore,
          max: 15,
          feedback:
            wpm < 95
              ? `Halting pace (${wpm} WPM) affected sentence flow. Maintain sentence rhythm.`
              : 'Sentences were largely comprehensible. Aim for concise phrases under 20 words.',
          evidence: rawSentences[0] || transcript.slice(0, 40),
        },
        grammar: {
          score: grammarScore,
          max: 15,
          feedback:
            corrections.length > 0
              ? `Penalized for ${corrections.length} grammatical/collocation errors: ${corrections.map((c) => c.explanation.split(':')[0]).join('; ')}.`
              : 'No glaring grammatical errors detected in this transcript sample.',
          evidence:
            corrections.length > 0
              ? corrections[0].whatSaid
              : rawSentences[0] || transcript.slice(0, 40),
        },
        vocabularyChoice: {
          score: vocabularyScore,
          max: 10,
          feedback:
            'Relied heavily on everyday conversational vocabulary. Integrate domain-precise nouns and descriptive adjectives.',
          evidence: words.slice(0, 6).join(' '),
        },
        fluencyFillers: {
          score: fluencyScore,
          max: 10,
          feedback:
            fillerCount > 0
              ? `Detected ${fillerCount} vocalized fillers (${fillerMatches.slice(0, 3).join(', ')}). Filler ratio: ${(fillerRatio * 100).toFixed(1)}%.`
              : 'Clean delivery with minimal vocalized hesitation.',
          evidence:
            fillerCount > 0
              ? fillerMatches.slice(0, 4).join(', ')
              : 'No prominent vocalized fillers',
        },
      },
      strengths,
      improvementAreas,
      corrections,
      reasoningFeedback: {
        strongestArgument: rawSentences.length > 0 ? `Key assertion: "${rawSentences[0]}"` : 'Direct attempt at tackling the prompt.',
        weakestArgument:
          wordCount < 40
            ? 'Premature ending without supporting evidence.'
            : 'Unbacked generalized claim made in the body of the response.',
        missingPoint: 'Did not address the counter-perspective or acknowledge real-world trade-offs.',
        betterExample: `Consider anchoring your point in a specific case study: e.g., how this dynamic operates in a collegiate project team or real-world organization.`,
      },
      betterWaysToSayIt: betterWays,
      personalizedExercises: [
        {
          title: 'Grammar & Subject-Verb Agreement Drill',
          description: 'Record 3 complex sentences using third-person singular subjects ("The engineer explains...", "Each team member presents...").',
          targetIssue: 'Subject-Verb Agreement and Tense Precision',
          durationMinutes: 4,
        },
        {
          title: 'The Silent Pause Drill',
          description: 'Whenever you feel the impulse to say "um", "like", or "basically", close your mouth completely for 2 silent seconds.',
          targetIssue: 'Eliminating filler sounds',
          durationMinutes: 3,
        },
      ],
      recommendedNextChallenge: {
        category: nextTopic.category,
        difficulty: nextTopic.difficulty,
        suggestedPrompt: `${nextTopic.title} — ${nextTopic.question}`,
        rationale: 'Forces you to explain technical concepts with strict grammatical accuracy.',
      },
    };
  }
}
