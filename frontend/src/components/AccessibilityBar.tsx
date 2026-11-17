import { languages } from '../lib/i18n'
export type Profile='Standard'|'Low-Vision / Blind'|'Deaf / Hard-of-Hearing'|'Cognitive / Dyslexia'|'Motor / Hands-Free'
type Props={profile:Profile;setProfile:(p:Profile)=>void;lang:string;setLang:(s:string)=>void;contrast:boolean;setContrast:(v:boolean)=>void;fontScale:number;setFontScale:(n:number)=>void;reduced:boolean;setReduced:(v:boolean)=>void;bionic:boolean;setBionic:(v:boolean)=>void}
const profiles:Profile[]=['Standard','Low-Vision / Blind','Deaf / Hard-of-Hearing','Cognitive / Dyslexia','Motor / Hands-Free']
export function AccessibilityBar(p:Props){
 return <header className="access-bar">
  <div className="top-line"><a href="#top" className="brand"><span className="brand-mark">C</span> CURSORFLOW<span className="brand-dot">.</span></a>
   <div className="top-actions"><label className="sr-label" htmlFor="language">Language</label><select id="language" value={p.lang} onChange={e=>p.setLang(e.target.value)}>{languages.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select><button className="small-button" onClick={()=>p.setContrast(!p.contrast)} aria-pressed={p.contrast}>◐ Contrast</button><button className="small-button" onClick={()=>p.setReduced(!p.reduced)} aria-pressed={p.reduced}>Motion {p.reduced?'off':'on'}</button><button className="small-button" onClick={()=>p.setFontScale(Math.max(0.9,p.fontScale-.1))} aria-label="Decrease text size">A−</button><button className="small-button" onClick={()=>p.setFontScale(Math.min(1.5,p.fontScale+.1))} aria-label="Increase text size">A+</button></div>
  </div>
  <div className="profile-line"><span className="mono">ACCESS PROFILE</span><div className="profile-pills" role="group" aria-label="Adaptive accessibility profile">{profiles.map(item=><button key={item} className={p.profile===item?'profile-pill active':'profile-pill'} onClick={()=>p.setProfile(item)} aria-pressed={p.profile===item}>{item}</button>)}</div><label className="toggle-label"><input type="checkbox" checked={p.bionic} onChange={e=>p.setBionic(e.target.checked)}/> Bionic reading</label></div>
 </header>
}
