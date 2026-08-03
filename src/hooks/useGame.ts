import { useCallback, useState } from "react";
import type { Country, GameMode, GameState, LineSegment, NordicCountry, PlacedCity } from "../types/game";
import { activeCountries,findCity } from "../cityClient";
import { project } from "../utils/projection";
import { findCrossing } from "../utils/geometry";
import { updateStatsAfterGame } from "../utils/storage";

const emptyState:GameState={phase:"setup",mode:"classic",country:"sweden",unlockedCountries:[],players:[],eliminated:[],eliminationOrder:[],currentPlayerIndex:0,placedCities:[],usedCityNames:new Set(),lines:[],lastElimination:null,crossingLines:null,winner:null,scores:[]};
const nextActive=(out:boolean[],from:number)=>{for(let n=1;n<=out.length;n++){const i=(from+n)%out.length;if(!out[i])return i}return from};
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

export function useGame(){
  const [state,setState]=useState<GameState>(emptyState),[history,setHistory]=useState<GameState[]>([]);
  const startGame=useCallback((players:string[],mode:GameMode,country:Country="sweden")=>{setHistory([]);setState({...emptyState,phase:"playing",players,mode,country,eliminated:players.map(()=>false),scores:players.map(()=>0)})},[]);
  const placeCity=useCallback(async(raw:string)=>{
    if(state.phase!=="playing")return{success:false,message:"Spelet är inte aktivt."};
    const key=raw.trim().toLocaleLowerCase("sv-SE"),match=await findCity(raw,activeCountries(state.country,state.unlockedCountries)),city=match?.city,cityCountry=match?.country;
    if(!city||!cityCountry)return{success:false,message:`"${raw}" finns inte i ortslistan.`};
    if(state.usedCityNames.has(key))return{success:false,message:`${city.name} har redan använts.`};
    setHistory(h=>[...h,state]);
    const point=project(city.lat,city.lng,cityCountry),playerIndex=state.currentPlayerIndex,previous=state.placedCities.at(-1),points=previous?Math.max(10,Math.round(distance(previous.point,point)*2)):50;
    const placed:PlacedCity={city,point,playerIndex,turnNumber:state.placedCities.length+1,points},segment:LineSegment|null=previous?{from:previous.point,to:point,playerIndex,turnNumber:placed.turnNumber}:null,crossing=segment?findCrossing(segment,state.lines):null,used=new Set(state.usedCityNames);used.add(key);
    const scores=[...state.scores];scores[playerIndex]+=points;let eliminated=[...state.eliminated],eliminationOrder=[...state.eliminationOrder];if(crossing){eliminated[playerIndex]=true;scores[playerIndex]=Math.max(0,scores[playerIndex]-100);eliminationOrder.push({playerName:state.players[playerIndex],cityName:city.name})}
    const placedCities=[...state.placedCities,placed],lines=segment?[...state.lines,segment]:state.lines,active=eliminated.filter(v=>!v).length;
    if(active<=1){const winner=state.players[eliminated.findIndex(v=>!v)]||state.players[playerIndex],counts=state.players.map((_,i)=>placedCities.filter(p=>p.playerIndex===i).length);updateStatsAfterGame(state.players,winner,eliminationOrder,placedCities.length,state.mode,scores,counts);setState({...state,phase:"gameover",placedCities,lines,usedCityNames:used,eliminated,eliminationOrder,lastElimination:crossing?eliminationOrder.at(-1)!:null,crossingLines:crossing,winner,scores})}else setState({...state,placedCities,lines,usedCityNames:used,eliminated,eliminationOrder,currentPlayerIndex:nextActive(eliminated,playerIndex),lastElimination:crossing?eliminationOrder.at(-1)!:null,crossingLines:crossing,scores});
    return{success:true,points};
  },[state]);
  const eliminateOnTimeout=useCallback(()=>{if(state.phase!=="playing")return;const i=state.currentPlayerIndex,eliminated=[...state.eliminated];eliminated[i]=true;const event={playerName:state.players[i],cityName:"Tiden tog slut"},eliminationOrder=[...state.eliminationOrder,event],active=eliminated.filter(v=>!v).length;if(active<=1){const winner=state.players[eliminated.findIndex(v=>!v)],counts=state.players.map((_,pi)=>state.placedCities.filter(p=>p.playerIndex===pi).length);updateStatsAfterGame(state.players,winner,eliminationOrder,state.placedCities.length,state.mode,state.scores,counts);setState(s=>({...s,phase:"gameover",eliminated,eliminationOrder,lastElimination:event,winner}))}else setState(s=>({...s,eliminated,eliminationOrder,lastElimination:event,currentPlayerIndex:nextActive(eliminated,i)}))},[state]);
  const resetGame=useCallback(()=>{setHistory([]);setState(emptyState)},[]),setRemoteState=useCallback((next:GameState)=>{setHistory([]);setState({...next,unlockedCountries:next.unlockedCountries??[],usedCityNames:new Set(next.usedCityNames)})},[]),undoLastMove=useCallback(()=>{const prev=history.at(-1);if(prev){setState(prev);setHistory(h=>h.slice(0,-1))}},[history]),unlockCountry=useCallback((country:NordicCountry)=>setState(current=>current.phase!=="playing"||country===current.country||current.unlockedCountries.includes(country)?current:{...current,unlockedCountries:[...current.unlockedCountries,country]}),[]),unlockCountries=useCallback((countries:NordicCountry[])=>setState(current=>current.phase!=="playing"?current:{...current,unlockedCountries:[...new Set([...current.unlockedCountries,...countries.filter(country=>country!==current.country)])]}),[]);
  return{state,currentPlayer:state.players[state.currentPlayerIndex],activeCount:state.eliminated.filter(v=>!v).length,startGame,placeCity,eliminateOnTimeout,resetGame,setRemoteState,unlockCountry,unlockCountries,undoLastMove,canUndo:history.length>0,clearLastElimination:()=>setState(s=>({...s,lastElimination:null}))};
}
