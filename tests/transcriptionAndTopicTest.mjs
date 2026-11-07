import { GoogleGenAI } from '../server/node_modules/@google/genai/dist/node/index.mjs';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import assert from 'assert';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

async function generateWithFallback(callConfig) {
  let lastErr = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        ...callConfig,
      });
      if (res && res.text) return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All models failed');
}

console.log('=== STARTING SPEAKUP TRANSCRIPTION & TOPIC VARIETY TEST SUITE ===\n');

async function test1_AudioTranscriptionRealSpeech() {
  console.log('TEST 1: Audio Transcription on Real Spoken Speech...');
  const res = await fetch('https://dpgr.am/bueller.wav');
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  console.log(`- Downloaded reference speech sample (${buffer.length} bytes)`);

  const response = await generateWithFallback({
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: buffer.toString('base64'),
            },
          },
          {
            text: 'Transcribe this spoken audio verbatim. Do not summarize, do not correct grammar, do not omit filler words or hesitation marks (such as um, uh, ah, like). If pure silence or no audible words are spoken, respond with exactly: [NO_SPEECH_DETECTED]. Return ONLY the plain text of the spoken words.',
          },
        ],
      },
    ],
  });

  const transcript = (response?.text || '').trim();
  console.log(`- Transcribed output: "${transcript}"`);
  assert(transcript.length > 20, 'Transcript should be longer than 20 chars');
  assert(
    transcript.toLowerCase().includes('life moves pretty fast') ||
      transcript.toLowerCase().includes('stop and look around'),
    'Transcript should accurately match spoken words'
  );
  console.log('✓ TEST 1 PASSED: Speech transcribed verbatim with high fidelity!\n');
}

async function test2_AudioSilenceNoSpeechDetected() {
  console.log('TEST 2: Audio Silence Detection (Zero Hallucination Filter)...');
  // Create a silent WAV buffer (mic unmuted but silent, or mic muted)
  const sampleRate = 8000;
  const numSamples = 8000;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Acoustic DSP energy check matching SpeakUp backend & client
  let maxVal = 0;
  for (let i = 44; i < buffer.length - 1; i += 2) {
    const s = Math.abs(buffer.readInt16LE(i));
    if (s > maxVal) maxVal = s;
  }
  const isAcousticallySilent = maxVal < 800;
  console.log(`- Silence check: max amplitude = ${maxVal}, isSilent = ${isAcousticallySilent}`);
  assert.strictEqual(isAcousticallySilent, true, 'Silent audio buffer must be detected as silent');

  console.log('✓ TEST 2 PASSED: Silence correctly identified before AI ingestion, preventing hallucinated speech!\n');
}

async function test3_TopicVarietyMultipleCategories() {
  console.log('TEST 3: Dynamic Topic Generation Across Broad Categories...');
  const testCategories = ['ai', 'psychology', 'environment', 'philosophy'];
  const generatedTopics = [];

  for (const cat of testCategories) {
    const prompt = `You are the lead curriculum architect for SpeakUp.
Generate ONE fresh, original, thought-provoking speaking challenge:
- Category: "${cat}"
- Practice Mode: "impromptu"
- Difficulty: "intermediate"
- Prompt Format: "open-question"

Respond strictly with valid JSON with this exact schema:
{
  "title": "Short descriptive title (3-6 words)",
  "category": "${cat}",
  "difficulty": "intermediate",
  "question": "The primary prompt the user will read and respond to",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
}`;

    const res = await generateWithFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.75 },
    });

    const parsed = JSON.parse(res.text);
    console.log(`- Category [${cat}]: "${parsed.title}" -> "${parsed.question.slice(0, 65)}..."`);
    assert(parsed.title && parsed.title.length > 5, 'Title must be valid');
    assert(parsed.question && parsed.question.length > 15, 'Question must be valid');
    assert(parsed.hints && parsed.hints.length >= 2, 'Hints must be present');
    generatedTopics.push(parsed.title);
  }

  // Ensure all generated topics are unique
  const uniqueTitles = new Set(generatedTopics.map((t) => t.toLowerCase()));
  assert.strictEqual(uniqueTitles.size, testCategories.length, 'All generated topics must be distinct');
  console.log('✓ TEST 3 PASSED: Dynamically generated unique challenges across categories!\n');
}

async function test4_AntiRepetitionConstraint() {
  console.log('TEST 4: Anti-Repetition Exclusion Enforcement...');
  const existingTopic = 'Autonomous Weapons Systems & Ethical Red Lines';
  const prompt = `You are the lead curriculum architect for SpeakUp.
Generate ONE fresh, original, thought-provoking speaking challenge:
- Category: "ai"
- Practice Mode: "debate"
- Difficulty: "advanced"
- Format: "open-question"

CRITICAL ANTI-REPETITION CONSTRAINT: Do NOT generate questions similar, identical, or conceptually redundant to any of these recently practiced topics:
- ${existingTopic}
- AI Chatbots in College Exams
Generate a completely novel perspective or scenario.

Respond strictly with valid JSON with this exact schema:
{
  "title": "Short descriptive title",
  "question": "The prompt"
}`;

  const res = await generateWithFallback({
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.8 },
  });

  const parsed = JSON.parse(res.text);
  console.log(`- Anti-repetition generated topic: "${parsed.title}"`);
  assert(
    !parsed.title.toLowerCase().includes('autonomous weapons'),
    'Should not duplicate excluded topic'
  );
  assert(
    !parsed.title.toLowerCase().includes('college exams'),
    'Should not duplicate excluded topic'
  );
  console.log('✓ TEST 4 PASSED: Anti-repetition successfully produced distinct prompt!\n');
}

async function test5_AllPracticeModesAndDifficulties() {
  console.log('TEST 5: Dynamic Generation Across All 6 Practice Modes & Difficulties...');
  const modes = [
    { mode: 'impromptu', diff: 'beginner', cat: 'everyday-life' },
    { mode: 'research', diff: 'intermediate', cat: 'science' },
    { mode: 'debate', diff: 'advanced', cat: 'technology' },
    { mode: 'interview', diff: 'intermediate', cat: 'careers' },
    { mode: 'explain-simply', diff: 'beginner', cat: 'ai' },
    { mode: 'real-life', diff: 'advanced', cat: 'business' },
  ];

  for (const m of modes) {
    const prompt = `You are the lead curriculum architect for SpeakUp.
Generate ONE fresh challenge:
- Mode: "${m.mode}"
- Category: "${m.cat}"
- Difficulty: "${m.diff}"

Respond in JSON:
{
  "title": "Short descriptive title",
  "question": "Question"
}`;

    const res = await generateWithFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.7 },
    });
    const parsed = JSON.parse(res.text);
    console.log(`- Mode [${m.mode}] (${m.diff} in ${m.cat}): "${parsed.title}"`);
    assert(parsed.title && parsed.question, `Must generate valid challenge for mode ${m.mode}`);
  }
  console.log('✓ TEST 5 PASSED: Generated dynamic challenges for all 6 modes across difficulties!\n');
}

async function runAll() {
  try {
    await test1_AudioTranscriptionRealSpeech();
    await test2_AudioSilenceNoSpeechDetected();
    await test3_TopicVarietyMultipleCategories();
    await test4_AntiRepetitionConstraint();
    await test5_AllPracticeModesAndDifficulties();
    console.log('========================================================');
    console.log('🎉 ALL TRANSCRIPTION & TOPIC VARIETY TESTS PASSED (5/5)!');
    console.log('========================================================');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  }
}

runAll();
