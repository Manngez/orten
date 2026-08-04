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
  ,unitedStates:()=>import("./data/unitedStatesCities"),canada:()=>import("./data/canadaCities")
};
const loaded=new Map<NordicCountry,Promise<LoadedCountry>>();
const normalize=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("sv-SE").trim();
const fold=(value:string)=>normalize(value).normalize("NFKD").replace(/\p{M}/gu,"");
const aliases=[...CITY_ALIASES,...GENERATED_CITY_ALIASES].map(alias=>({...alias,searchNames:[alias.name,...alias.aliases].map(fold)}));
type RegionPlace={city:City;country:NordicCountry;searchNames:string[]};
const region=(country:NordicCountry,name:string,lat:number,lng:number,aliases:string[]=[]):RegionPlace=>({country,city:{name,lat,lng},searchNames:[name,...aliases].map(fold)});
const REGION_PLACES:RegionPlace[]=[
  region("unitedStates","Alabama",32.8067,-86.7911),region("unitedStates","Alaska",61.3707,-152.4044),region("unitedStates","Arizona",33.7298,-111.4312),region("unitedStates","Arkansas",34.9697,-92.3731),
  region("unitedStates","California",36.1162,-119.6816),region("unitedStates","Colorado",39.0598,-105.3111),region("unitedStates","Connecticut",41.5978,-72.7554),region("unitedStates","Delaware",39.3185,-75.5071),
  region("unitedStates","Florida",27.7663,-81.6868),region("unitedStates","Georgia",33.0406,-83.6431),region("unitedStates","Hawaii",21.0943,-157.4983),region("unitedStates","Idaho",44.2405,-114.4788),
  region("unitedStates","Illinois",40.3495,-88.9861),region("unitedStates","Indiana",39.8494,-86.2583),region("unitedStates","Iowa",42.0115,-93.2105),region("unitedStates","Kansas",38.5266,-96.7265),
  region("unitedStates","Kentucky",37.6681,-84.6701),region("unitedStates","Louisiana",31.1695,-91.8678),region("unitedStates","Maine",44.6939,-69.3819),region("unitedStates","Maryland",39.0639,-76.8021),
  region("unitedStates","Massachusetts",42.2302,-71.5301),region("unitedStates","Michigan",43.3266,-84.5361),region("unitedStates","Minnesota",45.6945,-93.9002),region("unitedStates","Mississippi",32.7416,-89.6787),
  region("unitedStates","Missouri",38.4561,-92.2884),region("unitedStates","Montana",46.9219,-110.4544),region("unitedStates","Nebraska",41.1254,-98.2681),region("unitedStates","Nevada",38.3135,-117.0554),
  region("unitedStates","New Hampshire",43.4525,-71.5639),region("unitedStates","New Jersey",40.2989,-74.5210),region("unitedStates","New Mexico",34.8405,-106.2485),region("unitedStates","New York",42.1657,-74.9481),
  region("unitedStates","North Carolina",35.6301,-79.8064),region("unitedStates","North Dakota",47.5289,-99.7840),region("unitedStates","Ohio",40.3888,-82.7649),region("unitedStates","Oklahoma",35.5653,-96.9289),
  region("unitedStates","Oregon",44.5720,-122.0709),region("unitedStates","Pennsylvania",40.5908,-77.2098),region("unitedStates","Rhode Island",41.6809,-71.5118),region("unitedStates","South Carolina",33.8569,-80.9450),
  region("unitedStates","South Dakota",44.2998,-99.4388),region("unitedStates","Tennessee",35.7478,-86.6923),region("unitedStates","Texas",31.0545,-97.5635),region("unitedStates","Utah",40.1500,-111.8624),
  region("unitedStates","Vermont",44.0459,-72.7107),region("unitedStates","Virginia",37.7693,-78.1700),region("unitedStates","Washington",47.4009,-121.4905),region("unitedStates","West Virginia",38.4912,-80.9545),
  region("unitedStates","Wisconsin",44.2685,-89.6165),region("unitedStates","Wyoming",42.7560,-107.3025),region("unitedStates","District of Columbia",38.9072,-77.0369,["Washington DC","Washington D.C."]),
  region("canada","Alberta",53.9333,-116.5765),region("canada","British Columbia",53.7267,-127.6476,["Brittiska Columbia"]),region("canada","Manitoba",53.7609,-98.8139),region("canada","New Brunswick",46.5653,-66.4619),
  region("canada","Newfoundland and Labrador",53.1355,-57.6604,["Newfoundland","Labrador"]),region("canada","Northwest Territories",64.8255,-124.8457),region("canada","Nova Scotia",44.6820,-63.7443),
  region("canada","Nunavut",70.2998,-83.1076),region("canada","Ontario",51.2538,-85.3232),region("canada","Prince Edward Island",46.5107,-63.4168),region("canada","Quebec",52.9399,-73.5491,["Québec"]),
  region("canada","Saskatchewan",52.9399,-106.4509),region("canada","Yukon",64.2823,-135.0000)
];
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
      const regionKey=fold(request.name),region=REGION_PLACES.find(item=>request.countries.includes(item.country)&&item.searchNames.includes(regionKey));if(region){self.postMessage({id:request.id,result:{city:region.city,country:region.country}});return}
      const alias=await resolveAlias(request.name,request.countries);if(alias){self.postMessage({id:request.id,result:alias});return}
      const key=normalize(request.name),foldedKey=fold(request.name);
      for(const country of request.countries){const loadedCountry=await loadCountry(country),city=loadedCountry.byName.get(key)??loadedCountry.byFoldedName.get(foldedKey);if(city){self.postMessage({id:request.id,result:{city,country}});return}}
      self.postMessage({id:request.id,result:null});return;
    }
    const query=fold(request.query),used=new Set(request.usedNames.map(fold)),starts:City[]=[],contains:City[]=[],seen=new Set<string>();
    for(const item of REGION_PLACES){if(!request.countries.includes(item.country)||used.has(fold(item.city.name))||!item.searchNames.some(name=>name.startsWith(query)))continue;starts.push(item.city);seen.add(`${item.country}:${fold(item.city.name)}`);if(starts.length===request.limit)break}
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
