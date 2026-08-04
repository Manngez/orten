import { useEffect,useMemo,useRef,useState } from "react";
import type { GameState,NordicCountry } from "../types/game";
import { EUROPE_HEIGHT,EUROPE_OUTLINES,EUROPE_VIEWBOX,EUROPE_WIDTH } from "../data/europeOutlines";
import { COUNTRY_META } from "../data/countryCatalog";
import { PLAYER_COLORS } from "./GameSetup";

const MAX_ZOOM=18;

const darkFill=(hex:string)=>{const value=hex.replace("#","");if(value.length!==6)return"#172c32";const channel=(start:number)=>Math.round(Number.parseInt(value.slice(start,start+2),16)*.18+12).toString(16).padStart(2,"0");return`#${channel(0)}${channel(2)}${channel(4)}`};
const countryStyle=(country:NordicCountry)=>({stroke:COUNTRY_META[country].color,fill:darkFill(COUNTRY_META[country].color)});

type OutlinePoint={x:number;y:number};
const FAST_OUTLINES=new Map<string,string>();
const pointDistanceToSegment=(point:OutlinePoint,start:OutlinePoint,end:OutlinePoint)=>{
  const dx=end.x-start.x,dy=end.y-start.y;
  if(dx===0&&dy===0)return Math.hypot(point.x-start.x,point.y-start.y);
  const t=Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(point.x-(start.x+t*dx),point.y-(start.y+t*dy));
};
const simplifyPoints=(points:OutlinePoint[],tolerance:number):OutlinePoint[]=>{
  if(points.length<=2)return points;
  const keep=new Uint8Array(points.length),stack:Array<[number,number]>=[[0,points.length-1]];keep[0]=1;keep[points.length-1]=1;
  while(stack.length){const[start,end]=stack.pop()!;let furthest=tolerance,index=-1;for(let i=start+1;i<end;i++){const distance=pointDistanceToSegment(points[i],points[start],points[end]);if(distance>furthest){furthest=distance;index=i}}if(index>=0){keep[index]=1;stack.push([start,index],[index,end])}}
  return points.filter((_,index)=>keep[index]===1);
};
const fastOutline=(country:NordicCountry,compact:boolean)=>{
  const cacheKey=`${country}:${compact?"compact":"detail"}`,cached=FAST_OUTLINES.get(cacheKey);if(cached)return cached;
  const source=EUROPE_OUTLINES[country]?.path??"";
  const simplified=(source.match(/M[^M]+/g)??[]).map(part=>{
    const values=(part.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number),points:OutlinePoint[]=[];
    for(let i=0;i+1<values.length;i+=2)points.push({x:values[i],y:values[i+1]});
    if(points.length<3)return"";
    const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
    if(Math.max(...xs)<0||Math.min(...xs)>EUROPE_WIDTH||Math.max(...ys)<0||Math.min(...ys)>EUROPE_HEIGHT)return"";
    const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
    if(compact&&width<.7&&height<.7)return"";
    const closed=/Z\s*$/.test(part),radial=[points[0]],minDistance=compact?.7:.3;
    for(let i=1;i<points.length;i++){
      const point=points[i],last=radial.at(-1)!,dx=point.x-last.x,dy=point.y-last.y;
      if(i===points.length-1||dx*dx+dy*dy>=minDistance*minDistance)radial.push(point);
    }
    const kept=simplifyPoints(radial,compact?.65:.28);
    if(kept.length<3)return"";
    return `M${kept[0].x} ${kept[0].y} ${kept.slice(1).map(point=>`L${point.x} ${point.y}`).join(" ")}${closed?" Z":""}`;
  }).filter(Boolean).join(" ");
  FAST_OUTLINES.set(cacheKey,simplified);return simplified;
};

const fitCountries=(countries:NordicCountry[])=>{
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const country of countries){
    const values=(EUROPE_OUTLINES[country]?.path.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number);
    for(let index=0;index+1<values.length;index+=2){const x=values[index],y=values[index+1];if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
  }
  if(!Number.isFinite(minX)||maxX<=minX||maxY<=minY)return{x:0,y:0,scale:1};
  const padding=18,width=maxX-minX,height=maxY-minY;
  const scale=Math.min(MAX_ZOOM,Math.max(.65,Math.min((EUROPE_WIDTH-padding*2)/width,(EUROPE_HEIGHT-padding*2)/height)));
  return{scale,x:EUROPE_WIDTH/2-(minX+maxX)/2*scale,y:EUROPE_HEIGHT/2-(minY+maxY)/2*scale};
};

const clientToSvgPoint=(svg:SVGSVGElement,clientX:number,clientY:number)=>{
  const matrix=svg.getScreenCTM();
  if(matrix){const point=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());return{x:point.x,y:point.y}}
  const rect=svg.getBoundingClientRect();
  return{x:(clientX-rect.left)/rect.width*EUROPE_WIDTH,y:(clientY-rect.top)/rect.height*EUROPE_HEIGHT};
};

