import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Code2,
  Database,
  Zap,
  BarChart3,
  Coffee,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useInterview } from '../context/InterviewContext'
import { useInterviewSetup } from '../hooks/useInterviewSetup'

const ROLES = [
  {
    id: 'frontend',
    label: 'Frontend Developer',
    icon: Code2,
    desc: 'React, JavaScript, HTML, CSS'
  },
  {
    id: 'backend',
    label: 'Backend Developer',
    icon: Database,
    desc: 'Node.js, Express, MongoDB'
  },
  {
    id: 'fullstack',
    label: 'Full Stack Developer',
    icon: Zap,
    desc: 'Frontend + backend systems'
  },
  {
    id: 'java',
    label: 'Java Developer',
    icon: Zap,
    desc: 'Core Java, Spring Boot, OOP'
  },
  {
    id: 'devops',
    label: 'DevOps Engineer',
    icon: BarChart3,
    desc: 'Docker, Kubernetes, CI/CD'
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    icon: Coffee,
    desc: 'SQL, Python, Excel, Statistics'
  }
]

const INTERVIEW_TYPES = [
  {
    id: 'technical',
    label: 'Technical',
    desc: 'Focus on technical skills'
  },
  {
    id: 'hr',
    label: 'HR',
    desc: 'Behavioral and communication topics'
  },
  {
    id: 'mixed',
    label: 'Mixed',
    desc: 'Balanced technical and HR rounds'
  },
  {
    id: 'dsa',
    label: 'DSA',
    desc: 'Data structures and algorithms'
  }
]

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Beginner friendly' },
  { id: 'medium', label: 'Medium', desc: 'Intermediate' },
  { id: 'hard', label: 'Hard', desc: 'Advanced' }
]

