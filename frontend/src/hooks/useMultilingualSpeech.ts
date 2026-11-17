import { useCallback, useEffect, useRef, useState } from 'react'

type Recognition = {
  lang:string; continuous:boolean; interimResults:boolean; onresult:((event:any)=>void)|null
  onerror:((event:any)=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void
}
declare global { interface Window { SpeechRecognition?:new()=>Recognition; webkitSpeechRecognition?:new()=>Recognition } }

export function useMultilingualSpeech(lang:string) {
  const [listening,setListening]=useState(false)
  const [transcript,setTranscript]=useState('')
  const [interim,setInterim]=useState('')
  const [error,setError]=useState('')
  const [levels,setLevels]=useState<number[]>(Array(12).fill(4))
  const recognition=useRef<Recognition|null>(null)
  const audioContext=useRef<AudioContext|null>(null)
  const frame=useRef<number>(0)
  const stream=useRef<MediaStream|null>(null)

  const stop = useCallback(() => {
    recognition.current?.stop(); recognition.current=null
    stream.current?.getTracks().forEach(track=>track.stop()); stream.current=null
    if (audioContext.current) { audioContext.current.close(); audioContext.current=null }
    cancelAnimationFrame(frame.current); setListening(false); setLevels(Array(12).fill(4))
  },[])

  const start = useCallback(async () => {
    setError(''); setTranscript(''); setInterim('')
    const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition
    if (!Ctor) { setError('Speech recognition is not supported in this browser. Try Chrome or Edge.'); return }
    try {
      stream.current=await navigator.mediaDevices.getUserMedia({audio:true})
      const ctx=new AudioContext(); audioContext.current=ctx
      const analyser=ctx.createAnalyser(); analyser.fftSize=64
      ctx.createMediaStreamSource(stream.current).connect(analyser)
      const data=new Uint8Array(analyser.frequencyBinCount)
      const tick=()=>{ analyser.getByteFrequencyData(data); setLevels(Array.from({length:12},(_,i)=>Math.max(4,Math.round((data[i]||0)/3)))); frame.current=requestAnimationFrame(tick) }
      tick()
      const rec=new Ctor(); rec.lang=lang; rec.continuous=true; rec.interimResults=true
      rec.onresult=(event)=>{let final='';let temp='';for(let i=event.resultIndex;i<event.results.length;i++){const value=event.results[i][0].transcript;if(event.results[i].isFinal)final+=value+' ';else temp+=value}if(final)setTranscript(prev=>prev+final);setInterim(temp)}
      rec.onerror=(event)=>setError(event.error==='not-allowed'?'Microphone permission was denied.':`Speech recognition error: ${event.error}`)
      rec.onend=()=>setListening(false)
      recognition.current=rec;rec.start();setListening(true)
    } catch { setError('Microphone unavailable. Check permission and use localhost or HTTPS.') }
  },[lang])

  useEffect(()=>()=>{ recognition.current?.stop(); stream.current?.getTracks().forEach(t=>t.stop()); if(audioContext.current) void audioContext.current.close(); cancelAnimationFrame(frame.current) },[])
  return {listening,transcript,interim,error,levels,start,stop,setTranscript}
}
