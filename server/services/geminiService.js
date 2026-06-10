const axios = require('axios')
const { buildLocalQuestionEvaluation, buildLocalInterviewReport } = require('../utils/answerQuality')

const API_KEY = process.env.GEMINI_API_KEY
const DEFAULT_MODEL = 'gemini-2.5-flash-lite'
const DEFAULT_FALLBACKS = 'gemini-3.1-flash-lite,gemini-2.5-flash'

function uniqueModels(models) {
  return [...new Set(models.map((m) => m.replace(/^models\//, '').trim()).filter(Boolean))]
}

function getModelCandidates() {
  const fallbacks = (process.env.GEMINI_MODEL_FALLBACKS || DEFAULT_FALLBACKS)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (process.env.GEMINI_MODEL) {
    return uniqueModels([process.env.GEMINI_MODEL, ...fallbacks])
  }

  const legacyUrl = process.env.GEMINI_API_URL || ''
  const legacyMatch = legacyUrl.match(/models\/([^:/]+)/)
  if (legacyMatch) {
    return uniqueModels([legacyMatch[1], ...fallbacks])
  }

  return uniqueModels([DEFAULT_MODEL, ...fallbacks])
}

const GENERIC_POINT_PATTERN = /explain the concept clearly|give an example|mention trade-offs|add more details|be more specific|show practical usage|discuss edge cases/i

function normalizeText(value){
  return (value || '').toString().trim()
}

function sanitizeQuestionScore(value){
  const score = Number(value)
  if(!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(10, score))
}

function sanitizeOverallScore(value){
  const score = Number(value)
  if(!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, score))
}

function sanitizeFeedback(value){
  const text = String(value || '').trim()
  return text || 'No detailed feedback was returned by Gemini.'
}

function sanitizeList(value){
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
    : []
}

function normalizeConceptList(items){
  const list = Array.isArray(items) ? items : []
  return Array.from(new Set(list
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => !GENERIC_POINT_PATTERN.test(item))
  ))
}

function toSentenceCase(value){
  const text = String(value || '').trim()
  if(!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function computeCoverage(answer, point){
  const normalizedAnswer = normalizeText(answer).toLowerCase()
  const normalizedPoint = normalizeText(point).toLowerCase()

  if(!normalizedAnswer || !normalizedPoint) return false
  if(normalizedAnswer.includes(normalizedPoint)) return true

  const answerWords = new Set(normalizedAnswer.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean))
  const pointWords = normalizedPoint.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const overlap = pointWords.filter((word) => answerWords.has(word))
  return overlap.length >= Math.max(1, Math.min(3, pointWords.length))
}

function buildFallbackEvaluation({ question, answer }){
  return buildLocalQuestionEvaluation({ question, answer })
}

function buildQuestionsPrompt({ role, difficulty, experience, type, skills, resumeProvided }){
  const skillList = skills && skills.length ? skills.join(', ') : 'core computer science concepts'
  const resumeText = resumeProvided ? 'Resume details are available.' : 'No resume details are provided.'

  return `You are an expert technical interviewer for BTech Computer Science Engineering students preparing for placements and internships.

Candidate Details:
Role: ${role}
Difficulty: ${difficulty}
Experience: ${experience}
Interview Type: ${type}
Skills: ${skillList}
Resume: ${resumeText}

Rules:
1. Questions must resemble real placement interviews
2. Include theory + practical questions
3. Include one scenario-based question
4. Include one project-based question
5. Include one debugging/problem-solving question
6. Avoid repeated questions
7. Questions should test actual understanding
8. Keep questions concise but meaningful

Ask questions that are placement-ready for the given role and are not repetitive when the same profile is submitted again.

Return ONLY valid JSON with a top-level object containing a "questions" array.
Each question must be an object with: question, category, difficulty, expectedTopics.
Use difficulty tags: easy, medium, hard.
Do not include any commentary, markdown, or extra text outside the JSON object.

Output example:
{
  "questions": [
    {
      "question": "...",
      "category": "...",
      "difficulty": "...",
      "expectedTopics": ["...", "..."]
    }
  ]
}`
}

function buildEvaluationPrompt({ question, answer, role, difficulty }){
  const answerText = normalizeText(answer) || '(no answer provided)'
  return `You are a strict technical interview evaluator.

Scoring rules:
- 0: empty, missing, or "no answer" responses
- 1-2: gibberish, nonsense, or completely wrong
- 3-4: vague or mostly incorrect with tiny relevance
- 5-6: partially correct but missing key concepts
- 7-8: good answer with minor gaps
- 9-10: excellent, complete, interview-ready answer

Feedback rules:
- Write 2-4 sentences unique to THIS question and THIS answer
- Mention specific concepts the candidate got right or missed
- Never reuse the same feedback wording across questions
- If the answer is empty, say no answer was provided and what should have been covered
- If the answer is nonsense, say it does not demonstrate understanding

Return ONLY valid JSON:
{
  "score": 0,
  "feedback": ""
}

Interview question: ${normalizeText(question)}
Candidate answer: ${answerText}
Role: ${role}
Difficulty: ${difficulty}`
}

function extractTextFromResponse(payload){
  if(!payload?.candidates?.length) return ''
  const parts = payload.candidates[0]?.content?.parts || []
  return parts.map((part) => part?.text || '').filter(Boolean).join('\n').trim()
}

function parseJsonFromResponse(payload){
  if(!payload) throw new Error('Empty Gemini response')

  const text = extractTextFromResponse(payload)
  if(!text) throw new Error('No text output found in Gemini response')

  const cleaned = String(text)
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  try{
    return JSON.parse(cleaned)
  }catch(e){
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    const firstBracket = cleaned.indexOf('[')
    const lastBracket = cleaned.lastIndexOf(']')
    const candidate = firstBrace !== -1 && lastBrace !== -1
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : firstBracket !== -1 && lastBracket !== -1
        ? cleaned.slice(firstBracket, lastBracket + 1)
        : cleaned

    return JSON.parse(candidate)
  }
}

function isQuotaOrModelBlocked(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.error?.message || error?.message || '')
  return status === 404
    || (status === 429 && /limit:\s*0|quota exceeded|free_tier/i.test(message))
    || /not found|NOT_FOUND|is not supported/i.test(message)
}

function isTransientGeminiError(error) {
  const status = error?.response?.status
  return status === 503
    || status === 500
    || /temporar|timeout|network/i.test(String(error?.message || ''))
}

async function callGemini(prompt, { maxOutputTokens = 4096 } = {}) {
  if(!API_KEY) throw new Error('No GEMINI_API_KEY')

  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens
    }
  }

  const models = getModelCandidates()
  let lastError = null

  for (const model of models) {
    const modelId = model.replace(/^models\//, '')
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${API_KEY}`

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        })
        res.data._geminiModel = modelId
        return res.data
      } catch (error) {
        lastError = error
        const status = error?.response?.status || 'unknown'
        const message = String(error?.response?.data?.error?.message || error?.message || '')

        console.error('[Gemini] Model request failed', {
          model: modelId,
          attempt: attempt + 1,
          status,
          message: message.slice(0, 180)
        })

        if (isQuotaOrModelBlocked(error)) {
          break
        }

        if (isTransientGeminiError(error) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }

        if (status === 429 && attempt < 2) {
          const retryDelay = Number(error?.response?.data?.error?.details?.find?.((d) => d['@type']?.includes('RetryInfo'))?.retryDelay?.replace?.('s', '')) || (attempt + 1) * 2
          await new Promise((resolve) => setTimeout(resolve, Math.min(15000, retryDelay * 1000)))
          continue
        }

        break
      }
    }
  }

  throw lastError || new Error('All Gemini models failed')
}

async function sendPrompt(prompt, fallbackBuilder, options = {}){
  const fallbackEnabled = String(process.env.GEMINI_FALLBACK_ENABLED || 'true').toLowerCase() === 'true'
  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) console.log('[Gemini] Models:', getModelCandidates().join(', '))

  try {
    const response = await callGemini(prompt, options)
    if (isDev) console.log('[Gemini] Model used:', response._geminiModel)
    const parsed = parseJsonFromResponse(response)
    return {
      ...parsed,
      geminiModel: response._geminiModel,
      fallbackUsed: false
    }
  } catch (error) {
    console.error('[Gemini] All models failed:', error?.response?.data?.error?.message || error?.message)

    if (fallbackEnabled && typeof fallbackBuilder === 'function') {
      console.warn('[Gemini] Using local fallback evaluation')
      return { ...(fallbackBuilder()), fallbackUsed: true }
    }

    throw error
  }
}

async function generateInterviewQuestions(params){
  const prompt = buildQuestionsPrompt(params)
  return await sendPrompt(prompt)
}

function normalizeQuestionEvaluationResult(result){
  const score = sanitizeQuestionScore(result?.score)
  const feedback = sanitizeFeedback(result?.feedback)
  return {
    score,
    feedback,
    fallbackUsed: Boolean(result?.fallbackUsed)
  }
}

function normalizeInterviewResult(result, fallbackQuestions = []){
  const overallScore = sanitizeOverallScore(result?.overallScore)
  const strengths = sanitizeList(result?.strengths)
  const improvements = sanitizeList(result?.improvements)
  const questions = Array.isArray(result?.questions)
    ? result.questions.map((item, index) => ({
        questionId: String(item?.questionId || fallbackQuestions[index]?.questionId || fallbackQuestions[index]?.id || ''),
        score: sanitizeQuestionScore(item?.score),
        feedback: sanitizeFeedback(item?.feedback)
      }))
    : fallbackQuestions.map((item) => ({
        questionId: String(item?.questionId || item?.id || ''),
        score: 0,
        feedback: 'No feedback was returned for this question.'
      }))

  return {
    overallScore,
    strengths,
    improvements,
    questions,
    fallbackUsed: Boolean(result?.fallbackUsed),
    geminiModel: result?.geminiModel || null
  }
}

function truncateAnswer(text, maxLength = 1500) {
  const normalized = normalizeText(text)
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

function buildInterviewReportPrompt({ role, questions }){
  const questionsText = questions.map((q, index) => {
    return `Question ${index + 1}:\nquestionId: ${q.questionId || q.id || ''}\nquestion: ${normalizeText(q.question)}\nanswer: ${truncateAnswer(q.answer)}`
  }).join('\n\n')

  return `You are a strict interviewer summary generator.

Scoring rules for each question (0-10):
- 0: no answer or empty response
- 1-2: gibberish, nonsense, or completely wrong
- 3-4: vague or mostly incorrect
- 5-6: partially correct, missing key details
- 7-8: good with minor gaps
- 9-10: excellent and complete

Overall score (0-100): average of question scores x 10, rounded.

Rules:
1. Evaluate EACH question independently with unique feedback — never repeat the same sentence.
2. Reference what the candidate actually wrote and what was missing.
3. Return 2-5 strengths and 2-5 improvements based on actual performance.
4. Return ONLY valid JSON in this exact shape:
{
  "overallScore": 0,
  "strengths": ["..."],
  "improvements": ["..."],
  "questions": [
    {
      "questionId": "",
      "score": 0,
      "feedback": ""
    }
  ]
}

Role: ${role}

Interview data:
${questionsText}`
}

async function evaluateInterview(params){
  const prompt = buildInterviewReportPrompt(params)
  const result = await sendPrompt(
    prompt,
    () => buildLocalInterviewReport(params),
    { maxOutputTokens: 8192 }
  )
  return normalizeInterviewResult(result, params.questions || [])
}

async function evaluateCandidateAnswer(params){
  const prompt = buildEvaluationPrompt(params)
  const result = await sendPrompt(prompt, () => buildFallbackEvaluation(params))
  return normalizeQuestionEvaluationResult(result)
}

module.exports = { generateInterviewQuestions, evaluateCandidateAnswer, evaluateInterview }


