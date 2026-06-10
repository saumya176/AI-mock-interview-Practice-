/**
 * Hook for managing interview setup state and logic
 */

import { useState, useCallback } from 'react'
import {
  getSkillsForRole,
  getRepositoryFiles as mapRepositoryFiles,
  generateInterviewConfig,
  validateInterviewConfig
} from '../services/repositoryMapper'

const MAX_SKILLS = 5

export const useInterviewSetup = () => {
  const [step, setStep] = useState(1)
  const [setup, setSetup] = useState({
    role: '',
    interviewType: '',
    difficulty: '',
    selectedSkills: [],
    duration: 30,
    questionCount: 10
  })
  const [errors, setErrors] = useState([])

  const updateSetup = useCallback((updates) => {
    setSetup(prev => ({ ...prev, ...updates }))
    setErrors([])
  }, [])

  const setRole = useCallback((role) => {
    updateSetup({
      role,
      selectedSkills: []
    })
  }, [updateSetup])

  const getAvailableSkills = useCallback(() => {
    return getSkillsForRole(setup.role)
  }, [setup.role])

  const toggleSkill = useCallback((skill) => {
    setSetup(prev => {
      const selected = prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
      return {
        ...prev,
        selectedSkills: selected.slice(0, MAX_SKILLS)
      }
    })
  }, [])

  const removeSkill = useCallback((skill) => {
    setSetup(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(s => s !== skill)
    }))
  }, [])

  const validateStep = useCallback((currentStep) => {
    const stepErrors = []

    if (currentStep === 1 && !setup.role) {
      stepErrors.push('Choose a role to continue')
    }

    if (currentStep === 2) {
      if (!setup.interviewType) stepErrors.push('Choose an interview type')
      if (!setup.difficulty) stepErrors.push('Choose a difficulty level')
    }

    if (currentStep === 3) {
      if (!setup.selectedSkills.length) {
        stepErrors.push('Select at least one skill')
      }
      if (setup.selectedSkills.length > MAX_SKILLS) {
        stepErrors.push('You can select up to 5 skills only')
      }
    }

    return {
      isValid: stepErrors.length === 0,
      errors: stepErrors
    }
  }, [setup])

  const nextStep = useCallback(() => {
    const validation = validateStep(step)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return false
    }

    setStep(prev => Math.min(3, prev + 1))
    setErrors([])
    return true
  }, [step, validateStep])

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1))
    setErrors([])
  }, [])

  const getConfig = useCallback(() => {
    const validation = validateInterviewConfig(setup)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return null
    }
    return generateInterviewConfig(setup)
  }, [setup])

  const getRepositoryFiles = useCallback(() => {
    return mapRepositoryFiles({
      role: setup.role,
      interviewType: setup.interviewType,
      selectedSkills: setup.selectedSkills
    })
  }, [setup])

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    setup,
    updateSetup,
    setRole,
    getAvailableSkills,
    toggleSkill,
    removeSkill,
    errors,
    getConfig,
    getRepositoryFiles,
    progress: ((step - 1) / 3) * 100
  }
}
