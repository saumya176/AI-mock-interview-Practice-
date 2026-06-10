const test = require('node:test')
const assert = require('node:assert/strict')

const path = require('path')

function loadGeminiServiceWithAxiosMock(postImpl) {
  const axios = require('axios')
  const originalPost = axios.post
  axios.post = postImpl

  delete require.cache[require.resolve('../services/geminiService')]
  const geminiService = require('../services/geminiService')

  return {
    geminiService,
    restore: () => {
      axios.post = originalPost
      delete require.cache[require.resolve('../services/geminiService')]
    }
  }
}

test('evaluateCandidateAnswer throws on Gemini 429 rate limit by default', async () => {
  process.env.GEMINI_API_KEY = 'test-key'
  delete process.env.GEMINI_FALLBACK_ENABLED

  const { geminiService, restore } = loadGeminiServiceWithAxiosMock(async () => {
    const error = new Error('Too Many Requests')
    error.response = { status: 429, data: { error: { message: 'rate limit exceeded' } } }
    throw error
  })

  try {
    await assert.rejects(
      () => geminiService.evaluateCandidateAnswer({
        question: 'What is synchronization?',
        answer: 'It protects shared resources using synchronized blocks.',
        role: 'Java Developer',
        difficulty: 'medium',
        expectedTopics: ['thread safety', 'synchronized keyword']
      }),
      /429|rate limit|Too Many Requests/i
    )
  } finally {
    restore()
  }
})

test('evaluateCandidateAnswer falls back only when GEMINI_FALLBACK_ENABLED=true', async () => {
  process.env.GEMINI_API_KEY = 'test-key'
  process.env.GEMINI_FALLBACK_ENABLED = 'true'

  const { geminiService, restore } = loadGeminiServiceWithAxiosMock(async () => {
    const error = new Error('Too Many Requests')
    error.response = { status: 429, data: { error: { message: 'rate limit exceeded' } } }
    throw error
  })

  try {
    const result = await geminiService.evaluateCandidateAnswer({
      question: 'What is synchronization?',
      answer: 'It protects shared resources using synchronized blocks.',
      role: 'Java Developer',
      difficulty: 'medium',
      expectedTopics: ['thread safety', 'synchronized keyword']
    })

    assert.equal(typeof result.score, 'number')
    assert.equal(typeof result.feedback, 'string')
    assert.equal(result.fallbackUsed, true)
  } finally {
    restore()
    delete process.env.GEMINI_FALLBACK_ENABLED
  }
})
