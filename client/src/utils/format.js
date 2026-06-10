export function formatDate(value){
  if(!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

export function formatCurrency(value){
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(value)
}

/** Per-question scores are on a 0–10 scale. */
export function normalizeQuestionScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  if (score <= 10) return Math.max(0, Math.min(10, score))
  return Math.max(0, Math.min(10, Math.round(score / 10)))
}

/** Overall interview scores are on a 0–100 scale. */
export function normalizeOverallScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  if (score <= 10) return Math.max(0, Math.min(100, Math.round(score * 10)))
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function formatQuestionScore(value) {
  return `${normalizeQuestionScore(value)}/10`
}

export function formatOverallScore(value, { asPercent = true } = {}) {
  const normalized = normalizeOverallScore(value)
  return asPercent ? `${normalized}%` : `${normalized}/100`
}
