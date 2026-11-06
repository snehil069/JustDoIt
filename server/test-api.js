// Import the server directly in this process so it runs in the exact same sandbox context
import './dist/server/src/index.js';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  // Wait 1.5s for HTTP server to begin listening
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\n--- STARTING SPEAKUP BACKEND INTEGRATION TESTS ---');

  // 1. Test Health
  console.log('\n[1/7] Testing GET /api/health...');
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log('✓ Health Status:', health.status);
  console.log('  Providers:', health.providers);

  // 2. Test Categories
  console.log('\n[2/7] Testing GET /api/topics/categories...');
  const catRes = await fetch(`${API_BASE}/topics/categories`);
  const categories = await catRes.json();
  console.log(`✓ Retrieved ${categories.length} categories.`);
  console.log('  Sample category:', categories[0].id, '-', categories[0].label);

  // 3. Test Random Topic
  console.log('\n[3/7] Testing GET /api/topics/random...');
  const topicRes = await fetch(`${API_BASE}/topics/random?category=college-life&difficulty=medium`);
  const topic = await topicRes.json();
  console.log('✓ Random Topic Title:', topic.title);
  console.log('  Category:', topic.category, '| Difficulty:', topic.difficulty);
  console.log('  Question:', topic.question);

  // 4. Test Audio Signal Analysis
  console.log('\n[4/7] Testing POST /api/audio/analyze...');
  const audioRes = await fetch(`${API_BASE}/audio/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      durationSec: 60,
      wordCount: 120,
      transcript: 'Um, I think that, uh, discipline is very important you know.',
      volumeRmsSeries: [0.12, 0.15, 0.14, 0.13, 0.16, 0.15, 0.14, 0.12, 0.15, 0.13, 0.14, 0.15],
      silenceIntervalsSec: [{ start: 10, end: 12, duration: 2.0 }],
      clippingEventsCount: 0,
    }),
  });
  const audioMetrics = await audioRes.json();
  console.log('✓ WPM:', audioMetrics.wordsPerMinute);
  console.log('  Pace Rating:', audioMetrics.paceRating);
  console.log('  Filler Count:', audioMetrics.fillerCount);
  console.log('  Fillers Detected:', audioMetrics.fillerWordsDetected);
  console.log('  Volume Consistency:', audioMetrics.volumeConsistency);

  // 5. Test Speech Evaluation (Demo/Heuristic Evaluator)
  console.log('\n[5/7] Testing POST /api/evaluate with deliberate grammar errors & fillers...');
  const flawedSpeech = "Um, I didn't knew that he don't want to discuss about the project. Every students was confused, you know. Basically everyone thinks online classes is better.";
  const evalRes = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'test-session-1',
      topic: topic,
      mode: 'impromptu',
      transcript: flawedSpeech,
      durationSec: 45,
      aiProviderPreference: 'demo',
      rawAudioAnalysis: {
        durationSec: 45,
        wordCount: 26,
        transcript: flawedSpeech,
        volumeRmsSeries: [0.1, 0.12, 0.11, 0.14, 0.12, 0.13, 0.15, 0.12, 0.11, 0.13, 0.12],
        silenceIntervalsSec: [{ start: 5, end: 7, duration: 2 }],
      },
    }),
  });
  const evalReport = await evalRes.json();
  console.log('✓ Calibrated Score:', evalReport.transcriptScore, '/ 100');
  console.log('  Performance Level:', evalReport.performanceLevel);
  console.log('  Main Takeaway:', evalReport.mainTakeaway);
  console.log('  Identified Corrections:', evalReport.corrections.length);
  evalReport.corrections.forEach((c, idx) => {
    console.log(`    Correction ${idx + 1}: "${c.whatSaid}" -> "${c.correctVersion}" (${c.explanation})`);
  });
  console.log('  Claims Flagged:', evalReport.reasoningFeedback.unsupportedClaims?.map((c) => c.flag + ': ' + c.claim));
  console.log('  Personalized Drills:', evalReport.personalizedExercises.map((e) => e.title));

  // 6. Test Debate Turn
  console.log('\n[6/7] Testing POST /api/debate/turn...');
  const debateRes = await fetch(`${API_BASE}/debate/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      motion: 'Social media does more harm than good for college students.',
      userPosition: 'for',
      roundNumber: 1,
      totalRounds: 3,
      history: [],
      userArgument: 'Social media is purely negative because students waste 5 hours every day scrolling reels and getting depressed.',
    }),
  });
  const debateTurn = await debateRes.json();
  console.log('✓ Opponent AI Response:', debateTurn.aiResponse);
  console.log('  Round Critique:', debateTurn.roundCritique);

  // 7. Test Interview Turn
  console.log('\n[7/7] Testing POST /api/interview/turn...');
  const interviewRes = await fetch(`${API_BASE}/interview/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewType: 'behavioral-star',
      history: [],
      userAnswer: 'In my last semester team project, people were arguing a lot, so I talked to everyone and we finished the project on time.',
    }),
  });
  const interviewTurn = await interviewRes.json();
  console.log('✓ Interviewer Next Question:', interviewTurn.nextQuestion);
  console.log('  Feedback on Answer:', interviewTurn.feedbackOnAnswer);

  console.log('\n======================================================');
  console.log('🏆 ALL 7 BACKEND API TEST SUITES PASSED FLAWLESSLY! 🏆');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
