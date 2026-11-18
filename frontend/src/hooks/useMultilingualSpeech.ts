import { useCallback, useEffect, useRef, useState } from 'react'
type Recognition = {lang:string;continuous:boolean;interimResults:boolean;onresult:((event:any)=>void)|null;onerror:((event:any)=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void}
declare global { interface Window { SpeechRecognition?:new()=>Recognition; webkitSpeechRecognition?:new()=>Recognition } }
type SilenceHandler=(text:string)=>void
export function useMultilingualSpeech(lang:string) {
 const [listening,setListening]=useState(false);const [transcript,setTranscript]=useState('');const [interim,setInterim]=useState('');const [error,setError]=useState('');const [levels,setLevels]=useState<number[]>(Array(12).fill(4))
 const recognition=useRef<Recognition|null>(null);const audioContext=useRef<AudioContext|null>(null);const frame=useRef<number>(0);const stream=useRef<MediaStream|null>(null);const manuallyStopped=useRef(false)
 const transcriptRef=useRef('');const interimRef=useRef('');const silenceHandler=useRef<SilenceHandler|undefined>(undefined);const lastVoiceAt=useRef(0);const silenceTriggered=useRef(false)
 const cleanup=useCallback(()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(audioContext.current){void audioContext.current.close();audioContext.current=null}cancelAnimationFrame(frame.current);setLevels(Array(12).fill(4));setListening(false)},[])
 const stop=useCallback(()=>{manuallyStopped.current=true;const rec=recognition.current;recognition.current=null;try{rec?.stop()}catch{}cleanup()},[cleanup])
 const start=useCallback(async(onSilence?:SilenceHandler)=>{
  if(listening)return
  manuallyStopped.current=false;silenceTriggered.current=false;silenceHandler.current=onSilence;lastVoiceAt.current=Date.now();transcriptRef.current='';interimRef.current='';setError('');setTranscript('');setInterim('')
  const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition
  if(!Ctor){setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');return}
  if(!navigator.mediaDevices?.getUserMedia){setError('Microphone access requires localhost or a secure HTTPS connection.');return}
  try{
   stream.current=await navigator.mediaDevices.getUserMedia({audio:true})
   const ctx=new AudioContext();audioContext.current=ctx;if(ctx.state==='suspended')await ctx.resume()
   const analyser=ctx.createAnalyser();analyser.fftSize=64;ctx.createMediaStreamSource(stream.current).connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount)
   const tick=()=>{
    analyser.getByteFrequencyData(data);const average=data.reduce((sum,value)=>sum+value,0)/data.length
    setLevels(Array.from({length:12},(_,i)=>Math.max(4,Math.round((data[i]||0)/3))))
    if(average>9)lastVoiceAt.current=Date.now()
    else if(onSilence&&!silenceTriggered.current&&Date.now()-lastVoiceAt.current>=5000){
     silenceTriggered.current=true;const captured=[transcriptRef.current,interimRef.current].filter(Boolean).join(' ').trim()
     const rec=recognition.current;recognition.current=null;try{rec?.stop()}catch{}cleanup();if(captured)silenceHandler.current?.(captured)
    }
    frame.current=requestAnimationFrame(tick)
   };tick()
   const rec=new Ctor();rec.lang=lang;rec.continuous=true;rec.interimResults=true
   rec.onresult=(event)=>{let final='';let temp='';for(let i=event.resultIndex;i<event.results.length;i++){const value=event.results[i][0].transcript;if(event.results[i].isFinal)final+=value+' ';else temp+=value}
    if(final){transcriptRef.current+=final;setTranscript(transcriptRef.current)}interimRef.current=temp;setInterim(temp)}
   rec.onerror=(event)=>{if(event.error==='aborted'&&manuallyStopped.current)return;const messages:Record<string,string>={'not-allowed':'Microphone permission was denied. Allow microphone access in your browser settings.','service-not-allowed':'Speech recognition service is blocked by the browser.','no-speech':'No speech was detected. Try speaking closer to the microphone.','audio-capture':'No microphone was found. Check your input device.'};setError(messages[event.error]||`Speech recognition error: ${event.error}`)}
   rec.onend=()=>{recognition.current=null;cleanup()}
   recognition.current=rec;rec.start();setListening(true)
  }catch(e){cleanup();setError(e instanceof Error&&e.name==='NotAllowedError'?'Microphone permission was denied. Allow access and try again.':'Microphone unavailable. Check permission and use localhost or HTTPS.')}
 },[lang,listening,cleanup])
 useEffect(()=>()=>{manuallyStopped.current=true;try{recognition.current?.stop()}catch{}recognition.current=null;stream.current?.getTracks().forEach(t=>t.stop());if(audioContext.current)void audioContext.current.close();cancelAnimationFrame(frame.current)},[])
 return {listening,transcript,interim,error,levels,start,stop,setTranscript}
}
