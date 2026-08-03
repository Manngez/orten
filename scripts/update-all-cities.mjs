import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url);
const DATA_DIR = new URL("src/data/", ROOT);
const SOURCE = "https://download.geonames.org/export/dump";

const countries = [
  { code: "SE", key: "sweden", exportName: "SWEDISH_CITIES", file: "swedenCities.ts", limit: 6000 },
  { code: "NO", key: "norway", exportName: "NORWEGIAN_CITIES", file: "norwayCities.ts", limit: 6000 },
  { code: "FI", key: "finland", exportName: "FINNISH_CITIES", file: "finlandCities.ts", limit: 6000 },
  { code: "DK", key: "denmark", exportName: "DANISH_CITIES", file: "denmarkCities.ts", limit: 3000 },
  { code: "DE", key: "germany", exportName: "GERMAN_CITIES", file: "germanyCities.ts", limit: 12000 },
  { code: "NL", key: "netherlands", exportName: "NETHERLANDS_CITIES", file: "netherlandsCities.ts", limit: 5000 },
  { code: "BE", key: "belgium", exportName: "BELGIAN_CITIES", file: "belgiumCities.ts", limit: 5000 },
  { code: "LU", key: "luxembourg", exportName: "LUXEMBOURG_CITIES", file: "luxembourgCities.ts", limit: 1500 },
  { code: "FR", key: "france", exportName: "FRENCH_CITIES", file: "franceCities.ts", limit: 15000 },
  { code: "EE", key: "estonia", exportName: "ESTONIAN_CITIES", file: "estoniaCities.ts", limit: 6000 },
  { code: "LV", key: "latvia", exportName: "LATVIAN_CITIES", file: "latviaCities.ts", limit: 6000 },
  { code: "LT", key: "lithuania", exportName: "LITHUANIAN_CITIES", file: "lithuaniaCities.ts", limit: 6000 },
  { code: "PL", key: "poland", exportName: "POLISH_CITIES", file: "polandCities.ts", limit: 15000 },
  { code: "CH", key: "switzerland", exportName: "SWISS_CITIES", file: "switzerlandCities.ts", limit: 10000 },
  { code: "AT", key: "austria", exportName: "AUSTRIAN_CITIES", file: "austriaCities.ts", limit: 10000 },
  { code: "HU", key: "hungary", exportName: "HUNGARIAN_CITIES", file: "hungaryCities.ts", limit: 10000 },
  { code: "IT", key: "italy", exportName: "ITALIAN_CITIES", file: "italyCities.ts", limit: 20000 },
  { code: "ES", key: "spain", exportName: "SPANISH_CITIES", file: "spainCities.ts", limit: 20000 },
  { code: "AL", key: "albania", exportName: "ALBANIAN_CITIES", file: "albaniaCities.ts", limit: 6000 },
  { code: "AD", key: "andorra", exportName: "ANDORRAN_CITIES", file: "andorraCities.ts", limit: 1000 },
  { code: "AM", key: "armenia", exportName: "ARMENIAN_CITIES", file: "armeniaCities.ts", limit: 6000 },
  { code: "AZ", key: "azerbaijan", exportName: "AZERBAIJANI_CITIES", file: "azerbaijanCities.ts", limit: 8000 },
  { code: "BY", key: "belarus", exportName: "BELARUSIAN_CITIES", file: "belarusCities.ts", limit: 10000 },
  { code: "BA", key: "bosniaHerzegovina", exportName: "BOSNIAN_CITIES", file: "bosniaHerzegovinaCities.ts", limit: 8000 },
  { code: "BG", key: "bulgaria", exportName: "BULGARIAN_CITIES", file: "bulgariaCities.ts", limit: 10000 },
  { code: "HR", key: "croatia", exportName: "CROATIAN_CITIES", file: "croatiaCities.ts", limit: 8000 },
  { code: "CY", key: "cyprus", exportName: "CYPRIOT_CITIES", file: "cyprusCities.ts", limit: 4000 },
  { code: "CZ", key: "czechia", exportName: "CZECH_CITIES", file: "czechiaCities.ts", limit: 12000 },
  { code: "GE", key: "georgia", exportName: "GEORGIAN_CITIES", file: "georgiaCities.ts", limit: 7000 },
  { code: "GR", key: "greece", exportName: "GREEK_CITIES", file: "greeceCities.ts", limit: 12000 },
  { code: "IS", key: "iceland", exportName: "ICELANDIC_CITIES", file: "icelandCities.ts", limit: 4000 },
  { code: "IE", key: "ireland", exportName: "IRISH_CITIES", file: "irelandCities.ts", limit: 8000 },
  { code: "XK", key: "kosovo", exportName: "KOSOVAN_CITIES", file: "kosovoCities.ts", limit: 5000 },
  { code: "LI", key: "liechtenstein", exportName: "LIECHTENSTEIN_CITIES", file: "liechtensteinCities.ts", limit: 1000 },
  { code: "MT", key: "malta", exportName: "MALTESE_CITIES", file: "maltaCities.ts", limit: 2000 },
  { code: "MD", key: "moldova", exportName: "MOLDOVAN_CITIES", file: "moldovaCities.ts", limit: 7000 },
  { code: "MC", key: "monaco", exportName: "MONEGASQUE_CITIES", file: "monacoCities.ts", limit: 500 },
  { code: "ME", key: "montenegro", exportName: "MONTENEGRIN_CITIES", file: "montenegroCities.ts", limit: 4000 },
  { code: "MK", key: "northMacedonia", exportName: "MACEDONIAN_CITIES", file: "northMacedoniaCities.ts", limit: 5000 },
  { code: "PT", key: "portugal", exportName: "PORTUGUESE_CITIES", file: "portugalCities.ts", limit: 12000 },
  { code: "RO", key: "romania", exportName: "ROMANIAN_CITIES", file: "romaniaCities.ts", limit: 15000 },
  { code: "RU", key: "russia", exportName: "RUSSIAN_CITIES", file: "russiaCities.ts", limit: 20000, europeOnly: true },
  { code: "SM", key: "sanMarino", exportName: "SAN_MARINO_CITIES", file: "sanMarinoCities.ts", limit: 500 },
  { code: "RS", key: "serbia", exportName: "SERBIAN_CITIES", file: "serbiaCities.ts", limit: 10000 },
  { code: "SK", key: "slovakia", exportName: "SLOVAK_CITIES", file: "slovakiaCities.ts", limit: 9000 },
  { code: "SI", key: "slovenia", exportName: "SLOVENIAN_CITIES", file: "sloveniaCities.ts", limit: 6000 },
  { code: "TR", key: "turkey", exportName: "TURKISH_CITIES", file: "turkeyCities.ts", limit: 18000 },
  { code: "UA", key: "ukraine", exportName: "UKRAINIAN_CITIES", file: "ukraineCities.ts", limit: 18000 },
  { code: "GB", key: "unitedKingdom", exportName: "BRITISH_CITIES", file: "unitedKingdomCities.ts", limit: 20000 },
  { code: "VA", key: "vaticanCity", exportName: "VATICAN_CITIES", file: "vaticanCityCities.ts", limit: 100 },
];

