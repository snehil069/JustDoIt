import { Topic, Category, Difficulty, PromptFormat } from '../../../../shared/types/index.js';

export const CURATED_TOPICS: Topic[] = [
  // --- EVERYDAY LIFE ---
  {
    id: 'el-001',
    title: 'Discipline vs Motivation',
    category: 'everyday-life',
    difficulty: 'easy',
    format: 'random-word',
    question: 'Word: Discipline. Explain why discipline is more reliable than motivation in student life. Give one personal or observed example and explain what happens when discipline is absent.',
    taskExplanation: 'Contrast how fleeting motivation is with steady daily habits. Share a concrete example of a goal achieved through consistency.',
    suggestedDurationSec: 180,
    hints: ['Define motivation vs discipline', 'Give a real student routine example', 'Discuss the long-term compounding effect'],
    keywords: ['habit', 'consistency', 'routine', 'procrastination', 'focus'],
    source: 'curated'
  },
  {
    id: 'el-002',
    title: 'The Digital Detox Dilemma',
    category: 'everyday-life',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Is complete digital disconnection realistic for modern college students, or is mindful consumption a better goal? Defend your point of view.',
    taskExplanation: 'Examine academic dependencies on digital tools against the mental health impact of non-stop screen time.',
    suggestedDurationSec: 180,
    hints: ['Consider mandatory WhatsApp/email notices', 'Address mental fatigue and attention span', 'Propose practical boundaries'],
    keywords: ['screen time', 'digital wellbeing', 'mindfulness', 'productivity'],
    source: 'curated'
  },
  {
    id: 'el-003',
    title: 'Sudden Power Outage During Submission',
    category: 'everyday-life',
    difficulty: 'easy',
    format: 'hypothetical-situation',
    question: 'It is 11:30 PM, your final semester report is due at midnight, and your area experiences an unexpected power and internet blackout. How would you solve this calmly and communicate with your professor?',
    taskExplanation: 'Walk through your immediate emergency action steps, communication etiquette, and contingency planning.',
    suggestedDurationSec: 180,
    hints: ['Mobile hotspot / phone battery usage', 'Drafting an immediate polite notice to the instructor', 'Time-stamped local proof of work'],
    keywords: ['crisis management', 'communication', 'resourcefulness', 'grace under pressure'],
    source: 'curated'
  },
  {
    id: 'el-004',
    title: 'Financial Independence in College',
    category: 'everyday-life',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Should every undergraduate be encouraged or required to earn a portion of their living expenses through part-time work or internships?',
    suggestedDurationSec: 180,
    hints: ['Value of money and self-reliance', 'Risk of academic distraction', 'Socio-economic differences'],
    keywords: ['part-time job', 'financial literacy', 'budgeting', 'work ethic'],
    source: 'curated'
  },
  {
    id: 'el-005',
    title: 'Patience in an Instant World',
    category: 'everyday-life',
    difficulty: 'hard',
    format: 'random-word',
    question: 'Word: Patience. In an era of 10-minute grocery delivery and 15-second video reels, argue why deep patience is becoming a rare competitive advantage.',
    taskExplanation: 'Discuss how long-cycle achievements like skill mastery, research, and deep relationships demand patience.',
    suggestedDurationSec: 240,
    hints: ['Instant gratification epidemic', 'Deep work vs shallow scrolling', 'Mastering complex technical skills'],
    keywords: ['instant gratification', 'deep work', 'longevity', 'craftsmanship'],
    source: 'curated'
  },

  // --- COLLEGE AND STUDENT LIFE ---
  {
    id: 'cl-001',
    title: 'Mandatory 75% Attendance Rule',
    category: 'college-life',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Should colleges enforce strict minimum attendance policies, or should evaluation be based entirely on performance and assignment outcomes?',
    taskExplanation: 'Examine both the administrative goal of discipline and the student perspective on self-directed learning.',
    suggestedDurationSec: 180,
    hints: ['Classroom value vs self-study online', 'Working students or competitive exam prep', 'Accountability vs autonomy'],
    keywords: ['attendance', 'curriculum', 'autonomy', 'lecture quality'],
    source: 'curated'
  },
  {
    id: 'cl-002',
    title: 'The Free-Rider Dilemma',
    category: 'college-life',
    difficulty: 'medium',
    format: 'hypothetical-situation',
    question: 'Your final capstone project is due in 3 days. Two teammates have contributed almost nothing despite repeated reminders. How do you handle the submission, credits, and communication with the faculty guide?',
    taskExplanation: 'Balance fairness and project success with team dynamics and professional conflict resolution.',
    suggestedDurationSec: 180,
    hints: ['Direct respectful confrontation first', 'Documenting individual contributions', 'Informing faculty professionally without whiny tone'],
    keywords: ['teamwork', 'accountability', 'conflict resolution', 'ethics'],
    source: 'curated'
  },
  {
    id: 'cl-003',
    title: 'Ambition vs Burnout',
    category: 'college-life',
    difficulty: 'hard',
    format: 'random-word',
    question: 'Word: Ambition. Discuss how hyper-competitive college environments often turn healthy ambition into anxiety and toxic hustle. Where is the line?',
    suggestedDurationSec: 240,
    hints: ['Peer pressure and LinkedIn culture', 'Intrinsic vs extrinsic validation', 'Sustainable pacing'],
    keywords: ['burnout', 'hustle culture', 'mental health', 'peer pressure'],
    source: 'curated'
  },
  {
    id: 'cl-004',
    title: 'Extracurriculars vs Academic GPA',
    category: 'college-life',
    difficulty: 'easy',
    format: 'open-question',
    question: 'If a student has limited time, is it better to focus on achieving a 9+ GPA or a balanced profile with clubs, events, and leadership roles?',
    suggestedDurationSec: 180,
    hints: ['First job filtering thresholds', 'Holistic personality development', 'Diminishing returns of pure marks'],
    keywords: ['GPA', 'clubs', 'leadership', 'holistic development'],
    source: 'curated'
  },

  // --- TECHNOLOGY & ENGINEERING ---
  {
    id: 'te-001',
    title: 'AI in Academic Homework',
    category: 'tech-engineering',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Is the widespread use of generative AI by students degrading critical thinking, or is it simply the modern equivalent of the scientific calculator?',
    taskExplanation: 'Compare cognitive offloading with enhanced productivity. Give specific examples of good vs detrimental AI usage.',
    suggestedDurationSec: 180,
    hints: ['Difference between drafting ideas and cognitive bypass', 'Future workplace expectations', 'Assessment evolution'],
    keywords: ['generative AI', 'critical thinking', 'calculator analogy', 'learning'],
    source: 'curated'
  },
  {
    id: 'te-002',
    title: 'Electric Vehicles Transition in Developing Countries',
    category: 'tech-engineering',
    difficulty: 'hard',
    format: 'open-question',
    question: 'What are the main engineering and infrastructure bottlenecks preventing 100% EV adoption in developing economies like India, and how can engineers address them?',
    taskExplanation: 'Analyze grid capacity, battery chemistry in high temperatures, charging station density, and supply chain logistics.',
    suggestedDurationSec: 240,
    hints: ['Grid stability and renewable energy mix', 'Battery degradation in 45°C weather', 'Upfront cost vs total lifecycle cost'],
    keywords: ['electric vehicles', 'charging infrastructure', 'lithium-ion', 'power grid'],
    source: 'curated'
  },
  {
    id: 'te-003',
    title: 'Explaining a Tech Glitch to a Distressed Client',
    category: 'tech-engineering',
    difficulty: 'medium',
    format: 'hypothetical-situation',
    question: 'Your software deployment caused a retail client’s payment gateway to fail during a weekend sale for 45 minutes. Speak directly to the business owner to explain what happened, apologize, and outline preventive measures.',
    suggestedDurationSec: 180,
    hints: ['Do not drown them in arcane jargon', 'Acknowledge the financial and customer impact sincerely', 'Provide an SLA and post-mortem plan'],
    keywords: ['incident management', 'client communication', 'accountability', 'downtime'],
    source: 'curated'
  },

  // --- COMPUTER SCIENCE ---
  {
    id: 'cs-001',
    title: 'Explain Blockchain to a 10-Year-Old',
    category: 'computer-science',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Explain what a blockchain is and why people use it, speaking as if your audience is a 10-year-old child. Avoid jargon like "cryptographic hash" or "distributed consensus". Use an intuitive analogy.',
    taskExplanation: 'Test your ability to clarify complex distributed systems concepts using everyday metaphors like shared notebooks.',
    suggestedDurationSec: 180,
    hints: ['Shared classroom diary analogy', 'Why no single person can cheat or tear a page', 'How everyone checks each other’s copy'],
    keywords: ['blockchain', 'ledger', 'analogy', 'simplicity'],
    source: 'curated',
    modeContext: {
      targetAudience: '10-year-old child'
    }
  },
  {
    id: 'cs-002',
    title: 'Open Source vs Proprietary Software',
    category: 'computer-science',
    difficulty: 'hard',
    format: 'open-question',
    question: 'Analyze whether open-source software is fundamentally more secure than proprietary commercial software. Present concrete arguments from both viewpoints.',
    suggestedDurationSec: 240,
    hints: ['"Given enough eyeballs, all bugs are shallow"', 'Heartbleed and XZ Utils backdoor incidents', 'Economic incentives for patch maintenance'],
    keywords: ['open source', 'cybersecurity', 'proprietary', 'code review'],
    source: 'curated'
  },
  {
    id: 'cs-003',
    title: 'Algorithm Optimization Trade-Offs',
    category: 'computer-science',
    difficulty: 'hard',
    format: 'random-word',
    question: 'Word: Trade-off. Explain the fundamental trade-off between Time Complexity and Space Complexity in software engineering, using one classic example like caching or sorting.',
    suggestedDurationSec: 180,
    hints: ['Memoization / dynamic programming vs recursion', 'Hash tables vs linear lookups', 'Embedded vs cloud systems'],
    keywords: ['time complexity', 'space complexity', 'trade-offs', 'caching'],
    source: 'curated'
  },

  // --- GENERAL AWARENESS & SOCIETY ---
  {
    id: 'ga-001',
    title: 'Deepfakes and Public Trust',
    category: 'general-awareness',
    difficulty: 'hard',
    format: 'open-question',
    question: 'How do hyper-realistic AI deepfakes threaten democracy, the legal system, and journalism, and what is the balance between regulation and freedom of expression?',
    suggestedDurationSec: 240,
    hints: ['Electoral misinformation', 'Chain of custody for digital evidence', 'Algorithmic watermarking vs censorship'],
    keywords: ['deepfakes', 'disinformation', 'media literacy', 'democracy'],
    source: 'curated'
  },
  {
    id: 'sa-001',
    title: 'Urban Traffic and Public Transit',
    category: 'society-affairs',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Why do expanding road widths often worsen city traffic instead of curing it (induced demand), and what sustainable urban transit models should emerging cities adopt?',
    suggestedDurationSec: 180,
    hints: ['Concept of induced demand', 'Metro, bus-rapid-transit (BRT), and pedestrian infrastructure', 'Last-mile connectivity'],
    keywords: ['urban planning', 'induced demand', 'public transit', 'congestion'],
    source: 'curated'
  },

  // --- COMMUNICATION & PERSONALITY ---
  {
    id: 'cp-001',
    title: 'Handling Constructive Criticism',
    category: 'communication-personality',
    difficulty: 'easy',
    format: 'random-word',
    question: 'Word: Feedback. Why do most people instinctively get defensive when receiving critical feedback, and how can a professional train themselves to welcome it productively?',
    suggestedDurationSec: 180,
    hints: ['Ego separation from work output', 'Asking clarifying questions instead of defending', 'Action plans from reviews'],
    keywords: ['constructive feedback', 'emotional intelligence', 'defensiveness', 'growth mindset'],
    source: 'curated'
  },
  {
    id: 'cp-002',
    title: 'Disagreeing Respectfully in Public',
    category: 'communication-personality',
    difficulty: 'medium',
    format: 'hypothetical-situation',
    question: 'During a live team presentation, your colleague states a key metric that is factually wrong by 50%. How do you correct or address the situation without humiliating your colleague or alarming the audience?',
    suggestedDurationSec: 180,
    hints: ['Diplomatic bridging phrases', 'Taking joint responsibility for recent updates', 'Timing: when to intervene live vs after'],
    keywords: ['tact', 'diplomacy', 'collaboration', 'public speaking'],
    source: 'curated'
  },

  // --- CAREER & PROFESSIONAL SKILLS ---
  {
    id: 'cr-001',
    title: 'Specialist vs Generalist in Modern Careers',
    category: 'career-professional',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Is it better in the current tech and business job market to be a deep specialist (T-shaped depth) or a versatile generalist capable of pivoting rapidly?',
    suggestedDurationSec: 180,
    hints: ['Impact of rapid automation on narrow skills', 'Value of cross-domain synthesis', 'The T-shaped professional model'],
    keywords: ['specialization', 'generalist', 'career resilience', 'T-shaped'],
    source: 'curated'
  },
  {
    id: 'cr-002',
    title: 'Interview: "Tell Me About a Time You Failed"',
    category: 'career-professional',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Answer the classic behavioural interview question: "Tell me about a time you experienced a major failure or setback." Use the STAR framework (Situation, Task, Action, Result) and demonstrate genuine reflection.',
    taskExplanation: 'Deliver a structured 2-3 minute answer showcasing accountability rather than blaming circumstances or disguising a strength as a weakness.',
    suggestedDurationSec: 180,
    hints: ['Choose a real failure with real stakes', 'Spend 60% of time on Action and Learnings', 'Quantify or clearly describe the turnaround result'],
    keywords: ['STAR method', 'behavioral interview', 'resilience', 'humility'],
    source: 'curated',
    modeContext: {
      interviewType: 'behavioral-star'
    }
  },

  // --- CREATIVE THINKING ---
  {
    id: 'ct-001',
    title: 'Reinventing the College Library',
    category: 'creative-thinking',
    difficulty: 'medium',
    format: 'hypothetical-situation',
    question: 'You are appointed student advisor to the university chancellor. All physical textbooks are now digitized. Pitch a bold, creative vision for how the 3-floor physical library building should be transformed for 2030.',
    suggestedDurationSec: 180,
    hints: ['Collaborative maker spaces / studios', 'Silent reflection pods vs discussion hubs', 'Community showcase zones'],
    keywords: ['innovation', 'spatial design', 'community', 'pitching'],
    source: 'curated'
  },

  // --- CRITICAL THINKING & DEBATE ---
  {
    id: 'dt-001',
    title: 'Degree vs Practical Skills in Hiring',
    category: 'critical-thinking',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Motion: "College degrees should be replaced by demonstrated proof-of-work and skill assessments as the primary criteria for professional jobs."',
    taskExplanation: 'Deliver a well-structured argument either supporting or opposing this motion, addressing counterarguments explicitly.',
    suggestedDurationSec: 240,
    hints: ['Screening efficiency of degrees at scale', 'Meritocracy vs social mobility', 'Professional certifications and portfolio assessments'],
    keywords: ['meritocracy', 'higher education', 'recruitment', 'proof of work'],
    source: 'curated',
    modeContext: {
      debateMotion: 'College degrees should be replaced by demonstrated proof-of-work and skill assessments as primary hiring criteria.',
      debatePosition: 'for',
      debateRounds: 3
    }
  },
  {
    id: 'dt-002',
    title: 'Should Social Media Algorithms Be Regulated by Law?',
    category: 'critical-thinking',
    difficulty: 'hard',
    format: 'open-question',
    question: 'Motion: "Government regulators should have statutory authority to inspect, audit, and mandate algorithmic transparency for engagement-maximizing social feeds."',
    suggestedDurationSec: 240,
    hints: ['Public health and mental well-being externalities', 'Risk of state censorship and proprietary trade secrets', 'Algorithmic amplification of rage'],
    keywords: ['algorithmic transparency', 'regulation', 'antitrust', 'free speech'],
    source: 'curated',
    modeContext: {
      debateMotion: 'Governments should mandate algorithmic audits and transparency for engagement-driven social networks.',
      debatePosition: 'for',
      debateRounds: 3
    }
  }
];
