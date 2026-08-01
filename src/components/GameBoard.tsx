import { useRef,useState } from "react";
import type { GameState,NordicCountry } from "../types/game";
import { EUROPE_OUTLINES,EUROPE_VIEWBOX } from "../data/europeOutlines";
import { PLAYER_COLORS } from "./GameSetup";

const countryStyle:Record<NordicCountry,{stroke:string;fill:string}>={
  sweden:{stroke:"#3b7f78",fill:"#123733"},norway:{stroke:"#ff4268",fill:"#351b2a"},finland:{stroke:"#27d9ff",fill:"#0b2b35"},denmark:{stroke:"#fff",fill:"#353946"},germany:{stroke:"#f4c542",fill:"#2d2417"},netherlands:{stroke:"#ff8c42",fill:"#3a2417"},belgium:{stroke:"#ffd447",fill:"#332d16"},luxembourg:{stroke:"#70d6ff",fill:"#17313a"},france:{stroke:"#7aa2ff",fill:"#19243e"}
};

export default function GameBoard({state}:{state:GameState}){
  const [view,setView]=useState({x:0,y:0,scale:1}),pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef<{distance:number;center:{x:number;y:number};view:{x:number;y:number;scale:number}}|null>(null);
  const countries=[state.country,...state.unlockedCountries.filter(country=>country!==state.country)] as NordicCountry[];
  const onPointerDown=(event:React.PointerEvent<SVGSVGElement>)=>{event.currentTarget.setPointerCapture(event.pointerId);pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.current.size===2){const[a,b]=[...pointers.current.values()];gesture.current={distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},view}}else gesture.current={distance:0,center:{x:event.clientX,y:event.clientY},view}};
  const onPointerMove=(event:React.PointerEvent<SVGSVGElement>)=>{if(!pointers.current.has(event.pointerId)||!gesture.current)return;pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.current.values()],start=gesture.current;if(points.length===1){setView({...start.view,x:start.view.x+(points[0].x-start.center.x),y:start.view.y+(points[0].y-start.center.y)});return}const[a,b]=points,currentDistance=Math.hypot(a.x-b.x,a.y-b.y),scale=Math.min(6,Math.max(.65,start.view.scale*(currentDistance/start.distance))),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};setView({scale,x:start.view.x+(center.x-start.center.x),y:start.view.y+(center.y-start.center.y)})};
  const onPointerUp=(event:React.PointerEvent<SVGSVGElement>)=>{pointers.current.delete(event.pointerId);gesture.current=null};
  const zoom=(event:React.WheelEvent<SVGSVGElement>)=>{event.preventDefault();setView(current=>({...current,scale:Math.min(6,Math.max(.65,current.scale*(event.deltaY>0?.9:1.1)))}))};
  return <div className="board nordic-board"><svg viewBox={EUROPE_VIEWBOX} preserveAspectRatio="xMidYMid meet" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={zoom}>
    <defs><filter id="lineGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="countryGlow"><feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#61b7b0" strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
    <rect width="620" height="1160" fill="#071b24"/><rect width="620" height="1160" fill="url(#grid)"/>
    <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
      {countries.map(country=>{const unlocked=country!==state.country,style=countryStyle[country],outline=EUROPE_OUTLINES[country];return <path key={country} d={outline.path} fill={style.fill} fillRule="evenodd" stroke={style.stroke} strokeWidth={unlocked?2.2:1.5} vectorEffect="non-scaling-stroke" filter={unlocked?"url(#countryGlow)":undefined} className={unlocked?`country-draw ${country}`:""}/>})}
      {state.lines.map((s,i)=>{const crossing=state.crossingLines?.includes(s),latest=i===state.lines.length-1;return <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} stroke={crossing?"#fb4f5e":PLAYER_COLORS[s.playerIndex]} strokeOpacity={latest?1:.58} strokeWidth={crossing?4:latest?3:1.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" filter={latest?"url(#lineGlow)":undefined} className={latest?"draw-line":""}/>})}
      {state.placedCities.map((p,i)=>{const latest=i===state.placedCities.length-1;return <g key={i} className={latest?"latest-dot":""}><circle cx={p.point.x} cy={p.point.y} r={latest?8:5} fill={PLAYER_COLORS[p.playerIndex]} fillOpacity=".18"/><circle cx={p.point.x} cy={p.point.y} r={latest?4.5:3.2} fill={PLAYER_COLORS[p.playerIndex]} stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>{latest&&<><rect x={p.point.x+8} y={p.point.y-12} width={Math.min(88,p.city.name.length*6+18)} height="19" rx="5" fill="#ecfeff"/><text x={p.point.x+16} y={p.point.y+1} fill="#09232a" fontSize="8" fontWeight="800">{p.city.name}</text></>}</g>})}
    </g>
  </svg><div className="map-tools"><button onClick={()=>setView({x:0,y:0,scale:1})} aria-label="Återställ kartan">⌂</button><span>Nyp eller dra kartan</span></div></div>
}
