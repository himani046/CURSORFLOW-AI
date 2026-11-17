import { useRef, useState } from 'react'
import { api } from '../lib/api'
type Props={lang:string}
export function VisionModule({lang}:Props){
 const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState('');const [mode,setMode]=useState('describe')
 const [question,setQuestion]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 const [result,setResult]=useState<Awaited<ReturnType<typeof api.vision>>|null>(null)
 const [camera,setCamera]=useState(false);const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null)
 function choose(f:File){setFile(f);setPreview(URL.createObjectURL(f));setResult(null)}
 async function openCamera(){try{stream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});setCamera(true);if(video.current)video.current.srcObject=stream.current}catch{setError('Camera permission unavailable. Upload an image instead.')}}
 function snapshot(){const v=video.current;if(!v)return;const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;canvas.getContext('2d')?.drawImage(v,0,0);canvas.toBlob(blob=>{if(blob)choose(new File([blob],'camera-snapshot.jpg',{type:'image/jpeg'}));stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false)},'image/jpeg')}
 async function analyse(){if(!file)return;setBusy(true);setError('');try{const form=new FormData();form.append('image',file);form.append('mode',mode);form.append('question',question);form.append('target_lang',lang);const out=await api.vision(form);setResult(out);if(out.description){try{const url=await api.tts(out.description,lang,1);new Audio(url).play()}catch{/* Speech unavailable: result remains readable. */}}}catch(e){setError(e instanceof Error?e.message:'Image analysis failed')}finally{setBusy(false)}}
 return <section className="module-section vision-section" id="vision">
  <div className="section-heading"><div><p className="eyebrow">02 / SEE & ORIENT</p><h2>Let images<br/><em>tell their story.</em></h2></div><p>Understand what a camera sees. Get a scene description, read printed signs, or ask a question about an image.</p></div>
  <div className="tool-card vision-grid">
   <div className="vision-input">
    <div className="field-head"><label>Choose a view</label><span className="mono">IMAGE / CAMERA</span></div>
    {camera?<div className="camera-box"><video ref={video} autoPlay playsInline/><button className="button primary" onClick={snapshot}>Capture image</button><button className="small-button" onClick={()=>{stream.current?.getTracks().forEach(t=>t.stop());setCamera(false)}}>Cancel camera</button></div>:
     <label className="drop-zone"><span className="camera-icon">◎</span><strong>Drop an image or browse</strong><small>JPG, PNG or WEBP · up to 12 MB</small><input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&choose(e.target.files[0])}/></label>}
    <div className="vision-actions"><button className="small-button" onClick={openCamera}>◎ Use camera</button><label className="small-button file-label">↑ Choose image<input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&choose(e.target.files[0])}/></label></div>
    {preview&&<img className="vision-preview" src={preview} alt="Selected image preview"/>}
    <div className="field-head"><label htmlFor="vision-mode">What should we do?</label></div><select id="vision-mode" value={mode} onChange={e=>setMode(e.target.value)}><option value="describe">Describe the scene</option><option value="ocr">Read printed text (OCR)</option><option value="qa">Ask a question</option></select>
    {mode==='qa'&&<input className="question-input" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What does the sign say? Is there a door?"/>}
    <button className="button primary full" disabled={!file||busy||(mode==='qa'&&!question.trim())} onClick={analyse}>{busy?'Analysing…':'Describe this image →'}</button>
    {error&&<p className="error" role="alert">{error}</p>}
   </div>
   <div className="vision-output" aria-live="polite"><div className="field-head"><span>VISUAL ACCESS REPORT</span><span className="mono">OUTPUT / 02</span></div>
    {result?<><div className={'safety-tag '+(result.safety_level||'caution')}>{(result.safety_level||'caution').toUpperCase()} — AI VISUAL ASSESSMENT</div><h3>What is visible</h3><p>{result.description||result.answer}</p>
     <h3>Spatial orientation</h3><div className="spatial-zones">{(['left','center','right'] as const).map(z=><div key={z}><span>{z.toUpperCase()}</span><p>{result.spatial_zones?.[z]||'Not reported'}</p></div>)}</div>
     {result.extracted_text&&<><h3>Text in image</h3><blockquote>{result.extracted_text}</blockquote></>}
     {result.hazards?.length>0&&<><h3>Possible hazards</h3><ul>{result.hazards.map((h,i)=><li key={i}>{h}</li>)}</ul></>}
     {result.provider==='offline_fallback'&&<p className="notice">Image is validated; Gemini is not configured, so the scene was not analysed.</p>}
     <button className="small-button" onClick={async()=>{const u=await api.tts(result.description||result.answer||'No description available',lang,1);new Audio(u).play()}}>▶ Read report aloud</button>
    </>:<div className="empty-output"><div className="empty-icon">◉</div><h3>A clearer picture of your surroundings.</h3><p>Descriptions, printed words, spatial cues, and possible hazards will appear here.</p></div>}
   </div>
  </div>
 </section>
}
