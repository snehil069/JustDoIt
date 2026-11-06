import { Topic, Category, Difficulty, PromptFormat, PracticeMode } from '../../../../shared/types/index.js';
import { CURATED_TOPICS } from './topicBank.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/index.js';

class TopicService {
  private recentTopicIds: Set<string> = new Set();
  private maxRecentHistory = 30;

  public getCategories(): { id: Category; label: string; description: string }[] {
    return [
      { id: 'everyday-life', label: 'Everyday Life', description: 'Daily habits, routines, personal dilemmas, and real-world conversations' },
      { id: 'college-life', label: 'College & Student Life', description: 'Academics, campus conflicts, peer dynamics, and project coordination' },
      { id: 'tech-engineering', label: 'Technology & Engineering', description: 'Emerging tech, engineering ethics, sustainable transitions, and real-world application' },
      { id: 'computer-science', label: 'Computer Science', description: 'Systems, algorithms, open source, AI, and simplifying technical concepts' },
      { id: 'general-awareness', label: 'General Awareness', description: 'Global developments, geopolitics, media literacy, and scientific understanding' },
      { id: 'society-affairs', label: 'Society & Current Affairs', description: 'Civic challenges, urbanization, culture, social justice, and policy' },
      { id: 'communication-personality', label: 'Communication & Personality', description: 'Defending arguments, handling criticism, tact, and confident articulation' },
      { id: 'career-professional', label: 'Career & Professional Skills', description: 'Interviews, STAR responses, workplace dilemmas, and leadership strategy' },
      { id: 'creative-thinking', label: 'Creative Thinking', description: 'Unconventional solutions, scenario reimagining, and lateral ideas' },
      { id: 'critical-thinking', label: 'Critical Thinking & Debate', description: 'Counterarguments, cognitive fallacies, weighing trade-offs, and rigorous logic' },
    ];
  }

  public getRandomCuratedTopic(filters?: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Topic {
    let pool = CURATED_TOPICS.filter((t) => !this.recentTopicIds.has(t.id));
    if (pool.length === 0) {
      // Clear recent cache if exhausted
      this.recentTopicIds.clear();
      pool = CURATED_TOPICS;
    }

    if (filters?.category) {
      const catFiltered = pool.filter((t) => t.category === filters.category);
      if (catFiltered.length > 0) pool = catFiltered;
    }

    if (filters?.difficulty) {
      const diffFiltered = pool.filter((t) => t.difficulty === filters.difficulty);
      if (diffFiltered.length > 0) pool = diffFiltered;
    }

    if (filters?.format) {
      const formatFiltered = pool.filter((t) => t.format === filters.format);
      if (formatFiltered.length > 0) pool = formatFiltered;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)] || CURATED_TOPICS[0];
    this.recordTopicShown(selected.id);
    return selected;
  }

  public async generateTopic(params: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
    apiKeyOverride?: string;
  }): Promise<Topic> {
    const apiKey = params.apiKeyOverride || config.geminiApiKey;

    if (!apiKey) {
      return this.getRandomCuratedTopic(params);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are the lead curriculum architect for SpeakUp, an AI speaking improvement platform for college students and young professionals.
Generate ONE highly engaging, thought-provoking speaking challenge according to these criteria:
- Category: ${params.category || 'any college or professional topic'}
- Difficulty: ${params.difficulty || 'medium'} (easy: accessible with everyday examples; medium: requires structure & multi-perspective reasoning; hard: trade-offs, counterarguments, deeper logic)
- Format: ${params.format || 'open-question'} (Options: "random-word" [Must provide a Word: and a specific speaking task], "open-question", or "hypothetical-situation")
- Practice Mode: ${params.mode || 'impromptu'}

Rules:
1. Must support a meaningful 3 to 5 minute spoken response.
2. Avoid generic questions like "Tell me about yourself" unless mode is interview.
3. Encourage independent thinking and structured reasoning, not memorized answers.
4. Do NOT reveal the ideal answer.
5. If random-word, give a word AND a clear speaking challenge explaining why, with an example.

Respond strictly with valid JSON with this exact schema:
{
  "id": "gen-${Date.now()}",
  "title": "Short descriptive title (3-6 words)",
  "category": "${params.category || 'everyday-life'}",
  "difficulty": "${params.difficulty || 'medium'}",
  "format": "${params.format || 'open-question'}",
  "question": "The primary prompt the user will read and respond to",
  "taskExplanation": "1-2 sentences clarifying what good speakers should address",
  "suggestedDurationSec": 180,
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "source": "ai-generated"
}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed.title && parsed.question) {
        const topic: Topic = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: String(parsed.title),
          category: (parsed.category as Category) || params.category || 'everyday-life',
          difficulty: (parsed.difficulty as Difficulty) || params.difficulty || 'medium',
          format: (parsed.format as PromptFormat) || params.format || 'open-question',
          question: String(parsed.question),
          taskExplanation: parsed.taskExplanation,
          suggestedDurationSec: Number(parsed.suggestedDurationSec) || 180,
          hints: Array.isArray(parsed.hints) ? parsed.hints : [],
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          source: 'ai-generated',
        };
        this.recordTopicShown(topic.id);
        return topic;
      }
      return this.getRandomCuratedTopic(params);
    } catch (err) {
      console.warn('AI topic generation failed or timed out, falling back to curated bank:', err);
      return this.getRandomCuratedTopic(params);
    }
  }

  private recordTopicShown(id: string) {
    this.recentTopicIds.add(id);
    if (this.recentTopicIds.size > this.maxRecentHistory) {
      const first = this.recentTopicIds.values().next().value;
      if (first) this.recentTopicIds.delete(first);
    }
  }
}

export const topicService = new TopicService();
