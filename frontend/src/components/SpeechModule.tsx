import { useState } from 'react'
import { api } from '../lib/api'
import { useMultilingualSpeech } from '../hooks/useMultilingualSpeech'
type Props={lang:string}
const phrases=['I need help, please.','Please speak more slowly.','I do not understand.','Where is the nearest exit?','Please call someone for me.','Thank you.']
export function SpeechModule({lang}:Props){
 const speech=useMultilingualSpeech(lang);const [clean,setClean]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 const [ttsText,setTtsText]=useState('Welcome to CURSORFLOW. Choose any text and listen at your preferred speed.');const [rate,setRate]=useState(1);const [audio,setAudio]=useState<HTMLAudioElement|null>(null);const [active,setActive]=useState('');const [speaking,setSpeaking]=useState(false)
 async function refine(){if(!speech.transcript.trim())return;setBusy(true);setError('');try{const r=await api.refine(speech.transcript,lang,false);setClean(r.refined_transcript)}catch(e){setError(e instanceof Error?e.message:'Could not refine transcript')}finally{setBusy(false)}}
 async function speak(text:string){try{audio?.pause();setSpeaking(true);const url=await api.tts(text,lang,rate);const a=new Audio(url);setAudio(a);a.onended=()=>{setActive('');setSpeaking(false)};setActive(text);await a.play()}catch{setSpeaking(false);setError('Neural audio unavailable. Browser read-aloud can be used as a fallback.');if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(text);u.lang=lang;window.speechSynthesis.speak(u)}}}
 return <section className="module-section" id="speech">
  <div className="section-heading"><div><p className="eyebrow">03 / SPEAK & BE HEARD</p><h2>Every voice<br/><em>has a place.</em></h2></div><p>Turn spoken words into clear text. Communicate quickly with phrase cards. Listen to any text with adjustable speech.</p></div>
  <div className="speech-grid">
   <div className="tool-card speech-card"><div className="field-head"><span>LIVE SPEECH-TO-TEXT</span><span className="mono">MIC / 03A</span></div>
    <div className="mic-status"><button className={'mic-button '+(speech.listening?'listening':'')} onClick={()=>{if(speech.listening)speech.stop();else void speech.start()}} aria-label={speech.listening?'Stop microphone':'Start microphone'} aria-pressed={speech.listening}>{speech.listening?'■':'●'}</button><div><strong>{speech.listening?'Listening now':'Tap to start listening'}</strong><small>{speech.listening?'Microphone ready — speak naturally.':'Allow microphone access when your browser asks.'}</small></div></div>
    <div className={'waveform '+(speech.listening?'waveform-live':'')} aria-label="Live microphone signal">{speech.levels.map((v,i)=><span key={i} style={{height:`${v}px`}}/>)}</div>
    <div className="transcript-box" aria-live="polite"><p>{speech.transcript} <span className="interim">{speech.interim}</span></p>{!speech.transcript&&!speech.interim&&<small>Your transcript will appear here…</small>}</div>
    {speech.error&&<p className="error" role="alert">{speech.error}</p>}<div className="output-controls"><button className="button primary" disabled={!speech.transcript||busy} onClick={refine}>{busy?'Cleaning…':'Clean up transcript'}</button><button className="small-button" onClick={()=>{speech.stop();speech.setTranscript('');setClean('')}}>Clear</button></div>
    {clean&&<div className="refined"><span className="mono">CLEANED TRANSCRIPT</span><p>{clean}</p><button className="small-button" onClick={()=>navigator.clipboard?.writeText(clean)}>Copy text</button></div>}
   </div>
   <div className="tool-card speech-card"><div className="field-head"><span>QUICK COMMUNICATION / AAC</span><span className="mono">PHRASES / 03B</span></div><p className="section-intro">One tap to speak a phrase aloud.</p><div className="phrase-grid">{phrases.map((phrase,i)=><button key={phrase} className="phrase" onClick={()=>speak(phrase)}><span>0{i+1}</span>{phrase}<b>↗</b></button>)}</div>
    <label className="field-label" htmlFor="tts-text">Make your own voice</label><textarea id="tts-text" rows={3} value={ttsText} onChange={e=>setTtsText(e.target.value)}/>
    <div className="output-controls"><label>Speed <select value={rate} onChange={e=>setRate(Number(e.target.value))}><option value=".75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><button className="button primary" disabled={!ttsText.trim()||speaking} onClick={()=>speak(ttsText)}>{speaking?'Preparing / speaking…':'▶ Read aloud'}</button></div>
    {error&&<p className="error" role="alert">{error}</p>}
   </div>
  </div>
 </section>
}
