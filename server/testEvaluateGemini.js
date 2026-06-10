require('dotenv').config()
const { evaluateCandidateAnswer } = require('./services/geminiService')

async function main() {
  try {
    const result = await evaluateCandidateAnswer({
      question: 'Explain the difference between process and thread.',
      answer: 'A process is an independent program instance with its own memory, while threads are lighter-weight units inside a process sharing memory. Threads enable concurrency in a process and are cheaper to create than processes.',
      role: 'Software Engineer',
      difficulty: 'medium',
      expectedTopics: ['process', 'thread', 'memory sharing', 'concurrency']
    })
    console.log('RESULT', JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('ERROR', err.message || err)
    if(err.response) console.error(JSON.stringify(err.response.data, null, 2))
    process.exit(1)
  }
}

main()
