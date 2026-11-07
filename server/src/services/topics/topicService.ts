import { Topic, Category, Difficulty, PromptFormat, PracticeMode } from '../../../../shared/types/index.js';
import { CURATED_TOPICS } from './topicBank.js';
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/index.js';

export const ALL_30_CATEGORIES: { id: Category; label: string; description: string }[] = [
  { id: 'technology', label: 'Technology', description: 'Emerging tech, cybersecurity, digital infrastructure, and computing trends' },
  { id: 'ai', label: 'Artificial Intelligence', description: 'Machine learning, generative AI, automation, ethics, and human-AI collaboration' },
  { id: 'education', label: 'Education', description: 'Learning methods, educational reform, universities, and skill development' },
  { id: 'business', label: 'Business & Startups', description: 'Entrepreneurship, strategy, marketing, organizational design, and disruption' },
  { id: 'science', label: 'Science & Discovery', description: 'Physics, biology, scientific breakthroughs, space exploration, and empirical rigor' },
  { id: 'psychology', label: 'Psychology & Behavior', description: 'Human behavior, cognitive biases, emotional intelligence, and mental models' },
  { id: 'society', label: 'Society & Culture', description: 'Cultural shifts, civic issues, demographic changes, and modern social dynamics' },
  { id: 'environment', label: 'Environment & Climate', description: 'Sustainability, climate change, renewable energy, and ecological balance' },
  { id: 'sports', label: 'Sports & Competition', description: 'Athletics, high-performance psychology, teamwork, and modern sports industries' },
  { id: 'careers', label: 'Careers & Leadership', description: 'Professional growth, job transitions, workplace dilemmas, and leadership strategy' },
  { id: 'finance', label: 'Finance & Economics', description: 'Personal finance, macroeconomic trends, investing, monetary systems, and wealth' },
  { id: 'philosophy', label: 'Philosophy & Ethics', description: 'Moral dilemmas, existential inquiry, truth, logic, and timeless philosophical ideas' },
  { id: 'history', label: 'History & Civilization', description: 'Historical turning points, lessons of past empires, leadership triumphs and failures' },
  { id: 'entertainment', label: 'Media & Entertainment', description: 'Cinema, music, digital creators, video games, storytelling, and culture' },
  { id: 'everyday-life', label: 'Everyday Life', description: 'Daily habits, personal dilemmas, practical scenarios, and relatable human situations' },
  { id: 'college-life', label: 'College & Student Life', description: 'Campus conflicts, academic pressure, peer collaboration, and student autonomy' },
  { id: 'communication-personality', label: 'Communication & Rhetoric', description: 'Persuasion, handling disagreement, active listening, tact, and confident presence' },
  { id: 'creative-thinking', label: 'Creative & Lateral Thinking', description: 'Unconventional problem-solving, thought experiments, and imaginative ideas' },
  { id: 'critical-thinking', label: 'Critical Thinking & Logic', description: 'Spotting fallacies, evaluating arguments, balancing trade-offs, and dialectics' },
  { id: 'health-wellness', label: 'Health & Wellness', description: 'Physical health, nutrition, sleep science, mindfulness, and longevity' },
  { id: 'politics-governance', label: 'Governance & Policy', description: 'Public policy, civic duties, democratic systems, and institutional reform' },
  { id: 'space-astronomy', label: 'Space & Astronomy', description: 'Cosmology, Mars missions, astrophysics, space commercialization, and aliens' },
  { id: 'art-design', label: 'Art, Design & Aesthetics', description: 'Visual arts, architecture, industrial design, UX, and aesthetic theory' },
  { id: 'literature-books', label: 'Literature & Books', description: 'Great literature, character studies, narrative power, and reading habits' },
  { id: 'food-culinary', label: 'Food & Culinary Culture', description: 'Gastronomy, food sustainability, culinary heritage, and culinary innovation' },
  { id: 'travel-geography', label: 'Travel & Global Cultures', description: 'Cross-cultural immersion, geography, global exploration, and travel ethics' },
  { id: 'relationships-family', label: 'Relationships & Family', description: 'Interpersonal bonds, friendships, conflict resolution, and empathy' },
  { id: 'productivity-habits', label: 'Productivity & Focus', description: 'Time management, deep work, overcoming procrastination, and habit systems' },
  { id: 'future-foresight', label: 'Future Foresight', description: 'Megatrends of 2050, transhumanism, future of work, and long-term futures' },
  { id: 'urban-smart-cities', label: 'Urban Living & Smart Cities', description: 'City design, public transit, housing, smart infrastructure, and urbanism' },
];

class TopicService {
  private recentTopicIds: Set<string> = new Set();
  private recentTopicTitles: string[] = [];
  private recentCategories: Category[] = [];
  private maxRecentHistory = 40;

  public getCategories(): { id: Category; label: string; description: string }[] {
    return ALL_30_CATEGORIES;
  }

  public getRandomCuratedTopic(filters?: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Topic {
    let pool = CURATED_TOPICS.filter((t) => !this.recentTopicIds.has(t.id));
    if (pool.length === 0) {
      this.recentTopicIds.clear();
      pool = CURATED_TOPICS;
    }

    if (filters?.category) {
      const catFiltered = pool.filter((t) => t.category === filters.category);
      if (catFiltered.length > 0) pool = catFiltered;
    }

    if (filters?.difficulty) {
      const normalizedDiff = this.normalizeDifficulty(filters.difficulty);
      const diffFiltered = pool.filter((t) => this.normalizeDifficulty(t.difficulty) === normalizedDiff);
      if (diffFiltered.length > 0) pool = diffFiltered;
    }

    if (filters?.format) {
      const formatFiltered = pool.filter((t) => t.format === filters.format);
      if (formatFiltered.length > 0) pool = formatFiltered;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)] || CURATED_TOPICS[0];
    this.recordTopicShown(selected.id, selected.title, selected.category);
    return selected;
  }

