import api from './api'

export function fetchInterviewHistory(params){
  return api.get('/interviews/history', { params })
}

export function fetchInterviewDetail(id){
  return api.get(`/interviews/${id}`)
}

export function saveInterview(payload){
  return api.post('/interviews', payload)
}

export function updateInterview(id, payload){
  return api.patch(`/interviews/${id}`, payload)
}

export function deleteInterview(id){
  return api.delete(`/interviews/${id}`)
}
