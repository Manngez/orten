import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory=path.dirname(fileURLToPath(import.meta.url));
const fetchText=url=>new Promise((resolve,reject)=>https.get(url,response=>{if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){fetchText(new URL(response.headers.location,url).href).then(resolve,reject);return}if(response.statusCode!==200){reject(new Error(`HTTP ${response.statusCode}: ${url}`));return}response.setEncoding("utf8");let body="";response.on("data",chunk=>body+=chunk);response.on("end",()=>resolve(body))}).on("error",reject));

const bounds={lngMin:3.4,lngMax:32.2,latMin:54.4,latMax:71.4},width=620,height=760,pad=22;
const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const top=mercator(bounds.latMax),bottom=mercator(bounds.latMin);
const project=([lng,lat])=>[pad+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*(width-pad*2),pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)];

const geo=JSON.parse(await fetchText("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson"));
const countries={sweden:"SWE",norway:"NOR",finland:"FIN",denmark:"DNK"},output={};
for(const [name,code] of Object.entries(countries)){
  const feature=geo.features.find(item=>item.properties?.ADM0_A3===code),polygons=feature.geometry.type==="MultiPolygon"?feature.geometry.coordinates:feature.geometry.coordinates.map(polygon=>[polygon]),paths=[];
  let main="",mainLength=0;
  for(const polygon of polygons){const ring=polygon[0];if(!ring||ring.length<3)continue;const step=Math.max(1,Math.floor(ring.length/260)),points=ring.filter((_,index)=>index%step===0).map(project),data=`M ${points.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;paths.push(data);if(ring.length>mainLength){mainLength=ring.length;main=data}}
  output[name]={path:paths.join(" "),main};
}
fs.writeFileSync(path.join(directory,"..","src","data","nordicOutline.ts"),`/** Natural Earth coastlines in one shared Web Mercator projection. */\nexport const NORDIC_VIEWBOX = "0 0 ${width} ${height}";\nexport const NORDIC_BOUNDS = ${JSON.stringify(bounds)} as const;\nexport const NORDIC_OUTLINES = ${JSON.stringify(output,null,2)} as const;\n`,"utf8");

const postal=await fetchText("https://symerio.github.io/postal-codes-data/data/geonames/DK.txt"),groups=new Map();
for(const line of postal.split(/\r?\n/)){if(!line.trim())continue;const fields=line.split("\t"),name=fields[2]?.trim(),lat=Number(fields[9]),lng=Number(fields[10]);if(!name||!Number.isFinite(lat)||!Number.isFinite(lng))continue;const key=name.toLocaleLowerCase("da-DK"),group=groups.get(key)??{name,points:[]};group.points.push({lat,lng});groups.set(key,group)}
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]};
const cities=[...groups.values()].map(group=>({name:group.name,lat:median(group.points.map(point=>point.lat)),lng:median(group.points.map(point=>point.lng))}));
const aliases=[{name:"København",lat:55.6761,lng:12.5683},{name:"Aarhus",lat:56.1629,lng:10.2039},{name:"Odense",lat:55.4038,lng:10.4024},{name:"Aalborg",lat:57.0488,lng:9.9217}];
for(const alias of aliases)if(!cities.some(city=>city.name.toLocaleLowerCase("da-DK")===alias.name.toLocaleLowerCase("da-DK")))cities.push(alias);
cities.sort((a,b)=>a.name.localeCompare(b.name,"da-DK"));
fs.writeFileSync(path.join(directory,"..","src","data","denmarkCities.ts"),`import type { City } from "../types/game";\n\n/** Offline database of Danish postal localities, generated from GeoNames. */\nexport const DANISH_CITIES: City[] = [\n${cities.map(city=>`  { name: ${JSON.stringify(city.name)}, lat: ${city.lat.toFixed(4)}, lng: ${city.lng.toFixed(4)} },`).join("\n")}\n];\n`,"utf8");
console.log(`Created shared Nordic outlines and ${cities.length} Danish postal localities.`);
