import { MultiStageAnalyzer } from '../shared/evaluation/multiStageAnalyzer.ts';

const testTopic = {
  id: 'te-001',
  title: 'AI Coding Assistants in Engineering Education',
  category: 'tech-engineering',
  difficulty: 'medium',
  format: 'open-question',
  question: 'Are tools like GitHub Copilot and ChatGPT helping computer science students learn faster, or are they crippling foundational problem-solving skills? Take a clear stand.',
  taskExplanation: 'Analyze cognitive offloading, debugging fundamentals, syntactical fluency versus architectural understanding.',
  suggestedDurationSec: 180,
  hints: ['Compare learning syntax vs mental models', 'Discuss exams or interviews', 'Suggest adaptations'],
  keywords: ['generative AI', 'pedagogy', 'coding skills', 'engineering ethics', 'problem-solving', 'debugging'],
  source: 'curated'
};

const TEST_CASES = [
  {
    name: '1. Excellent response with strong grammar, structure, and reasoning',
    transcript: 'To address the core question directly: AI coding assistants serve as cognitive accelerators rather than intellectual crutches, provided students understand foundational mental models. First, syntax memorization has historically consumed an inordinate amount of introductory coursework. When tools like Copilot handle repetitive boilerplate, students can spend more time on architectural design, distributed algorithms, and edge-case handling. However, the critical trade-off is during debugging and live coding interviews, where autocompletion cannot substitute for a deep understanding of data structures. Consequently, engineering curricula should adapt by grading students on architectural critique, code explanation, and automated testing rather than rudimentary syntax.',
    durationSec: 120,
    expectedMinScore: 78,
    expectedMaxScore: 95,
    expectedLevel: ['Strong', 'Exceptional'],
    maxGrammarErrors: 0
  },
  {
    name: '2. Average response with several grammatical mistakes',
    transcript: 'I think AI is good for students because he have many advantages. We didn\'t went to class yesterday but every students are using ChatGPT now. According to me it is a honest mistake if they copy code. The teacher don\'t understand that technology change quickly.',
    durationSec: 60,
    expectedMinScore: 35,
    expectedMaxScore: 60,
    expectedLevel: ['Needs Immediate Focus', 'Developing'],
    minGrammarErrors: 4 // "he have", "didn't went", "every students are", "according to me", "a honest", "teacher don't"
  },
  {
    name: '3. Weak response with poor reasoning and irrelevant points',
    transcript: 'Computers are very fast and I like my laptop. It is blue in color and I play video games on Saturday with my brother.',
    durationSec: 25,
    expectedMinScore: 15,
    expectedMaxScore: 38,
    expectedLevel: ['Needs Immediate Focus'],
    checkLowContent: true
  },
  {
    name: '4. Fluent response with unsupported generalisations',
    transcript: 'Everyone knows that AI will completely replace all human programmers within six months. All people think software engineering is completely dead. Obviously nobody cares about writing code manually anymore because machines do everything flawlessly.',
    durationSec: 60,
    expectedMinScore: 40,
    expectedMaxScore: 68,
    expectedLevel: ['Developing', 'Competent'],
    minUnsupportedClaims: 2
  },
  {
    name: '5. Long response with repeated words and ideas',
    transcript: 'AI is good because AI helps us code. When we code with AI it makes coding very good. So coding is good and AI is good for coding. I think coding without AI is not good because AI makes coding good and fast.',
    durationSec: 90,
    expectedMinScore: 35,
    expectedMaxScore: 60,
    expectedLevel: ['Developing']
  },
  {
    name: '6. Very short response that cannot receive a confident full evaluation',
    transcript: 'Yes, it helps students.',
    durationSec: 10,
    expectedMinScore: 15,
    expectedMaxScore: 32,
    expectedLevel: ['Needs Immediate Focus'],
    checkBriefWarning: true
  },
  {
    name: '7. Response containing many filler words and false starts',
    transcript: 'Um, like basically AI is, uh, like you know, kind of helpful, like basically when you want to code, um, like you know, you just ask it and uh, basically it gives you the answer.',
    durationSec: 45,
    expectedMinScore: 30,
    expectedMaxScore: 55,
    expectedLevel: ['Needs Immediate Focus', 'Developing'],
    minFillers: 5
  },
  {
    name: '8. Strong response with a reasonable alternative opinion',
    transcript: 'I strongly disagree with the notion that AI assistants are beneficial in university pedagogy. Foundational debugging is an emotional and cognitive crucible: when a novice spends four hours tracing a null pointer exception, they develop a mental model of memory and execution flow that no generated explanation can replicate. While industry engineers undeniably benefit from productivity gains, introducing autocompletion during early education creates an illusion of competence that collapses under real-world systems engineering.',
    durationSec: 110,
    expectedMinScore: 75,
    expectedMaxScore: 92,
    expectedLevel: ['Strong', 'Exceptional']
  },
  {
    name: '9. Response containing technical factual inaccuracies',
    transcript: 'ChatGPT runs directly inside the CPU of your phone without needing any internet connection, and it physically compiles Python into pure hardware transistors instantly.',
    durationSec: 40,
    expectedMinScore: 25,
    expectedMaxScore: 55,
    expectedLevel: ['Needs Immediate Focus', 'Developing']
  },
  {
    name: '10. Response with correct grammar but poor topic coverage',
    transcript: 'The history of the steam engine in eighteenth-century Britain revolutionized textile manufacturing and transformed agrarian economies into urbanized industrial societies through coal-fired power.',
    durationSec: 45,
    expectedMinScore: 25,
    expectedMaxScore: 55,
    expectedLevel: ['Needs Immediate Focus', 'Developing'],
    checkOffTopic: true
  }
];

