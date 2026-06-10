import React, { createContext, useContext, useEffect, useState } from 'react'

const defaultInterviewContext = {
  session: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  results: null,
  startSession: () => {},
  setQuestions: () => {},
  setCurrentIndex: () => {},
  saveAnswer: () => {},
  markForReview: () => {},
  setEvaluation: () => {},
  setResults: () => {},
  setInterviewId: () => {},
  completeAnswer: () => {},
  resetSession: () => {}
}

const InterviewContext = createContext(defaultInterviewContext)

const initialState = {
  session: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  results: null
}

export function InterviewProvider({ children }){
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('interviewSession')
    return stored ? JSON.parse(stored).session : null
  })
  const [questions, setQuestions] = useState(() => {
    const stored = localStorage.getItem('interviewSession')
    return stored ? JSON.parse(stored).questions : []
  })
  const [currentIndex, setCurrentIndex] = useState(() => {
    const stored = localStorage.getItem('interviewSession')
    return stored ? JSON.parse(stored).currentIndex : 0
  })
  const [answers, setAnswers] = useState(() => {
    const stored = localStorage.getItem('interviewSession')
    return stored ? JSON.parse(stored).answers : {}
  })
  const [results, setResults] = useState(() => {
    const stored = localStorage.getItem('interviewSession')
    return stored ? JSON.parse(stored).results : null
  })

  useEffect(() => {
    const hasStoredData = Boolean(session || questions.length || currentIndex || Object.keys(answers || {}).length || results)

    if (hasStoredData) {
      localStorage.setItem('interviewSession', JSON.stringify({ session, questions, currentIndex, answers, results }))
      return
    }

    localStorage.removeItem('interviewSession')
  }, [session, questions, currentIndex, answers, results])

  const startSession = (config, initialQuestions = [], interviewId = null) => {
    const preparedQuestions = initialQuestions.map((question, index) => ({
      ...question,
      id: question.id || `q-${index}-${Date.now()}`,
      text: question.text || question.question || question.prompt || question.title || '',
      question: question.question || question.text || question.prompt || question.title || ''
    }))
    setSession({ config, startedAt: Date.now(), interviewId })
    setQuestions(preparedQuestions)
    setCurrentIndex(0)
    setAnswers(preparedQuestions.reduce((acc, question) => ({
      ...acc,
      [question.id]: { text: '', review: false, evaluation: null }
    }), {}))
    setResults(null)
  }

  const saveAnswer = (questionId, text, timeTaken = 0) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text,
        timeTaken
      }
    }))
  }

  const markForReview = (questionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        review: !prev[questionId]?.review
      }
    }))
  }

  const setEvaluation = (questionId, evaluation) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        evaluation
      }
    }))
  }

  const completeAnswer = (questionId, text, timeTaken, evaluation) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text,
        timeTaken,
        evaluation
      }
    }))
  }

  const setInterviewId = (interviewId) => {
    setSession((prev) => (prev ? { ...prev, interviewId } : prev))
  }

  const resetSession = () => {
    setSession(null)
    setQuestions([])
    setCurrentIndex(0)
    setAnswers({})
    setResults(null)
    localStorage.removeItem('interviewSession')
  }

  return (
    <InterviewContext.Provider value={{
      session,
      questions,
      currentIndex,
      answers,
      results,
      startSession,
      setQuestions,
      setCurrentIndex,
      saveAnswer,
      markForReview,
      setEvaluation,
      setResults,
      setInterviewId,
      completeAnswer,
      resetSession
    }}>
      {children}
    </InterviewContext.Provider>
  )
}

export const useInterview = () => useContext(InterviewContext) || defaultInterviewContext
