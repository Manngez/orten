import { useEffect,useMemo,useState } from "react";
import { useGame } from "./hooks/useGame";
import GameSetup from "./components/GameSetup";
import GameBoard from "./components/GameBoard";
import CityInput from "./components/CityInput";
import StatsPanel from "./components/StatsPanel";
import { PLAYER_COLORS } from "./components/GameSetup";

function beep(kind:"move"|"out"){
  try{const C=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=kind==="out"?130:520;g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.start();o.stop(c.currentTime+.18)}catch{}
}
export default function App(){
  const game=useGame(),{state}=game;
  const [stats,setStats]=useState(false),[sound,setSound]=useState(()=>localStorage.getItem("blindkarta_sound")!=="off"),[left,setLeft]=useState(15);
  useEffect(()=>{localStorage.setItem("blindkarta_sound",sound?"on":"off")},[sound]);
  useEffect(()=>{setLeft(15)},[state.currentPlayerIndex,state.phase]);
  useEffect(()=>{if(state.phase!=="playing"||state.mode!=="blitz")return;const t=setInterval(()=>setLeft(v=>{if(v<=1){game.eliminateOnTimeout();return 15}return v-1}),1000);return()=>clearInterval(t)},[state.phase,state.mode,state.currentPlayerIndex,game.eliminateOnTimeout]);
  const counts=useMemo(()=>state.players.map((_,i)=>state.placedCities.filter(p=>p.playerIndex===i).length),[state.players,state.placedCities]);
  if(state.phase==="setup") return <><GameSetup onStart={game.startGame} onStats={()=>setStats(true)}/>{stats&&<StatsPanel onClose={()=>setStats(false)}/>}</>;
  const submit=(name:string)=>{const r=game.placeCity(name);if(r.success&&sound)beep("move");return r};
  return <main className="game-shell">
    <header className="topbar"><div className="brand compact"><span className="brand-mark">O</span><span>ORTEN <b>2.0</b></span></div><div className="top-actions"><span className={`mode-pill ${state.mode}`}>{state.mode==="blitz"?"BLITZ · 15 S":"KLASSISK"}</span><button aria-label="Ljud av eller på" onClick={()=>setSound(v=>!v)}>{sound?"♪":"×"}</button><button onClick={()=>confirm("Avsluta matchen?")&&game.resetGame()}>↗</button></div></header>
    <section className="play-layout">
      <aside className="status-panel">
        <div className="turn-label">Tur {state.placedCities.length+1} · {game.activeCount} kvar</div>
        <div className="current-player"><span style={{background:PLAYER_COLORS[state.currentPlayerIndex]}}>{state.currentPlayerIndex+1}</span><div><small>NU SPELAR</small><h2>{game.currentPlayer}</h2></div>{state.mode==="blitz"&&<div className={`timer ${left<=5?"danger":""}`}><b>{left}</b><small>SEK</small></div>}</div>
        {state.mode==="blitz"&&<div className="timer-track"><i style={{width:`${left/15*100}%`}}/></div>}
        <div className="scoreboard">{state.players.map((p,i)=><div key={p} className={`${i===state.currentPlayerIndex?"active":""} ${state.eliminated[i]?"out":""}`}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><b>{p}</b><small>{counts[i]} orter</small><strong>{state.scores[i]||0} p</strong></div>)}</div>
        <div className="desktop-input"><CityInput usedCityNames={state.usedCityNames} onPlaceCity={submit} disabled={false}/></div>
        <button className="undo" disabled={!game.canUndo} onClick={game.undoLastMove}>↶ Ångra senaste drag</button>
      </aside>
      <section className="map-wrap"><GameBoard state={state}/><div className="map-caption"><span><i/> Senaste ort</span><strong>{state.placedCities.at(-1)?.city.name||"Väntar på första orten"}</strong></div></section>
      <div className="mobile-input"><CityInput usedCityNames={state.usedCityNames} onPlaceCity={submit} disabled={false}/></div>
    </section>
    {state.lastElimination&&state.phase==="playing"&&<button className="elimination" onClick={game.clearLastElimination}><b>LINJEKORSNING</b><span>{state.lastElimination.playerName} är utslagen</span><small>Tryck för att stänga</small></button>}
    {state.phase==="gameover"&&<div className="modal-backdrop"><section className="result-card"><div className="trophy">★</div><p>MATCHEN ÄR AVGJORD</p><h1>{state.winner}</h1><h2>vinner ORTEN!</h2><div className="result-scores">{state.players.slice().sort((a,b)=>state.scores[state.players.indexOf(b)]-state.scores[state.players.indexOf(a)]).map(p=>{const i=state.players.indexOf(p);return <div key={p}><span style={{background:PLAYER_COLORS[i]}}>{i+1}</span><b>{p}</b><strong>{state.scores[i]} p</strong></div>})}</div><button className="primary" onClick={game.resetGame}>Spela igen <span>→</span></button><button className="text-button" onClick={()=>setStats(true)}>Visa statistik</button></section></div>}
    {stats&&<StatsPanel onClose={()=>setStats(false)}/>}
  </main>
}