export default function InterviewSetup() {
  const navigate = useNavigate()
  const { startSession } = useInterview()
  const {
    setup,
    step,
    progress,
    errors,
    updateSetup,
    setRole,
    getAvailableSkills,
    toggleSkill,
    removeSkill,
    nextStep,
    prevStep,
    getConfig
  } = useInterviewSetup()
  const [loading, setLoading] = useState(false)
  const [localErrors, setLocalErrors] = useState([])

  const availableSkills = useMemo(() => getAvailableSkills(), [getAvailableSkills])

  const handleRoleSelect = (roleId) => {
    const role = ROLES.find((item) => item.id === roleId)
    if (role) {
      setRole(role.label)
    }
  }

  const handleStart = async () => {
    setLoading(true)
    setLocalErrors([])

    try {
      const config = getConfig()
      if (!config) {
        setLoading(false)
        return
      }

      startSession(config)
      navigate('/interview')
    } catch (err) {
      console.error('Setup error:', err)
      setLocalErrors(['Unable to start interview. Please refresh and try again.'])
    } finally {
      setLoading(false)
    }
  }

  const combinedErrors = [...errors, ...localErrors]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600 font-semibold mb-3">
            Interview setup
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Build a focused interview plan in minutes.
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Use local repository files for reliable question selection. Gemini only evaluates answers, generates feedback, and suggests follow-ups.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_0.95fr]">
          <aside className="space-y-4">
            <Card className="bg-slate-950 text-slate-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Progress</p>
                    <p className="text-lg font-semibold">Step {step} of 3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">{Math.round(progress)}%</p>
                  </div>
                </div>
                <div className="rounded-full bg-slate-800 h-2 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-50 text-blue-700 p-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Local repository driven</h2>
                    <p className="text-sm text-slate-500">Selected skills map directly to question files.</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Role</p>
                    <p className="font-semibold text-slate-900">{setup.role || 'Choose a role'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="font-semibold text-slate-900">{setup.interviewType || 'Choose a type'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Skills</p>
                    <p className="font-semibold text-slate-900">{setup.selectedSkills.length || 0} selected</p>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          <main>
            <Card className="overflow-hidden">
              <div className="p-8 md:p-10">
                {combinedErrors.length > 0 && (
                  <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {combinedErrors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <section className="space-y-8">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-400 mb-3">Step 1</p>
                      <h2 className="text-3xl font-semibold text-slate-900">Select the target role</h2>
                      <p className="mt-2 text-slate-600 max-w-2xl">Pick the role path that matches your mock interview goals.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {ROLES.map((role) => {
                        const Icon = role.icon
                        const selected = setup.role === role.label
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleRoleSelect(role.id)}
                            className={`group rounded-3xl border p-6 text-left transition ${selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="rounded-2xl bg-slate-100 p-3 text-blue-600 group-hover:bg-blue-50 transition">
                                <Icon className="w-6 h-6" />
                              </div>
                              {selected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="mt-5">
                              <h3 className="text-xl font-semibold text-slate-900">{role.label}</h3>
                              <p className="mt-2 text-sm text-slate-500">{role.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={nextStep} disabled={!setup.role}>Continue</Button>
                    </div>
                  </section>
                )}

                {step === 2 && (
                  <section className="space-y-8">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-400 mb-3">Step 2</p>
                      <h2 className="text-3xl font-semibold text-slate-900">Fine-tune the interview type</h2>
                      <p className="mt-2 text-slate-600 max-w-2xl">Select the type and difficulty to shape the final question set.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {INTERVIEW_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateSetup({ interviewType: type.label })}
                          className={`rounded-3xl border p-5 text-left transition ${setup.interviewType === type.label ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <h3 className="text-lg font-semibold text-slate-900">{type.label}</h3>
                          <p className="mt-2 text-sm text-slate-500">{type.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {DIFFICULTIES.map((difficulty) => (
                        <button
                          key={difficulty.id}
                          type="button"
                          onClick={() => updateSetup({ difficulty: difficulty.label })}
                          className={`rounded-3xl border p-5 text-left transition ${setup.difficulty === difficulty.label ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <h3 className="text-lg font-semibold text-slate-900">{difficulty.label}</h3>
                          <p className="mt-2 text-sm text-slate-500">{difficulty.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500">Session duration</p>
                        <p className="font-semibold text-slate-900">{setup.duration} min</p>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="5"
                        value={setup.duration}
                        onChange={(event) => updateSetup({ duration: Number(event.target.value) })}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button onClick={nextStep} disabled={!setup.interviewType || !setup.difficulty}>
                        Continue
                      </Button>
                    </div>
                  </section>
                )}

                {step === 3 && (
                  <section className="space-y-8">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-400 mb-3">Step 3</p>
                      <h2 className="text-3xl font-semibold text-slate-900">Choose your skills</h2>
                      <p className="mt-2 text-slate-600 max-w-2xl">Skills are mapped directly to local repository files for question selection.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <p className="text-sm font-semibold text-slate-700 mb-4">Available skills</p>
                      <div className="flex flex-wrap gap-3">
                        {availableSkills.length ? (
                          availableSkills.map((skill) => {
                            const selected = setup.selectedSkills.includes(skill)
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                disabled={!selected && setup.selectedSkills.length >= 5}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${selected ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60'}`}
                              >
                                {skill}
                              </button>
                            )
                          })
                        ) : (
                          <p className="text-slate-500">Pick a role to load skills.</p>
                        )}
                      </div>
                    </div>

                    {setup.selectedSkills.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">Selected skills ({setup.selectedSkills.length}/5)</p>
                          <p className="text-sm text-blue-600">Tap a skill to remove</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {setup.selectedSkills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"
                            >
                              {skill}
                              <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Card className="bg-slate-50 border-slate-200">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">Role</p>
                          <p className="font-semibold text-slate-900">{setup.role}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">Interview Type</p>
                          <p className="font-semibold text-slate-900">{setup.interviewType}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">Difficulty</p>
                          <p className="font-semibold text-slate-900">{setup.difficulty}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">Duration</p>
                          <p className="font-semibold text-slate-900">{setup.duration} min</p>
                        </div>
                      </div>
                    </Card>

                    <div className="flex flex-col gap-3 sm:flex-row justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button onClick={handleStart} disabled={loading || setup.selectedSkills.length === 0}>
                        {loading ? 'Starting…' : 'Start Interview'}
                      </Button>
                    </div>
                  </section>
                )}
              </div>
            </Card>
          </main>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>💡 Tip: Interview questions come from local repository JSON files. Gemini is only used for evaluation and feedback.</p>
        </div>
      </div>
    </div>
  )
}
