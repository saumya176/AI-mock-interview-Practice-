import React, {useState, useEffect, useRef} from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { useInterview } from '../context/InterviewContext'
import useSpeechToText from '../hooks/useSpeechToText'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import VoiceControls from '../components/VoiceControls'
import api from '../services/api'
import { buildLocalInterviewReport } from '../utils/answerEvaluation'


export default function Interview(){
  const navigate = useNavigate()
  const {session, questions, setQuestions, currentIndex, setCurrentIndex, completeAnswer, setResults, answers, setInterviewId} = useInterview()
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(120)
  const [questionStartAt, setQuestionStartAt] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const questionsLoadingRef = useRef(false)

  useEffect(()=>{
    if(!session?.config){
      navigate('/setup')
      return
    }

    async function load(){
      if (questionsLoadingRef.current) return
      questionsLoadingRef.current = true
      setLoading(true)
      try{
        const payload = { config: {
          ...session.config,
          type: session.config.type || session.config.interviewType
        } }
        const res = await api.post('/ai/questions', payload).catch((err)=>{
          console.error('Question load failed:', err)
          return null
        })
        if(res && res.data && Array.isArray(res.data.questions) && res.data.questions.length){
          const normalizedQuestions = res.data.questions.map((q, idx) => ({
            ...q,
            id: q.id || `q-${idx}`,
            text: q.question || q.text || `Question ${idx + 1}`,
            question: q.question || q.text || `Question ${idx + 1}`,
            difficulty: q.difficulty || 'medium',
            type: q.type || 'technical',
            expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics : []
          }))
          setQuestions(normalizedQuestions)
          if(res.data.interviewId){
            setInterviewId(res.data.interviewId)
          }
        }else{
          setQuestions(getFallbackQuestions(session?.config))
        }
      }catch(e){
        console.error('Question load failed:', e)
        setQuestions(getFallbackQuestions(session?.config))
      }finally{
        questionsLoadingRef.current = false
        setLoading(false)
      }
    }

    if(questions.length === 0) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, questions.length, navigate])

  useEffect(()=>{
    if (!questions.length) return
    const q = questions[currentIndex]
    setAnswer(answers[q?.id]?.text || '')
    setTimer(120)
    setQuestionStartAt(Date.now())
  }, [currentIndex, questions, answers])

  function getFallbackQuestions(config){
    if(!config) return [
      { id: 1, text:'Explain the event loop and asynchronous behavior in the browser.' },
      { id: 2, text:'Design a URL shortener service with analytics and scalable storage.' },
      { id: 3, text:'How do you design a scalable RESTful API for high throughput?' }
    ]

    const role = config.role || 'Software Engineer'
    const company = config.company || 'a modern tech company'
    const skills = (config.skills || []).join(', ') || 'core engineering skills'
    return [
      { id: 1, text: `Describe how ${role} uses React reconciliation to improve rendering performance in real applications.` },
      { id: 2, text: `Explain the browser event loop and asynchronous behavior when building responsive ${role} interfaces.` },
      { id: 3, text: `Design a scalable RESTful API for ${company} with ${skills}, focusing on throughput and reliability.` },
      { id: 4, text: `Outline a URL shortener service with analytics and scalable storage tailored for ${company}.` }
    ]
  }

  // auto move to next when timer reaches 0
  useEffect(()=>{
    if(timer !== 0) return
    handleNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer])

  async function handleNext(){
    if(!q || submitting) return

    const responseText = (answer || transcript || '').trim()
    const timeTaken = Math.max(0, Date.now() - questionStartAt)

    flushSync(() => {
      completeAnswer(q.id, responseText, timeTaken, null)
    })

    reset()
    setAnswer('')

    if(currentIndex < questions.length - 1){
      setCurrentIndex(currentIndex + 1)
      return
    }

    setSubmitting(true)
    try{
      const updatedAnswers = {
        ...answers,
        [q.id]: { ...(answers[q.id] || {}), text: responseText, timeTaken }
      }
      const payloadAnswers = questions.reduce((acc, question) => {
        acc[question.id] = {
          question,
          answer: question.id === currentQuestionId ? responseText : (updatedAnswers[question.id]?.text || '')
        }
        return acc
      }, {})

      let finalResults = null
      try {
        const rep = await api.post('/ai/report', {
          answers: payloadAnswers,
          role: session?.config?.role || 'Software Engineer',
          interviewId: session?.interviewId
        })
        finalResults = rep?.data || null
      } catch (error) {
        console.error('AI report failed, using local evaluation:', error)
      }

      if (!finalResults) {
        finalResults = buildLocalInterviewReport(questions, updatedAnswers)
      }

      flushSync(() => {
        setResults(finalResults)
      })
      navigate('/results')
    }catch(e){
      console.error('Report fetch failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(()=>{
    if(loading || questions.length === 0) return
    const interval = setInterval(()=> setTimer((value)=> Math.max(0, value - 1)), 1000)
    return ()=> clearInterval(interval)
  }, [loading, questions.length])

  // speech hooks
  const { supported, isRecording, isPaused, transcript, error, start, pause, resume, stop, reset } = useSpeechToText({ onResult: (t)=> setAnswer(t) })
  const { voices, voice, setVoice, rate, setRate, speaking, paused, speak, pause: pauseSpeech, resume: resumeSpeech, cancel } = useSpeechSynthesis()

  const q = questions[currentIndex]
  const currentQuestionId = q?.id
  const questionText = q?.text || q?.question || q?.prompt || q?.title || 'Question not available yet.'

  // auto-read question when it changes
  useEffect(()=>{
    if(!q || !questionText) return
    // avoid overlap
    cancel()
    speak(questionText, { rate })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, questionText])

  if(loading) return <div className="p-8"><Skeleton className="h-10 w-full mb-4" /><Skeleton className="h-40 w-full" /></div>

  if(!loading && questions.length === 0){
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">No interview session available</h2>
          <p className="text-slate-600 mb-6">It looks like there are no questions loaded yet. Please go back to the setup page to start a new interview.</p>
          <Button as={Link} to="/setup">Back to Setup</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4 text-slate-700">
        <div className="font-medium">Question {currentIndex+1} / {questions.length}</div>
        <div className="text-sm text-slate-500">00:{timer.toString().padStart(2, '0')}</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold mb-2 text-slate-900">{questionText}</h3>
        <p className="text-sm text-slate-600">Provide your answer below or use voice answer.</p>
      </div>
      <div className="mb-4 flex flex-col gap-4">
        {/* Microphone Control Panel */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-yellow-500' : 'bg-slate-300'}`}></div>
              <span className="text-sm font-medium text-slate-700">
                {isRecording ? 'Recording...' : isPaused ? 'Paused' : 'Microphone Ready'}
              </span>
            </div>
            {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {!isRecording && !isPaused && (
              <Button onClick={start} className="bg-blue-600 hover:bg-blue-700 text-white">
                ▶ Start Recording
              </Button>
            )}
            {isRecording && (
              <>
                <Button onClick={pause} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  ⏸ Pause
                </Button>
                <Button onClick={stop} className="bg-red-600 hover:bg-red-700 text-white">
                  ⏹ Stop
                </Button>
              </>
            )}
            {isPaused && (
              <>
                <Button onClick={resume} className="bg-green-600 hover:bg-green-700 text-white">
                  ▶ Resume
                </Button>
                <Button onClick={stop} className="bg-red-600 hover:bg-red-700 text-white">
                  ⏹ Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Transcript Display & Edit Area */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Your Answer</label>
            <div className="text-xs text-slate-500">
              {answer.length} characters • {answer.split(/\s+/).filter(w => w).length} words
            </div>
          </div>
          
          <textarea 
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl h-48 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={answer} 
            onChange={(e)=>setAnswer(e.target.value)} 
            placeholder="Your answer will appear here from microphone or you can type directly..."
          />
          
          <div className="mt-3 flex gap-2">
            <Button onClick={()=>{ reset(); setAnswer('') }} className="bg-slate-600 hover:bg-slate-700 text-white text-sm">
              🗑 Clear All
            </Button>
            <Button onClick={()=>setAnswer(answer + ' ')} className="bg-slate-500 hover:bg-slate-600 text-white text-sm" title="Add space">
              + Space
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>💡 Tip:</strong> You can pause recording to think, edit your text manually, or switch between voice and typing. All transcript will be preserved until you move to the next question.
          </p>
        </div>
      </div>
      <div className="mb-4">
        <VoiceControls voices={voices} voice={voice} setVoice={setVoice} rate={rate} setRate={setRate} speaking={speaking} paused={paused} speak={(text)=>speak(text||q?.text||'')} pause={pauseSpeech} resume={resumeSpeech} cancel={cancel} />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleNext} disabled={submitting}>
          {submitting ? 'Generating AI feedback…' : (currentIndex < questions.length - 1 ? 'Next' : 'Finish & View Results')}
        </Button>
      </div>
    </div>
  )
}
