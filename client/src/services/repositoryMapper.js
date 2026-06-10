/**
 * Repository mapping for local question repositories
 * Maps roles, interview types, and skills to JSON files
 */

export const ROLE_MAPPING = {
  'Frontend Developer': 'frontend',
  'Backend Developer': 'backend',
  'Full Stack Developer': ['frontend', 'backend'],
  'Java Developer': 'java',
  'DevOps Engineer': 'devops',
  'Data Analyst': 'data-analyst'
}

export const SKILL_MAPPING = {
  // Frontend
  'frontend': {
    'React': 'react.json',
    'JavaScript': 'javascript.json',
    'HTML': 'html.json',
    'CSS': 'css.json'
  },
  // Backend
  'backend': {
    'Node.js': 'nodejs.json',
    'Express': 'express.json',
    'MongoDB': 'mongodb.json',
    'Authentication': 'authentication.json',
    'REST API': 'rest-api.json'
  },
  // Full Stack
  'fullstack': {
    'API Integration': 'api-integration.json',
    'Frontend-Backend Flow': 'frontend-backend-flow.json'
  },
  // Java
  'java': {
    'Core Java': 'core-java.json',
    'OOPS': 'oops.json',
    'Collections': 'collections.json',
    'Multithreading': 'multithreading.json',
    'Spring Boot': 'springboot.json'
  },
  // DevOps
  'devops': {
    'Docker': 'docker.json',
    'Kubernetes': 'kubernetes.json',
    'CI/CD': 'cicd.json',
    'AWS': 'aws-basics.json'
  },
  // Data Analyst
  'data-analyst': {
    'SQL': 'sql.json',
    'Python': 'python.json',
    'Excel': 'excel.json',
    'Statistics': 'statistics.json',
    'Power BI': 'powerbi.json'
  },
  // DSA
  'dsa': {
    'Arrays': 'arrays.json',
    'Strings': 'strings.json',
    'Linked List': 'linkedlist.json',
    'Trees': 'trees.json',
    'Graphs': 'graphs.json',
    'Sorting': 'sorting.json',
    'Searching': 'searching.json'
  },
  // HR
  'hr': {
    'Behavioral': 'behavioral.json',
    'Project Discussion': 'project-discussion.json'
  }
}

export const ROLE_TO_SKILLS = {
  'Frontend Developer': ['React', 'JavaScript', 'HTML', 'CSS'],
  'Backend Developer': ['Node.js', 'Express', 'MongoDB', 'Authentication', 'REST API'],
  'Full Stack Developer': ['React', 'JavaScript', 'Node.js', 'MongoDB', 'API Integration'],
  'Java Developer': ['Core Java', 'OOPS', 'Collections', 'Multithreading', 'Spring Boot'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
  'Data Analyst': ['SQL', 'Python', 'Excel', 'Statistics', 'Power BI']
}

export const INTERVIEW_TYPE_MAPPING = {
  'Technical': 'technical',
  'HR': 'hr',
  'Mixed': ['technical', 'hr'],
  'DSA': 'dsa'
}

export const INTERVIEW_DIFFICULTY = {
  'Easy': 'easy',
  'Medium': 'medium',
  'Hard': 'hard'
}

export const QUESTIONS_PER_DIFFICULTY = {
  'easy': 5,
  'medium': 8,
  'hard': 5
}

/**
 * Get available skills for a selected role
 */
export const getSkillsForRole = (role) => {
  return ROLE_TO_SKILLS[role] || []
}

/**
 * Get repository files to fetch based on interview config
 */
export const getRepositoryFiles = (config) => {
  const { role, interviewType, selectedSkills } = config
  const files = []
  
  // Get role-based repositories
  const roleRepo = ROLE_MAPPING[role]
  const roleRepos = Array.isArray(roleRepo) ? roleRepo : [roleRepo]
  
  // Get skills mapping for this role
  const skillMapping = {}
  roleRepos.forEach(repo => {
    if (SKILL_MAPPING[repo]) {
      Object.assign(skillMapping, SKILL_MAPPING[repo])
    }
  })
  
  // Add selected skill files
  selectedSkills.forEach(skill => {
    if (skillMapping[skill]) {
      files.push(skillMapping[skill])
    }
  })
  
  // Add interview type specific files
  if (interviewType === 'HR' || interviewType === 'Mixed') {
    if (SKILL_MAPPING['hr']) {
      Object.values(SKILL_MAPPING['hr']).forEach(file => {
        if (!files.includes(file)) {
          files.push(file)
        }
      })
    }
  }
  
  if (interviewType === 'DSA') {
    Object.values(SKILL_MAPPING['dsa']).forEach(file => {
      if (!files.includes(file)) {
        files.push(file)
      }
    })
  }
  
  return [...new Set(files)]
}

/**
 * Get questions from loaded repositories
 */
export const filterQuestionsByConfig = (allQuestions, config) => {
  const { difficulty, interviewType, questionCount = 18 } = config
  
  let filtered = allQuestions
  
  // Filter by difficulty
  if (difficulty && difficulty !== 'Mixed') {
    filtered = filtered.filter(q => q.difficulty === difficulty.toLowerCase())
  }
  
  // Filter by type
  if (interviewType) {
    const typeMap = INTERVIEW_TYPE_MAPPING[interviewType]
    const types = Array.isArray(typeMap) ? typeMap : [typeMap]
    filtered = filtered.filter(q => types.includes(q.type))
  }
  
  // Shuffle and limit
  return filtered
    .sort(() => Math.random() - 0.5)
    .slice(0, questionCount)
}

/**
 * Generate interview configuration object
 */
export const generateInterviewConfig = (setup) => {
  const difficultyKey = INTERVIEW_DIFFICULTY[setup.difficulty] || setup.difficulty?.toLowerCase()
  const defaultQuestionCount = QUESTIONS_PER_DIFFICULTY[difficultyKey] || 10

  return {
    id: `interview_${Date.now()}`,
    role: setup.role,
    type: setup.interviewType,
    interviewType: setup.interviewType,
    difficulty: setup.difficulty,
    selectedSkills: setup.selectedSkills || [],
    questionCount: setup.questionCount || defaultQuestionCount,
    duration: setup.duration || 30,
    source: 'local-repository',
    createdAt: new Date().toISOString(),
    status: 'pending',
    repositoryFiles: getRepositoryFiles({
      role: setup.role,
      interviewType: setup.interviewType,
      selectedSkills: setup.selectedSkills || []
    })
  }
}

/**
 * Validate interview configuration
 */
export const validateInterviewConfig = (setup) => {
  const errors = []
  
  if (!setup.role) errors.push('Please select a role')
  if (!setup.interviewType) errors.push('Please select interview type')
  if (!setup.difficulty) errors.push('Please select difficulty level')
  if (!setup.selectedSkills || setup.selectedSkills.length === 0) {
    errors.push('Please select at least one skill')
  }
  if (setup.selectedSkills && setup.selectedSkills.length > 5) {
    errors.push('Please select maximum 5 skills')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get repository paths for loading
 */
export const getRepositoryPath = (filename, role) => {
  const candidateRepos = Object.keys(SKILL_MAPPING)

  for (const repo of candidateRepos) {
    const mapping = SKILL_MAPPING[repo]
    if (mapping) {
      const hasFile = Object.values(mapping).includes(filename)
      if (hasFile) {
        return `/question-repositories/${repo}/${filename}`
      }
    }
  }

  return null
}
