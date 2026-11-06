import type { Topic, Category, Difficulty, PromptFormat } from '../types/index.ts';

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
    taskExplanation: 'Weigh practical life lessons, budgeting, and maturity against academic pressure and burnout risks.',
    suggestedDurationSec: 180,
    hints: ['Consider students from different socioeconomic backgrounds', 'Balance study hours vs work hours', 'Analyze long-term career readiness'],
    keywords: ['financial literacy', 'student jobs', 'work-life balance', 'maturity'],
    source: 'curated'
  },

  // --- COLLEGE LIFE ---
  {
    id: 'cl-001',
    title: 'The Free-Rider Dilemma',
    category: 'college-life',
    difficulty: 'medium',
    format: 'hypothetical-situation',
    question: 'You are leading a 4-person capstone project worth 40% of your grade. One teammate has skipped meetings, contributed zero lines of code, and now asks you to include their name before submission. What do you say and do?',
    taskExplanation: 'Demonstrate constructive assertiveness, fairness to contributing members, and professional conflict escalation.',
    suggestedDurationSec: 180,
    hints: ['Private transparent conversation first', 'Documenting tangible contributions', 'Approaching faculty with objective records'],
    keywords: ['teamwork', 'accountability', 'conflict resolution', 'leadership'],
    source: 'curated'
  },
  {
    id: 'cl-002',
    title: 'Marks vs Real Skills',
    category: 'college-life',
    difficulty: 'easy',
    format: 'open-question',
    question: 'Many college students obsess over CGPA while ignoring communication, building projects, and hands-on skills. How would you persuade a first-year student to balance both?',
    taskExplanation: 'Present a nuanced perspective on why GPA gets you the initial screening, but skills and clear articulation close the deal.',
    suggestedDurationSec: 180,
    hints: ['Define the threshold role of GPA in resume shortlisting', 'Illustrate interview failure despite 9+ GPA', 'Propose a 70/30 time split rule'],
    keywords: ['CGPA', 'employability', 'communication', 'practical skills'],
    source: 'curated'
  },

  // --- TECH & ENGINEERING ---
  {
    id: 'te-001',
    title: 'AI Coding Assistants in Engineering Education',
    category: 'tech-engineering',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Are tools like GitHub Copilot and ChatGPT helping computer science students learn faster, or are they crippling foundational problem-solving skills? Take a clear stand.',
    taskExplanation: 'Analyze cognitive offloading, debugging fundamentals, syntactical fluency versus architectural understanding.',
    suggestedDurationSec: 180,
    hints: ['Compare learning syntax vs developing mental models', 'Discuss blind copy-pasting during exams or technical interviews', 'Suggest how professors should adapt testing'],
    keywords: ['generative AI', 'pedagogy', 'coding skills', 'engineering ethics'],
    source: 'curated'
  },
  {
    id: 'te-002',
    title: 'The Smart City Trade-off',
    category: 'tech-engineering',
    difficulty: 'hard',
    format: 'hypothetical-situation',
    question: 'Your city municipal corporation is proposing 10,000 facial-recognition cameras and automated traffic profiling to cut crime by 60%. As a civic technologist on the advisory panel, present your 3-minute recommendations on civil liberties, data retention, and safeguards.',
    taskExplanation: 'Balance public safety benefits with privacy hazards, false positive risks, and governance framework.',
    suggestedDurationSec: 240,
    hints: ['False positive rates on marginalized demographics', 'Strict retention periods & third-party auditing', 'Judicial warrants requirement'],
    keywords: ['surveillance', 'public safety', 'privacy', 'civic governance'],
    source: 'curated'
  },

  // --- COMPUTER SCIENCE ---
  {
    id: 'cs-001',
    title: 'Explain APIs to a 10-Year-Old',
    category: 'computer-science',
    difficulty: 'easy',
    format: 'random-word',
    question: 'Word: API. Explain what an Application Programming Interface is using a real-world analogy (like a restaurant waiter or a plug socket) without using jargon like JSON, endpoints, or protocols.',
    taskExplanation: 'Test clarity, analogy strength, and ability to break down technical abstractions for non-technical listeners.',
    suggestedDurationSec: 180,
    hints: ['Use the restaurant menu/waiter/kitchen analogy', 'Explain what happens when data is requested and returned', 'Mention why software systems need them to talk to each other'],
    keywords: ['analogy', 'simplification', 'APIs', 'technical communication'],
    source: 'curated'
  },
  {
    id: 'cs-002',
    title: 'Monolith vs Microservices',
    category: 'computer-science',
    difficulty: 'hard',
    format: 'open-question',
    question: 'Why do so many startups prematurely adopt microservices and regret it? Explain when a monolithic architecture is actually the superior engineering choice.',
    taskExplanation: 'Articulate trade-offs: operational overhead, network latency, distributed transactions vs rapid iteration and simple deployment.',
    suggestedDurationSec: 240,
    hints: ['Define distributed systems complexity', 'Explain organizational alignment (Conway Law)', 'Highlight debugging and observability challenges in early stages'],
    keywords: ['software architecture', 'microservices', 'monolith', 'scalability'],
    source: 'curated'
  },

  // --- GENERAL AWARENESS & GEOPOLITICS ---
  {
    id: 'ga-001',
    title: 'Deepfakes and Electoral Integrity',
    category: 'general-awareness',
    difficulty: 'medium',
    format: 'open-question',
    question: 'With generative video and audio clones now virtually indistinguishable from reality, how can democratic societies safeguard elections without implementing authoritarian censorship?',
    taskExplanation: 'Discuss cryptographic watermarking, public media literacy, rapid debunking mechanisms, and platform accountability.',
    suggestedDurationSec: 180,
    hints: ['C2PA digital provenance standards', 'The "liar dividend" (claiming real evidence is fake)', 'Role of independent journalistic verification'],
    keywords: ['deepfakes', 'misinformation', 'democracy', 'verification'],
    source: 'curated'
  },
  {
    id: 'ga-002',
    title: 'Space Exploration vs Earth Priorities',
    category: 'general-awareness',
    difficulty: 'medium',
    format: 'open-question',
    question: 'How do you justify spending billions of dollars on lunar and Martian missions when millions on Earth lack clean drinking water, healthcare, and education?',
    taskExplanation: 'Demonstrate technology transfer, resource discovery, global inspiration, and comparative budget realities.',
    suggestedDurationSec: 180,
    hints: ['Spin-off technologies (satellites for agriculture, solar panels, water purification)', 'Contextualize space budgets vs global military spending', 'Long-term species survival'],
    keywords: ['space exploration', 'budget priorities', 'scientific research', 'technology transfer'],
    source: 'curated'
  },

  // --- SOCIETY & CURRENT AFFAIRS ---
  {
    id: 'sa-001',
    title: 'The Loneliness Epidemic Among Hyper-Connected Youth',
    category: 'society-affairs',
    difficulty: 'medium',
    format: 'open-question',
    question: 'Young people today have thousands of followers, instant messaging, and non-stop group chats, yet public health organizations report unprecedented levels of loneliness. Diagnose the root causes and suggest solutions.',
    taskExplanation: 'Differentiate between low-friction virtual connectivity and vulnerable, reciprocal real-world relationships.',
    suggestedDurationSec: 180,
    hints: ['Curated reality on social feeds creating inadequacy', 'Decline of unstructured physical third places', 'Replacing deep calls with passive scrolling'],
    keywords: ['mental health', 'community', 'social media', 'loneliness'],
    source: 'curated'
  },

  // --- COMMUNICATION & PERSONALITY ---
  {
    id: 'cp-001',
    title: 'Handling a Public Dismissal of Your Idea',
    category: 'communication-personality',
    difficulty: 'easy',
    format: 'hypothetical-situation',
    question: 'During a team meeting, you propose an idea and a senior member says condescendingly, "That is completely impractical, you clearly have not thought this through." How do you respond in that exact room calmly and professionally?',
    taskExplanation: 'Demonstrate emotional regulation, de-escalation, disarming hostile tones, and pivoting to curious inquiry.',
    suggestedDurationSec: 180,
    hints: ['Pause before speaking to avoid defensive reflexes', 'Acknowledge their experience while asking for specific constraints', 'Invite collaborative refinement'],
    keywords: ['poise', 'handling criticism', 'professional composure', 'tact'],
    source: 'curated'
  },

  // --- CAREER & INTERVIEWS ---
  {
    id: 'cr-001',
    title: 'The STAR Method Failure Question',
    category: 'career-professional',
    difficulty: 'medium',
    format: 'open-question',
    question: '"Tell me about a time you committed a significant mistake or failed to meet an important deadline. What happened and what did you learn?" Structure your answer using Situation, Task, Action, and Result.',
    taskExplanation: 'Avoid fake flaws like "I work too hard". Show real ownership, root cause analysis, corrective systemic action, and humility.',
    suggestedDurationSec: 180,
    hints: ['Pick a genuine mistake with tangible impact', 'Spend 20% on the mistake, 80% on the recovery and new habit formed', 'End on positive outcome'],
    keywords: ['STAR method', 'interviewing', 'accountability', 'learning mindset'],
    source: 'curated'
  },
  {
    id: 'cr-002',
    title: 'Why Should We Hire You Over Candidates with Higher GPAs?',
    category: 'career-professional',
    difficulty: 'medium',
    format: 'open-question',
    question: 'In a final round job interview, the hiring manager asks: "Other candidates applied with a 9.5 CGPA and top credentials. Why should we select you?" Deliver a compelling 2-minute pitch.',
    taskExplanation: 'Pitch unique value: grit, domain passion, portfolio proof, teamwork, problem-solving curiosity, without disparaging high scorers.',
    suggestedDurationSec: 120,
    hints: ['Validate high academic achievement with respect', 'Highlight demonstrated project execution and self-directed curiosity', 'Connect your specific work style to company impact'],
    keywords: ['elevator pitch', 'confidence', 'differentiation', 'interview skills'],
    source: 'curated'
  },

  // --- CREATIVE THINKING ---
  {
    id: 'ct-001',
    title: 'Sell an Invisible Umbrella',
    category: 'creative-thinking',
    difficulty: 'easy',
    format: 'random-word',
    question: 'Word: Airflow. Pitch a revolutionary handheld gadget that protects the user from rain using an invisible high-velocity aerodynamic air shield instead of fabric and metal ribs. Convince an investor.',
    taskExplanation: 'Combine vivid descriptive imagery, ergonomic benefits, overcoming wind inversion, and a memorable consumer pitch.',
    suggestedDurationSec: 180,
    hints: ['Contrast with broken, wet umbrellas', 'Explain the aerodynamic curtain mechanism', 'Outline convenience: fits in a pocket, dries instantly'],
    keywords: ['pitching', 'creative sales', 'storytelling', 'innovation'],
    source: 'curated'
  },

  // --- CRITICAL THINKING & DEBATE ---
  {
    id: 'dt-001',
    title: 'Universal Basic Income',
    category: 'critical-thinking',
    difficulty: 'hard',
    format: 'open-question',
    question: 'Motion: "This House would replace all conditional welfare programs with an unconditional Universal Basic Income funded by corporate automation taxes." Present the strongest argument either FOR or AGAINST.',
    taskExplanation: 'Present clear principles: human dignity, poverty alleviation, economic stimulus VS work disincentives, inflation risk, fiscal sustainability.',
    suggestedDurationSec: 240,
    hints: ['Choose one side definitively', 'Address the strongest counterargument of the opposing side', 'Cite economic mechanisms and societal incentives'],
    keywords: ['UBI', 'welfare', 'automation', 'public economics', 'debate'],
    source: 'curated'
  }
];
