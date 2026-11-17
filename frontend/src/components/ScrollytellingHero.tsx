import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
type Props={onJump:(id:string)=>void}
export function ScrollytellingHero({onJump}:Props){
 const ref=useRef<HTMLElement>(null);const reduced=useReducedMotion()
 const {scrollYProgress}=useScroll({target:ref,offset:['start start','end end']})
 const progress=useSpring(scrollYProgress,{stiffness:80,damping:24})
 const rotate=useTransform(progress,[0,1],[-18,100])
 const scale=useTransform(progress,[0,.5,1],[1,1.16,.84])
 useEffect(()=>{if(reduced)return},[reduced])
 const nodes=[{key:'VOICE',id:'assistant',x:'50%',y:'7%'},{key:'VISION',id:'vision',x:'82%',y:'49%'},{key:'TEXT',id:'simplify',x:'50%',y:'88%'},{key:'SPEECH',id:'speech',x:'18%',y:'49%'}]
 return <section ref={ref} className="story" id="top">
  <div className="story-sticky">
   <div className="story-copy"><p className="eyebrow">ACCESS IS A HUMAN RIGHT / 001</p><h1>Make the digital<br/><em>world reachable.</em></h1><p className="hero-sub">A voice that listens. Words that make sense. Images that speak. Tools that adapt to you.</p>
    <div className="hero-actions"><button className="button primary" onClick={()=>onJump('workspace')}>Explore live tools ↘</button><span className="mono">SCROLL TO CONNECT ↓</span></div>
   </div>
   <div className="prism-wrap" aria-label="Four linked accessibility modules">
    <svg className="tether" viewBox="0 0 500 500" role="img" aria-label="Connections between voice, vision, text and speech">
     <motion.circle cx="250" cy="250" r="155" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" style={{rotate}}/>
     <motion.path d="M250 45 C400 80 425 200 455 250 C420 400 330 420 250 455 C100 420 75 300 45 250 C80 100 170 75 250 45" fill="none" stroke="#d9381e" strokeWidth="2" style={{pathLength:progress}}/>
     <path d="M250 85 Q420 250 250 415 Q80 250 250 85" fill="none" stroke="currentColor" strokeWidth="1" opacity=".35"/>
    </svg>
    <motion.div className="prism-core" style={{rotate:reduced?0:rotate,scale}}><span>CF</span><small>ACCESS<br/>ENGINE</small></motion.div>
    {nodes.map(n=><button key={n.key} className="orbit-node" style={{left:n.x,top:n.y}} onClick={()=>onJump(n.id)}><span>{n.key}</span><b>↗</b></button>)}
    <span className="prism-caption mono">SCROLL-LINKED / MULTIMODAL SYSTEM</span>
   </div>
   <div className="story-bottom"><span className="mono">01 — LISTEN</span><span className="mono">02 — SEE</span><span className="mono">03 — UNDERSTAND</span><span className="mono">04 — ACT</span></div>
  </div>
 </section>
}