const crossingPoint=(lines:GameState["crossingLines"])=>{
  if(!lines)return null;
  const[a,b]=lines,x1=a.from.x,y1=a.from.y,x2=a.to.x,y2=a.to.y,x3=b.from.x,y3=b.from.y,x4=b.to.x,y4=b.to.y;
  const denominator=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if(Math.abs(denominator)<1e-9)return null;
  return{x:((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/denominator,y:((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/denominator};
};

export default function GameBoard({state}:{state:GameState}){
  const countries=[state.country,...state.unlockedCountries.filter(country=>country!==state.country)] as NordicCountry[];
  const countryKey=countries.join("|"),defaultView=useMemo(()=>fitCountries(countries),[countryKey]);
  const [view,setView]=useState(defaultView),pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef<{distance:number;center:{x:number;y:number};view:{x:number;y:number;scale:number}}|null>(null),frame=useRef<number|null>(null),queuedView=useRef<typeof view|null>(null);
  const compactMap=countries.length>10;
  useEffect(()=>setView(defaultView),[defaultView]);
  const newestUnlocked=state.unlockedCountries.at(-1);
  const scheduleView=(next:typeof view)=>{queuedView.current=next;if(frame.current!==null)return;frame.current=requestAnimationFrame(()=>{frame.current=null;if(queuedView.current)setView(queuedView.current)})};
  const countryLayer=useMemo(()=>countries.map(country=>{const unlocked=country!==state.country,animate=!compactMap&&unlocked&&country===newestUnlocked,style=countryStyle(country),outline=fastOutline(country,compactMap);return outline?<path key={country} d={outline} fill={style.fill} fillRule="evenodd" stroke={style.stroke} strokeWidth={unlocked?.7:1.5} strokeOpacity={unlocked?.5:1} vectorEffect="non-scaling-stroke" pointerEvents="none" className={animate?`country-draw ${country}`:""}/>:null}),[state.country,state.unlockedCountries,newestUnlocked,compactMap]);
  const lineLayer=useMemo(()=>state.lines.map((s,i)=>{const crossing=state.crossingLines?.includes(s),latest=i===state.lines.length-1;return <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} stroke={crossing?"#ff3347":PLAYER_COLORS[s.playerIndex]} strokeOpacity={crossing||latest?1:.58} strokeWidth={crossing?5:latest?3:1.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" filter={crossing||latest?"url(#lineGlow)":undefined} className={`${latest?"draw-line ":""}${crossing?"crossing-line":""}`}/>}),[state.lines,state.crossingLines]);
  const intersection=useMemo(()=>crossingPoint(state.crossingLines),[state.crossingLines]);
  const cityLayer=useMemo(()=>state.placedCities.map((p,i)=>{const latest=i===state.placedCities.length-1,inv=1/view.scale,labelWidth=Math.min(88,p.city.name.length*6+18);return <g key={i} className={latest?"latest-dot":""}><circle cx={p.point.x} cy={p.point.y} r={(latest?8:5)*inv} fill={PLAYER_COLORS[p.playerIndex]} fillOpacity=".18"/><circle cx={p.point.x} cy={p.point.y} r={(latest?4.5:3.2)*inv} fill={PLAYER_COLORS[p.playerIndex]} stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>{latest&&<><rect x={p.point.x+8*inv} y={p.point.y-12*inv} width={labelWidth*inv} height={19*inv} rx={5*inv} fill="#ecfeff"/><text x={p.point.x+16*inv} y={p.point.y+1*inv} fill="#09232a" fontSize={8*inv} fontWeight="800">{p.city.name}</text></>}</g>}),[state.placedCities,view.scale]);
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
    if(points.length===1){scheduleView({...start.view,x:start.view.x+(points[0].x-start.center.x),y:start.view.y+(points[0].y-start.center.y)});return}
    const[a,b]=points,currentDistance=Math.hypot(a.x-b.x,a.y-b.y),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    const scale=Math.min(MAX_ZOOM,Math.max(.65,start.view.scale*(currentDistance/start.distance)));
    const anchorX=(start.center.x-start.view.x)/start.view.scale,anchorY=(start.center.y-start.view.y)/start.view.scale;
    scheduleView({scale,x:center.x-anchorX*scale,y:center.y-anchorY*scale});
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
  const zoomBy=(factor:number)=>setView(current=>{const scale=Math.min(MAX_ZOOM,Math.max(.65,current.scale*factor)),anchorX=(EUROPE_WIDTH/2-current.x)/current.scale,anchorY=(EUROPE_HEIGHT/2-current.y)/current.scale;return{scale,x:EUROPE_WIDTH/2-anchorX*scale,y:EUROPE_HEIGHT/2-anchorY*scale}});
  return <div className="board nordic-board"><svg viewBox={EUROPE_VIEWBOX} preserveAspectRatio="xMidYMid meet" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={zoom}>
    <defs><filter id="lineGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="countryGlow"><feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#61b7b0" strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
    <rect width={EUROPE_WIDTH} height={EUROPE_HEIGHT} fill="#071b24"/><rect width={EUROPE_WIDTH} height={EUROPE_HEIGHT} fill="url(#grid)"/>
    <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
      <g className="country-layer">{countryLayer}</g>
      {lineLayer}
      {intersection&&<g className="crossing-point" transform={`translate(${intersection.x} ${intersection.y})`}><circle r={12/view.scale} fill="#ff3347" fillOpacity=".3"/><circle r={6/view.scale} fill="#ff3347" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke"/></g>}
      {cityLayer}
    </g>
  </svg><div className="map-tools"><button onClick={()=>zoomBy(1.35)} aria-label="Zooma in">+</button><button onClick={()=>zoomBy(1/1.35)} aria-label="Zooma ut">−</button><button onClick={()=>setView(defaultView)} aria-label="Anpassa kartan till aktiva länder">⌂</button><span>Nyp eller dra kartan</span></div></div>
}
