import type {
  Topic,
  PracticeMode,
  EvaluationReport,
  DimensionScore,
  GrammarCorrection,
  MissedPoint,
  ImprovementPriority,
  CoachSummary,
  DetailedObservation,
  AudioDeliveryMetrics,
} from '../types/index.ts';
import { CURATED_TOPICS } from '../topics/topicBank.ts';

interface GrammarRule {
  id: string;
  errorType: string;
  severity: 'minor' | 'moderate' | 'major';
  pattern: RegExp;
  fix: (match: RegExpMatchArray, sentence: string) => {
    correct: string;
    explanation: string;
    natural?: string;
  };
}

export const LINGUISTIC_RULES: GrammarRule[] = [
  // 1. Singular subject with plural verb (Subject-verb agreement)
  {
    id: 'sva-singular-subject',
    errorType: 'Subject-Verb Agreement',
    severity: 'major',
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
        explanation: `Subject-verb disagreement: Singular subject '${subject}' requires the third-person singular verb '${correctVerb}', not '${verb}'.`,
        natural: `${subject} ${correctVerb}`,
      };
    },
  },

  // 2. Plural subject with singular verb
  {
    id: 'sva-plural-subject',
    errorType: 'Subject-Verb Agreement',
    severity: 'major',
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

  // 3. First person singular errors ("I has", "I is", "I does")
  {
    id: 'sva-first-person',
    errorType: 'Subject-Verb Agreement',
    severity: 'major',
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
        explanation: `Subject-verb disagreement: First-person singular pronoun 'I' pairs with '${correctVerb}', not '${verb}'.`,
      };
    },
  },

  // 4. Singular subject with "don't" (e.g. "he don't", "the teacher don't")
  {
    id: 'sva-negative-contraction',
    errorType: 'Subject-Verb Agreement',
    severity: 'moderate',
    pattern: /\b(the\s+[a-z]+(?<!s)|he|she|it|this|that|everyone|everybody|nobody|someone|teacher|student)\s+don't\b/i,
    fix: (m) => ({
      correct: `${m[1]} doesn't`,
      explanation: `Subject-verb disagreement: Singular subject '${m[1]}' requires the contraction "doesn't", not "don't".`,
      natural: `${m[1]} doesn't`,
    }),
  },

  // 5. Double past tense with auxiliary did / didn't
  {
    id: 'double-past-did',
    errorType: 'Auxiliary Verb & Tense Doubling',
    severity: 'major',
    pattern: /\b(did|didn't|did not)\s+(went|saw|spoke|ate|ran|bought|thought|came|knew|took|became|wrote)\b/i,
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
        wrote: 'write',
      };
      const base = baseMap[pastVerb] || pastVerb;
      return {
        correct: `${aux} ${base}`,
        explanation: `Double past tense violation: The auxiliary verb '${aux}' already marks the past tense. The main verb that follows must remain in the base infinitive ('${base}'), not past tense ('${pastVerb}').`,
        natural: `${aux} ${base}`,
      };
    },
  },

  // 6. Perfect tense with simple past verb instead of past participle (e.g., "have went")
  {
    id: 'perfect-tense-participle',
    errorType: 'Past Participle Misuse',
    severity: 'major',
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
        explanation: `Tense construction error: Auxiliary '${aux}' requires the past participle ('${participle}'), not simple past ('${verb}').`,
        natural: `${aux} ${participle}`,
      };
    },
  },

  // 7. Redundant "discuss about"
  {
    id: 'preposition-discuss-about',
    errorType: 'Redundant Preposition',
    severity: 'moderate',
    pattern: /\bdiscuss\s+about\b/i,
    fix: () => ({
      correct: 'discuss',
      explanation: `'Discuss' is a transitive verb that directly governs its object (e.g. 'discuss the plan'). Saying 'discuss about' is redundant.`,
      natural: 'discuss or talk about',
    }),
  },

  // 8. Incorrect idiom "cope up with"
  {
    id: 'idiom-cope-up-with',
    errorType: 'Incorrect Idiom / Collocation',
    severity: 'moderate',
    pattern: /\bcope\s+up\s+with\b/i,
    fix: () => ({
      correct: 'cope with',
      explanation: `Collocation error: The standard English idiom is 'cope with'. 'Up' is superfluous and grammatically incorrect.`,
      natural: 'cope with or handle',
    }),
  },

  // 9. Tautology "revert back" / "reply back"
  {
    id: 'tautology-revert-back',
    errorType: 'Tautology / Redundancy',
    severity: 'minor',
    pattern: /\b(revert|reply|repeat|return)\s+back\b/i,
    fix: (m) => ({
      correct: m[1],
      explanation: `Redundancy: The prefix 're-' in '${m[1]}' already denotes returning or answering. Adding 'back' creates an unnecessary tautology.`,
      natural: m[1],
    }),
  },

  // 10. Redundant "repeat again"
  {
    id: 'tautology-repeat-again',
    errorType: 'Tautology / Redundancy',
    severity: 'minor',
    pattern: /\brepeat\s+again\b/i,
    fix: () => ({
      correct: 'repeat',
      explanation: `'Repeat' means to say or do something again. Using 'repeat again' is redundant.`,
      natural: 'repeat or restate',
    }),
  },

  // 11. "According to me"
  {
    id: 'collocation-according-to-me',
    errorType: 'Collocation / Tone',
    severity: 'minor',
    pattern: /\baccording\s+to\s+me\b/i,
    fix: () => ({
      correct: 'in my opinion',
      explanation: `'According to' is standardly used to cite external third-party authorities (e.g. 'according to research'). When expressing personal perspective, use 'In my opinion' or 'From my viewpoint'.`,
      natural: 'in my view / from my perspective',
    }),
  },

  // 12. Quantifier "every / each" with plural noun
  {
    id: 'quantifier-every-plural',
    errorType: 'Quantifier & Plurality Mismatch',
    severity: 'moderate',
    pattern: /\b(every|each)\s+(students|people|members|friends|reasons|persons|colleges|problems|years)\b/i,
    fix: (m) => {
      const singular = m[2].endsWith('s') ? m[2].slice(0, -1) : m[2];
      return {
        correct: `${m[1]} ${singular}`,
        explanation: `Quantifier mismatch: '${m[1]}' distributes individually and must be followed by a singular countable noun ('${singular}'), not plural ('${m[2]}').`,
        natural: `${m[1]} ${singular}`,
      };
    },
  },

  // 13. "One of the" with singular noun
  {
    id: 'quantifier-one-of-the',
    errorType: 'Quantifier & Plurality Mismatch',
    severity: 'moderate',
    pattern: /\bone\s+of\s+the\s+([a-z]+(?<!s))\b/i,
    fix: (m) => {
      const noun = m[1];
      if (['best', 'worst', 'most', 'main', 'first', 'last', 'only'].includes(noun.toLowerCase())) {
        return { correct: m[0], explanation: '' };
      }
      return {
        correct: `one of the ${noun}s`,
        explanation: `'One of the' signifies selection from a collection and must precede a plural noun ('${noun}s'), not singular ('${noun}').`,
        natural: `one of the ${noun}s`,
      };
    },
  },

  // 14. "Much" with countable nouns
  {
    id: 'quantifier-much-countable',
    errorType: 'Quantifier Mismatch',
    severity: 'moderate',
    pattern: /\bmuch\s+(people|things|friends|problems|reasons|students|mistakes)\b/i,
    fix: (m) => ({
      correct: `many ${m[1]}`,
      explanation: `'Much' is reserved strictly for uncountable mass nouns (e.g. 'much information'). For countable discrete items, use 'many ${m[1]}'.`,
      natural: `many ${m[1]}`,
    }),
  },

  // 15. Double negative
  {
    id: 'double-negative',
    errorType: 'Double Negative',
    severity: 'moderate',
    pattern: /\b(don't|doesn't|didn't|can't|won't)\s+(have|know|see|want)\s+(no|nothing)\b/i,
    fix: (m) => {
      const aux = m[1];
      const verb = m[2];
      const repl = m[3].toLowerCase() === 'no' ? 'any' : 'anything';
      return {
        correct: `${aux} ${verb} ${repl}`,
        explanation: `Double negative: Pairing '${aux}' with '${m[3]}' creates a double negative that cancels the intended meaning in formal English. Use '${repl}'.`,
        natural: `${aux} ${verb} ${repl}`,
      };
    },
  },

  // 16. Indefinite article "a" before vowel sound
  {
    id: 'article-a-before-vowel',
    errorType: 'Article Misuse',
    severity: 'minor',
    pattern: /\ba\s+(hour|honest|honor|apple|engineer|interview|idea|option|issue|answer|example|organization|industry|obstacle|outcome|insight)\b/i,
    fix: (m) => ({
      correct: `an ${m[1]}`,
      explanation: `Article mismatch: The word '${m[1]}' begins with a vowel sound. Use indefinite article 'an', not 'a'.`,
      natural: `an ${m[1]}`,
    }),
  },

  // 17. Indefinite article "an" before consonant sound
  {
    id: 'article-an-before-consonant',
    errorType: 'Article Misuse',
    severity: 'minor',
    pattern: /\ban\s+(university|uniform|user|useful|unique|one-time|student|teacher|problem|person|challenge|career|point)\b/i,
    fix: (m) => ({
      correct: `a ${m[1]}`,
      explanation: `Article mismatch: The word '${m[1]}' begins with a consonant sound ('yu' or consonant). Use indefinite article 'a', not 'an'.`,
      natural: `a ${m[1]}`,
    }),
  },

  // 18. Plural "informations"
  {
    id: 'uncountable-informations',
    errorType: 'Uncountable Noun Error',
    severity: 'moderate',
    pattern: /\binformations\b/i,
    fix: () => ({
      correct: 'information',
      explanation: `'Information' is an uncountable mass noun in English and never takes a plural '-s'. Use 'information' or 'pieces of information'.`,
      natural: 'information',
    }),
  },

  // 19. "Equally as good"
  {
    id: 'redundant-equally-as',
    errorType: 'Comparative Redundancy',
    severity: 'minor',
    pattern: /\bequally\s+as\s+([a-z]+)\b/i,
    fix: (m) => ({
      correct: `just as ${m[1]}`,
      explanation: `'Equally as' is a redundant comparative. Use either 'equally ${m[1]}' or 'just as ${m[1]}'.`,
      natural: `just as ${m[1]}`,
    }),
  },
];

