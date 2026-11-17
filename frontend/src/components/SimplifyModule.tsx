import { useMemo, useState } from 'react'
import { api, type SimplifyResult } from '../lib/api'
type Props={lang:string;bionic:boolean}
export function SimplifyModule({lang,bionic}:Props){
 const [text,setText]=useState('');const [mode,setMode]=useState('easy_read');const [result,setResult]=useState<SimplifyResult|null>(null)
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [file,setFile]=useState<File|null>(null);const [url,setUrl]=useState('')
 const [ruler,setRuler]=useState(false);const [rate,setRate]=useState(1);const [audio,setAudio]=useState<HTMLAudioElement|null>(null)
 const [playing,setPlaying]=useState(false)
 async function run(){setError('');setLoading(true);setResult(null);try{
  let out:SimplifyResult
  if(file||url){const form=new FormData();if(file)form.append('file',file);if(url)form.append('url',url);form.append('mode',mode);form.append('target_lang',lang);out=await api.simplifySource(form)}
  else out=await api.simplify(text,mode,lang)
  setResult(out)
 }catch(e){setError(e instanceof Error?e.message:'Could not simplify content')}finally{setLoading(false)}}
 async function read(){if(!result)return;try{const blob=await api.tts(result.simplified_text,lang,rate);audio?.pause();const next=new Audio(blob);setAudio(next);next.onended=()=>setPlaying(false);await next.play();setPlaying(true)}catch(e){setError(e instanceof Error?e.message:'Audio playback failed')}}
 function stop(){audio?.pause();setPlaying(false)}
 const lines=useMemo(()=>result?.simplified_text.split(/(?<=[.!?])\\s+|\\n+/).filter(Boolean)||[],[result])
 return <section className="module-section" id="simplify">
  <div className="section-heading"><div><p className="eyebrow">01 / READ & UNDERSTAND</p><h2>Complex in.<br/><em>Clear out.</em></h2></div><p>Turn long documents, government notices, and complicated language into easy-read information you can act on.</p></div>
  <div className="tool-card simplify-grid">
   <div className="tool-input"><div className="field-head"><label htmlFor="source-text">Your content</label><span className="mono">TEXT / PDF / WEB</span></div>
    <textarea id="source-text" value={text} onChange={e=>{setText(e.target.value);setFile(null);setUrl('')}} placeholder="Paste a medical letter, notice, article, or any text you want to understand…" rows={9}/>
    <div className="source-row"><label className="file-label">↑ Upload PDF / TXT<input type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={e=>{setFile(e.target.files?.[0]||null);setUrl('')}}/></label><span>{file?.name||'No file selected'}</span></div>
    <div className="url-row"><input type="url" value={url} onChange={e=>{setUrl(e.target.value);setFile(null)}} placeholder="https:// article or notice URL"/><select value={mode} onChange={e=>setMode(e.target.value)} aria-label="Simplification style"><option value="easy_read">Easy Read</option><option value="eli5">Explain simply</option><option value="action_items">Action steps</option></select></div>
    <div className="example-row"><button onClick={()=>{setText('The applicant shall submit all requisite documentation within fourteen working days of receipt of this communication, failing which the application may be deemed ineligible for further consideration.');setFile(null);setUrl('')}}>Try a formal notice ↗</button><button onClick={()=>{setText('Patients are advised to take the prescribed medication twice daily after meals. If you experience persistent dizziness, difficulty breathing, or swelling, discontinue use and contact your healthcare provider immediately. Do not exceed the recommended dosage.');setFile(null);setUrl('')}}>Try a medical note ↗</button></div>
    <button className="button primary full" disabled={loading||(!text.trim()&&!file&&!url.trim())} onClick={run}>{loading?'Working…':'Make it easier to understand →'}</button>
    {error&&<p className="error" role="alert">{error}</p>}
   </div>
   <div className="tool-output" aria-live="polite"><div className="field-head"><span>YOUR EASY-READ VERSION</span><span className="mono">OUTPUT / 01</span></div>
    {result?<><div className="grade-row"><div><strong>{result.original_grade??'—'}</strong><small>ORIGINAL GRADE</small></div><span>→</span><div><strong className="accent">{result.simplified_grade??'—'}</strong><small>NEW GRADE</small></div></div>
     <div className={'easy-read '+(bionic?'bionic':'')}>{lines.map((line,i)=><p key={i}>{bionic?<Bionic text={line}/>:line}</p>)}</div>
     {result.provider==='offline_fallback'&&<p className="notice" role="status">AI rewriting was unavailable. {result.provider_error||'Check the Gemini connection and backend configuration.'}</p>}
     <div className="output-controls"><button className="button primary" onClick={playing?stop:read}>{playing?'■ Stop reading':'▶ Read aloud'}</button><label>Speed <select value={rate} onChange={e=>setRate(Number(e.target.value))}><option value=".75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><button className="small-button" onClick={()=>setRuler(!ruler)} aria-pressed={ruler}>Reading ruler {ruler?'on':'off'}</button></div>
     {ruler&&<div className="ruler-overlay">FOCUS STRIP — follow each line at your own pace</div>}
    </>:<div className="empty-output"><div className="empty-icon">Aa</div><h3>Your clearer version appears here.</h3><p>We’ll show readability scores, short points, and an audio version you can listen to.</p></div>}
   </div>
  </div>
 </section>
}
function Bionic({text}:{text:string}){return <>{text.split(/(\\s+)/).map((word,i)=>/^\\s+$/.test(word)?word:<span key={i}><b>{word.slice(0,Math.max(1,Math.ceil(word.length*.4)))}</b>{word.slice(Math.max(1,Math.ceil(word.length*.4)))}</span>)}</>}
