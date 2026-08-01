import { writeFileSync } from "node:fs";

const SOURCE="https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const wanted={SE:"sweden",NO:"norway",FI:"finland",DK:"denmark",DE:"germany",NL:"netherlands",BE:"belgium",LU:"luxembourg",FR:"france"};
const bounds={lngMin:-10,lngMax:32,latMin:41,latMax:72};
const width=620,height=1160,pad=18;
const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const top=mercator(bounds.latMax),bottom=mercator(bounds.latMin);
const project=([lng,lat])=>[
  pad+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*(width-pad*2),
  pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)
];
const ringPath=ring=>ring.map((point,index)=>{const[x,y]=project(point);return `${index?"L":"M"}${x.toFixed(1)} ${y.toFixed(1)}`}).join(" ")+" Z";
const geometryPath=geometry=>{
  if(geometry.type==="Polygon")return geometry.coordinates.map(ringPath).join(" ");
  if(geometry.type==="MultiPolygon")return geometry.coordinates.flatMap(polygon=>polygon.map(ringPath)).join(" ");
  return "";
};

const response=await fetch(SOURCE);
if(!response.ok)throw new Error(`Kunde inte hämta landsgränser: ${response.status}`);
const geojson=await response.json();
const outlines={};
for(const feature of geojson.features){
  const code=feature.properties?.ISO_A2??feature.properties?.iso_a2;
  const key=wanted[code];
  if(!key)continue;
  const path=geometryPath(feature.geometry);
  if(path)outlines[key]={path,main:path};
}
for(const key of Object.values(wanted))if(!outlines[key])throw new Error(`Saknar landsgräns för ${key}`);
const output=`/** Genererad från datasets/geo-countries. Alla länder delar samma projektion. */\nexport const EUROPE_VIEWBOX=\"0 0 ${width} ${height}\";\nexport const EUROPE_BOUNDS=${JSON.stringify(bounds)} as const;\nexport const EUROPE_OUTLINES=${JSON.stringify(outlines)} as const;\n`;
writeFileSync(new URL("../src/data/europeOutlines.ts",import.meta.url),output,"utf8");
console.log("Europeiska landsgränser uppdaterade:",Object.keys(outlines));
