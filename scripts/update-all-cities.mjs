import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url);
const DATA_DIR = new URL("src/data/", ROOT);
const SOURCE = "https://download.geonames.org/export/dump";

const countries = [
  { code: "SE", key: "sweden", exportName: "SWEDISH_CITIES", file: "cities.ts", limit: 6000 },
  { code: "NO", key: "norway", exportName: "NORWEGIAN_CITIES", file: "norwayCities.ts", limit: 6000 },
  { code: "FI", key: "finland", exportName: "FINNISH_CITIES", file: "finlandCities.ts", limit: 6000 },
  { code: "DK", key: "denmark", exportName: "DANISH_CITIES", file: "denmarkCities.ts", limit: 3000 },
  { code: "DE", key: "germany", exportName: "GERMAN_CITIES", file: "germanyCities.ts", limit: 12000 },
  { code: "NL", key: "netherlands", exportName: "NETHERLANDS_CITIES", file: "netherlandsCities.ts", limit: 5000 },
  { code: "BE", key: "belgium", exportName: "BELGIAN_CITIES", file: "belgiumCities.ts", limit: 5000 },
  { code: "LU", key: "luxembourg", exportName: "LUXEMBOURG_CITIES", file: "luxembourgCities.ts", limit: 1500 },
  { code: "FR", key: "france", exportName: "FRENCH_CITIES", file: "franceCities.ts", limit: 15000 },
];

const acceptedCodes = new Set(["PPL","PPLA","PPLA2","PPLA3","PPLA4","PPLA5","PPLC","PPLG","PPLS","PPLX"]);
const preferredCodes = new Set(["PPLC","PPLA","PPLA2","PPLA3","PPLA4","PPLA5"]);
const normalize=value=>value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g,"").replace(/\s+/g," ").trim().toLocaleLowerCase("sv-SE");
const titleScore=place=>(preferredCodes.has(place.featureCode)?1_000_000_000:0)+place.population;
function parseCountry(text,limit){const byName=new Map();for(const line of text.split("\n")){if(!line)continue;const c=line.split("\t");if(c.length<15||c[6]!=="P"||!acceptedCodes.has(c[7]))continue;const name=c[1]?.normalize("NFKC").replace(/\s+/g," ").trim(),lat=Number(c[4]),lng=Number(c[5]),population=Number(c[14])||0;if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||/^(unknown|unnamed|ohne namen)$/i.test(name))continue;const place={name,lat,lng,population,featureCode:c[7]},key=normalize(name),previous=byName.get(key);if(!previous||titleScore(place)>titleScore(previous))byName.set(key,place)}return[...byName.values()].sort((a,b)=>titleScore(b)-titleScore(a)||a.name.localeCompare(b.name)).slice(0,limit).sort((a,b)=>a.name.localeCompare(b.name))}
const escapeText=value=>JSON.stringify(value);
function cityArray(exportName,places,countryCode){const rows=places.map(place=>`  { name: ${escapeText(place.name)}, lat: ${place.lat.toFixed(5)}, lng: ${place.lng.toFixed(5)} },`).join("\n");return`import type { City } from "../types/game";\n\n/** GeoNames ${countryCode}, filtrerade bebodda platser. Genererad automatiskt. */\nexport const ${exportName}: City[] = [\n${rows}\n];\n`}
function swedishFile(places){return`${cityArray("SWEDISH_CITIES",places,"SE")}\nimport type { Country, NordicCountry } from "../types/game";\nimport { NORWEGIAN_CITIES } from "./norwayCities";\nimport { FINNISH_CITIES } from "./finlandCities";\nimport { DANISH_CITIES } from "./denmarkCities";\nimport { GERMAN_CITIES } from "./germanyCities";\nimport { NETHERLANDS_CITIES } from "./netherlandsCities";\nimport { BELGIAN_CITIES } from "./belgiumCities";\nimport { LUXEMBOURG_CITIES } from "./luxembourgCities";\nimport { FRENCH_CITIES } from "./franceCities";\n\nconst normalize=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("sv-SE").trim();\nconst COUNTRY_CITIES:Record<NordicCountry,City[]>={sweden:SWEDISH_CITIES,norway:NORWEGIAN_CITIES,finland:FINNISH_CITIES,denmark:DANISH_CITIES,germany:GERMAN_CITIES,netherlands:NETHERLANDS_CITIES,belgium:BELGIAN_CITIES,luxembourg:LUXEMBOURG_CITIES,france:FRENCH_CITIES};\nexport function citiesForCountry(country:NordicCountry):City[]{return COUNTRY_CITIES[country]}\nexport function getCities(country:Country,unlockedCountries:NordicCountry[]=[]):City[]{return[country,...unlockedCountries.filter(item=>item!==country)].flatMap(citiesForCountry)}\nexport function createCityMap(country:Country):Map<string,City>{return new Map(getCities(country).map(city=>[normalize(city.name),city]))}\nexport function searchCities(query:string,usedNames:Set<string>,country:Country,unlockedCountries:NordicCountry[]=[],limit=10):City[]{const q=normalize(query);if(!q)return[];const startsWith:City[]=[],contains:City[]=[];for(const city of getCities(country,unlockedCountries)){const lower=normalize(city.name);if(usedNames.has(lower))continue;if(lower.startsWith(q))startsWith.push(city);else if(lower.includes(q))contains.push(city)}return[...startsWith,...contains].slice(0,limit)}\n`}
const work=mkdtempSync(join(tmpdir(),"orten-geonames-")),counts={};
try{for(const country of countries){const zip=join(work,`${country.code}.zip`);execFileSync("curl",["--fail","--location","--silent","--show-error",`${SOURCE}/${country.code}.zip`,"--output",zip],{stdio:"inherit"});execFileSync("unzip",["-q","-o",zip,"-d",work],{stdio:"inherit"});const text=readFileSync(join(work,`${country.code}.txt`),"utf8"),places=parseCountry(text,country.limit);counts[country.key]=places.length;writeFileSync(new URL(country.file,DATA_DIR),country.key==="sweden"?swedishFile(places):cityArray(country.exportName,places,country.code),"utf8")}writeFileSync(new URL("cityCounts.json",DATA_DIR),`${JSON.stringify(counts,null,2)}\n`,"utf8");console.log("Ortdata uppdaterad:",counts)}finally{rmSync(work,{recursive:true,force:true})}
