import { useState } from "react";
import type { Country, GameMode } from "../types/game";
export const PLAYER_COLORS=["#fb7185","#38bdf8","#34d399","#fbbf24","#a78bfa","#f472b6","#22d3ee","#fb923c"];
export default function GameSetup({onStart,onStats,onOnline}:{onStart:(p:string[],m:GameMode,c:Country)=>void;onStats:()=>void;onOnline:()=>void}){
  const [count,setCount]=useState(2),[names,setNames]=useState(["",""]),[mode,setMode]=useState<GameMode>("classic"),[country,setCountry]=useState<Country>("sweden"),[error,setError]=useState("");
  const changeCount=(n:number)=>{setCount(n);setNames(v=>Array.from({length:n},(_,i)=>v[i]||""))};
  const start=()=>{const p=names.map((n,i)=>n.trim()||`Spelare ${i+1}`);if(new Set(p.map(n=>n.toLowerCase())).size<p.length){setError("Alla spelare behöver unika namn.");return}onStart(p,mode,country)};
  return <main className="setup-shell">
    <section className="hero">
      <div className="landing-actions">
        <button className="round-action" onClick={onStats} aria-label="Inställningar och statistik">⚙</button>
        <button className="leaderboard-action" onClick={onStats}><span>♛</span> Topplista</button>
      </div>
      <div className="orten-logo" aria-label="ORTEN">
        <span className="pin-logo"><i/></span><h1>ORTEN</h1>
      </div>
      <p className="landing-subtitle">Det nordiska geografispelet där<br/>nästa ort kan bli din <em>sista.</em></p>
    </section>
    <section className="setup-card">
      <div className="section-label">Land</div>
      <div className="country-grid">
        <button className={country==="sweden"?"selected":""} onClick={()=>setCountry("sweden")}><span>🇸🇪</span> Sverige</button>
        <button className={country==="norway"?"selected":""} onClick={()=>setCountry("norway")}><span>🇳🇴</span> Norge</button>
      </div>
      <div className="section-label">Spelläge</div>
      <div className="mode-grid">
        <button className={mode==="classic"?"selected":""} onClick={()=>setMode("classic")}><span className="mode-icon">⌖</span><span><strong>Klassisk</strong><small>Obegränsad betänketid</small></span></button>
        <button className={mode==="blitz"?"selected blitz":""} onClick={()=>setMode("blitz")}><span className="mode-icon blitz-icon">ϟ</span><span><strong>Blitz · 15 s</strong><small>Snabbt, nervigt, skoningslöst</small></span></button>
      </div>
      <div className="section-row"><span className="section-label">Spelare</span><div className="stepper"><button onClick={()=>changeCount(Math.max(2,count-1))}>−</button><b>{count}</b><button onClick={()=>changeCount(Math.min(8,count+1))}>+</button></div></div>
      <div className="name-grid">{names.map((name,i)=><label key={i}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><i className="player-icon">♟</i><input value={name} onChange={e=>setNames(v=>v.map((x,j)=>j===i?e.target.value:x))} placeholder={`Spelare ${i+1}`} maxLength={18}/></label>)}</div>
      {error&&<p className="error">{error}</p>}
      <button className="primary" onClick={start}>Starta matchen <span>→</span></button>
      <button className="online-primary" onClick={onOnline}>Spela online <span>↗</span></button>
      <button className="text-button" onClick={onStats}>Visa lokal statistik</button>
    </section>
  </main>
}
