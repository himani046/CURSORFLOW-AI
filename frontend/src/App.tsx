import { useEffect, useState } from 'react'
import { ReactLenis } from 'lenis/react'
import { AccessibilityBar, type Profile } from './components/AccessibilityBar'
import { ScrollytellingHero } from './components/ScrollytellingHero'
import { SimplifyModule } from './components/SimplifyModule'
import { VisionModule } from './components/VisionModule'
import { SpeechModule } from './components/SpeechModule'
import { AssistantModule } from './components/AssistantModule'

export function App(){
 const [profile,setProfile]=useState<Profile>('Standard')
 const [lang,setLang]=useState('en-IN')
 const [contrast,setContrast]=useState(false)
 const [fontScale,setFontScale]=useState(1)
 const [reduced,setReduced]=useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
 const [bionic,setBionic]=useState(false)
 const [listening,setListening]=useState(false)
 const [lenisEnabled,setLenisEnabled]=useState(!reduced)
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)')
  const change=()=>setReduced(media.matches)
  media.addEventListener('change',change);return()=>media.removeEventListener('change',change)
 },[])
 useEffect(()=>{
  if(profile==='Low-Vision / Blind'){setContrast(true);setFontScale(1.25);setBionic(false)}
  else if(profile==='Deaf / Hard-of-Hearing'){setContrast(false)}
  else if(profile==='Cognitive / Dyslexia'){setBionic(true);setFontScale(1.1)}
  else if(profile==='Motor / Hands-Free'){setFontScale(1.15)}
 },[profile])
 useEffect(()=>{
  function key(e:KeyboardEvent){
   if(e.altKey&&e.key.toLowerCase()==='v'){e.preventDefault();setListening(v=>!v)}
   if(profile==='Motor / Hands-Free'&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
    const ids:Record<string,string>={'1':'assistant','2':'vision','3':'simplify','4':'speech'}
    if(ids[e.key]&&!(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)){
      document.getElementById(ids[e.key])?.scrollIntoView({behavior:reduced?'auto':'smooth'})
    }
   }
  }
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 },[profile,reduced])
 useEffect(()=>{setLenisEnabled(!reduced&&!contrast)},[reduced,contrast])
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'})
 return <div className={['app-shell',contrast?'contrast':'',profile==='Cognitive / Dyslexia'?'dyslexia':'',profile==='Motor / Hands-Free'?'motor':'',profile==='Deaf / Hard-of-Hearing'?'deaf':''].join(' ')} style={{'--font-scale':fontScale} as React.CSSProperties}>
  {lenisEnabled?<ReactLenis root options={{lerp:.08,smoothWheel:true}}/>:null}
  <AccessibilityBar profile={profile} setProfile={setProfile} lang={lang} setLang={setLang} contrast={contrast} setContrast={setContrast} fontScale={fontScale} setFontScale={setFontScale} reduced={reduced} setReduced={setReduced} bionic={bionic} setBionic={setBionic}/>
  {profile==='Deaf / Hard-of-Hearing'&&<div className="caption-banner" role="status">LIVE CAPTION MODE ACTIVE — Speech transcripts and text remain visible on screen.</div>}
  <ScrollytellingHero onJump={jump}/>
  <main id="workspace">
   <div className="workspace-intro"><span className="mono">THE ACCESS WORKSPACE / 4 LIVE MODULES</span><h2>Choose how you<br/><em>want to connect.</em></h2><p>Every tool works on its own. Use them together, at your pace.</p></div>
   <SimplifyModule lang={lang} bionic={bionic}/>
   <VisionModule lang={lang}/>
   <SpeechModule lang={lang}/>
   <AssistantModule lang={lang} handsFree={profile==='Motor / Hands-Free'}/>
  </main>
  <footer className="footer"><div className="brand"><span className="brand-mark">C</span> CURSORFLOW<span className="brand-dot">.</span></div><p>Built around one idea: access should never be an afterthought.</p><span className="mono">DESIGNED FOR HUMAN INDEPENDENCE / 2026</span><button className="button primary" onClick={()=>jump('top')}>Back to top ↑</button></footer>
  <button className="jump-dock" onClick={()=>jump('workspace')}>Jump to live tools ↓</button>
  {listening&&<div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Voice command panel"><button className="close-overlay" onClick={()=>setListening(false)} aria-label="Close">×</button><p className="mono">VOICE ASSISTANCE / ALT + V</p><h2>What would you like to do?</h2><div className="voice-commands">{[['Read aloud','simplify'],['Simplify','simplify'],['Describe image','vision'],['Start listening','speech'],['Everyday tasks','assistant']].map(([label,id])=><button key={label} onClick={()=>{setListening(false);jump(id)}}>{label} ↗</button>)}</div><p className="muted">Voice shortcut panel. Use your browser’s microphone button inside each tool to dictate.</p></div>}
 </div>
}