  public normalizeDifficulty(diff?: Difficulty): 'beginner' | 'intermediate' | 'advanced' {
    if (!diff) return 'intermediate';
    if (diff === 'beginner' || diff === 'easy') return 'beginner';
    if (diff === 'advanced' || diff === 'hard') return 'advanced';
    return 'intermediate';
  }

  public async generateTopic(params: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
    apiKeyOverride?: string;
    recentTopics?: string[];
  }): Promise<Topic> {
    const apiKey = params.apiKeyOverride || config.geminiApiKey;

    if (!apiKey) {
      return this.getRandomCuratedTopic(params);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const normalizedDifficulty = this.normalizeDifficulty(params.difficulty);
      const chosenCategory = params.category || this.pickRandomCategory();
      const chosenMode = params.mode || 'impromptu';
      const chosenFormat = params.format || 'open-question';

      const recentExclusions = [
        ...this.recentTopicTitles,
        ...(params.recentTopics || []),
      ].slice(-30);

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

      const difficultyGuidelines: Record<'beginner' | 'intermediate' | 'advanced', string> = {
        beginner: 'Beginner: Accessible, concrete everyday situations. Focused on clear personal expression and straightforward examples.',
        intermediate: 'Intermediate: Requires structured reasoning, balancing two competing viewpoints or practical trade-offs.',
        advanced: 'Advanced: Complex systemic trade-offs, philosophical dilemmas, multi-stakeholder conflicts, or counter-intuitive edge cases.',
      };

      const prompt = `You are the lead curriculum architect for SpeakUp, an elite AI speech and communication platform.
Generate ONE fresh, original, thought-provoking speaking challenge according to these criteria:

- Category: "${chosenCategory}"
- Target Mode: "${chosenMode}" (${modeInstructions[chosenMode]})
- Difficulty: "${normalizedDifficulty}" (${difficultyGuidelines[normalizedDifficulty]})
- Prompt Format: "${chosenFormat}" (Options: "open-question", "random-word", or "hypothetical-situation")
${antiRepetitionClause}

Rules:
1. The question must be genuinely engaging, intellectually stimulating, and promote authentic critical thinking.
2. Avoid overused cliches (e.g., "social media is bad", "work-life balance", "tell me about yourself", "paper vs digital").
3. Include 3 distinct dialectical angles or hints to guide the speaker's reasoning.
4. If format is "random-word", give a provocative word AND a concrete speaking task.
5. If format is "hypothetical-situation", set an immediate, realistic role and stakes.

Respond strictly with valid JSON with this exact schema:
{
  "id": "gen-${Date.now()}",
  "title": "Short descriptive title (3-6 words)",
  "category": "${chosenCategory}",
  "difficulty": "${normalizedDifficulty}",
  "format": "${chosenFormat}",
  "question": "The primary prompt the user will read and respond to (1-3 sentences)",
  "taskExplanation": "1-2 sentences clarifying what excellent speakers should focus on",
  "suggestedDurationSec": 180,
  "hints": ["Dialectical Angle 1", "Dialectical Angle 2", "Dialectical Angle 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "source": "ai-generated"
}`;

      let responseText = '';
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
      for (const model of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.75,
            },
          });
          if (result && result.text) {
            responseText = result.text;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Topic generation model ${model} failed, trying fallback:`, modelErr?.message || modelErr);
        }
      }

      if (!responseText) {
        return this.getRandomCuratedTopic(params);
      }

      const parsed = JSON.parse(responseText);

      if (parsed.title && parsed.question) {
        const topic: Topic = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: String(parsed.title),
          category: (parsed.category as Category) || chosenCategory,
          difficulty: (parsed.difficulty as Difficulty) || normalizedDifficulty,
          format: (parsed.format as PromptFormat) || chosenFormat,
          question: String(parsed.question),
          taskExplanation: parsed.taskExplanation,
          suggestedDurationSec: Number(parsed.suggestedDurationSec) || 180,
          hints: Array.isArray(parsed.hints) ? parsed.hints : [],
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          source: 'ai-generated',
        };
        this.recordTopicShown(topic.id, topic.title, topic.category);
        return topic;
      }
      return this.getRandomCuratedTopic(params);
    } catch (err) {
      console.warn('AI topic generation failed or timed out, falling back to curated bank:', err);
      return this.getRandomCuratedTopic(params);
    }
  }

  private pickRandomCategory(): Category {
    const available = ALL_30_CATEGORIES.filter((c) => !this.recentCategories.includes(c.id));
    const pool = available.length > 0 ? available : ALL_30_CATEGORIES;
    const chosen = pool[Math.floor(Math.random() * pool.length)].id;
    this.recordCategoryShown(chosen);
    return chosen;
  }

  private recordCategoryShown(category: Category) {
    this.recentCategories.push(category);
    if (this.recentCategories.length > 10) {
      this.recentCategories.shift();
    }
  }

  private recordTopicShown(id: string, title?: string, category?: Category) {
    this.recentTopicIds.add(id);
    if (title) {
      this.recentTopicTitles.push(title);
      if (this.recentTopicTitles.length > this.maxRecentHistory) {
        this.recentTopicTitles.shift();
      }
    }
    if (category) {
      this.recordCategoryShown(category);
    }
    if (this.recentTopicIds.size > this.maxRecentHistory) {
      const first = this.recentTopicIds.values().next().value;
      if (first) this.recentTopicIds.delete(first);
    }
  }
}

export const topicService = new TopicService();
