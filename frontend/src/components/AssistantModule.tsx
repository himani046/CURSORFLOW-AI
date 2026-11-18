import { useState } from 'react'
import { api } from '../lib/api'
import { useMultilingualSpeech } from '../hooks/useMultilingualSpeech'
type Props={lang:string;handsFree:boolean}
type Message={role:'user'|'assistant';content:string}
const starters=['Help me write a polite email','Explain this bill in simple steps','Help me plan my day','Make a checklist for an appointment']
export function AssistantModule({lang,handsFree}:Props){
 const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:'Hello. I’m your CURSORFLOW assistant. Tell me what you would like help with, and we can work through it one step at a time.'}])
 const [input,setInput]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 const speech=useMultilingualSpeech(lang)
 async function send(value=input){if(!value.trim()||busy)return;const next=[...messages,{role:'user' as const,content:value.trim()}];setMessages(next);setInput('');setBusy(true);setError('');try{const out=await api.assistant(value,next.slice(-8),lang,false);setMessages([...next,{role:'assistant',content:out.reply}]);if(handsFree&&out.reply){const url=await api.tts(out.reply,lang,1);const audio=new Audio(url);audio.onended=()=>{if(handsFree)void speech.start()};await audio.play()}}catch(e){setError(e instanceof Error?e.message:'Assistant request failed')}finally{setBusy(false)}}
 function dictate(){if(speech.listening){speech.stop();setInput([speech.transcript,speech.interim].filter(Boolean).join(' ').trim())}else speech.start((captured)=>setInput(captured))}
 return <section className="module-section assistant-section" id="assistant">
  <div className="section-heading"><div><p className="eyebrow">04 / DO THE EVERYDAY</p><h2>Small steps.<br/><em>More independence.</em></h2></div><p>A patient, voice-first helper for everyday tasks—from understanding a letter to organising your next appointment.</p></div>
  <div className="tool-card assistant-card">
   <aside className="assistant-aside"><p className="mono">TASK STARTERS</p><h3>What would help today?</h3>{starters.map(s=><button key={s} onClick={()=>setInput(s)}>{s}<span>↗</span></button>)}<div className="assistant-note"><span>!</span><p>For important medical, legal, or financial decisions, use the assistant as a guide—not as a replacement for a qualified professional.</p></div></aside>
   <div className="chat-panel"><div className="chat-head"><div className="assistant-avatar">CF</div><div><strong>CURSORFLOW assistant</strong><small>PLAIN-LANGUAGE SUPPORT / {lang}</small></div><span className="online-dot">● READY</span></div>
    <div className="chat-messages" aria-live="polite">{messages.map((m,i)=><div key={i} className={'message '+m.role}><span>{m.role==='assistant'?'CF':'YOU'}</span><p>{m.content}</p>{m.role==='assistant'&&<button className="speak-reply" onClick={async()=>{try{const url=await api.tts(m.content,lang,1);new Audio(url).play()}catch{}}}>▶ Listen</button>}</div>)}{busy&&<p className="mono">THINKING THROUGH THE NEXT STEP…</p>}</div>
    <form className="chat-compose" onSubmit={e=>{e.preventDefault();send()}}><button type="button" className={speech.listening?'mic-button recording':'mic-button'} onClick={dictate} aria-label={speech.listening?"Stop to send dictated text":"Start voice dictation"} aria-pressed={speech.listening}>●</button>{speech.listening&&<small className="stop-to-send">Stop to send</small>}<input aria-label="Message the assistant" value={input} onChange={e=>setInput(e.target.value)} placeholder="Tell me what you need help with…"/><button type="submit" className="button primary" disabled={busy||!input.trim()}>Send ↗</button></form>
    {speech.interim&&<small className="transcription-hint">{speech.interim}</small>}{speech.error&&<p className="error">{speech.error}</p>}{error&&<p className="error">{error}</p>}
   </div>
  </div>
 </section>
}
