import { GoogleGenAI } from '@google/genai';
import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
  DebateTurn,
  InterviewTurn,
} from '../../../../shared/types/index.js';
import { config } from '../../config/index.js';

// Prioritized list of active Google Developer API models supporting generateContent
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

export class GeminiProvider {
  private getClient(apiKeyOverride?: string): GoogleGenAI {
    const key = apiKeyOverride || config.geminiApiKey;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Helper that executes generateContent with automatic model fallback
   * (e.g. if a model is temporarily experiencing 503 high demand).
   */
  private async executeWithFallback(
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
        console.warn(`Model ${model} request failed:`, err?.message || err);
        // Continue to next candidate model
      }
    }

    throw lastError || new Error('All candidate Gemini models failed to respond.');
  }

  /**
   * Safe test connection method for backend diagnostics
   */
  public async testConnection(apiKeyOverride?: string): Promise<{
    success: boolean;
    model: string;
    message: string;
    latencyMs: number;
  }> {
    const ai = this.getClient(apiKeyOverride);
    const start = Date.now();

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
      message: parsed.message || 'Connection verified',
      latencyMs,
    };
  }

  public async evaluateSpeech(params: {
    sessionId: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    researchNotes?: string;
    audioMetrics?: AudioDeliveryMetrics;
    apiKeyOverride?: string;
  }): Promise<EvaluationReport> {
    const ai = this.getClient(params.apiKeyOverride);

    const systemPrompt = `You are the chief speech evaluator and communication architect for SpeakUp.
Your role: Act as a strict, knowledgeable, supportive communication coach.
You must tell users what they actually need to improve, not what they want to hear.

CRITICAL EVALUATION RULES:
1. Honest, Calibrated Scoring: A weak response must be given 30-55. An average response 60-74. A good response 75-85. Do NOT give 90-100 to weak or mediocre responses. Never inflate scores for politeness.
2. If the user spoke less than 20 words or gave an empty/irrelevant response, content score must be < 5 and overall score < 30.
3. Content Relevance & Accuracy (Max 20): Did they directly answer the prompt? Distinguish facts from opinions. Flag unverified or incorrect claims.
4. Reasoning, Examples & Evidence (Max 15): Did they explain *why*? Are examples concrete or generic? Challenge broad generalizations.
5. Organisation & Flow (Max 15): Clear opening, body, transitions, conclusion? Point out disorganized jumping.
6. Clarity & Sentence Construction (Max 15): Run-on sentences, awkward phrasing, clear expression.
7. Grammar (Max 15): Real errors only (subject-verb agreement, tenses, prepositions, articles). Do NOT invent mistakes.
8. Vocabulary & Word Choice (Max 10): Precision over big fancy words. Flag repetitive vocabulary.
9. Fluency & Fillers (Max 10): Penalize frequent "um", "uh", "you know", "like".
10. Corrections Table: For every genuine mistake, provide the exact spoken sentence, corrected version, and clear explanation.
11. Better Way to Say It: Take 1-2 actual sentences spoken and show a polished, natural professional version without rewriting their entire personality.
12. Exercises: Generate 3 actionable drills targeting their exact recorded weaknesses.
13. Recommended Next Challenge: A concrete next challenge to practice.

TASK DETAILS:
- Topic Title: "${params.topic.title}"
- Question/Prompt: "${params.topic.question}"
- Mode: ${params.mode}
- Difficulty: ${params.topic.difficulty}
- Duration Spoken: ${params.durationSec} seconds
${params.researchNotes ? `- Research Notes Written by User: "${params.researchNotes}"` : ''}
${params.audioMetrics ? `- Measured Audio Delivery Metrics: Words Per Minute: ${params.audioMetrics.wordsPerMinute || 'N/A'}, Filler Count: ${params.audioMetrics.fillerCount || 0}, Pause Count: ${params.audioMetrics.pauseCount || 'N/A'}, Longest Pause: ${params.audioMetrics.longestPauseSec || 'N/A'}s` : ''}

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
  "strengths": ["Up to 3 specific strengths with quotes from the speech"],
  "improvementAreas": ["Top 3 critical weaknesses to fix"],
  "corrections": [
    {
      "whatSaid": "exact sentence spoken with error",
      "correctVersion": "corrected grammatical sentence",
      "explanation": "rule violated (e.g. subject-verb agreement)",
      "naturalAlternative": "optional idiomatic phrasing"
    }
  ],
  "reasoningFeedback": {
    "strongestArgument": "best point made",
    "weakestArgument": "weakest point made",
    "missingPoint": "key aspect ignored",
    "unsupportedClaims": [
      {
        "claim": "specific claim made",
        "flag": "unsupported" | "needs-verification" | "incorrect" | "partially-correct" | "opinion",
        "explanation": "why this claim is problematic"
      }
    ],
    "betterExample": "a more concrete, convincing example they could have used"
  },
  "betterWaysToSayIt": [
    {
      "original": "spoken sentence",
      "refined": "improved version",
      "whyBetter": "explanation of clarity/impact improvement"
    }
  ],
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
    "suggestedPrompt": "Title and prompt of next recommended exercise",
    "rationale": "Why this fixes their specific weakness"
  }
}`;

    const { text, modelUsed } = await this.executeWithFallback(ai, systemPrompt, true, 0.3);
    const parsed = JSON.parse(text);

    // Sum up score to ensure mathematical consistency
    const dims = parsed.dimensionScores;
    const computedTotal =
      (dims.contentRelevance?.score || 0) +
      (dims.reasoningEvidence?.score || 0) +
      (dims.organizationStructure?.score || 0) +
      (dims.clarityConstruction?.score || 0) +
      (dims.grammar?.score || 0) +
      (dims.vocabularyChoice?.score || 0) +
      (dims.fluencyFillers?.score || 0);

    const report: EvaluationReport = {
      id: `eval-${Date.now()}`,
      sessionId: params.sessionId,
      transcriptScore: Math.min(100, Math.max(0, computedTotal || parsed.transcriptScore)),
      performanceLevel: parsed.performanceLevel || 'Competent',
      mainTakeaway: parsed.mainTakeaway || 'Session evaluated successfully.',
      dimensionScores: parsed.dimensionScores,
      strengths: parsed.strengths || [],
      improvementAreas: parsed.improvementAreas || [],
      corrections: parsed.corrections || [],
      reasoningFeedback: parsed.reasoningFeedback || {},
      betterWaysToSayIt: parsed.betterWaysToSayIt || [],
      deliveryMetrics: params.audioMetrics,
      deliveryScore: params.audioMetrics?.wordsPerMinute
        ? {
            score: Math.min(
              100,
              Math.max(
                30,
                85 -
                  (params.audioMetrics.fillerCount || 0) * 3 -
                  (params.audioMetrics.paceRating === 'ideal' ? 0 : 15)
              )
            ),
            confidence: params.audioMetrics.volumeConsistency === 'consistent' ? 'high' : 'medium',
            coverageNotes: params.audioMetrics.reliabilityNote,
          }
        : undefined,
      personalizedExercises: parsed.personalizedExercises || [],
      recommendedNextChallenge: parsed.recommendedNextChallenge || {
        category: params.topic.category,
        difficulty: params.topic.difficulty,
        suggestedPrompt: 'Continue with impromptu speaking practice.',
        rationale: 'Build continuous speaking endurance.',
      },
      isDemoMode: false,
      evaluationVersion: `${modelUsed}-v1`,
      createdAt: new Date().toISOString(),
    };

    return report;
  }

  public async generateDebateTurn(params: {
    motion: string;
    userPosition: 'for' | 'against';
    roundNumber: number;
    totalRounds: number;
    history: DebateTurn[];
    userArgument: string;
    apiKeyOverride?: string;
  }): Promise<{ aiResponse: string; roundCritique?: string }> {
    const ai = this.getClient(params.apiKeyOverride);
    const aiPosition = params.userPosition === 'for' ? 'AGAINST' : 'FOR';

    const historyPrompt = params.history
      .map((t) => `${t.speaker === 'user' ? 'USER' : 'AI DEBATE PARTNER'} (Round ${t.roundNumber}): ${t.content}`)
      .join('\n\n');

    const prompt = `You are an elite, respectful, intellectually rigorous debate opponent.
DEBATE MOTION: "${params.motion}"
USER'S POSITION: ${params.userPosition.toUpperCase()}
YOUR POSITION: ${aiPosition}
CURRENT ROUND: ${params.roundNumber} of ${params.totalRounds}

DEBATE RULES:
1. Do NOT automatically agree with the user.
2. Attack the weakest premise, faulty assumption, or unsupported claim in the user's latest argument.
3. Bring in a concrete counter-example or statistical reality.
4. Keep your spoken debate rebuttal under 150 words (punchy and conversational for spoken debate).
5. Also provide a private 1-sentence critique pointing out the logical fallacy or missing evidence in the user's turn.

PREVIOUS TURNS:
${historyPrompt || 'None (First round)'}

USER'S LATEST ARGUMENT (ROUND ${params.roundNumber}):
"""
${params.userArgument}
"""

Respond in JSON:
{
  "aiResponse": "Your spoken rebuttal as the opposing debater (100-150 words)",
  "roundCritique": "Private feedback on the logical strength or flaw in the user's turn (1-2 sentences)"
}`;

    const { text } = await this.executeWithFallback(ai, prompt, true, 0.6);
    const parsed = JSON.parse(text);
    return {
      aiResponse: parsed.aiResponse,
      roundCritique: parsed.roundCritique,
    };
  }

  public async generateInterviewTurn(params: {
    interviewType: string;
    history: InterviewTurn[];
    userAnswer: string;
    apiKeyOverride?: string;
  }): Promise<{ nextQuestion: string; feedbackOnAnswer: string; starAnalysis?: any }> {
    const ai = this.getClient(params.apiKeyOverride);

    const prompt = `You are a professional corporate interviewer conducting a ${params.interviewType} interview.
Listen closely to the candidate's response.
If their answer was vague, lacked concrete metrics, missed the STAR framework (Situation, Task, Action, Result), or sounded memorized, call it out and ask a targeted follow-up question.
If their answer was solid, acknowledge one specific detail and advance to the next logical interview question.

PREVIOUS QUESTIONS & ANSWERS:
${params.history.map((h, i) => `Q${i + 1}: ${h.interviewerQuestion}\nA${i + 1}: ${h.userAnswer}`).join('\n\n')}

CANDIDATE'S LATEST ANSWER:
"""
${params.userAnswer}
"""

Respond in JSON:
{
  "nextQuestion": "The next question or targeted probing follow-up (conversational and realistic)",
  "feedbackOnAnswer": "Honest evaluation of their answer: specificity, depth, structure, or red flags (2-3 sentences)",
  "starAnalysis": {
    "situationIdentified": boolean,
    "taskIdentified": boolean,
    "actionIdentified": boolean,
    "resultIdentified": boolean,
    "notes": "Short breakdown of how well they executed STAR"
  }
}`;

    const { text } = await this.executeWithFallback(ai, prompt, true, 0.5);
    const parsed = JSON.parse(text);
    return {
      nextQuestion: parsed.nextQuestion,
      feedbackOnAnswer: parsed.feedbackOnAnswer,
      starAnalysis: parsed.starAnalysis,
    };
  }
}

export const geminiProvider = new GeminiProvider();
