import { useRef,useState } from "react";
import type { GameState,NordicCountry } from "../types/game";
import { EUROPE_OUTLINES,EUROPE_VIEWBOX } from "../data/europeOutlines";
import { PLAYER_COLORS } from "./GameSetup";

const MAX_ZOOM=18;

const countryStyle:Record<NordicCountry,{stroke:string;fill:string}>={
  sweden:{stroke:"#3b7f78",fill:"#123733"},norway:{stroke:"#ff4268",fill:"#351b2a"},finland:{stroke:"#27d9ff",fill:"#0b2b35"},denmark:{stroke:"#fff",fill:"#353946"},germany:{stroke:"#f4c542",fill:"#2d2417"},netherlands:{stroke:"#ff8c42",fill:"#3a2417"},belgium:{stroke:"#ffd447",fill:"#332d16"},luxembourg:{stroke:"#70d6ff",fill:"#17313a"},france:{stroke:"#7aa2ff",fill:"#19243e"},estonia:{stroke:"#4895ef",fill:"#152943"},latvia:{stroke:"#b56576",fill:"#351d25"},lithuania:{stroke:"#80b918",fill:"#263213"},poland:{stroke:"#ff5d8f",fill:"#381b27"},switzerland:{stroke:"#ff595e",fill:"#371a1b"},austria:{stroke:"#ef476f",fill:"#351923"},hungary:{stroke:"#06d6a0",fill:"#12352d"},italy:{stroke:"#52b788",fill:"#15332a"},spain:{stroke:"#ffb703",fill:"#382c12"}
};

const clientToSvgPoint=(svg:SVGSVGElement,clientX:number,clientY:number)=>{
  const matrix=svg.getScreenCTM();
  if(matrix){const point=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());return{x:point.x,y:point.y}}
  const rect=svg.getBoundingClientRect();
  return{x:(clientX-rect.left)/rect.width*620,y:(clientY-rect.top)/rect.height*1160};
};

export default function GameBoard({state}:{state:GameState}){
  const [view,setView]=useState({x:0,y:0,scale:1}),pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef<{distance:number;center:{x:number;y:number};view:{x:number;y:number;scale:number}}|null>(null);
  const countries=[state.country,...state.unlockedCountries.filter(country=>country!==state.country)] as NordicCountry[];
  const onPointerDown=(event:React.PointerEvent<SVGSVGElement>)=>{
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId,clientToSvgPoint(event.currentTarget,event.clientX,event.clientY));
    const points=[...pointers.current.values()];
    if(points.length===2){const[a,b]=points;gesture.current={distance:Math.max(.001,Math.hypot(a.x-b.x,a.y-b.y)),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},view}}
    else gesture.current={distance:0,center:points[0],view};
  };
  const onPointerMove=(event:React.PointerEvent<SVGSVGElement>)=>{
    if(!pointers.current.has(event.pointerId)||!gesture.current)return;
    pointers.current.set(event.pointerId,clientToSvgPoint(event.currentTarget,event.clientX,event.clientY));
    const points=[...pointers.current.values()],start=gesture.current;
    if(points.length===1){setView({...start.view,x:start.view.x+(points[0].x-start.center.x),y:start.view.y+(points[0].y-start.center.y)});return}
    const[a,b]=points,currentDistance=Math.hypot(a.x-b.x,a.y-b.y),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    const scale=Math.min(MAX_ZOOM,Math.max(.65,start.view.scale*(currentDistance/start.distance)));
    const anchorX=(start.center.x-start.view.x)/start.view.scale,anchorY=(start.center.y-start.view.y)/start.view.scale;
    setView({scale,x:center.x-anchorX*scale,y:center.y-anchorY*scale});
  };
  const onPointerUp=(event:React.PointerEvent<SVGSVGElement>)=>{
    pointers.current.delete(event.pointerId);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    const remaining=[...pointers.current.values()];
    gesture.current=remaining.length===1?{distance:0,center:remaining[0],view}:null;
  };
  const zoom=(event:React.WheelEvent<SVGSVGElement>)=>{
    event.preventDefault();
    const point=clientToSvgPoint(event.currentTarget,event.clientX,event.clientY);
    setView(current=>{const scale=Math.min(MAX_ZOOM,Math.max(.65,current.scale*(event.deltaY>0?.9:1.1))),anchorX=(point.x-current.x)/current.scale,anchorY=(point.y-current.y)/current.scale;return{scale,x:point.x-anchorX*scale,y:point.y-anchorY*scale}});
  };
  return <div className="board nordic-board"><svg viewBox={EUROPE_VIEWBOX} preserveAspectRatio="xMidYMid meet" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={zoom}>
    <defs><filter id="lineGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="countryGlow"><feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#61b7b0" strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
    <rect width="620" height="1160" fill="#071b24"/><rect width="620" height="1160" fill="url(#grid)"/>
    <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
      {countries.map(country=>{const unlocked=country!==state.country,style=countryStyle[country],outline=EUROPE_OUTLINES[country];return <path key={country} d={outline.path} fill={style.fill} fillRule="evenodd" stroke={style.stroke} strokeWidth={unlocked?2.2:1.5} vectorEffect="non-scaling-stroke" className={unlocked?`country-draw ${country}`:""}/>})}
      {state.lines.map((s,i)=>{const crossing=state.crossingLines?.includes(s),latest=i===state.lines.length-1;return <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} stroke={crossing?"#fb4f5e":PLAYER_COLORS[s.playerIndex]} strokeOpacity={latest?1:.58} strokeWidth={crossing?4:latest?3:1.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" filter={latest?"url(#lineGlow)":undefined} className={latest?"draw-line":""}/>})}
      {state.placedCities.map((p,i)=>{const latest=i===state.placedCities.length-1,inv=1/view.scale,labelWidth=Math.min(88,p.city.name.length*6+18);return <g key={i} className={latest?"latest-dot":""}><circle cx={p.point.x} cy={p.point.y} r={(latest?8:5)*inv} fill={PLAYER_COLORS[p.playerIndex]} fillOpacity=".18"/><circle cx={p.point.x} cy={p.point.y} r={(latest?4.5:3.2)*inv} fill={PLAYER_COLORS[p.playerIndex]} stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>{latest&&<><rect x={p.point.x+8*inv} y={p.point.y-12*inv} width={labelWidth*inv} height={19*inv} rx={5*inv} fill="#ecfeff"/><text x={p.point.x+16*inv} y={p.point.y+1*inv} fill="#09232a" fontSize={8*inv} fontWeight="800">{p.city.name}</text></>}</g>})}
    </g>
  </svg><div className="map-tools"><button onClick={()=>setView({x:0,y:0,scale:1})} aria-label="Återställ kartan">⌂</button><span>Nyp eller dra kartan</span></div></div>
}