export class MultiStageAnalyzer {
  /**
   * Stage A: Sentence-by-sentence grammar and syntax parsing
   */
  public static analyzeGrammar(sentences: string[]): GrammarCorrection[] {
    const corrections: GrammarCorrection[] = [];
    const usedRuleSentenceKeys = new Set<string>();

    for (const sentence of sentences) {
      for (const rule of LINGUISTIC_RULES) {
        const match = sentence.match(rule.pattern);
        if (match) {
          const key = `${rule.id}:${sentence}`;
          if (!usedRuleSentenceKeys.has(key)) {
            usedRuleSentenceKeys.add(key);
            const { correct, explanation, natural } = rule.fix(match, sentence);
            if (explanation) {
              const correctedSentence = sentence.replace(rule.pattern, correct);
              corrections.push({
                whatSaid: sentence,
                correctVersion: correctedSentence,
                errorType: rule.errorType,
                explanation,
                severity: rule.severity,
                naturalAlternative: natural ? sentence.replace(rule.pattern, natural) : undefined,
              });
            }
          }
        }
      }
    }

    return corrections;
  }

  /**
   * Stage B: Topic decomposition and missed points analysis
   */
  public static analyzeTopicCoverage(
    topic: Topic,
    transcript: string
  ): {
    matchedKeywords: string[];
    missedPoints: MissedPoint[];
    coverageScoreRatio: number;
    isCompletelyOffTopic: boolean;
  } {
    const lower = transcript.toLowerCase();

    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
      'this', 'that', 'these', 'those', 'from', 'with', 'about', 'your', 'explain',
      'should', 'could', 'would', 'like', 'tools', 'take', 'make', 'just', 'more',
      'very', 'good', 'well', 'clear', 'stand', 'helping', 'faster', 'much', 'many',
      'some', 'time', 'also', 'than', 'then', 'into', 'only', 'other', 'have', 'been',
      'were', 'they', 'them', 'their', 'very', 'fast', 'laptop', 'blue', 'color', 'brother'
    ]);

    // Extract both whole phrases and individual sub-terms from topic keywords
    const domainKeywords = new Set<string>();
    (topic.keywords || []).forEach((k) => {
      domainKeywords.add(k.toLowerCase());
      k.toLowerCase().split(/[\s-]+/).forEach((sub) => {
        if (sub.length > 2 && !stopWords.has(sub)) domainKeywords.add(sub);
      });
    });

    const titleAndQuestionTerms = `${topic.title} ${topic.question}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    titleAndQuestionTerms.forEach((t) => domainKeywords.add(t));

    const matchedKeywords = Array.from(domainKeywords).filter((k) => lower.includes(k));

    // Core domain terms (excluding generic conversational words like "computer", "student", "class")
    const coreDomainKeywords = new Set<string>();
    (topic.keywords || []).forEach((k) => {
      k.toLowerCase().split(/[\s-]+/).forEach((sub) => {
        if (sub.length > 2 && !['computer', 'student', 'students', 'person', 'people', 'class', 'tools'].includes(sub)) {
          coreDomainKeywords.add(sub);
        }
      });
    });

    // Also extract substantive terms from title and question (length >= 4, not in stopWords)
    `${topic.title} ${topic.question}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .forEach((term) => {
        if (
          term.length >= 4 &&
          !stopWords.has(term) &&
          !['computer', 'student', 'students', 'people', 'person', 'tools', 'things'].includes(term)
        ) {
          coreDomainKeywords.add(term);
        }
      });

    const matchedCore = Array.from(coreDomainKeywords).filter((k) => lower.includes(k));
    const isCompletelyOffTopic = matchedCore.length === 0;

    // Dynamically derive expected dimensions from the actual topic & question
    const expectedDimensions: Array<{
      dimension: string;
      keywords: string[];
      importance: 'essential' | 'recommended' | 'optional';
      whyImportant: string;
      howToAddress: string;
    }> = [];

    // If the topic provides explicit hints, generate question-specific dimensions from them
    if (topic.hints && topic.hints.length >= 2) {
      topic.hints.forEach((hint, idx) => {
        const hintClean = hint.trim();
        const hintTerms = hintClean
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3 && !stopWords.has(w));
        expectedDimensions.push({
          dimension: hintClean,
          keywords: hintTerms.length > 0 ? hintTerms : [hintClean.toLowerCase()],
          importance: idx === 0 ? 'essential' : idx === 1 ? 'essential' : 'recommended',
          whyImportant: `Prompt guidelines specifically recommend examining "${hintClean}" to build a comprehensive answer.`,
          howToAddress: `Dedicate a focused 2-3 sentence segment analyzing "${hintClean}" with a concrete example.`,
        });
      });
    }

    // If no hints or < 2 hints, dynamically generate question-specific dimensions based on title & question
    if (expectedDimensions.length < 2) {
      const substantiveTitleTerms = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      expectedDimensions.push({
        dimension: `Core Thesis & Stance: ${topic.title}`,
        keywords: substantiveTitleTerms.length > 0 ? substantiveTitleTerms : [topic.title.toLowerCase()],
        importance: 'essential',
        whyImportant: `A clear, unambiguous opening stance directly addressing "${topic.title}" anchors your speech and prevents wandering.`,
        howToAddress: `State your decisive thesis on ${topic.title} within your opening 15 seconds.`,
      });

      expectedDimensions.push({
        dimension: 'Causal Reasoning & Real-World Evidence',
        keywords: ['because', 'reason', 'example', 'instance', 'evidence', 'specifically', 'result', 'since', 'due to'],
        importance: 'essential',
        whyImportant: 'Unsubstantiated opinions fail to persuade; claims must be backed by causal explanation ("why") and concrete evidence.',
        howToAddress: 'Anchor your main claim by citing a real-world scenario, organizational case study, or concrete mechanism.',
      });

      expectedDimensions.push({
        dimension: 'Trade-offs, Limitations & Nuances',
        keywords: ['however', 'although', 'trade-off', 'contrast', 'balance', 'challenge', 'risk', 'counter', 'limitation', 'whereas'],
        importance: 'recommended',
        whyImportant: 'Mature articulation acknowledges counterarguments, operational limitations, and context-dependent trade-offs.',
        howToAddress: 'Address the most compelling counterargument or practical friction point before reaffirming your stance.',
      });

      expectedDimensions.push({
        dimension: 'Actionable Resolution & Strategic Takeaway',
        keywords: ['solution', 'future', 'implement', 'strategy', 'recommend', 'ultimately', 'conclude', 'adapt', 'step'],
        importance: 'optional',
        whyImportant: 'A strong conclusion synthesizes the argument into an actionable takeaway rather than trailing off.',
        howToAddress: 'End with a forward-looking summary or concrete recommendation for action.',
      });
    }

    const missedPoints: MissedPoint[] = [];
    let coveredDimensionCount = 0;

    for (const dim of expectedDimensions) {
      const isCovered = dim.keywords.some((kw) => lower.includes(kw));
      if (isCovered) {
        coveredDimensionCount++;
      } else {
        missedPoints.push({
          point: dim.dimension,
          whyImportant: dim.whyImportant,
          howToIncorporate: dim.howToAddress,
          importance: dim.importance,
        });
      }
    }

    const keywordCoverageRatio = domainKeywords.size > 0 ? matchedKeywords.length / domainKeywords.size : 0;
    const dimensionCoverageRatio = coveredDimensionCount / expectedDimensions.length;
    const coverageScoreRatio = isCompletelyOffTopic ? 0 : Math.min(1, dimensionCoverageRatio * 0.6 + keywordCoverageRatio * 0.4);

    return {
      matchedKeywords,
      missedPoints,
      coverageScoreRatio,
      isCompletelyOffTopic,
    };
  }

  /**
   * Stage C: Evidence & Argument Extraction
   * Extracts distinct, genuine substrings from transcript for each evaluation criterion.
   * Guarantees that no short opening snippet (e.g. "First of all, I") is reused across unrelated dimensions.
   */
  public static extractEvidence(
    sentences: string[],
    transcript: string,
    topic: Topic,
    corrections: GrammarCorrection[],
    unsupportedClaims: Array<{ claim: string; flag: any; explanation: string }>,
    foundTransitions: string[]
  ): {
    contentEvidence: string;
    reasoningEvidence: string;
    organizationEvidence: string;
    clarityEvidence: string;
    grammarEvidence: string;
    strongestArgument: string;
    weakestArgument: string;
    betterExample: string;
  } {
    const validSentences = sentences
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && transcript.includes(s));

    const usedQuotes = new Set<string>();

    const pickQuote = (candidate?: string, fallbackNote?: string): string => {
      if (candidate && transcript.includes(candidate) && !usedQuotes.has(candidate)) {
        usedQuotes.add(candidate);
        return candidate;
      }
      // If candidate was already used or invalid, look for another valid unused sentence
      const alternate = validSentences.find((s) => !usedQuotes.has(s) && s.length >= 15);
      if (alternate) {
        usedQuotes.add(alternate);
        return alternate;
      }
      return fallbackNote || 'Insufficient distinct transcript evidence.';
    };

    // 1. Content Relevance Evidence: Find sentence with highest prompt keyword overlap
    const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'why', 'how', 'this', 'that', 'from', 'with']);
    const topicTerms = `${topic.title} ${topic.question}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    let bestContentSentence: string | undefined;
    let maxMatches = 0;
    for (const s of validSentences) {
      const lower = s.toLowerCase();
      const count = topicTerms.filter((term) => lower.includes(term)).length;
      if (count > maxMatches) {
        maxMatches = count;
        bestContentSentence = s;
      }
    }
    const contentEvidence = pickQuote(
      bestContentSentence,
      'Insufficient transcript evidence directly addressing the core prompt.'
    );

    // 2. Reasoning Evidence: Sentence with causal reasoning markers
    const causalRegex = /\b(because|since|therefore|as a result|consequently|for instance|for example|leads to|due to|specifically)\b/i;
    const bestReasoningSentence = validSentences.find((s) => causalRegex.test(s));
    const reasoningEvidence = pickQuote(
      bestReasoningSentence || (unsupportedClaims.length > 0 ? unsupportedClaims[0].claim : undefined),
      'No causal explanations or verifiable evidence markers identified in transcript.'
    );

    // 3. Organization Evidence: Sentence with structural transition markers
    const transitionRegex = /\b(firstly|secondly|furthermore|however|moreover|on the other hand|in addition|finally|in conclusion|ultimately|in contrast)\b/i;
    const bestOrgSentence = validSentences.find((s) => transitionRegex.test(s));
    const organizationEvidence = pickQuote(
      bestOrgSentence,
      foundTransitions.length > 0
        ? `Used transition marker "${foundTransitions[0]}".`
        : 'No structural transitions or signposts used in the response.'
    );

    // 4. Clarity Evidence: Distinct sentence evaluated for syntax and readability
    const bestClaritySentence = validSentences.find((s) => !usedQuotes.has(s) && s.length >= 25);
    const clarityEvidence = pickQuote(
      bestClaritySentence,
      'Phrasing evaluated across complete response.'
    );

    // 5. Grammar Evidence: Sentence containing detected grammar error or clean sentence
    let grammarEvidence: string;
    if (corrections.length > 0 && corrections[0].whatSaid && transcript.includes(corrections[0].whatSaid)) {
      grammarEvidence = corrections[0].whatSaid;
    } else {
      const cleanSentence = validSentences.find((s) => !usedQuotes.has(s) && s.length >= 20);
      grammarEvidence = cleanSentence || 'No grammatical violations detected in response.';
    }

    // 6. Strongest Argument: Substantive sentence (> 30 chars) with causal or logical connector
    const substantiveSentences = validSentences.filter((s) => s.length >= 30);
    const strongestCandidate =
      substantiveSentences.find((s) => causalRegex.test(s)) ||
      substantiveSentences[0] ||
      validSentences[0];
    const strongestArgument = strongestCandidate || 'Direct opening engagement with the prompt.';

    // 7. Weakest Argument: Unsupported claim or fragmented/hasty conclusion
    let weakestCandidate = unsupportedClaims[0]?.claim;
    if (!weakestCandidate || weakestCandidate === strongestArgument) {
      weakestCandidate = validSentences.find(
        (s) => s !== strongestArgument && s.length < 25 && !causalRegex.test(s)
      );
    }
    if (!weakestCandidate || weakestCandidate === strongestArgument) {
      weakestCandidate = validSentences.length > 1
        ? validSentences[validSentences.length - 1]
        : 'Single brief statement lacks supporting reasoning.';
    }
    const weakestArgument = weakestCandidate;

    const betterExample =
      `Instead of broad assertions, anchor your position on ${topic.title} with an empirical benchmark, organizational case study, or concrete trade-off scenario.`;

    return {
      contentEvidence,
      reasoningEvidence,
      organizationEvidence,
      clarityEvidence,
      grammarEvidence,
      strongestArgument,
      weakestArgument,
      betterExample,
    };
  }

  /**
   * Complete Calibrated Multi-Stage Evaluation
   */
  public static evaluateComplete(params: {
    sessionId?: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    audioMetrics?: AudioDeliveryMetrics;
    researchNotes?: string;
  }): EvaluationReport {
    const { sessionId, topic, mode, transcript, durationSec, audioMetrics, researchNotes } = params;

    // 1. Tokenize & Sentence Split
    const rawWords = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = rawWords.length;
    const effectiveSec = Math.max(1, durationSec);
    const calculatedWpm = Math.round((wordCount / effectiveSec) * 60);
    const wpm = audioMetrics?.wordsPerMinute || calculatedWpm;

    // Clean sentence splitting
    const rawSentences = transcript
      .split(/[.?!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    // 2. Stage A: Exhaustive Linguistic & Grammar Analysis
    const corrections = this.analyzeGrammar(rawSentences);

    // Also detect filler sounds
    const fillerRegex = /\b(um|uh|erm|like|you know|basically|actually|sort of|kind of|i mean)\b/gi;
    const fillerMatches = transcript.match(fillerRegex) || [];
    const fillerCount = fillerMatches.length;
    const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

    // 3. Stage B: Topic Decomposition & Missed Points
    const { matchedKeywords, missedPoints, coverageScoreRatio, isCompletelyOffTopic } = this.analyzeTopicCoverage(topic, transcript);

    // 4. Stage C: Reasoning, Logic & Evidence Extraction
    const generalizations = [
      { pattern: /\b(everyone\s+knows|all\s+people\s+think|nobody\s+cares|always\s+fails|everyone\s+is)\b/i, explanation: 'Sweeping generalization presented as fact without statistical or contextual qualification.' },
      { pattern: /\b(it\s+is\s+obvious\s+that|obviously)\b/i, explanation: 'Using "obviously" sidesteps the need for logical evidence.' },
      { pattern: /\b(they\s+just\s+waste|total\s+waste\s+of\s+time)\b/i, explanation: 'Dismissive assertion lacking causal breakdown or balanced analysis.' },
    ];
    const unsupportedClaims: Array<{ claim: string; flag: any; explanation: string }> = [];
    for (const s of rawSentences) {
      for (const gen of generalizations) {
        if (gen.pattern.test(s)) {
          unsupportedClaims.push({
            claim: s,
            flag: 'unsupported',
            explanation: gen.explanation,
          });
        }
      }
    }

    // 5. Stage D: Transitions & Structure
    const transitionMarkers = [
      'furthermore', 'however', 'moreover', 'on the other hand',
      'in addition', 'for example', 'for instance', 'specifically',
      'consequently', 'therefore', 'in contrast', 'firstly', 'secondly',
      'finally', 'in summary', 'to conclude', 'ultimately', 'because', 'while'
    ];
    const foundTransitions = transitionMarkers.filter((m) =>
      transcript.toLowerCase().includes(m)
    );

    // Extract verified, distinct evidence across all dimensions
    const evidenceReport = this.extractEvidence(
      rawSentences,
      transcript,
      topic,
      corrections,
      unsupportedClaims,
      foundTransitions
    );

    // Repetitive vocabulary analysis
    const wordFreq: Record<string, number> = {};
    for (const w of rawWords) {
      const lw = w.toLowerCase();
      if (lw.length > 2 && !['and', 'the', 'for', 'with', 'that', 'this'].includes(lw)) {
        wordFreq[lw] = (wordFreq[lw] || 0) + 1;
      }
    }
    const maxFreq = Math.max(0, ...Object.values(wordFreq));
    const isHighlyRepetitive = wordCount >= 30 && maxFreq / wordCount > 0.09;

    // 6. SCORING ENGINE: Strict Weighted Rubric (Total 100)
    let contentScore: number;
    let reasoningScore: number;
    let orgScore: number;
    let clarityScore: number;
    let grammarScore: number;
    let vocabScore: number;
    let fluencyScore: number;

    const uniqueWords = new Set(rawWords.map((w) => w.toLowerCase()));
    const lexicalDiversity = wordCount > 0 ? uniqueWords.size / wordCount : 0.5;

    const isSeverelyOffTopic = isCompletelyOffTopic;

    const rhetoricalMarkers = [
      'furthermore', 'however', 'moreover', 'on the other hand',
      'in addition', 'for example', 'for instance', 'specifically',
      'consequently', 'therefore', 'in contrast', 'firstly', 'secondly',
      'finally', 'in summary', 'to conclude', 'ultimately', 'because', 'while',
      'rather than', 'instead of', 'whereas', 'when a', 'provided'
    ];
    const foundRhetorical = rhetoricalMarkers.filter((m) =>
      transcript.toLowerCase().includes(m)
    );

    const isHighDensityStructured =
      wordCount >= 50 &&
      coverageScoreRatio >= 0.25 &&
      corrections.length === 0 &&
      foundRhetorical.length >= 1;

    if (isSeverelyOffTopic) {
      contentScore = 3;
      reasoningScore = 3;
      orgScore = 3;
      clarityScore = Math.min(6, Math.round(wordCount / 5));
      grammarScore = Math.max(3, 9 - corrections.length * 3);
      vocabScore = 3;
      fluencyScore = 4;
    } else if (wordCount < 18) {
      contentScore = 4;
      reasoningScore = 3;
      orgScore = 3;
      clarityScore = 5;
      grammarScore = Math.max(3, 8 - corrections.length * 3);
      vocabScore = 2;
      fluencyScore = 3;
    } else if (isHighDensityStructured) {
      contentScore = Math.min(20, Math.round(15 + coverageScoreRatio * 4));
      reasoningScore = unsupportedClaims.length > 0 ? 11 : 14;
      orgScore = foundRhetorical.length >= 2 ? 14 : 13;
      clarityScore = 13;
      grammarScore = 15;
      vocabScore = lexicalDiversity > 0.6 ? 9 : 8;
      fluencyScore = wpm >= 115 && wpm <= 165 ? 9 : 8;
    } else if (wordCount < 40) {
      contentScore = Math.min(10, Math.round(6 + coverageScoreRatio * 4));
      reasoningScore = 5;
      orgScore = 5;
      clarityScore = 7;
      grammarScore = Math.max(4, 11 - corrections.length * 3);
      vocabScore = 4;
      fluencyScore = 5;
    } else if (wordCount < 75) {
      contentScore = Math.min(14, Math.round(9 + coverageScoreRatio * 5));
      reasoningScore = unsupportedClaims.length > 0 ? 7 : 9;
      orgScore = foundTransitions.length >= 1 ? 9 : 7;
      clarityScore = 9;
      grammarScore = Math.max(4, 13 - corrections.length * 3);
      vocabScore = isHighlyRepetitive ? 3 : 6;
      fluencyScore = fillerRatio > 0.05 ? 5 : 7;
      if (isHighlyRepetitive) reasoningScore = Math.min(reasoningScore, 5);
    } else {
      if (coverageScoreRatio > 0.7) contentScore = 18;
      else if (coverageScoreRatio > 0.4) contentScore = 15;
      else contentScore = 11;

      if (unsupportedClaims.length >= 2) reasoningScore = 8;
      else if (unsupportedClaims.length === 1) reasoningScore = 10;
      else if (foundTransitions.includes('because') || foundTransitions.includes('therefore') || foundTransitions.includes('consequently')) reasoningScore = 13;
      else reasoningScore = 11;

      if (foundTransitions.length >= 3) orgScore = 14;
      else if (foundTransitions.length >= 1) orgScore = 11;
      else orgScore = 8;

      clarityScore = 12;
      if (wpm < 95 || wpm > 180) clarityScore = Math.max(6, clarityScore - 3);

      if (corrections.length === 0) grammarScore = 15;
      else if (corrections.length === 1) grammarScore = 12;
      else if (corrections.length === 2) grammarScore = 9;
      else if (corrections.length <= 4) grammarScore = 6;
      else grammarScore = 3;

      if (isHighlyRepetitive) vocabScore = 3;
      else if (lexicalDiversity > 0.6) vocabScore = 9;
      else if (lexicalDiversity > 0.45) vocabScore = 7;
      else vocabScore = 5;

      if (fillerRatio > 0.07) fluencyScore = 4;
      else if (fillerRatio > 0.03) fluencyScore = 6;
      else if (wpm >= 115 && wpm <= 165) fluencyScore = 9;
      else fluencyScore = 7;
    }

    const totalScore = Math.min(
      100,
      Math.max(
        15,
        contentScore +
          reasoningScore +
          orgScore +
          clarityScore +
          grammarScore +
          vocabScore +
          fluencyScore
      )
    );

    let performanceLevel: EvaluationReport['performanceLevel'] = 'Competent';
    if (totalScore >= 85) performanceLevel = 'Exceptional';
    else if (totalScore >= 72) performanceLevel = 'Strong';
    else if (totalScore >= 58) performanceLevel = 'Competent';
    else if (totalScore >= 42) performanceLevel = 'Developing';
    else performanceLevel = 'Needs Immediate Focus';

    // 7. Structured Observations (Strengths & Weaknesses)
    const detailedStrengths: DetailedObservation[] = [];
    if (wordCount >= 60) {
      detailedStrengths.push({
        title: 'Sustained Delivery & Output Volume',
        evidence: `Delivered ${wordCount} words across ${effectiveSec} seconds (${wpm} WPM).`,
        impactOrWhy: 'Demonstrated stamina and ability to speak continuously under timed conditions.',
      });
    }
    if (matchedKeywords.length > 0) {
      detailedStrengths.push({
        title: 'Prompt Engagement & Keyword Focus',
        evidence: `Referenced core prompt concepts: "${matchedKeywords.slice(0, 3).join('", "')}".`,
        impactOrWhy: 'Ensured the response remained connected to the specific challenge prompt.',
      });
    }
    if (foundTransitions.length > 0) {
      detailedStrengths.push({
        title: 'Logical Connectives & Structural Cadence',
        evidence: `Used transitions: "${foundTransitions.slice(0, 3).join('", "')}".`,
        impactOrWhy: 'Helped listeners follow the progression of thoughts.',
      });
    }
    if (corrections.length === 0 && wordCount >= 30) {
      detailedStrengths.push({
        title: 'Clean Grammatical Execution',
        evidence: `Zero grammatical errors detected across ${wordCount} words.`,
        impactOrWhy: 'Maintained syntactical consistency without disruptive agreement or tense breaks.',
      });
    }
    if (detailedStrengths.length === 0) {
      detailedStrengths.push({
        title: 'Prompt Engagement Effort',
        evidence: `Delivered ${wordCount} words on "${topic.title}".`,
        impactOrWhy: 'Attempted the speaking challenge directly under practice conditions.',
      });
    }

    const detailedWeaknesses: DetailedObservation[] = [];
    if (corrections.length > 0) {
      detailedWeaknesses.push({
        title: `Grammatical Errors Detected (${corrections.length} flagged)`,
        evidence: `"${corrections[0].whatSaid}" → "${corrections[0].correctVersion}"`,
        impactOrWhy: 'Grammatical violations undermine professional credibility and distract the listener from your arguments.',
        actionableStep: 'Review each item in the Syntax & Grammar Calibrations table below.',
      });
    }
    if (wordCount < 40) {
      detailedWeaknesses.push({
        title: 'Insufficient Development & Elaboration',
        evidence: `Total output: ${wordCount} words.`,
        impactOrWhy: 'Responses under 40 words do not provide enough depth to demonstrate structured thinking.',
        actionableStep: 'Aim for a 3-part framework: (1) Core position, (2) Detailed supporting reason with an example, (3) Concluding impact.',
      });
    }
    if (missedPoints.length > 0) {
      detailedWeaknesses.push({
        title: `Missed Critical Dimension: ${missedPoints[0].point}`,
        evidence: `Topic "${topic.title}" benefits from addressing this dimension.`,
        impactOrWhy: missedPoints[0].whyImportant,
        actionableStep: missedPoints[0].howToIncorporate,
      });
    }
    if (unsupportedClaims.length > 0) {
      detailedWeaknesses.push({
        title: 'Unsupported Generalization in Argument',
        evidence: `"${unsupportedClaims[0].claim}"`,
        impactOrWhy: unsupportedClaims[0].explanation,
        actionableStep: 'Qualify statements: replace sweeping absolutes with measured context and evidence.',
      });
    }
    if (fillerCount >= 3) {
      detailedWeaknesses.push({
        title: 'Vocalized Hesitation Habit',
        evidence: `Recorded ${fillerCount} fillers (${fillerMatches.slice(0, 3).join(', ')}).`,
        impactOrWhy: 'Fillers erode vocal authority and create an impression of uncertainty.',
        actionableStep: 'Practice intentional silent pauses when transitioning between ideas.',
      });
    }

    // 8. Better Ways to Say It
    const betterWays = [
      {
        original: rawSentences[0] || 'My topic is about this...',
        refined: `To address the core question directly: ${(rawSentences[0] || topic.question).replace(/^(so|well|basically|i think that)\s*/i, '').trim()}`,
        whyBetter: 'Eliminates introductory hesitation and establishes an authoritative thesis statement immediately.',
      },
      {
        original: rawSentences.length > 1 ? rawSentences[1] : 'And another thing is...',
        refined: `Furthermore, a critical factor to examine is how this dynamic influences observed outcomes in practice.`,
        whyBetter: 'Replaces colloquial conversational phrasing with structured analytical connective tissue.',
      },
    ];

    // 9. Personal Improvement Plan (3 Priorities)
    const improvementPlan: ImprovementPriority[] = [
      {
        priority: 1,
        title: corrections.length > 0 ? 'Grammar & Agreement Precision' : 'Thesis & Direct Engagement',
        description: corrections.length > 0
          ? `Address the ${corrections.length} specific grammatical and tense issues identified in your speech.`
          : 'Lead with a decisive, unhesitating thesis statement within the first 10 seconds.',
        targetWeakness: corrections.length > 0 ? 'Syntax accuracy' : 'Opening clarity',
        concreteDrill: corrections.length > 0
          ? 'Re-read the corrections table and speak each corrected sentence aloud 3 times.'
          : 'Practice delivering 3 different 15-second opening thesis statements on random topics.',
        timeframe: 'Fix Immediately',
      },
      {
        priority: 2,
        title: 'Supporting Evidence & Concrete Examples',
        description: 'Back up assertions with specific, tangible illustrations rather than generic claims.',
        targetWeakness: 'Reasoning depth and proof',
        concreteDrill: 'For your next challenge, speak for 90 seconds and include at least one named organization or real-world scenario.',
        timeframe: 'Work on Next',
      },
      {
        priority: 3,
        title: 'Vocal Fluency & Intentional Pausing',
        description: 'Eliminate vocalized fillers by getting comfortable with silent pauses.',
        targetWeakness: 'Fluency and filler elimination',
        concreteDrill: 'The 2-Second Silent Pause drill: Close your lips whenever gathering your next thought.',
        timeframe: 'Develop Gradually',
      },
    ];

    // 10. Coach's Direct Summary
    const coachSummary: CoachSummary = {
      whatDidWell: detailedStrengths[0]?.title || 'Attempted the timed speaking challenge.',
      whatDidBadly: detailedWeaknesses[0]?.title || 'Needs stronger structural development.',
      whatMissed: missedPoints[0]?.point || 'Exploring counter-perspectives and concrete case studies.',
      biggestWeaknessSkill: corrections.length > 0 ? 'Grammatical syntax accuracy' : 'Logical evidence and examples',
      whatToPractiseNext: `${topic.category} speaking challenges with strict 2-minute time constraints`,
      nextSessionFocus: corrections.length > 0 ? 'Eliminating subject-verb and tense errors' : 'Structuring Point-Reason-Example-Point',
    };

    const nextTopic =
      CURATED_TOPICS.find((t) => t.id !== topic.id && t.category === topic.category) ||
      CURATED_TOPICS[0];

    return {
      id: `report-${Date.now()}`,
      sessionId: sessionId || `session-${Date.now()}`,
      transcriptScore: totalScore,
      performanceLevel,
      mainTakeaway:
        wordCount < 25
          ? `Critically brief (${wordCount} words). A score of ${totalScore}/100 reflects insufficient substance to evaluate depth. Aim for at least 60-90 seconds of sustained reasoning.`
          : corrections.length > 0
          ? `Score: ${totalScore}/100 (${performanceLevel}). Identified ${corrections.length} grammatical and phrasing errors that weakened your authority. Review the syntax calibrations table below.`
          : `Score: ${totalScore}/100 (${performanceLevel}). Demonstrated clean articulation, but missed key analytical dimensions and trade-offs required for top-tier evaluation.`,
      dimensionScores: {
        contentRelevance: {
          score: contentScore,
          max: 20,
          weightedPoints: contentScore,
          feedback:
            matchedKeywords.length > 0
              ? `Engaged with prompt themes (${matchedKeywords.slice(0, 3).join(', ')}). Missed ${missedPoints.length} core analytical dimensions.`
              : 'Failed to directly anchor arguments in the core subject of the challenge prompt.',
          evidence: evidenceReport.contentEvidence,
        },
        reasoningEvidence: {
          score: reasoningScore,
          max: 15,
          weightedPoints: reasoningScore,
          feedback:
            unsupportedClaims.length > 0
              ? `Contained ${unsupportedClaims.length} unsupported claim(s). Requires causal backing ("because...") and real-world examples.`
              : 'Arguments were structured, but would benefit from verifiable empirical benchmarks.',
          evidence: evidenceReport.reasoningEvidence,
        },
        organizationStructure: {
          score: orgScore,
          max: 15,
          weightedPoints: orgScore,
          feedback:
            foundTransitions.length > 0
              ? `Utilized transition signposts: "${foundTransitions.slice(0, 3).join(', ')}".`
              : 'Lacks structural scaffolding. Use Point-Reason-Example-Point hierarchy.',
          evidence: evidenceReport.organizationEvidence,
        },
        clarityConstruction: {
          score: clarityScore,
          max: 15,
          weightedPoints: clarityScore,
          feedback:
            wpm < 95
              ? `Pace was halting (${wpm} WPM). Keep sentences under 25 words for listener retention.`
              : 'Phrasing was intelligible with clear sentence boundaries.',
          evidence: evidenceReport.clarityEvidence,
        },
        grammar: {
          score: grammarScore,
          max: 15,
          weightedPoints: grammarScore,
          feedback:
            corrections.length > 0
              ? `Penalized for ${corrections.length} grammatical violation(s): ${corrections.map((c) => c.errorType).slice(0, 2).join(', ')}.`
              : 'No grammatical or syntactical violations detected in this transcript sample.',
          evidence: evidenceReport.grammarEvidence,
        },
        vocabularyChoice: {
          score: vocabScore,
          max: 10,
          weightedPoints: vocabScore,
          feedback:
            'Relied primarily on everyday conversational vocabulary. Integrate precise domain terminology.',
          evidence: rawWords.slice(0, 6).join(' '),
        },
        fluencyFillers: {
          score: fluencyScore,
          max: 10,
          weightedPoints: fluencyScore,
          feedback:
            fillerCount > 0
              ? `Recorded ${fillerCount} vocalized filler sound(s) (${fillerMatches.slice(0, 3).join(', ')}). Filler ratio: ${(fillerRatio * 100).toFixed(1)}%.`
              : 'Controlled vocal delivery with minimal hesitation sounds.',
          evidence:
            fillerCount > 0
              ? fillerMatches.slice(0, 4).join(', ')
              : 'No prominent vocalized fillers',
        },
      },
      deliveryMetrics: {
        wordsPerMinute: wpm,
        pauseCount: audioMetrics?.pauseCount,
        longestPauseSec: audioMetrics?.longestPauseSec,
        totalSilenceSec: audioMetrics?.totalSilenceSec,
        fillerCount,
        volumeConsistency: audioMetrics?.volumeConsistency,
        reliabilityNote: audioMetrics?.reliabilityNote || (durationSec > 0 ? 'Calculated from transcript words and duration' : 'Text input analysis'),
      },
      strengths: detailedStrengths.map((s) => `${s.title}: ${s.evidence}`),
      improvementAreas: detailedWeaknesses.map((w) => `${w.title}: ${w.evidence}`),
      detailedStrengths,
      detailedWeaknesses,
      missedPoints,
      improvementPlan,
      coachSummary,
      corrections,
      reasoningFeedback: {
        strongestArgument: evidenceReport.strongestArgument,
        weakestArgument: evidenceReport.weakestArgument,
        missingPoint: missedPoints[0]?.point,
        unsupportedClaims,
        betterExample: evidenceReport.betterExample,
      },
      betterWaysToSayIt: betterWays,
      personalizedExercises: [
        {
          title: improvementPlan[0].title,
          description: improvementPlan[0].concreteDrill,
          targetIssue: improvementPlan[0].targetWeakness,
          durationMinutes: 4,
        },
        {
          title: improvementPlan[1].title,
          description: improvementPlan[1].concreteDrill,
          targetIssue: improvementPlan[1].targetWeakness,
          durationMinutes: 5,
        },
      ],
      recommendedNextChallenge: {
        category: nextTopic.category,
        difficulty: nextTopic.difficulty,
        suggestedPrompt: `${nextTopic.title} — ${nextTopic.question}`,
        rationale: 'Addresses your identified reasoning and structural gaps under timed conditions.',
      },
      isDemoMode: true,
      evaluationVersion: '3.1.0-calibrated',
      createdAt: new Date().toISOString(),
    };
  }
}
