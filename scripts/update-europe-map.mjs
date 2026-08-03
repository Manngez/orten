import { writeFileSync } from "node:fs";

const SOURCE="https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const wanted={SE:"sweden",NO:"norway",FI:"finland",DK:"denmark",DE:"germany",NL:"netherlands",BE:"belgium",LU:"luxembourg",FR:"france",EE:"estonia",LV:"latvia",LT:"lithuania",PL:"poland",CH:"switzerland",AT:"austria",HU:"hungary",IT:"italy",ES:"spain",AL:"albania",AD:"andorra",AM:"armenia",AZ:"azerbaijan",BY:"belarus",BA:"bosniaHerzegovina",BG:"bulgaria",HR:"croatia",CY:"cyprus",CZ:"czechia",GE:"georgia",GR:"greece",IS:"iceland",IE:"ireland",XK:"kosovo",LI:"liechtenstein",MT:"malta",MD:"moldova",MC:"monaco",ME:"montenegro",MK:"northMacedonia",PT:"portugal",RO:"romania",RU:"russia",SM:"sanMarino",RS:"serbia",SK:"slovakia",SI:"slovenia",TR:"turkey",UA:"ukraine",GB:"unitedKingdom",VA:"vaticanCity"};
const nameFallback={Sweden:"sweden",Norway:"norway",Finland:"finland",Denmark:"denmark",Germany:"germany",Netherlands:"netherlands",Belgium:"belgium",Luxembourg:"luxembourg",France:"france",Estonia:"estonia",Latvia:"latvia",Lithuania:"lithuania",Poland:"poland",Switzerland:"switzerland",Austria:"austria",Hungary:"hungary",Italy:"italy",Spain:"spain",Albania:"albania",Andorra:"andorra",Armenia:"armenia",Azerbaijan:"azerbaijan",Belarus:"belarus","Bosnia and Herzegovina":"bosniaHerzegovina",Bulgaria:"bulgaria",Croatia:"croatia",Cyprus:"cyprus",Czechia:"czechia",Georgia:"georgia",Greece:"greece",Iceland:"iceland",Ireland:"ireland",Kosovo:"kosovo",Liechtenstein:"liechtenstein",Malta:"malta",Moldova:"moldova",Monaco:"monaco",Montenegro:"montenegro","North Macedonia":"northMacedonia",Portugal:"portugal",Romania:"romania",Russia:"russia","San Marino":"sanMarino",Serbia:"serbia",Slovakia:"slovakia",Slovenia:"slovenia",Turkey:"turkey",Ukraine:"ukraine","United Kingdom":"unitedKingdom","Vatican City":"vaticanCity"};
const bounds={lngMin:-25,lngMax:60,latMin:34,latMax:72};
const width=1200,height=900,pad=18;
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
  const properties=feature.properties??{};
  const code=properties["ISO3166-1-Alpha-2"]??properties.ISO_A2??properties.iso_a2??properties.ISO_A2_EH;
  const name=properties.name??properties.ADMIN??properties.NAME_EN??properties.NAME;
  const key=wanted[code]??nameFallback[name];
  if(!key)continue;
  const path=geometryPath(feature.geometry);
  if(path)outlines[key]={path,main:path};
}
for(const key of Object.values(wanted))if(!outlines[key])throw new Error(`Saknar landsgräns för ${key}`);
const output=`/** Genererad från datasets/geo-countries. Alla länder delar samma projektion. */\nexport const EUROPE_WIDTH=${width};\nexport const EUROPE_HEIGHT=${height};\nexport const EUROPE_PADDING=${pad};\nexport const EUROPE_VIEWBOX=\"0 0 ${width} ${height}\";\nexport const EUROPE_BOUNDS=${JSON.stringify(bounds)} as const;\nexport const EUROPE_OUTLINES=${JSON.stringify(outlines)} as const;\n`;
writeFileSync(new URL("../src/data/europeOutlines.ts",import.meta.url),output,"utf8");
console.log("Europeiska landsgränser uppdaterade:",Object.keys(outlines));
