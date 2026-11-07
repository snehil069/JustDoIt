import { GoogleGenAI } from '@google/genai';
import {
  Topic,
  Category,
  Difficulty,
  PromptFormat,
  PracticeMode,
  EvaluationReport,
  DebateTurn,
  InterviewTurn,
  AudioDeliveryMetrics,
  IdealSpeech,
} from '@shared/types/index';
import { storageService } from './storage';
import { LocalEvaluator } from './localEvaluator';
import { blobToBase64, convertBlobToWav } from '../utils/audioUtils';
import { BUILTIN_API_KEYS } from '../config/builtinKeys';

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

export class LocalGeminiService {
  private static getApiKey(override?: string): string {
    if (override && override.trim()) return override.trim();
    const settings = storageService.getSettings();
    if (settings.geminiApiKey && settings.geminiApiKey.trim()) return settings.geminiApiKey.trim();
    const env = (import.meta as any).env || {};
    const envKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    if (envKey && envKey.trim()) return envKey.trim();
    return BUILTIN_API_KEYS.gemini;
  }

  private static async executeWithFallback(
    ai: GoogleGenAI,
    contents: string,
    responseJson: boolean = true,
    temperature: number = 0.3
  ): Promise<{ text: string; modelUsed: string }> {
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: responseJson
            ? {
                responseMimeType: 'application/json',
                temperature,
              }
            : {
                temperature,
              },
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Client] Model ${model} request failed:`, err?.message || err);
      }
    }

    throw lastError || new Error('All candidate Gemini models failed to respond.');
  }

  public static async testConnection(apiKeyOverride?: string): Promise<{
    success: boolean;
    model: string;
    message: string;
    latencyMs: number;
    error?: string;
  }> {
    const key = this.getApiKey(apiKeyOverride);
    if (!key) {
      return {
        success: false,
        model: 'none',
        message: 'No Gemini API key provided. Add your key in Settings.',
        latencyMs: 0,
        error: 'Key missing',
      };
    }

    const start = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const { text, modelUsed } = await this.executeWithFallback(
        ai,
        'Respond with a JSON object: {"status": "ok", "message": "Gemini connection verified"}',
        true,
        0.1
      );
      const latencyMs = Date.now() - start;
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { message: text.trim() };
      }

      return {
        success: true,
        model: modelUsed,
        message: parsed.message || 'Connection verified successfully.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        model: 'failed',
        message: 'Gemini API connection failed.',
        latencyMs: Date.now() - start,
        error: err?.message || 'Authentication or network error.',
      };
    }
  }

  /**
   * Client-side verbatim audio transcription using Gemini multimodal input
   */
  public static async transcribeAudio(
    audioBlob: Blob,
    apiKeyOverride?: string
  ): Promise<{ transcript: string; noSpeech?: boolean }> {
    const key = this.getApiKey(apiKeyOverride);
    if (!key) {
      throw new Error('No Gemini API key configured. Please add your key in Settings.');
    }

    // Convert blob to standard WAV for maximum reliability across browsers
    const { wavBlob, mimeType, isSilent } = await convertBlobToWav(audioBlob);
    if (isSilent) {
      return { transcript: '', noSpeech: true };
    }
    const base64Data = await blobToBase64(wavBlob);

    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `Transcribe this spoken audio verbatim. Do not summarize, do not correct grammar, do not omit filler words or hesitation marks (such as um, uh, ah, like). If pure silence, non-speech noise, or no audible words are spoken, respond with exactly: [NO_SPEECH_DETECTED]. Return ONLY the plain text of the spoken words.`;

    let lastError: any = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/wav',
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        });

        const text = response?.text?.trim() || '';
        if (text.includes('[NO_SPEECH_DETECTED]') || !text) {
          return { transcript: '', noSpeech: true };
        }
        return { transcript: text, noSpeech: false };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Client Audio] Model ${model} audio transcription failed:`, err?.message || err);
      }
    }

    throw lastError || new Error('All candidate Gemini models failed to transcribe audio.');
  }

  /**
   * Client-side dynamic topic generator with anti-repetition memory
   */
  public static async generateTopic(params: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
    recentTopics?: string[];
    apiKeyOverride?: string;
  }): Promise<Topic> {
    const key = this.getApiKey(params.apiKeyOverride);
    if (!key) {
      throw new Error('No Gemini API key configured.');
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const all30Categories: Category[] = [
      'technology', 'ai', 'education', 'business', 'science', 'psychology',
      'society', 'environment', 'sports', 'careers', 'finance', 'philosophy',
      'history', 'entertainment', 'everyday-life', 'college-life',
      'communication-personality', 'creative-thinking', 'critical-thinking',
      'health-wellness', 'politics-governance', 'space-astronomy', 'art-design',
      'literature-books', 'food-culinary', 'travel-geography', 'relationships-family',
      'productivity-habits', 'future-foresight', 'urban-smart-cities',
    ];

    const chosenCategory = params.category || all30Categories[Math.floor(Math.random() * all30Categories.length)];
    const chosenDifficulty = params.difficulty || 'intermediate';
    const chosenMode = params.mode || 'impromptu';
    const chosenFormat = params.format || 'open-question';

    const recentExclusions = (params.recentTopics || []).slice(-30);
    const antiRepetitionClause = recentExclusions.length > 0
      ? `\nCRITICAL ANTI-REPETITION CONSTRAINT: Do NOT generate questions similar, identical, or conceptually redundant to any of these recently practiced topics:\n- ${recentExclusions.join('\n- ')}\nGenerate a completely fresh, distinct problem angle or thought experiment.`
      : '';

    const modeInstructions: Record<PracticeMode, string> = {
      impromptu: 'Design a high-friction spontaneous speaking challenge that requires the speaker to take a clear stand, present two concrete reasons, and synthesize a cohesive takeaway without prep time.',
      research: 'Design a topic suitable for a structured 5-minute research-backed presentation requiring empirical examples, policy/tech context, and analytical depth.',
      debate: 'Design a sharply polarized, balanced debate motion with an obvious tension where both affirmative and opposing sides have compelling moral and practical arguments.',
      interview: 'Design a demanding behavioral or situational interview prompt requiring the candidate to employ the STAR method (Situation, Task, Action, Result) with measurable impact.',
      'explain-simply': 'Design a complex, nuanced concept from this category that the speaker must explain clearly using intuitive real-world metaphors, suitable for an intelligent 12-year-old, without jargon.',
      'real-life': 'Design a high-stakes, realistic interpersonal scenario (e.g. negotiation, delivering difficult feedback, crisis communication, or persuasive stakeholder alignment).',
    };

    const difficultyGuidelines: Record<string, string> = {
      beginner: 'Beginner: Accessible, concrete everyday situations. Focused on clear personal expression and straightforward examples.',
      easy: 'Beginner: Accessible, concrete everyday situations. Focused on clear personal expression and straightforward examples.',
      intermediate: 'Intermediate: Requires structured reasoning, balancing two competing viewpoints or practical trade-offs.',
      medium: 'Intermediate: Requires structured reasoning, balancing two competing viewpoints or practical trade-offs.',
      advanced: 'Advanced: Complex systemic trade-offs, philosophical dilemmas, multi-stakeholder conflicts, or counter-intuitive edge cases.',
      hard: 'Advanced: Complex systemic trade-offs, philosophical dilemmas, multi-stakeholder conflicts, or counter-intuitive edge cases.',
    };

    const prompt = `You are the lead curriculum architect for SpeakUp speech platform.
Generate ONE original, thought-provoking speaking challenge according to these criteria:

- Category: "${chosenCategory}"
- Target Mode: "${chosenMode}" (${modeInstructions[chosenMode]})
- Difficulty: "${chosenDifficulty}" (${difficultyGuidelines[chosenDifficulty] || difficultyGuidelines.intermediate})
- Format: "${chosenFormat}" (Options: "open-question", "random-word", or "hypothetical-situation")
${antiRepetitionClause}

Rules:
1. Promote deep critical thinking, trade-offs, and reasoned argumentation.
2. Avoid generic platitudes and cliches.
3. Include 3 distinct dialectical angles or hints.
4. If format is "random-word", provide a provocative word AND a concrete speaking challenge.
5. If format is "hypothetical-situation", set an immediate realistic role and stakes.

Respond strictly with valid JSON with this exact schema:
{
  "id": "gen-${Date.now()}",
  "title": "Short descriptive title (3-6 words)",
  "category": "${chosenCategory}",
  "difficulty": "${chosenDifficulty}",
  "format": "${chosenFormat}",
  "question": "The primary prompt the user will read and respond to (1-3 sentences)",
  "taskExplanation": "1-2 sentences on what good speakers should emphasize",
  "suggestedDurationSec": 180,
  "hints": ["Dialectical Angle 1", "Dialectical Angle 2", "Dialectical Angle 3"],
  "keywords": ["key1", "key2", "key3"],
  "source": "ai-generated"
}`;

    const { text } = await this.executeWithFallback(ai, prompt, true, 0.75);
    const parsed = JSON.parse(text);

    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(parsed.title),
      category: (parsed.category as Category) || chosenCategory,
      difficulty: (parsed.difficulty as Difficulty) || chosenDifficulty,
      format: (parsed.format as PromptFormat) || chosenFormat,
      question: String(parsed.question),
      taskExplanation: parsed.taskExplanation,
      suggestedDurationSec: Number(parsed.suggestedDurationSec) || 180,
      hints: Array.isArray(parsed.hints) ? parsed.hints : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      source: 'ai-generated',
    };
  }

  public static async evaluateSpeech(params: {
    sessionId?: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    audioMetrics?: AudioDeliveryMetrics;
    researchNotes?: string;
    apiKeyOverride?: string;
  }): Promise<EvaluationReport> {
    const key = this.getApiKey(params.apiKeyOverride);

    // If no key or demo mode, use the calibrated rule-based evaluator
    if (!key) {
      return LocalEvaluator.evaluate(params);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `You are the lead communication evaluator and speech architect for SpeakUp.
Your role: Act as a strict, expert, evidence-based speech coach.
You must tell users what they actually need to improve, not what they want to hear.

CRITICAL EVALUATION RULES:
1. Honest, Calibrated Scoring: A weak response must be given 30-55. An average response 60-74. A good response 75-85. Do NOT give 90-100 to weak or mediocre responses. Never inflate scores for politeness.
2. If the user spoke less than 20 words or gave an empty/irrelevant response, content score must be < 5 and overall score < 30.
3. EXHAUSTIVE GRAMMAR & SYNTAX EXAMINATION: Examine the original transcript sentence-by-sentence.
   Identify EVERY detectable grammatical mistake, subject-verb agreement error, tense mismatch, double past ("didn't went"), incorrect preposition ("discuss about"), incorrect article ("a honest"), and plurality error ("every students").
   DO NOT limit to 3 or 5. If 8 errors exist, list all 8.
4. IMPORTANT POINTS MISSED: Identify 2-4 critical dimensions, trade-offs, or arguments relevant to the prompt that the speaker completely missed or insufficiently explained.
5. REASONING & EVIDENCE: Challenge unsupported claims, sweeping generalizations, and lack of causal backing ("why"). Give exact transcript quotes.
6. COACH'S SUMMARY: Provide direct, personalized answers to the 6 core coach questions.

TASK DETAILS:
- Topic Title: "${params.topic.title}"
- Question/Prompt: "${params.topic.question}"
- Mode: ${params.mode}
- Difficulty: ${params.topic.difficulty}
- Duration Spoken: ${params.durationSec} seconds
${params.researchNotes ? `- Research Notes: "${params.researchNotes}"` : ''}
${params.audioMetrics ? `- Measured Delivery: WPM: ${params.audioMetrics.wordsPerMinute || 'N/A'}, Fillers: ${params.audioMetrics.fillerCount || 0}, Pauses: ${params.audioMetrics.pauseCount || 'N/A'}` : ''}

USER'S VERBATIM SPOKEN TRANSCRIPT:
"""
${params.transcript}
"""

OUTPUT FORMAT:
Return strict JSON matching this exact structure:
{
  "transcriptScore": number (0-100 sum of dimension scores),
  "performanceLevel": "Needs Immediate Focus" | "Developing" | "Competent" | "Strong" | "Exceptional",
  "mainTakeaway": "1-2 sentence core verdict on the response",
  "dimensionScores": {
    "contentRelevance": { "score": number (0-20), "max": 20, "feedback": "string", "evidence": "string quote" },
    "reasoningEvidence": { "score": number (0-15), "max": 15, "feedback": "string", "evidence": "string quote" },
    "organizationStructure": { "score": number (0-15), "max": 15, "feedback": "string", "evidence": "string quote" },
    "clarityConstruction": { "score": number (0-15), "max": 15, "feedback": "string", "evidence": "string quote" },
    "grammar": { "score": number (0-15), "max": 15, "feedback": "string", "evidence": "string quote" },
    "vocabularyChoice": { "score": number (0-10), "max": 10, "feedback": "string", "evidence": "string quote" },
    "fluencyFillers": { "score": number (0-10), "max": 10, "feedback": "string", "evidence": "string quote" }
  },
  "detailedStrengths": [
    { "title": "Strength heading", "evidence": "Exact quote from transcript", "impactOrWhy": "Why this was effective" }
  ],
  "detailedWeaknesses": [
    { "title": "Weakness heading", "evidence": "Exact quote from transcript", "impactOrWhy": "Why this weakened the response", "actionableStep": "What to do differently" }
  ],
  "corrections": [
    {
      "whatSaid": "exact sentence spoken with error",
      "correctVersion": "corrected grammatical sentence",
      "errorType": "Subject-Verb Agreement / Tense / Preposition / Article / etc.",
      "explanation": "rule violated",
      "severity": "minor" | "moderate" | "major",
      "naturalAlternative": "optional idiomatic phrasing"
    }
  ],
  "missedPoints": [
    {
      "point": "Crucial aspect not discussed",
      "whyImportant": "Why this matters to the question",
      "howToIncorporate": "How they could have framed it",
      "importance": "essential" | "recommended" | "optional"
    }
  ],
  "reasoningFeedback": {
    "strongestArgument": "best point made with quote",
    "weakestArgument": "weakest point made with quote",
    "missingPoint": "key aspect ignored",
    "unsupportedClaims": [
      { "claim": "exact sentence quote", "flag": "unsupported", "explanation": "why this claim is problematic" }
    ],
    "betterExample": "a more concrete example they could have used"
  },
  "betterWaysToSayIt": [
    {
      "original": "spoken sentence",
      "refined": "improved version",
      "whyBetter": "explanation of improvement"
    }
  ],
  "coachSummary": {
    "whatDidWell": "Concise observation of best performance element",
    "whatDidBadly": "Concise observation of primary failure point",
    "whatMissed": "Most important topic dimension omitted",
    "biggestWeaknessSkill": "Core skill needing immediate practice",
    "whatToPractiseNext": "Recommended challenge type",
    "nextSessionFocus": "Specific actionable focus for next recording"
  },
  "personalizedExercises": [
    {
      "title": "Exercise name",
      "description": "Specific 2-minute drill",
      "targetIssue": "e.g. Eliminating filler words",
      "durationMinutes": 3
    }
  ],
  "recommendedNextChallenge": {
    "category": "${params.topic.category}",
    "difficulty": "${params.topic.difficulty}",
    "suggestedPrompt": "Title and prompt of next exercise",
    "rationale": "Why this fixes their specific weakness"
  }
}`;

      const { text } = await this.executeWithFallback(ai, prompt, true, 0.3);
      const parsed = JSON.parse(text);

      const dims = parsed.dimensionScores || {};
      const localAnalysis = LocalEvaluator.evaluate(params);

      // 1. Hybrid grammar assurance: merge any rule-based errors that Gemini missed
      if (localAnalysis.corrections && localAnalysis.corrections.length > 0) {
        parsed.corrections = parsed.corrections || [];
        const existingSpoken = new Set(parsed.corrections.map((c: any) => c.whatSaid?.toLowerCase().trim()));
        for (const c of localAnalysis.corrections) {
          if (!existingSpoken.has(c.whatSaid?.toLowerCase().trim())) {
            parsed.corrections.push(c);
          }
        }
      }

      // 2. Strict scoring calibration based on grammar and word count
      if (parsed.corrections && parsed.corrections.length > 0 && dims.grammar) {
        dims.grammar.score = Math.min(dims.grammar.score || 15, Math.max(3, 15 - parsed.corrections.length * 3));
      }

      // Set weightedPoints explicitly and verify evidence is genuine substring
      for (const key of Object.keys(dims)) {
        if (dims[key]) {
          dims[key].weightedPoints = dims[key].score;
          if (!dims[key].evidence || !params.transcript.includes(dims[key].evidence)) {
            dims[key].evidence =
              localAnalysis.dimensionScores?.[key as keyof typeof localAnalysis.dimensionScores]?.evidence ||
              'Evaluated across transcript.';
          }
        }
      }

      // 3. Guarantee missed points presence
      if (!parsed.missedPoints || parsed.missedPoints.length < 2) {
        parsed.missedPoints = [
          ...(parsed.missedPoints || []),
          ...(localAnalysis.missedPoints || []).slice(0, 3),
        ];
      }

      // 4. Guarantee structured detailed strengths and weaknesses
      if (!parsed.detailedStrengths || parsed.detailedStrengths.length === 0) {
        parsed.detailedStrengths = localAnalysis.detailedStrengths || [];
      }
      if (!parsed.detailedWeaknesses || parsed.detailedWeaknesses.length === 0) {
        parsed.detailedWeaknesses = localAnalysis.detailedWeaknesses || [];
      }

      parsed.strengths = (parsed.detailedStrengths || []).map((s: any) => `${s.title}: ${s.evidence}`);
      parsed.improvementAreas = (parsed.detailedWeaknesses || []).map((w: any) => `${w.title}: ${w.evidence}`);

      // 5. Guarantee improvement plan, coach summary, and delivery metrics
      if (!parsed.improvementPlan || parsed.improvementPlan.length === 0) {
        parsed.improvementPlan = localAnalysis.improvementPlan || [];
      }
      if (!parsed.coachSummary) {
        parsed.coachSummary = localAnalysis.coachSummary;
      }
      parsed.deliveryMetrics = localAnalysis.deliveryMetrics;

      const computedTotal =
        (dims.contentRelevance?.score || 0) +
        (dims.reasoningEvidence?.score || 0) +
        (dims.organizationStructure?.score || 0) +
        (dims.clarityConstruction?.score || 0) +
        (dims.grammar?.score || 0) +
        (dims.vocabularyChoice?.score || 0) +
        (dims.fluencyFillers?.score || 0);

      parsed.id = parsed.id || `report-${Date.now()}`;
      parsed.sessionId = params.sessionId || `session-${Date.now()}`;
      parsed.isDemoMode = false;
      parsed.evaluationVersion = '3.0.0-hybrid';
      parsed.createdAt = new Date().toISOString();
      parsed.transcriptScore = computedTotal;
      return parsed as EvaluationReport;
    } catch (err) {
      console.warn('[Gemini Client] Evaluation API call failed, falling back to local evaluator:', err);
      return LocalEvaluator.evaluate(params);
    }
  }

  public static async generateDebateTurn(params: {
    motion: string;
    userPosition: 'for' | 'against';
    roundNumber: number;
    totalRounds: number;
    history: DebateTurn[];
    userArgument: string;
    apiKeyOverride?: string;
  }): Promise<{ aiResponse: string; roundCritique?: string }> {
    const key = this.getApiKey(params.apiKeyOverride);
    const aiPosition = params.userPosition === 'for' ? 'AGAINST' : 'FOR';

    if (!key) {
      return {
        aiResponse: `While your argument makes a notable point, looking at this from the ${aiPosition} perspective reveals critical flaws. By solely focusing on individual benefits, you overlook systemic trade-offs and implementation costs. In round ${params.roundNumber}, how do you justify the disproportionate burden this policy places on other stakeholders?`,
        roundCritique: 'Clear assertion presented, but consider pre-empting the financial and operational trade-offs of your stance.',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `You are a world-class collegiate debater and debate adjudicator.
Current Motion: "${params.motion}"
User is arguing: ${params.userPosition.toUpperCase()}
You are arguing: ${aiPosition}
Round: ${params.roundNumber} of ${params.totalRounds}

User's Latest Argument:
"""
${params.userArgument}
"""

Instructions:
1. Rebuttal & Counter-Argument: Deliver a sharp, intellectually rigorous, persuasive counter-argument (120-180 words).
2. Directly dismantle at least one specific assumption made by the user.
3. Keep the tone civil, formal, and challenging.
4. Adjudicator Critique: Provide 1-2 sentences of honest tactical feedback on how the user could have defended their point more strongly.

Return strict JSON:
{
  "aiResponse": "Your spoken counterargument",
  "roundCritique": "Brief tactical feedback on their debate technique"
}`;

      const { text } = await this.executeWithFallback(ai, prompt, true, 0.4);
      return JSON.parse(text);
    } catch {
      return {
        aiResponse: `Taking the ${aiPosition} position on "${params.motion}", we must examine the unintended secondary consequences. When you argue that "${params.userArgument.slice(0, 50)}...", you assume ideal execution without accounting for real-world friction.`,
        roundCritique: 'Good momentum, but tighten your causal reasoning to leave fewer openings.',
      };
    }
  }

  public static async generateInterviewTurn(params: {
    role: string;
    industry: string;
    stage: string;
    questionNumber: number;
    totalQuestions: number;
    history: InterviewTurn[];
    userAnswer: string;
    apiKeyOverride?: string;
  }): Promise<{ followUpQuestion: string; feedback?: string }> {
    const key = this.getApiKey(params.apiKeyOverride);

    if (!key) {
      return {
        followUpQuestion: `Thank you for sharing that context. Can you drill deeper into a specific technical or interpersonal obstacle you faced during that process, and how you measured the final outcome?`,
        feedback: 'Solid foundational response. To stand out, anchor your answer more tightly in quantifiable results (STAR method).',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `You are an executive interviewer conducting a professional interview.
Role: ${params.role}
Industry: ${params.industry}
Interview Stage: ${params.stage}
Question: ${params.questionNumber} of ${params.totalQuestions}

Candidate's Answer:
"""
${params.userAnswer}
"""

Task:
1. Formulate a realistic, probing follow-up question (or next question) that tests their depth and ownership.
2. Provide a 1-sentence constructive feedback tip on how they structured this answer.

Return strict JSON:
{
  "followUpQuestion": "The next question",
  "feedback": "1 constructive sentence on delivery or structure"
}`;

      const { text } = await this.executeWithFallback(ai, prompt, true, 0.3);
      return JSON.parse(text);
    } catch {
      return {
        followUpQuestion: 'That gives good context. Looking back, what is one thing you would do differently in that scenario?',
        feedback: 'Good honesty. Remember to highlight your personal contribution versus the general team effort.',
      };
    }
  }

  public static async generateIdealSpeech(params: {
    topic: Topic;
    mode: PracticeMode;
    difficulty?: Difficulty;
    originalTranscript?: string;
    weaknessesToAddress?: string[];
    apiKeyOverride?: string;
  }): Promise<IdealSpeech> {
    const key = this.getApiKey(params.apiKeyOverride);

    const weaknessContext =
      params.weaknessesToAddress && params.weaknessesToAddress.length > 0
        ? `TARGET WEAKNESSES TO REMEDY:
${params.weaknessesToAddress.map((w, i) => `${i + 1}. ${w}`).join('\n')}`
        : '';

    if (!key) {
      return {
        topicTitle: params.topic.title,
        targetDurationSec: 150,
        idealTranscript: `When we examine ${params.topic.title.toLowerCase()}, the central question is not merely what is convenient today, but how we build lasting resilience for tomorrow. First and foremost, empirical evidence shows that clear systemic incentives drive sustainable outcomes far more effectively than isolated interventions. Consider, for instance, how modern organizations navigate rapid technological shifts: those that establish clear guardrails succeed, while those acting without foresight face compounding friction. Now, critics often point out that immediate adaptation requires significant initial investment. While that concern is valid, delaying action invariably compounds long-term costs. In conclusion, by aligning our incentives with deliberate structural habits, we transform an apparent trade-off into an enduring strategic advantage.`,
        structureBreakdown: [
          {
            sectionName: '1. Hook & Provocative Thesis',
            contentSnippet: `When we examine ${params.topic.title.toLowerCase()}, the central question is not merely what is convenient today, but how we build lasting resilience for tomorrow.`,
            rhetoricalPurpose: 'Captures attention and establishes immediate intellectual point of view.',
          },
          {
            sectionName: '2. Causal Evidence & Concrete Illustration',
            contentSnippet:
              'First and foremost, empirical evidence shows that clear systemic incentives drive sustainable outcomes far more effectively than isolated interventions.',
            rhetoricalPurpose: 'Demonstrates why this premise holds with empirical/real-world context.',
          },
          {
            sectionName: '3. Conceding the Nuance / Counter-Perspective',
            contentSnippet:
              'Now, critics often point out that immediate adaptation requires significant initial investment. While that concern is valid, delaying action invariably compounds long-term costs.',
            rhetoricalPurpose: 'Anticipates counterarguments, proving intellectual honesty.',
          },
          {
            sectionName: '4. Memorable Synthesis & Call-to-Thought',
            contentSnippet:
              'In conclusion, by aligning our incentives with deliberate structural habits, we transform an apparent trade-off into an enduring strategic advantage.',
            rhetoricalPurpose: 'Leaves a lasting, cohesive impression without merely repeating.',
          },
        ],
        keyTechniquesUsed: [
          'Antithesis & Contrast Framing',
          'Concrete Metric-Anchored Illustration',
          'Direct Counter-Argument Deconstruction',
          'Signposted Rhetorical Flow',
        ],
        estimatedWpm: 140,
        whyThisScoresHigh:
          'Features a clear thesis, structured causal reasoning, explicit counter-argument acknowledgment, and pristine spoken cadence without fillers or rambling.',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `You are a championship orator, master debater, and chief communication coach for SpeakUp.
Your mission: Generate a master-level, 95+ score caliber IDEAL SPOKEN RESPONSE for the following speaking prompt:

TOPIC TITLE: "${params.topic.title}"
QUESTION / PROMPT: "${params.topic.question}"
PRACTICE MODE: "${params.mode}"
DIFFICULTY: "${params.difficulty || params.topic.difficulty || 'intermediate'}"
${weaknessContext}

${params.originalTranscript ? `USER'S ORIGINAL ATTEMPT (FOR CONTRAST & TARGETED IMPROVEMENT):\n"""\n${params.originalTranscript.slice(0, 1000)}\n"""` : ''}

CRITICAL BENCHMARK STANDARDS:
1. Spoken Pacing: Tailored for a natural 2 to 3 minute oral delivery (~200 to 350 spoken words, ~130-150 WPM).
2. Spoken Cadence: Use natural conversational transitions, vivid metaphors, active verbs, and rhetorical signposting ("First", "Crucially", "Consider this", "Ultimately").
3. Unshakable Logic: Present a crisp counter-intuitive thesis, at least two rigorous causal arguments ("why" + real-world evidence), address the strongest counter-argument directly, and close with a punchy synthesis.
4. Flawless Grammar: Zero awkward phrasing, zero filler words, lexical precision without esoteric jargon.

Respond strictly with valid JSON conforming to this schema:
{
  "topicTitle": "${params.topic.title}",
  "targetDurationSec": 150,
  "idealTranscript": "The complete, pristine spoken response verbatim, formatted in 3-4 natural speaking paragraphs.",
  "structureBreakdown": [
    {
      "sectionName": "1. Hook & Provocative Thesis",
      "contentSnippet": "First 1-2 opening sentences",
      "rhetoricalPurpose": "Captures attention and establishes immediate intellectual point of view."
    },
    {
      "sectionName": "2. Causal Evidence & Concrete Illustration",
      "contentSnippet": "Body argument snippet",
      "rhetoricalPurpose": "Demonstrates why this premise holds with empirical/real-world context."
    },
    {
      "sectionName": "3. Conceding the Nuance / Counter-Perspective",
      "contentSnippet": "Trade-off argument snippet",
      "rhetoricalPurpose": "Anticipates counterarguments, proving intellectual honesty."
    },
    {
      "sectionName": "4. Memorable Synthesis & Call-to-Thought",
      "contentSnippet": "Concluding 1-2 sentences",
      "rhetoricalPurpose": "Leaves a lasting, cohesive impression without merely repeating."
    }
  ],
  "keyTechniquesUsed": [
    "Antithesis & Contrast Framing",
    "Concrete Metric-Anchored Illustration",
    "Direct Counter-Argument Deconstruction"
  ],
  "estimatedWpm": 140,
  "whyThisScoresHigh": "2-3 sentences explaining why this exact response achieves 95+ on content, reasoning, flow, and clarity."
}`;

      const { text } = await this.executeWithFallback(ai, prompt, true, 0.4);
      const parsed = JSON.parse(text);

      return {
        topicTitle: parsed.topicTitle || params.topic.title,
        targetDurationSec: Number(parsed.targetDurationSec) || 150,
        idealTranscript: String(parsed.idealTranscript || ''),
        structureBreakdown: Array.isArray(parsed.structureBreakdown) ? parsed.structureBreakdown : [],
        keyTechniquesUsed: Array.isArray(parsed.keyTechniquesUsed) ? parsed.keyTechniquesUsed : [],
        estimatedWpm: Number(parsed.estimatedWpm) || 140,
        whyThisScoresHigh: String(
          parsed.whyThisScoresHigh ||
            'Demonstrates clear thesis, structured causal reasoning, and immaculate cadence.'
        ),
      };
    } catch (err) {
      console.warn('[Gemini Client] Ideal speech generation API call failed:', err);
      return {
        topicTitle: params.topic.title,
        targetDurationSec: 150,
        idealTranscript: `When approaching ${params.topic.title.toLowerCase()}, the decisive factor is disciplined execution coupled with clear causal thinking. First, empirical practice confirms that focusing on foundational principles yields exponential dividends over time. For example, consistent structured articulation consistently outperforms hurried improvisation. Furthermore, while skeptics may claim that such structure limits spontaneity, the reality is that mastery of structure is precisely what unlocks effortless confidence. Ultimately, true eloquence is not about verbosity—it is about clarity of thought and intentional delivery.`,
        structureBreakdown: [
          {
            sectionName: '1. Hook & Provocative Thesis',
            contentSnippet: `When approaching ${params.topic.title.toLowerCase()}, the decisive factor is disciplined execution coupled with clear causal thinking.`,
            rhetoricalPurpose: 'Directly anchors the premise with authoritative clarity.',
          },
          {
            sectionName: '2. Causal Evidence & Application',
            contentSnippet:
              'First, empirical practice confirms that focusing on foundational principles yields exponential dividends over time.',
            rhetoricalPurpose: 'Offers rationale and grounding for the core argument.',
          },
          {
            sectionName: '3. Nuance & Refutation',
            contentSnippet:
              'Furthermore, while skeptics may claim that such structure limits spontaneity, the reality is that mastery of structure is precisely what unlocks effortless confidence.',
            rhetoricalPurpose: 'Neutralizes common objections.',
          },
          {
            sectionName: '4. Memorable Synthesis',
            contentSnippet:
              'Ultimately, true eloquence is not about verbosity—it is about clarity of thought and intentional delivery.',
            rhetoricalPurpose: 'Delivers a resonant takeaway.',
          },
        ],
        keyTechniquesUsed: [
          'Parallel Construction',
          'Pre-emptive Refutation',
          'Aphoristic Synthesis',
        ],
        estimatedWpm: 140,
        whyThisScoresHigh:
          'Exhibits structured reasoning, zero filler words, crisp diction, and direct relevance to the prompt.',
      };
    }
  }
}
