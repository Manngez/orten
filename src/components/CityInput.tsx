import { useMemo,useRef,useState } from "react";
import { searchCities } from "../data/cities";
export default function CityInput({usedCityNames,onPlaceCity,disabled}:{usedCityNames:Set<string>;onPlaceCity:(n:string)=>{success:boolean;message?:string};disabled:boolean}){
  const [query,setQuery]=useState(""),[open,setOpen]=useState(false),[message,setMessage]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const suggestions=useMemo(()=>searchCities(query,usedCityNames).slice(0,6),[query,usedCityNames]);
  const choose=(name:string)=>{const r=onPlaceCity(name);if(r.success){setQuery("");setOpen(false);setMessage("")}else{setMessage(r.message||"Ogiltig ort");input.current?.focus()}};
  return <div className="city-control"><form onSubmit={e=>{e.preventDefault();const exact=suggestions.find(s=>s.name.toLowerCase()===query.trim().toLowerCase());choose(exact?.name||suggestions[0]?.name||query)}}><label><small>NÄSTA ORT</small><input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);setMessage("")}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} placeholder="Skriv en svensk ort…" autoComplete="off" autoCapitalize="words" enterKeyHint="go" disabled={disabled} aria-label="Nästa svenska ort"/></label><button disabled={disabled||!query.trim()} aria-label="Placera ort">→</button></form>
  {open&&suggestions.length>0&&<ul>{suggestions.map(city=><li key={city.name} onMouseDown={e=>{e.preventDefault();choose(city.name)}}><b>{city.name}</b><span>Placera →</span></li>)}</ul>}
  {message&&<p className="input-error">{message}</p>}</div>
}
