import { GoogleGenAI } from '@google/genai';
import {
  Topic,
  PracticeMode,
  EvaluationReport,
  DebateTurn,
  InterviewTurn,
  AudioDeliveryMetrics,
} from '@shared/types/index';
import { storageService } from './storage';
import { LocalEvaluator } from './localEvaluator';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

export class LocalGeminiService {
  private static getApiKey(override?: string): string {
    if (override && override.trim()) return override.trim();
    const settings = storageService.getSettings();
    if (settings.geminiApiKey && settings.geminiApiKey.trim()) return settings.geminiApiKey.trim();
    const env = (import.meta as any).env || {};
    return env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
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
}
