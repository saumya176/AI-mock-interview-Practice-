export const dashboardStats = {
  overview: [
    { title: 'Average Score', value: '88%', delta: '+6% from last week' },
    { title: 'Interviews Completed', value: '24', delta: '4 more this month' },
    { title: 'Technical Accuracy', value: '91%', delta: '+3 pts' },
    { title: 'Communication Rating', value: '89%', delta: '+5 pts' }
  ],
  weeklyProgress: [
    { day: 'Mon', score: 75 },
    { day: 'Tue', score: 82 },
    { day: 'Wed', score: 88 },
    { day: 'Thu', score: 85 },
    { day: 'Fri', score: 92 },
    { day: 'Sat', score: 94 },
    { day: 'Sun', score: 90 }
  ],
  skillBreakdown: [
    { subject: 'React', score: 94 },
    { subject: 'Node.js', score: 89 },
    { subject: 'System Design', score: 82 },
    { subject: 'Algorithms', score: 85 },
    { subject: 'Communication', score: 90 }
  ],
  recommendations: [
    'Focus on system design case studies for distributed systems',
    'Practice communication with timed answers',
    'Review MongoDB schema design and indexing patterns'
  ],
  history: [
    { id:'IV-8023', role:'Frontend Developer', score: 91, type:'Technical', date:'May 19, 2026', duration:'28m', weak:'System Design' },
    { id:'IV-7981', role:'Backend Developer', score: 84, type:'Mixed', date:'May 14, 2026', duration:'32m', weak:'Database' },
    { id:'IV-7925', role:'Full Stack Developer', score: 88, type:'Technical', date:'May 09, 2026', duration:'25m', weak:'OOP' }
  ]
}

export const voiceProfiles = [
  'Neutral AI',
  'Coach',
  'Executive',
  'Friendly Mentor'
]

export const roleOptions = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'MERN Stack Developer',
  'DevOps Engineer',
  'Data Analyst',
  'Software Engineer'
]

export const interviewTypes = [
  'Technical',
  'HR',
  'DSA',
  'System Design',
  'Behavioral',
  'Mixed'
]

export const companyOptions = [
  'Fortune AI Labs',
  'NeoTech Systems',
  'QuantumSoft',
  'ByteCraft',
  'NextBase'
]

export const skillOptions = [
  'React', 'Node.js', 'MongoDB', 'TypeScript', 'Algorithms', 'System Design', 'CI/CD', 'Cloud'
]
