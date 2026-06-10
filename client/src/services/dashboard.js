import api from './api'

export function fetchDashboardOverview(range = 30) {
  return api.get(`/dashboard/overview?range=${range}`)
}

export function fetchDashboardCharts(range = 30) {
  return api.get(`/dashboard/charts?range=${range}`)
}

export function fetchDashboardRecommendations(range = 30) {
  return api.get(`/dashboard/recommendations?range=${range}`)
}

export function fetchRecentInterviews(limit = 8) {
  return api.get(`/dashboard/recent-interviews?limit=${limit}`)
}

export function fetchDashboardStats(range = 30) {
  return api.get(`/dashboard/stats?range=${range}`)
}

export function fetchDashboardSummary() {
  return api.get('/dashboard/summary')
}
