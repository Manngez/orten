import { useState } from "react";
import type { Country, GameMode } from "../types/game";
export const PLAYER_COLORS=["#ffb25a","#79d8c8","#c3a2f7","#ff7c93","#9dd67a","#7fb4ff","#f4d56b","#d5a19a"];

export default function GameSetup({onStart,onStats,onOnline}:{onStart:(p:string[],m:GameMode,c:Country,duelBreakTarget?:number)=>void;onStats:()=>void;onOnline:()=>void}){
  const [count,setCount]=useState(2),[names,setNames]=useState(["",""]),[mode,setMode]=useState<GameMode>("race"),[error,setError]=useState(""),[showRules,setShowRules]=useState(false);
  const changeCount=(n:number)=>{setCount(n);setNames(v=>Array.from({length:n},(_,i)=>v[i]||""))};
  const selectMode=(next:GameMode)=>{setMode(next);if(next==="duel"&&count!==2)changeCount(2)};
  const start=()=>{const players=names.map((name,i)=>name.trim()||`Spelare ${i+1}`);if(new Set(players.map(name=>name.toLocaleLowerCase("sv"))).size!==players.length){setError("Ge spelarna olika namn.");return}onStart(players,mode,"sweden",1)};
  return <main className="kamp-home">
    <header className="kamp-header"><a className="kamp-brand" href="./" aria-label="Kartkamp startsida"><span className="kamp-brand-symbol">✳</span><b>KARTKAMP</b></a><nav><button onClick={()=>setShowRules(true)}>Så fungerar det</button><button onClick={onStats}>Statistik ↗</button></nav></header>
    <div className="kamp-layout">
      <section className="kamp-story"><div className="kamp-kicker"><span/> GEOGRAFI MÖTER STRATEGI <small>01 / 03</small></div><h1>Världen är<br/>din <em>spelplan.</em></h1><p className="kamp-lead">Välj en ort. Dra en linje. Tänk ett drag längre än dina vänner.</p>
        <div className="kamp-illustration" aria-hidden="true"><div className="kamp-orbit orbit-one"/><div className="kamp-orbit orbit-two"/><span className="kamp-pin pin-one">Umeå</span><span className="kamp-pin pin-two">Örebro</span><span className="kamp-pin pin-three">Malmö</span><svg viewBox="0 0 500 350" preserveAspectRatio="none"><path d="M98 76 C150 145 265 65 332 166 S410 230 301 285" fill="none" stroke="#ffb25a" strokeWidth="3" strokeDasharray="9 8"/><circle cx="98" cy="76" r="6" fill="#ffb25a"/><circle cx="332" cy="166" r="6" fill="#ffb25a"/><circle cx="301" cy="285" r="7" fill="#ffb25a"/></svg><span className="kamp-compass">N<br/>↑</span></div>
        <div className="kamp-principles"><div><b>01</b><span>Turas om att placera orter</span></div><div><b>02</b><span>Längre linjer ger fler poäng</span></div><div><b>03</b><span>Undvik att korsa din väg</span></div></div>
      </section>
      <section className="kamp-panel" aria-label="Skapa match"><div className="kamp-panel-head"><span>NY MATCH / SVERIGE</span><h2>Samla ditt lag.</h2><p>Spela tillsammans på samma skärm. Inga konton behövs.</p></div>
        <div className="kamp-field-label">VÄLJ SPELSÄTT</div><div className="kamp-modes">
          <button className={mode==="race"?"active":""} onClick={()=>selectMode("race")} aria-pressed={mode==="race"}><span className="mode-number">01</span><span><b>Poängjakten</b><small>Fem drag var. Flest poäng vinner. En korsning kostar 100 p.</small></span><i>↗</i></button>
          <button className={mode==="classic"?"active":""} onClick={()=>selectMode("classic")} aria-pressed={mode==="classic"}><span className="mode-number">02</span><span><b>Sista kvar</b><small>En korsning slår ut dig. Klassisk överlevnad.</small></span><i>↗</i></button>
          <button className={mode==="blitz"?"active":""} onClick={()=>selectMode("blitz")} aria-pressed={mode==="blitz"}><span className="mode-number">03</span><span><b>Blitz</b><small>Originalreglerna med 15 sekunder per drag.</small></span><i>↗</i></button>
          <button className={mode==="duel"?"active":""} onClick={()=>selectMode("duel")} aria-pressed={mode==="duel"}><span className="mode-number">04</span><span><b>Duell</b><small>Två spelare bygger varsin linje.</small></span><i>↗</i></button>
        </div>
        <div className="kamp-players-head"><span className="kamp-field-label">SPELARE</span><div className="kamp-stepper"><button aria-label="Färre spelare" disabled={mode==="duel"||count<=2} onClick={()=>changeCount(count-1)}>−</button><b>{count}</b><button aria-label="Fler spelare" disabled={mode==="duel"||count>=8} onClick={()=>changeCount(count+1)}>+</button></div></div>
        <div className="kamp-names">{names.map((name,i)=><label key={i}><span style={{background:PLAYER_COLORS[i]}}>{String(i+1).padStart(2,"0")}</span><input value={name} onChange={event=>setNames(v=>v.map((n,j)=>j===i?event.target.value:n))} placeholder={`Spelare ${i+1}`} aria-label={`Namn på spelare ${i+1}`} maxLength={18}/></label>)}</div>
        {error&&<p className="kamp-error" role="alert">{error}</p>}
        <button className="kamp-start" onClick={start}>Starta spelet <span>↗</span></button><button className="kamp-online" onClick={onOnline}>Spela online med vänner <span>→</span></button>
      </section>
    </div><footer className="kamp-footer"><span>BYGGT FÖR NYFIKNA HJÄRNOR</span><span>SVENSKA ORTER · 2–8 SPELARE</span></footer>
    {showRules&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowRules(false)}><section className="kamp-rules" role="dialog" aria-modal="true" aria-labelledby="kamp-rules-title"><button className="kamp-close" onClick={()=>setShowRules(false)} aria-label="Stäng">×</button><span className="kamp-field-label">SPELGUIDE</span><h2 id="kamp-rules-title">Så spelar du.</h2><ol><li><b>Välj en ort.</b> Skriv en svensk ort som inte redan används.</li><li><b>Dra vidare.</b> Kartkamp kopplar orten till föregående ort och ger poäng för sträckan.</li><li><b>Se upp för krysset.</b> I Poängjakten tappar du 100 poäng. I Sista kvar blir du utslagen.</li><li><b>Vinn matchen.</b> Poängjakten slutar efter fem drag per spelare. Flest poäng vinner.</li></ol><button className="kamp-start" onClick={()=>setShowRules(false)}>Jag är redo <span>↗</span></button></section></div>}
  </main>;
}
