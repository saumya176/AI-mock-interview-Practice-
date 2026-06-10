import { useEffect, useRef, useState, useCallback } from 'react'

export default function useSpeechToText({ onResult, silenceTimeout = 3000 } = {}){
  const [supported, setSupported] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const accumulatedTranscriptRef = useRef('')
  const currentSessionRef = useRef('')
  const silenceTimer = useRef(null)
  const autoRestartRef = useRef(false)

  useEffect(()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SpeechRecognition){ setSupported(false); return }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true

    rec.onresult = (e)=>{
      let interim = ''
      let final = ''
      for(let i = 0; i < e.results.length; i++){
        const r = e.results[i]
        if(r.isFinal) final += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      const currentText = `${final}${interim}`.trim()
      currentSessionRef.current = currentText
      const combinedText = (accumulatedTranscriptRef.current + ' ' + currentText).trim()
      setTranscript(combinedText)
      if(onResult) onResult(combinedText)
      // reset silence timer
      if(silenceTimer.current) clearTimeout(silenceTimer.current)
      silenceTimer.current = setTimeout(()=>{
        // stop recording on silence
        stop()
      }, silenceTimeout)
    }

    rec.onerror = (e)=>{
      setError(e.error || 'speech_error')
    }

    rec.onend = ()=>{
      const wasRecording = isRecording
      recognitionRef.current = rec
      // Accumulate the final text when recording ends
      if(currentSessionRef.current) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + currentSessionRef.current).trim()
        currentSessionRef.current = ''
      }
      if(wasRecording && autoRestartRef.current && !isPaused){
        // restart after short delay only if auto-restart is enabled
        setTimeout(()=>{ start() }, 300)
      } else {
        setIsRecording(false)
      }
    }

    recognitionRef.current = rec
    return ()=>{
      if(recognitionRef.current){
        recognitionRef.current.onresult = null
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        try{ recognitionRef.current.stop() }catch(e){}
      }
      if(silenceTimer.current) clearTimeout(silenceTimer.current)
      // Preserve accumulated transcript on cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(()=>{
    const rec = recognitionRef.current
    if(!rec) return setError('SpeechRecognition not supported')
    autoRestartRef.current = false
    setIsPaused(false)
    try{
      rec.start()
      setIsRecording(true)
      setError(null)
      if(silenceTimer.current) clearTimeout(silenceTimer.current)
    }catch(e){
      // some browsers throw if start called twice
    }
  }, [])

  const pause = useCallback(()=>{
    const rec = recognitionRef.current
    autoRestartRef.current = false
    try{
      rec && rec.stop()
    }catch(e){}
    setIsRecording(false)
    setIsPaused(true)
    if(silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  const resume = useCallback(()=>{
    const rec = recognitionRef.current
    if(!rec) return setError('SpeechRecognition not supported')
    setIsPaused(false)
    try{
      rec.start()
      setIsRecording(true)
      setError(null)
      if(silenceTimer.current) clearTimeout(silenceTimer.current)
    }catch(e){
      // some browsers throw if start called twice
    }
  }, [])

  const stop = useCallback(()=>{
    const rec = recognitionRef.current
    autoRestartRef.current = false
    try{
      rec && rec.stop()
    }catch(e){}
    setIsRecording(false)
    setIsPaused(false)
    if(silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  const reset = useCallback(()=>{
    accumulatedTranscriptRef.current = ''
    currentSessionRef.current = ''
    setTranscript('')
  }, [])

  return { supported, isRecording, isPaused, transcript, error, start, pause, resume, stop, reset }
}