const acceptedCodes = new Set(["PPL","PPLA","PPLA2","PPLA3","PPLA4","PPLA5","PPLC","PPLG","PPLS","PPLX"]);
const preferredCodes = new Set(["PPLC","PPLA","PPLA2","PPLA3","PPLA4","PPLA5"]);
const normalize=value=>value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g,"").replace(/\s+/g," ").trim().toLocaleLowerCase("sv-SE");
const titleScore=place=>(preferredCodes.has(place.featureCode)?1_000_000_000:0)+place.population;
function parseCountry(text,limit,europeOnly=false){const byName=new Map();for(const line of text.split("\n")){if(!line)continue;const c=line.split("\t");if(c.length<15||c[6]!=="P"||!acceptedCodes.has(c[7]))continue;const name=c[1]?.normalize("NFKC").replace(/\s+/g," ").trim(),lat=Number(c[4]),lng=Number(c[5]),population=Number(c[14])||0;if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||europeOnly&&lng>60||/^(unknown|unnamed|ohne namen)$/i.test(name))continue;const place={name,lat,lng,population,featureCode:c[7]},key=normalize(name),previous=byName.get(key);if(!previous||titleScore(place)>titleScore(previous))byName.set(key,place)}return[...byName.values()].sort((a,b)=>titleScore(b)-titleScore(a)||a.name.localeCompare(b.name)).slice(0,limit).sort((a,b)=>a.name.localeCompare(b.name))}
const escapeText=value=>JSON.stringify(value);
function cityArray(exportName,places,countryCode){const rows=places.map(place=>`  { name: ${escapeText(place.name)}, lat: ${place.lat.toFixed(5)}, lng: ${place.lng.toFixed(5)} },`).join("\n");return`import type { City } from "../types/game";\n\n/** GeoNames ${countryCode}, filtrerade bebodda platser. Genererad automatiskt. */\nexport const ${exportName}: City[] = [\n${rows}\n];\n`}
const work=mkdtempSync(join(tmpdir(),"orten-geonames-")),counts={};
try{for(const country of countries){const zip=join(work,`${country.code}.zip`);execFileSync("curl",["--fail","--location","--silent","--show-error",`${SOURCE}/${country.code}.zip`,"--output",zip],{stdio:"inherit"});execFileSync("unzip",["-q","-o",zip,"-d",work],{stdio:"inherit"});const text=readFileSync(join(work,`${country.code}.txt`),"utf8"),places=parseCountry(text,country.limit,country.europeOnly);counts[country.key]=places.length;writeFileSync(new URL(country.file,DATA_DIR),cityArray(country.exportName,places,country.code),"utf8")}writeFileSync(new URL("cityCounts.json",DATA_DIR),`${JSON.stringify(counts,null,2)}\n`,"utf8");console.log("Ortdata uppdaterad:",counts)}finally{rmSync(work,{recursive:true,force:true})}
