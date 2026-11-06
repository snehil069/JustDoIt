import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config, updateRuntimeConfig } from './config/index.js';
import { topicService } from './services/topics/topicService.js';
import { evaluationEngine } from './services/evaluation/evaluationEngine.js';
import { geminiProvider } from './services/ai/geminiProvider.js';
import { audioAnalyzer } from './services/audio/audioAnalyzer.js';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      gemini: { configured: !!config.geminiApiKey },
      deepgram: { configured: !!config.deepgramApiKey },
      grok: { configured: !!config.grokApiKey },
    },
    defaultAiProvider: config.defaultAiProvider,
    defaultSttProvider: config.defaultSttProvider,
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json({
    hasGeminiKey: !!config.geminiApiKey,
    hasGrokKey: !!config.grokApiKey,
    hasDeepgramKey: !!config.deepgramApiKey,
    defaultAiProvider: config.defaultAiProvider,
    defaultSttProvider: config.defaultSttProvider,
  });
});

app.post('/api/settings', (req, res) => {
  const { geminiApiKey, grokApiKey, deepgramApiKey, defaultAiProvider, defaultSttProvider } = req.body;
  updateRuntimeConfig({
    geminiApiKey,
    grokApiKey,
    deepgramApiKey,
    defaultAiProvider,
    defaultSttProvider,
  });
  res.json({
    success: true,
    message: 'Runtime provider settings updated.',
    hasGeminiKey: !!config.geminiApiKey,
    hasDeepgramKey: !!config.deepgramApiKey,
  });
});

// AI Diagnostics & Connection Test
app.all('/api/ai/test', async (req, res) => {
  try {
    const apiKeyOverride = (req.body?.apiKeyOverride || req.query?.apiKeyOverride) as string | undefined;
    const result = await geminiProvider.testConnection(apiKeyOverride);
    res.json(result);
  } catch (err: any) {
    const safeError = err?.message || 'Gemini API test failed';
    res.status(500).json({
      success: false,
      error: safeError,
    });
  }
});

// Topics
app.get('/api/topics/categories', (req, res) => {
  res.json(topicService.getCategories());
});

app.get('/api/topics/random', (req, res) => {
  const { category, difficulty, format, mode } = req.query;
  const topic = topicService.getRandomCuratedTopic({
    category: category as any,
    difficulty: difficulty as any,
    format: format as any,
    mode: mode as any,
  });
  res.json(topic);
});

app.post('/api/topics/generate', async (req, res) => {
  try {
    const { category, difficulty, format, mode, apiKeyOverride } = req.body;
    const topic = await topicService.generateTopic({
      category,
      difficulty,
      format,
      mode,
      apiKeyOverride,
    });
    res.json(topic);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate topic' });
  }
});

// Audio Analysis
app.post('/api/audio/analyze', (req, res) => {
  try {
    const metrics = audioAnalyzer.analyze(req.body);
    res.json(metrics);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Audio analysis failed' });
  }
});

// Speech Evaluation
app.post('/api/evaluate', async (req, res) => {
  try {
    const report = await evaluationEngine.evaluate(req.body);
    res.json(report);
  } catch (err: any) {
    console.error('Evaluation route error:', err);
    res.status(400).json({ error: err?.message || 'Failed to evaluate speech' });
  }
});

// Debate Turn
app.post('/api/debate/turn', async (req, res) => {
  try {
    const { motion, userPosition, roundNumber, totalRounds, history, userArgument, apiKeyOverride } = req.body;
    const activeKey = apiKeyOverride || config.geminiApiKey;

    if (!activeKey) {
      // Demo response for debate
      const turnResponses = [
        "While your argument highlights the immediate benefit, you have overlooked the second-order economic consequences. Specifically, how do you prevent abuse and standard dilution in the long run?",
        "That is an optimistic perspective, but empirical evidence suggests otherwise. When similar policies were tested, compliance plummeted and costs multiplied.",
        "Your premise assumes perfect enforcement. In reality, bad actors consistently exploit loopholes when strict oversight is absent. How does your solution resolve that vulnerability?",
      ];
      const selected = turnResponses[(roundNumber - 1) % turnResponses.length];
      return res.json({
        aiResponse: selected,
        roundCritique: "Demo Mode critique: Your point made an assertive claim, but lacked numerical or empirical evidence to withstand counter-scrutiny.",
      });
    }

    const response = await geminiProvider.generateDebateTurn({
      motion,
      userPosition,
      roundNumber,
      totalRounds,
      history,
      userArgument,
      apiKeyOverride: activeKey,
    });
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Debate turn failed' });
  }
});

