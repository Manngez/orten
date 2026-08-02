import { useEffect,useRef,useState } from "react";
import { activeCountries,searchCities } from "../cityClient";
import type { City } from "../types/game";
import type { Country,NordicCountry } from "../types/game";

export default function CityInput({usedCityNames,onPlaceCity,disabled,country,unlockedCountries}:{usedCityNames:Set<string>;onPlaceCity:(n:string)=>Promise<{success:boolean;message?:string}>;disabled:boolean;country:Country;unlockedCountries:NordicCountry[]}){
  const [query,setQuery]=useState(""),[open,setOpen]=useState(false),[message,setMessage]=useState(""),[suggestions,setSuggestions]=useState<City[]>([]),[loading,setLoading]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{let current=true;const value=query.trim();if(!value){setSuggestions([]);setLoading(false);return()=>{current=false}}setLoading(true);const timer=window.setTimeout(()=>{void searchCities(value,activeCountries(country,unlockedCountries),usedCityNames,6).then(result=>{if(current)setSuggestions(result)}).catch(()=>{if(current)setSuggestions([])}).finally(()=>{if(current)setLoading(false)})},70);return()=>{current=false;window.clearTimeout(timer)}},[query,usedCityNames,country,unlockedCountries]);
  const choose=async(name:string)=>{setLoading(true);const r=await onPlaceCity(name);setLoading(false);if(r.success){setQuery("");setOpen(false);setMessage("")}else{setMessage(r.message||"Ogiltig ort");input.current?.focus()}};
  return <div className="city-control"><form onSubmit={e=>{e.preventDefault();const exact=suggestions.find(s=>s.name.toLowerCase()===query.trim().toLowerCase());void choose(exact?.name||suggestions[0]?.name||query)}}><label><small>{loading?"LADDAR ORTER…":"NÄSTA ORT"}</small><input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);setMessage("")}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} placeholder={unlockedCountries.length?"Skriv en tillgänglig ort…":country==="norway"?"Skriv en norsk ort…":"Skriv en svensk ort…"} autoComplete="off" autoCapitalize="words" enterKeyHint="go" disabled={disabled} aria-label="Nästa ort"/></label><button disabled={disabled||loading||!query.trim()} aria-label="Placera ort">→</button></form>
  {open&&suggestions.length>0&&<ul>{suggestions.map(city=><li key={city.name} onMouseDown={e=>{e.preventDefault();choose(city.name)}}><b>{city.name}</b><span>Placera →</span></li>)}</ul>}
  {message&&<p className="input-error">{message}</p>}</div>
}
