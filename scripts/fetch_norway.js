import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory=path.dirname(fileURLToPath(import.meta.url));
const fetchText=url=>new Promise((resolve,reject)=>https.get(url,response=>{if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){fetchText(new URL(response.headers.location,url).href).then(resolve,reject);return}if(response.statusCode!==200){reject(new Error(`HTTP ${response.statusCode}: ${url}`));return}response.setEncoding("utf8");let body="";response.on("data",chunk=>body+=chunk);response.on("end",()=>resolve(body))}).on("error",reject));

const postal=await fetchText("https://symerio.github.io/postal-codes-data/data/geonames/NO.txt"),groups=new Map();
for(const line of postal.split(/\r?\n/)){if(!line.trim())continue;const fields=line.split("\t"),name=fields[2]?.trim(),lat=Number(fields[9]),lng=Number(fields[10]);if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||lat>72)continue;const key=name.toLocaleLowerCase("nb-NO"),group=groups.get(key)??{name,lat:0,lng:0,count:0};group.lat+=lat;group.lng+=lng;group.count++;groups.set(key,group)}
const cities=[...groups.values()].map(group=>({name:group.name,lat:group.lat/group.count,lng:group.lng/group.count})).sort((a,b)=>a.name.localeCompare(b.name,"nb-NO"));
const cityFile=`import type { City } from "../types/game";\n\n/** Offline database of Norwegian postal localities, generated from GeoNames. */\nexport const NORWEGIAN_CITIES: City[] = [\n${cities.map(city=>`  { name: ${JSON.stringify(city.name)}, lat: ${city.lat.toFixed(4)}, lng: ${city.lng.toFixed(4)} },`).join("\n")}\n];\n`;
fs.writeFileSync(path.join(directory,"..","src","data","norwayCities.ts"),cityFile,"utf8");

const geo=JSON.parse(await fetchText("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson")),feature=geo.features.find(item=>item.properties?.ADM0_A3==="NOR"),polygons=feature.geometry.type==="MultiPolygon"?feature.geometry.coordinates:feature.geometry.coordinates.map(polygon=>[polygon]);
const bounds={latMin:57.7,latMax:71.3,lngMin:4,lngMax:31.5},width=320,height=700,padX=25,padY=25;
const project=([lng,lat])=>[padX+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*(width-padX*2),padY+(bounds.latMax-lat)/(bounds.latMax-bounds.latMin)*(height-padY*2)];
const paths=[];
for(const polygon of polygons){const ring=polygon[0];if(!ring?.some(([,lat])=>lat<72)||ring.every(([,lat])=>lat>72))continue;const kept=ring.filter(([lng,lat])=>lat<=bounds.latMax+.2&&lat>=bounds.latMin-.2&&lng>=bounds.lngMin-.5&&lng<=bounds.lngMax+.5);if(kept.length<3)continue;const step=Math.max(1,Math.floor(kept.length/260)),points=kept.filter((_,index)=>index%step===0).map(project);paths.push(`M ${points.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`)}
const outline=`/** Norway's mainland coastline from Natural Earth 1:10m, projected for ORTEN. */\nexport const NORWAY_VIEWBOX = "0 0 320 700";\nexport const NORWAY_OUTLINE_PATH = ${JSON.stringify(paths.join(" "))};\n`;
fs.writeFileSync(path.join(directory,"..","src","data","norwayOutline.ts"),outline,"utf8");
console.log(`Created ${cities.length} Norwegian postal localities and ${paths.length} coastline paths.`);
