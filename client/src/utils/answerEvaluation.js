function normalizeText(value) {
  return String(value || '').trim()
}

function isEmptyAnswer(text) {
  const normalized = normalizeText(text).toLowerCase()
  return !normalized || normalized === 'no answer provided' || normalized === 'n/a' || normalized === 'na'
}

function isGibberish(text) {
  const normalized = normalizeText(text)
  if (!normalized || normalized.length < 6) return false
  const words = normalized.split(/\s+/).filter((word) => word.length > 1)
  if (!words.length) return true
  const readableWords = words.filter((word) => /[aeiou]/i.test(word.replace(/[^a-z]/gi, '')))
  if (readableWords.length / words.length < 0.45) return true
  return (normalized.match(/[bcdfghjklmnpqrstvwxyz]{6,}/gi) || []).length >= 2
}

export function buildLocalQuestionEvaluation({ question, answer }) {
  const questionText = normalizeText(question) || 'this question'
  const answerText = normalizeText(answer)

  if (isEmptyAnswer(answerText)) {
    return {
      score: 0,
      feedback: `No answer was provided for "${questionText}". State the definition, the key formula or property, and one short example.`
    }
  }

  if (isGibberish(answerText)) {
    return {
      score: 1,
      feedback: `The response to "${questionText}" is not meaningful. Explain the concept with the core definition and one example.`
    }
  }

  const hasDefinition = /is a|means|defined as|refers to|measure of|used to|represents/i.test(answerText)
  const hasExample = /example|for instance|such as|e\.g\./i.test(answerText)
  let score = 3
  if (answerText.length > 50) score += 1
  if (answerText.length > 120) score += 1
  if (hasDefinition) score += 2
  if (hasExample) score += 2
  score = Math.min(10, Math.max(0, score))

  const feedback = score >= 8
    ? `Strong answer for "${questionText}". You explained the concept clearly.`
    : score >= 5
      ? `Partially correct on "${questionText}". Add the formal definition and one example.`
      : `Weak answer for "${questionText}". Cover the definition, why it matters, and one example.`

  return { score, feedback }
}

export function buildLocalInterviewReport(questions, answerMap) {
  const questionEntries = (questions || []).map((q) => {
    const answerText = normalizeText(answerMap?.[q.id]?.text)
    const evaluation = buildLocalQuestionEvaluation({
      question: q.question || q.text || '',
      answer: answerText
    })
    return {
      questionId: q.id,
      question: q.question || q.text || '',
      answer: answerText,
      score: evaluation.score,
      feedback: evaluation.feedback
    }
  })

  const average = questionEntries.length
    ? questionEntries.reduce((sum, item) => sum + item.score, 0) / questionEntries.length
    : 0

  const strengths = questionEntries.filter((item) => item.score >= 7).map((item) => `Clear explanation of "${item.question}"`)
  const improvements = questionEntries
    .filter((item) => item.score < 7)
    .map((item) => item.score === 0
      ? `Answer "${item.question}" — no response was given`
      : `Strengthen "${item.question}" with definition and example`)

  return {
    overallScore: Math.round(average * 10),
    strengths: strengths.length ? strengths : ['You attempted most of the interview questions.'],
    improvements: improvements.length ? improvements : ['Review missed concepts and practice structured answers.'],
    questions: questionEntries,
    fallbackUsed: true
  }
}
