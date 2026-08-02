/// <reference lib="webworker" />
import type { City,NordicCountry } from "./types/game";

type CityModule=Record<string,City[]>;
type LoadedCountry={cities:City[];byName:Map<string,City>};
type WorkerRequest=
  |{id:number;type:"search";query:string;countries:NordicCountry[];usedNames:string[];limit:number}
  |{id:number;type:"find";name:string;countries:NordicCountry[]};

const loaders:Record<NordicCountry,()=>Promise<CityModule>>={
  sweden:()=>import("./data/swedenCities"),norway:()=>import("./data/norwayCities"),finland:()=>import("./data/finlandCities"),denmark:()=>import("./data/denmarkCities"),
  germany:()=>import("./data/germanyCities"),netherlands:()=>import("./data/netherlandsCities"),belgium:()=>import("./data/belgiumCities"),luxembourg:()=>import("./data/luxembourgCities"),france:()=>import("./data/franceCities"),
  estonia:()=>import("./data/estoniaCities"),latvia:()=>import("./data/latviaCities"),lithuania:()=>import("./data/lithuaniaCities"),poland:()=>import("./data/polandCities"),switzerland:()=>import("./data/switzerlandCities"),
  austria:()=>import("./data/austriaCities"),hungary:()=>import("./data/hungaryCities"),italy:()=>import("./data/italyCities"),spain:()=>import("./data/spainCities")
};
const loaded=new Map<NordicCountry,Promise<LoadedCountry>>();
const normalize=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("sv-SE").trim();
const loadCountry=(country:NordicCountry)=>{
  let pending=loaded.get(country);
  if(!pending){pending=loaders[country]().then(module=>{const cities=Object.values(module).find(Array.isArray)??[];return{cities,byName:new Map(cities.map(city=>[normalize(city.name),city]))}});loaded.set(country,pending)}
  return pending;
};

self.onmessage=async(event:MessageEvent<WorkerRequest>)=>{
  const request=event.data;
  try{
    if(request.type==="find"){
      const key=normalize(request.name);
      for(const country of request.countries){const city=(await loadCountry(country)).byName.get(key);if(city){self.postMessage({id:request.id,result:{city,country}});return}}
      self.postMessage({id:request.id,result:null});return;
    }
    const query=normalize(request.query),used=new Set(request.usedNames),starts:City[]=[],contains:City[]=[];
    if(query)for(const country of request.countries){
      const {cities}=await loadCountry(country);
      for(const city of cities){const name=normalize(city.name);if(used.has(name))continue;if(name.startsWith(query)){starts.push(city);if(starts.length===request.limit)break}else if(contains.length<request.limit&&name.includes(query))contains.push(city)}
      if(starts.length===request.limit)break;
    }
    self.postMessage({id:request.id,result:[...starts,...contains].slice(0,request.limit)});
  }catch(error){self.postMessage({id:request.id,error:error instanceof Error?error.message:"Ortregistret kunde inte laddas."})}
};

export {};
