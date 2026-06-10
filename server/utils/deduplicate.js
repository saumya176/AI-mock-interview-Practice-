const stringSimilarity = require('string-similarity')

function dedupeQuestions(existingQuestions = [], newQuestions = [], threshold = 0.75){
  // existingQuestions: array of strings or objects with question
  const existingTexts = existingQuestions.map(q => (typeof q === 'string') ? q : (q.question || ''))
  const filtered = []

  for(const nq of newQuestions){
    const text = (typeof nq === 'string') ? nq : (nq.question || '')
    let isDuplicate = false
    for(const ex of existingTexts){
      const sim = stringSimilarity.compareTwoStrings(text, ex)
      if(sim >= threshold){ isDuplicate = true; break }
    }
    // also check against already accepted new ones
    if(!isDuplicate){
      for(const acc of filtered){
        const accText = (typeof acc === 'string') ? acc : (acc.question || '')
        const sim2 = stringSimilarity.compareTwoStrings(text, accText)
        if(sim2 >= threshold){ isDuplicate = true; break }
      }
    }
    if(!isDuplicate) filtered.push(nq)
  }

  return filtered
}

module.exports = { dedupeQuestions }
