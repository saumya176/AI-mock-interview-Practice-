const stringSimilarity = require('string-similarity')

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function extractQuestionText(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item.question === 'string') return item.question
  return String(item).trim()
}

function removePreviouslySeenQuestions(questions = [], previousQuestions = [], threshold = 0.74) {
  const previousTexts = previousQuestions.map(extractQuestionText).filter(Boolean)
  return questions.filter((question) => {
    const text = extractQuestionText(question)
    if (!text) return false
    for (const existingText of previousTexts) {
      if (!existingText) continue
      const score = stringSimilarity.compareTwoStrings(text.toLowerCase(), existingText.toLowerCase())
      if (score >= threshold) {
        return false
      }
    }
    return true
  })
}

module.exports = {
  removePreviouslySeenQuestions
}
