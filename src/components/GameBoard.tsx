import type { GameState } from "../types/game";
import { SWEDEN_OUTLINE_PATH,GOTLAND_PATH,OLAND_PATH,SWEDEN_VIEWBOX } from "../data/swedenOutline";
import { NORWAY_OUTLINE_PATH,NORWAY_VIEWBOX } from "../data/norwayOutline";
import { PLAYER_COLORS } from "./GameSetup";
export default function GameBoard({state}:{state:GameState}){
  const norway=state.country==="norway",viewBox=norway?NORWAY_VIEWBOX:SWEDEN_VIEWBOX;
  return <div className="board"><svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
    <defs><filter id="lineGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#153c39"/><stop offset="1" stopColor="#0b2429"/></linearGradient><pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#61b7b0" strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
    <rect width="320" height="700" fill="#071b24"/><rect width="320" height="700" fill="url(#grid)"/>
    <path d={norway?NORWAY_OUTLINE_PATH:SWEDEN_OUTLINE_PATH} fill="url(#land)" stroke="#3b7f78" strokeWidth="1.4"/>{!norway&&<><path d={GOTLAND_PATH} fill="#123733" stroke="#3b7f78"/><path d={OLAND_PATH} fill="#123733" stroke="#3b7f78"/></>}
    {state.lines.map((s,i)=>{const crossing=state.crossingLines?.includes(s),latest=i===state.lines.length-1;return <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} stroke={crossing?"#fb4f5e":PLAYER_COLORS[s.playerIndex]} strokeOpacity={latest?1:.58} strokeWidth={crossing?4:latest?3:1.8} strokeLinecap="round" filter={latest?"url(#lineGlow)":undefined} className={latest?"draw-line":""}/>})}
    {state.placedCities.map((p,i)=>{const latest=i===state.placedCities.length-1;return <g key={i} className={latest?"latest-dot":""}><circle cx={p.point.x} cy={p.point.y} r={latest?8:5} fill={PLAYER_COLORS[p.playerIndex]} fillOpacity=".18"/><circle cx={p.point.x} cy={p.point.y} r={latest?4.5:3.2} fill={PLAYER_COLORS[p.playerIndex]} stroke="#fff" strokeWidth="1.2"/>{latest&&<><rect x={Math.min(224,Math.max(3,p.point.x+8))} y={p.point.y-12} width={Math.min(88,p.city.name.length*6+18)} height="19" rx="5" fill="#ecfeff"/><text x={Math.min(232,Math.max(11,p.point.x+16))} y={p.point.y+1} fill="#09232a" fontSize="8" fontWeight="800">{p.city.name}</text></>}</g>})}
  </svg></div>
}
