import { useCallback, useState } from "react";
import type { Country, GameMode, GameState, LineSegment, PlacedCity } from "../types/game";
import { createCityMap, getCities } from "../data/cities";
import { FINNISH_CITIES } from "../data/finlandCities";
import { project } from "../utils/projection";
import { findCrossing } from "../utils/geometry";
import { updateStatsAfterGame } from "../utils/storage";

const cityMaps={sweden:createCityMap("sweden"),norway:createCityMap("norway")};
const finnishMap=new Map(FINNISH_CITIES.map(city=>[city.name.toLocaleLowerCase("fi"),city]));
const emptyState: GameState = { phase:"setup", mode:"classic", country:"sweden", finlandUnlocked:false, players:[], eliminated:[], eliminationOrder:[], currentPlayerIndex:0, placedCities:[], usedCityNames:new Set(), lines:[], lastElimination:null, crossingLines:null, winner:null, scores:[] };
const nextActive = (out:boolean[], from:number) => {
  for(let n=1;n<=out.length;n++){ const i=(from+n)%out.length; if(!out[i]) return i; }
  return from;
};
const distance = (a:{x:number;y:number}, b:{x:number;y:number}) => Math.hypot(a.x-b.x,a.y-b.y);

export function useGame(){
  const [state,setState]=useState<GameState>(emptyState);
  const [history,setHistory]=useState<GameState[]>([]);
  const startGame=useCallback((players:string[],mode:GameMode,country:Country="sweden")=>{
    setHistory([]); setState({...emptyState,phase:"playing",players,mode,country,eliminated:players.map(()=>false),scores:players.map(()=>0)});
  },[]);
  const placeCity=useCallback((raw:string)=>{
    if(state.phase!=="playing") return {success:false,message:"Spelet är inte aktivt."};
    const key=raw.trim().toLocaleLowerCase(state.country==="norway"?"nb":"sv"),baseCity=cityMaps[state.country].get(key),finlandCity=state.finlandUnlocked?finnishMap.get(raw.trim().toLocaleLowerCase("fi")):undefined,city=baseCity??finlandCity;
    if(!city) return {success:false,message:`"${raw}" finns inte i ortslistan.`};
    if(state.usedCityNames.has(key)) return {success:false,message:`${city.name} har redan använts.`};
    setHistory(h=>[...h,state]);
    const point=project(city.lat,city.lng,state.country,!baseCity&&Boolean(finlandCity)), playerIndex=state.currentPlayerIndex;
    const previous=state.placedCities.at(-1);
    const points=previous ? Math.max(10,Math.round(distance(previous.point,point)*2)) : 50;
    const placed:PlacedCity={city,point,playerIndex,turnNumber:state.placedCities.length+1,points};
    const segment:LineSegment|null=previous?{from:previous.point,to:point,playerIndex,turnNumber:placed.turnNumber}:null;
    const crossing=segment?findCrossing(segment,state.lines):null;
    const used=new Set(state.usedCityNames); used.add(key);
    const scores=[...state.scores]; scores[playerIndex]+=points;
    let eliminated=[...state.eliminated], eliminationOrder=[...state.eliminationOrder];
    if(crossing){ eliminated[playerIndex]=true; scores[playerIndex]=Math.max(0,scores[playerIndex]-100); eliminationOrder.push({playerName:state.players[playerIndex],cityName:city.name}); }
    const placedCities=[...state.placedCities,placed], lines=segment?[...state.lines,segment]:state.lines;
    const active=eliminated.filter(v=>!v).length;
    if(active<=1){
      const winner=state.players[eliminated.findIndex(v=>!v)] || state.players[playerIndex];
      const counts=state.players.map((_,i)=>placedCities.filter(p=>p.playerIndex===i).length);
      updateStatsAfterGame(state.players,winner,eliminationOrder,placedCities.length,state.mode,scores,counts);
      setState({...state,phase:"gameover",placedCities,lines,usedCityNames:used,eliminated,eliminationOrder,lastElimination:crossing?eliminationOrder.at(-1)!:null,crossingLines:crossing,winner,scores});
    } else setState({...state,placedCities,lines,usedCityNames:used,eliminated,eliminationOrder,currentPlayerIndex:nextActive(eliminated,playerIndex),lastElimination:crossing?eliminationOrder.at(-1)!:null,crossingLines:crossing,scores});
    return {success:true,points};
  },[state]);
  const eliminateOnTimeout=useCallback(()=>{
    if(state.phase!=="playing") return;
    const i=state.currentPlayerIndex, eliminated=[...state.eliminated]; eliminated[i]=true;
    const event={playerName:state.players[i],cityName:"Tiden tog slut"};
    const eliminationOrder=[...state.eliminationOrder,event], active=eliminated.filter(v=>!v).length;
    if(active<=1){
      const winner=state.players[eliminated.findIndex(v=>!v)];
      const counts=state.players.map((_,pi)=>state.placedCities.filter(p=>p.playerIndex===pi).length);
      updateStatsAfterGame(state.players,winner,eliminationOrder,state.placedCities.length,state.mode,state.scores,counts);
      setState(s=>({...s,phase:"gameover",eliminated,eliminationOrder,lastElimination:event,winner}));
    } else setState(s=>({...s,eliminated,eliminationOrder,lastElimination:event,currentPlayerIndex:nextActive(eliminated,i)}));
  },[state]);
  const resetGame=useCallback(()=>{setHistory([]);setState(emptyState)},[]);
  const setRemoteState=useCallback((next:GameState)=>{
    setHistory([]);
    setState({...next,usedCityNames:new Set(next.usedCityNames)});
  },[]);
  const undoLastMove=useCallback(()=>{const prev=history.at(-1);if(prev){setState(prev);setHistory(h=>h.slice(0,-1))}},[history]);
  const unlockFinland=useCallback(()=>setState(current=>current.phase==="playing"&&!current.finlandUnlocked?{...current,finlandUnlocked:true}:current),[]);
  return {state,currentPlayer:state.players[state.currentPlayerIndex],activeCount:state.eliminated.filter(v=>!v).length,availableCities:getCities(state.country,state.finlandUnlocked).filter(c=>!state.usedCityNames.has(c.name.toLocaleLowerCase(state.country==="norway"?"nb":"sv"))),startGame,placeCity,eliminateOnTimeout,resetGame,setRemoteState,unlockFinland,undoLastMove,canUndo:history.length>0,clearLastElimination:()=>setState(s=>({...s,lastElimination:null}))};
}
