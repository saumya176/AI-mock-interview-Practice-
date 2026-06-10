const { loadQuestionsForConfig, selectBalancedQuestions } = require('./repositoryLoader')
const { removePreviouslySeenQuestions } = require('./antiRepetitionService')

async function generate({ userId, config = {}, previousQuestions = [] }) {
  const allQuestions = await loadQuestionsForConfig(config)
  const filteredByDifficulty = (config.difficulty && config.difficulty !== 'Mixed')
    ? allQuestions.filter((q) => q.difficulty === String(config.difficulty).toLowerCase())
    : allQuestions

  const unseenQuestions = removePreviouslySeenQuestions(filteredByDifficulty, previousQuestions, 0.72)
  const selectionSource = unseenQuestions.length ? unseenQuestions : filteredByDifficulty
  const selected = selectBalancedQuestions(selectionSource, config)

  return {
    resumeAnalysis: config.resumeAnalysis || {},
    questions: selected,
    raw: { questions: selected }
  }
}

module.exports = { generate }
