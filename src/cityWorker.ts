/// <reference lib="webworker" />
import type { City,NordicCountry } from "./types/game";
import { CITY_ALIASES } from "./data/cityAliases";
import { GENERATED_CITY_ALIASES } from "./data/generatedCityAliases";

type CityModule=Record<string,City[]>;
type LoadedCountry={searchable:{city:City;key:string}[];byName:Map<string,City>;byFoldedName:Map<string,City>};
type WorkerRequest=
  |{id:number;type:"search";query:string;countries:NordicCountry[];usedNames:string[];limit:number}
  |{id:number;type:"find";name:string;countries:NordicCountry[]};

const loaders:Record<NordicCountry,()=>Promise<CityModule>>={
  sweden:()=>import("./data/swedenCities"),norway:()=>import("./data/norwayCities"),finland:()=>import("./data/finlandCities"),denmark:()=>import("./data/denmarkCities"),
  germany:()=>import("./data/germanyCities"),netherlands:()=>import("./data/netherlandsCities"),belgium:()=>import("./data/belgiumCities"),luxembourg:()=>import("./data/luxembourgCities"),france:()=>import("./data/franceCities"),
  estonia:()=>import("./data/estoniaCities"),latvia:()=>import("./data/latviaCities"),lithuania:()=>import("./data/lithuaniaCities"),poland:()=>import("./data/polandCities"),switzerland:()=>import("./data/switzerlandCities"),
  austria:()=>import("./data/austriaCities"),hungary:()=>import("./data/hungaryCities"),italy:()=>import("./data/italyCities"),spain:()=>import("./data/spainCities")
  ,albania:()=>import("./data/albaniaCities"),andorra:()=>import("./data/andorraCities"),armenia:()=>import("./data/armeniaCities"),azerbaijan:()=>import("./data/azerbaijanCities"),belarus:()=>import("./data/belarusCities")
  ,bosniaHerzegovina:()=>import("./data/bosniaHerzegovinaCities"),bulgaria:()=>import("./data/bulgariaCities"),croatia:()=>import("./data/croatiaCities"),cyprus:()=>import("./data/cyprusCities"),czechia:()=>import("./data/czechiaCities")
  ,georgia:()=>import("./data/georgiaCities"),greece:()=>import("./data/greeceCities"),iceland:()=>import("./data/icelandCities"),ireland:()=>import("./data/irelandCities"),kosovo:()=>import("./data/kosovoCities")
  ,liechtenstein:()=>import("./data/liechtensteinCities"),malta:()=>import("./data/maltaCities"),moldova:()=>import("./data/moldovaCities"),monaco:()=>import("./data/monacoCities"),montenegro:()=>import("./data/montenegroCities")
  ,northMacedonia:()=>import("./data/northMacedoniaCities"),portugal:()=>import("./data/portugalCities"),romania:()=>import("./data/romaniaCities"),russia:()=>import("./data/russiaCities"),sanMarino:()=>import("./data/sanMarinoCities")
  ,serbia:()=>import("./data/serbiaCities"),slovakia:()=>import("./data/slovakiaCities"),slovenia:()=>import("./data/sloveniaCities"),turkey:()=>import("./data/turkeyCities"),ukraine:()=>import("./data/ukraineCities")
  ,unitedKingdom:()=>import("./data/unitedKingdomCities"),vaticanCity:()=>import("./data/vaticanCityCities")
};
const loaded=new Map<NordicCountry,Promise<LoadedCountry>>();
const normalize=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("sv-SE").trim();
const fold=(value:string)=>normalize(value).normalize("NFKD").replace(/\p{M}/gu,"");
const aliases=[...CITY_ALIASES,...GENERATED_CITY_ALIASES].map(alias=>({...alias,searchNames:[alias.name,...alias.aliases].map(fold)}));
const loadCountry=(country:NordicCountry)=>{
  let pending=loaded.get(country);
  if(!pending){pending=loaders[country]().then(module=>{const cities=Object.values(module).find(Array.isArray)??[],searchable=cities.map(city=>({city,key:fold(city.name)}));return{searchable,byName:new Map(cities.map(city=>[normalize(city.name),city])),byFoldedName:new Map(searchable.map(item=>[item.key,item.city]))}});loaded.set(country,pending)}
  return pending;
};

const resolveAlias=async(value:string,countries:NordicCountry[])=>{
  const key=fold(value),alias=aliases.find(item=>countries.includes(item.country)&&item.searchNames.includes(key));
  if(!alias)return null;
  const country=await loadCountry(alias.country),city=country.byName.get(normalize(alias.name))??country.byFoldedName.get(fold(alias.name));
  return city?{city,country:alias.country}:null;
};

self.onmessage=async(event:MessageEvent<WorkerRequest>)=>{
  const request=event.data;
  try{
    if(request.type==="find"){
      const alias=await resolveAlias(request.name,request.countries);if(alias){self.postMessage({id:request.id,result:alias});return}
      const key=normalize(request.name),foldedKey=fold(request.name);
      for(const country of request.countries){const loadedCountry=await loadCountry(country),city=loadedCountry.byName.get(key)??loadedCountry.byFoldedName.get(foldedKey);if(city){self.postMessage({id:request.id,result:{city,country}});return}}
      self.postMessage({id:request.id,result:null});return;
    }
    const query=fold(request.query),used=new Set(request.usedNames.map(fold)),starts:City[]=[],contains:City[]=[],seen=new Set<string>();
    for(const alias of aliases){if(!request.countries.includes(alias.country)||!alias.searchNames.some(name=>name.startsWith(query)))continue;const countryData=await loadCountry(alias.country),city=countryData.byName.get(normalize(alias.name))??countryData.byFoldedName.get(fold(alias.name));if(city&&!used.has(fold(city.name))){starts.push(city);seen.add(`${alias.country}:${fold(city.name)}`);if(starts.length===request.limit)break}}
    if(query)for(const country of request.countries){
      const {searchable}=await loadCountry(country);
      for(const {city,key:name} of searchable){const id=`${country}:${name}`;if(used.has(name)||seen.has(id))continue;if(name.startsWith(query)){starts.push(city);seen.add(id);if(starts.length===request.limit)break}else if(contains.length<request.limit&&name.includes(query)){contains.push(city);seen.add(id)}}
      if(starts.length===request.limit)break;
    }
    self.postMessage({id:request.id,result:[...starts,...contains].slice(0,request.limit)});
  }catch(error){self.postMessage({id:request.id,error:error instanceof Error?error.message:"Ortregistret kunde inte laddas."})}
};

export {};