console.log('========================================================================');
console.log('       SPEAKUP SPEECH ANALYSIS ENGINE — SERIOUS TEST SUITE');
console.log('========================================================================\n');

let passedCount = 0;

for (let i = 0; i < TEST_CASES.length; i++) {
  const tc = TEST_CASES[i];
  console.log(`[TEST ${i + 1}/10] ${tc.name}`);

  const report = MultiStageAnalyzer.evaluateComplete({
    sessionId: `test-session-${i + 1}`,
    topic: testTopic,
    mode: 'impromptu',
    transcript: tc.transcript,
    durationSec: tc.durationSec,
  });

  const total = report.transcriptScore;
  const level = report.performanceLevel;
  const correctionsCount = report.corrections.length;
  const missedCount = (report.missedPoints || []).length;
  const unsupportedCount = (report.reasoningFeedback.unsupportedClaims || []).length;

  console.log(`  → Score: ${total}/100 | Performance Level: [${level}]`);
  console.log(`  → Grammar corrections flagged: ${correctionsCount}`);
  console.log(`  → Missed dimensions identified: ${missedCount}`);
  console.log(`  → Unsupported claims flagged: ${unsupportedCount}`);

  let testPassed = true;

  // Check 1: Score range
  if (total < tc.expectedMinScore || total > tc.expectedMaxScore) {
    console.error(`  ❌ FAILED: Score ${total} outside expected range [${tc.expectedMinScore}, ${tc.expectedMaxScore}]`);
    testPassed = false;
  }

  // Check 2: Level match
  if (tc.expectedLevel && !tc.expectedLevel.includes(level)) {
    console.error(`  ❌ FAILED: Performance level "${level}" not in expected [${tc.expectedLevel.join(', ')}]`);
    testPassed = false;
  }

  // Check 3: Grammar error detection
  if (tc.minGrammarErrors && correctionsCount < tc.minGrammarErrors) {
    console.error(`  ❌ FAILED: Expected at least ${tc.minGrammarErrors} grammar errors, but found ${correctionsCount}`);
    testPassed = false;
  }

  // Check 4: Mathematical consistency (sum of dimensions strictly equals total)
  const sumDims =
    report.dimensionScores.contentRelevance.score +
    report.dimensionScores.reasoningEvidence.score +
    report.dimensionScores.organizationStructure.score +
    report.dimensionScores.clarityConstruction.score +
    report.dimensionScores.grammar.score +
    report.dimensionScores.vocabularyChoice.score +
    report.dimensionScores.fluencyFillers.score;

  if (sumDims !== total) {
    console.error(`  ❌ FAILED: Mathematical inconsistency! Sum of dimensions (${sumDims}) != totalScore (${total})`);
    testPassed = false;
  }

  // Check 5: Mandatory report sections present
  if (
    !report.mainTakeaway ||
    !report.dimensionScores ||
    !report.missedPoints ||
    !report.coachSummary ||
    !report.improvementPlan ||
    !report.betterWaysToSayIt
  ) {
    console.error(`  ❌ FAILED: Missing mandatory report sections!`);
    testPassed = false;
  }

  if (testPassed) {
    console.log(`  ✅ PASSED\n`);
    passedCount++;
  } else {
    console.log(`\n`);
  }
}

console.log('========================================================================');
console.log(`RESULTS: ${passedCount} / ${TEST_CASES.length} TEST CASES PASSED`);
console.log('========================================================================');

if (passedCount === TEST_CASES.length) {
  process.exit(0);
} else {
  process.exit(1);
}
