import { useMemo,useRef,useState } from "react";
import { searchCities } from "../data/cities";
import { GERMAN_CITIES } from "../data/germanyCities";
import type { City,Country,NordicCountry } from "../types/game";
const normalize=(value:string)=>value.toLocaleLowerCase("sv-SE").trim();
export default function CityInput({usedCityNames,onPlaceCity,disabled,country,unlockedCountries}:{usedCityNames:Set<string>;onPlaceCity:(n:string)=>{success:boolean;message?:string};disabled:boolean;country:Country;unlockedCountries:NordicCountry[]}){
  const [query,setQuery]=useState(""),[open,setOpen]=useState(false),[message,setMessage]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const suggestions=useMemo(()=>{
    const nordic=searchCities(query,usedCityNames,country,unlockedCountries.filter(item=>item!=="germany"),10);
    if(!unlockedCountries.includes("germany"))return nordic.slice(0,6);
    const q=normalize(query);
    const german:City[]=q?GERMAN_CITIES.filter(city=>!usedCityNames.has(normalize(city.name))&&normalize(city.name).includes(q)).sort((a,b)=>Number(normalize(b.name).startsWith(q))-Number(normalize(a.name).startsWith(q))).slice(0,10):[];
    return [...nordic,...german].filter((city,index,list)=>list.findIndex(item=>item.name===city.name)===index).slice(0,6);
  },[query,usedCityNames,country,unlockedCountries]);
  const choose=(name:string)=>{const r=onPlaceCity(name);if(r.success){setQuery("");setOpen(false);setMessage("")}else{setMessage(r.message||"Ogiltig ort");input.current?.focus()}};
  return <div className="city-control"><form onSubmit={e=>{e.preventDefault();const exact=suggestions.find(s=>s.name.toLowerCase()===query.trim().toLowerCase());choose(exact?.name||suggestions[0]?.name||query)}}><label><small>NÄSTA ORT</small><input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);setMessage("")}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} placeholder={unlockedCountries.length?"Skriv en tillgänglig ort…":country==="norway"?"Skriv en norsk ort…":"Skriv en svensk ort…"} autoComplete="off" autoCapitalize="words" enterKeyHint="go" disabled={disabled} aria-label="Nästa ort"/></label><button disabled={disabled||!query.trim()} aria-label="Placera ort">→</button></form>
  {open&&suggestions.length>0&&<ul>{suggestions.map(city=><li key={city.name} onMouseDown={e=>{e.preventDefault();choose(city.name)}}><b>{city.name}</b><span>Placera →</span></li>)}</ul>}
  {message&&<p className="input-error">{message}</p>}</div>
}
