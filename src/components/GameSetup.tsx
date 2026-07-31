import { useState } from "react";
import type { GameMode } from "../types/game";
export const PLAYER_COLORS=["#fb7185","#38bdf8","#34d399","#fbbf24","#a78bfa","#f472b6","#22d3ee","#fb923c"];
export default function GameSetup({onStart,onStats,onOnline}:{onStart:(p:string[],m:GameMode)=>void;onStats:()=>void;onOnline:()=>void}){
  const [count,setCount]=useState(2),[names,setNames]=useState(["",""]),[mode,setMode]=useState<GameMode>("classic"),[error,setError]=useState("");
  const changeCount=(n:number)=>{setCount(n);setNames(v=>Array.from({length:n},(_,i)=>v[i]||""))};
  const start=()=>{const p=names.map((n,i)=>n.trim()||`Spelare ${i+1}`);if(new Set(p.map(n=>n.toLowerCase())).size<p.length){setError("Alla spelare behöver unika namn.");return}onStart(p,mode)};
  return <main className="setup-shell">
    <section className="hero">
      <div className="brand"><span className="brand-mark">O</span><span>ORTEN <b>2.0</b></span></div>
      <div className="hero-copy"><p className="eyebrow">Svenska orter. Skarpa svängar.</p><h1>Dra linjen.<br/><em>Undvik krysset.</em></h1><p>Det lokala geografispelet där nästa ort kan bli din sista.</p></div>
      <div className="rule-strip"><span>01 Nämn en ort</span><span>02 Linjen dras</span><span>03 Korsar du åker du ut</span></div>
    </section>
    <section className="setup-card">
      <div className="section-label">Spelläge</div>
      <div className="mode-grid">
        <button className={mode==="classic"?"selected":""} onClick={()=>setMode("classic")}><strong>Klassisk</strong><small>Obegränsad betänketid</small></button>
        <button className={mode==="blitz"?"selected blitz":""} onClick={()=>setMode("blitz")}><strong>Blitz · 15 s</strong><small>Snabbt, nervigt, skoningslöst</small></button>
      </div>
      <div className="section-row"><span className="section-label">Spelare</span><div className="stepper"><button onClick={()=>changeCount(Math.max(2,count-1))}>−</button><b>{count}</b><button onClick={()=>changeCount(Math.min(8,count+1))}>+</button></div></div>
      <div className="name-grid">{names.map((name,i)=><label key={i}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><input value={name} onChange={e=>setNames(v=>v.map((x,j)=>j===i?e.target.value:x))} placeholder={`Spelare ${i+1}`} maxLength={18}/></label>)}</div>
      {error&&<p className="error">{error}</p>}
      <button className="primary" onClick={start}>Starta matchen <span>→</span></button>
      <button className="online-primary" onClick={onOnline}>Spela online <span>↗</span></button>
      <button className="text-button" onClick={onStats}>Visa lokal statistik</button>
    </section>
  </main>
}
