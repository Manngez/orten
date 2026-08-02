import type { City,NordicCountry } from "./types/game";

type CityMatch={city:City;country:NordicCountry};
type Pending={resolve:(value:unknown)=>void;reject:(reason?:unknown)=>void};
const worker=new Worker(new URL("./cityWorker.ts",import.meta.url),{type:"module"});
const pending=new Map<number,Pending>();
let nextId=1;

worker.onmessage=(event:MessageEvent<{id:number;result?:unknown;error?:string}>)=>{const request=pending.get(event.data.id);if(!request)return;pending.delete(event.data.id);event.data.error?request.reject(new Error(event.data.error)):request.resolve(event.data.result)};
worker.onerror=event=>{for(const request of pending.values())request.reject(new Error(event.message||"Ortregistret kunde inte laddas."));pending.clear()};
const request=<T>(message:Record<string,unknown>)=>new Promise<T>((resolve,reject)=>{const id=nextId++;pending.set(id,{resolve:resolve as (value:unknown)=>void,reject});worker.postMessage({id,...message})});

export const activeCountries=(country:NordicCountry,unlocked:NordicCountry[])=>[country,...unlocked.filter(item=>item!==country)];
export const searchCities=(query:string,countries:NordicCountry[],usedNames:Set<string>,limit=6)=>request<City[]>({type:"search",query,countries,usedNames:[...usedNames],limit});
export const findCity=(name:string,countries:NordicCountry[])=>request<CityMatch|null>({type:"find",name,countries});
