function normalizeText(value) {
  return String(value || '').trim()
}

function isEmptyAnswer(text) {
  const normalized = normalizeText(text).toLowerCase()
  return !normalized
    || normalized === 'no answer provided'
    || normalized === 'n/a'
    || normalized === 'na'
    || normalized === 'none'
}

function isGibberish(text) {
  const normalized = normalizeText(text)
  if (!normalized || normalized.length < 6) return false

  const words = normalized.split(/\s+/).filter((word) => word.length > 1)
  if (!words.length) return true

  const readableWords = words.filter((word) => {
    const letters = word.replace(/[^a-z]/gi, '')
    if (letters.length < 3) return true
    return /[aeiou]/i.test(letters) && letters.length / word.length > 0.5
  })

  const readableRatio = readableWords.length / words.length
  if (readableRatio < 0.45) return true

  const consonantRuns = normalized.match(/[bcdfghjklmnpqrstvwxyz]{6,}/gi) || []
  if (consonantRuns.length >= 2) return true

  const uniqueCharRatio = new Set(normalized.toLowerCase().replace(/\s/g, '')).size / normalized.replace(/\s/g, '').length
  if (normalized.length > 20 && uniqueCharRatio > 0.75) return true

  return false
}

function buildLocalQuestionEvaluation({ question, answer }) {
  const questionText = normalizeText(question) || 'this question'
  const answerText = normalizeText(answer)

  if (isEmptyAnswer(answerText)) {
    return {
      score: 0,
      feedback: `No answer was provided for "${questionText}". State the definition, the key formula or property, and one short example.`,
      fallbackUsed: true
    }
  }

  if (isGibberish(answerText)) {
    return {
      score: 1,
      feedback: `The response to "${questionText}" is not meaningful. Explain the concept in plain language with the core definition and one example.`,
      fallbackUsed: true
    }
  }

  const hasDefinition = /is a|means|defined as|refers to|measure of|used to|represents/i.test(answerText)
  const hasExample = /example|for instance|such as|e\.g\.|like when/i.test(answerText)
  const hasStructure = /types?|steps?|because|therefore|formula|property|distribution|test/i.test(answerText)

  let score = 3
  if (answerText.length > 50) score += 1
  if (answerText.length > 120) score += 1
  if (hasDefinition) score += 2
  if (hasExample) score += 2
  if (hasStructure) score += 1
  score = Math.max(0, Math.min(10, score))

  let feedback
  if (score >= 8) {
    feedback = `Strong answer for "${questionText}". You explained the concept clearly${hasExample ? ' with a useful example' : ''}.`
  } else if (score >= 5) {
    feedback = `Partially correct on "${questionText}". Add the formal definition${hasExample ? '' : ', one example'}, and the most important property or use case.`
  } else {
    feedback = `Weak answer for "${questionText}". Cover the definition, why it matters, and one concrete example.`
  }

  return { score, feedback, fallbackUsed: true }
}

function buildLocalInterviewReport({ role, questions = [] }) {
  const questionResults = questions.map((item) => {
    const evaluation = buildLocalQuestionEvaluation({
      question: item.question,
      answer: item.answer
    })
    return {
      questionId: item.questionId || item.id || '',
      question: item.question || '',
      answer: item.answer || '',
      score: evaluation.score,
      feedback: evaluation.feedback
    }
  })

  const average = questionResults.length
    ? questionResults.reduce((sum, item) => sum + item.score, 0) / questionResults.length
    : 0
  const overallScore = Math.round(average * 10)

  const strengths = questionResults
    .filter((item) => item.score >= 7)
    .map((item) => `Clear explanation of "${item.question}"`)
  const improvements = questionResults
    .filter((item) => item.score < 7)
    .map((item) => item.score === 0
      ? `Answer "${item.question}" — no response was given`
      : `Strengthen "${item.question}" with definition and example`)

  return {
    overallScore,
    strengths: strengths.length ? strengths.slice(0, 5) : ['You attempted most of the interview questions.'],
    improvements: improvements.length ? improvements.slice(0, 5) : ['Review the missed concepts and practice structured answers.'],
    questions: questionResults,
    fallbackUsed: true
  }
}

module.exports = {
  isEmptyAnswer,
  isGibberish,
  buildLocalQuestionEvaluation,
  buildLocalInterviewReport
}