// Interview Turn
app.post('/api/interview/turn', async (req, res) => {
  try {
    const { interviewType, history, userAnswer, apiKeyOverride } = req.body;
    const activeKey = apiKeyOverride || config.geminiApiKey;

    if (!activeKey) {
      // Demo interview response
      return res.json({
        nextQuestion: "That gives me some initial context. Could you walk me through the specific quantifiable outcome of your actions, and what you would do differently if you faced that situation again?",
        feedbackOnAnswer: "Demo Mode feedback: You outlined the general problem, but the specific 'Action' you personally took and the final measurable 'Result' were left vague. Remember to apply the STAR method.",
        starAnalysis: {
          situationIdentified: true,
          taskIdentified: true,
          actionIdentified: false,
          resultIdentified: false,
          notes: "Situation established, but needs concrete individual actions and metrics.",
        },
      });
    }

    const response = await geminiProvider.generateInterviewTurn({
      interviewType,
      history,
      userAnswer,
      apiKeyOverride: activeKey,
    });
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Interview turn failed' });
  }
});

// Create HTTP and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let deepgramLive: any = null;

  ws.on('message', async (message: Buffer | string) => {
    try {
      // Check if message is JSON control command
      if (typeof message === 'string' || (Buffer.isBuffer(message) && message.toString().startsWith('{'))) {
        const text = message.toString();
        const data = JSON.parse(text);

        if (data.type === 'START_DEEPGRAM') {
          const dgKey = data.apiKey || config.deepgramApiKey;
          if (!dgKey) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'No Deepgram API Key configured on server or client.' }));
            return;
          }

          const deepgram = createClient(dgKey);
          deepgramLive = deepgram.listen.live({
            model: 'nova-2',
            language: 'en-IN', // Supports Indian English accents & tech terms
            smart_format: true,
            interim_results: true,
            punctuate: true,
            filler_words: true, // Preserve fillers for honest fluency evaluation
          });

          deepgramLive.on(LiveTranscriptionEvents.Open, () => {
            ws.send(JSON.stringify({ type: 'DEEPGRAM_READY' }));
          });

          deepgramLive.on(LiveTranscriptionEvents.Transcript, (data: any) => {
            const transcript = data.channel.alternatives[0]?.transcript || '';
            const isFinal = data.is_final;
            if (transcript) {
              ws.send(
                JSON.stringify({
                  type: 'TRANSCRIPT',
                  transcript,
                  isFinal,
                  words: data.channel.alternatives[0]?.words || [],
                })
              );
            }
          });

          deepgramLive.on(LiveTranscriptionEvents.Error, (err: any) => {
            ws.send(JSON.stringify({ type: 'ERROR', message: err?.message || 'Deepgram live error' }));
          });

          deepgramLive.on(LiveTranscriptionEvents.Close, () => {
            ws.send(JSON.stringify({ type: 'DEEPGRAM_CLOSED' }));
          });
        } else if (data.type === 'STOP_DEEPGRAM') {
          if (deepgramLive) {
            deepgramLive.finish();
            deepgramLive = null;
          }
        }
      } else if (deepgramLive && Buffer.isBuffer(message)) {
        // Raw audio chunk forwarded to Deepgram
        deepgramLive.send(message);
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'ERROR', message: err?.message || 'WebSocket error' }));
    }
  });

  ws.on('close', () => {
    if (deepgramLive) {
      deepgramLive.finish();
      deepgramLive = null;
    }
  });
});

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 SpeakUp Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}/ws`);
  console.log(`🤖 Gemini API Key: ${config.geminiApiKey ? 'Configured' : 'Missing (Demo Mode Active)'}`);
  console.log(`🎙️ Deepgram API Key: ${config.deepgramApiKey ? 'Configured' : 'Missing (Web Speech Fallback Active)'}`);
});
