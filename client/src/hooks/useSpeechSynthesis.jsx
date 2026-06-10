import { useEffect, useRef, useState, useCallback } from 'react'

export default function useSpeechSynthesis(){
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const utterRef = useRef(null)
  const [voices, setVoices] = useState([])
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rate, setRate] = useState(1)
  const [voice, setVoice] = useState(null)

  useEffect(()=>{
    if(!synth) return
    const loadVoices = ()=>{
      const v = synth.getVoices()
      setVoices(v)
      if(v.length && !voice) setVoice(v[0])
    }
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return ()=>{ if(synth) synth.onvoiceschanged = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const speak = useCallback((text, opts={})=>{
    if(!synth) return
    cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = opts.rate || rate
    if(voice) u.voice = voice
    u.onend = ()=>{ setSpeaking(false); setPaused(false) }
    u.onerror = ()=>{ setSpeaking(false); setPaused(false) }
    utterRef.current = u
    synth.speak(u)
    setSpeaking(true)
  }, [synth, rate, voice])

  const pause = useCallback(()=>{
    if(!synth) return
    synth.pause()
    setPaused(true)
  }, [synth])

  const resume = useCallback(()=>{
    if(!synth) return
    synth.resume()
    setPaused(false)
  }, [synth])

  const cancel = useCallback(()=>{
    if(!synth) return
    synth.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [synth])

  return { voices, voice, setVoice, rate, setRate, speaking, paused, speak, pause, resume, cancel }
}
