import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const directory=path.dirname(fileURLToPath(import.meta.url));
const fetchText=url=>new Promise((resolve,reject)=>https.get(url,response=>{if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){fetchText(new URL(response.headers.location,url).href).then(resolve,reject);return}if(response.statusCode!==200){reject(new Error(`HTTP ${response.statusCode}: ${url}`));return}response.setEncoding("utf8");let body="";response.on("data",chunk=>body+=chunk);response.on("end",()=>resolve(body))}).on("error",reject));
const postal=await fetchText("https://symerio.github.io/postal-codes-data/data/geonames/FI.txt"),groups=new Map();
for(const line of postal.split(/\r?\n/)){if(!line.trim())continue;const fields=line.split("\t"),name=fields[2]?.trim(),lat=Number(fields[9]),lng=Number(fields[10]);if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||lat>70.2)continue;const key=name.toLocaleLowerCase("fi-FI"),group=groups.get(key)??{name,lat:0,lng:0,count:0};group.lat+=lat;group.lng+=lng;group.count++;groups.set(key,group)}
const cities=[...groups.values()].map(group=>({name:group.name,lat:group.lat/group.count,lng:group.lng/group.count})).sort((a,b)=>a.name.localeCompare(b.name,"fi-FI"));
fs.writeFileSync(path.join(directory,"..","src","data","finlandCities.ts"),`import type { City } from "../types/game";\n\n/** Offline database of Finnish postal localities, generated from GeoNames. */\nexport const FINNISH_CITIES: City[] = [\n${cities.map(city=>`  { name: ${JSON.stringify(city.name)}, lat: ${city.lat.toFixed(4)}, lng: ${city.lng.toFixed(4)} },`).join("\n")}\n];\n`,"utf8");
const geo=JSON.parse(await fetchText("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson")),feature=geo.features.find(item=>item.properties?.ADM0_A3==="FIN"),polygons=feature.geometry.type==="MultiPolygon"?feature.geometry.coordinates:feature.geometry.coordinates.map(polygon=>[polygon]),bounds={latMin:59.4,latMax:70.2,lngMin:19,lngMax:31.7},width=175,height=650,originX=335,originY=25;
const project=([lng,lat])=>[originX+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*width,originY+(bounds.latMax-lat)/(bounds.latMax-bounds.latMin)*height],paths=[];
let main="",mainLength=0;
for(const polygon of polygons){const ring=polygon[0];if(!ring||ring.length<3)continue;const step=Math.max(1,Math.floor(ring.length/220)),points=ring.filter((_,index)=>index%step===0).map(project),pathData=`M ${points.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;paths.push(pathData);if(ring.length>mainLength){mainLength=ring.length;main=pathData}}
fs.writeFileSync(path.join(directory,"..","src","data","finlandOutline.ts"),`/** Finland coastline from Natural Earth, positioned beside the active ORTEN map. */\nexport const FINLAND_OUTLINE_PATH = ${JSON.stringify(paths.join(" "))};\nexport const FINLAND_MAIN_PATH = ${JSON.stringify(main)};\n`,"utf8");
console.log(`Created ${cities.length} Finnish postal localities and ${paths.length} coastline paths.`);
