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
];

const acceptedCodes = new Set([
  "PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5",
  "PPLC", "PPLG", "PPLS", "PPLX",
]);
const preferredCodes = new Set(["PPLC", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5"]);

function normalize(value) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("sv-SE");
}

function titleScore(place) {
  return (preferredCodes.has(place.featureCode) ? 1_000_000_000 : 0) + place.population;
}

function parseCountry(text, limit) {
  const byName = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const columns = line.split("\t");
    if (columns.length < 15 || columns[6] !== "P" || !acceptedCodes.has(columns[7])) continue;
    const name = columns[1]?.normalize("NFKC").replace(/\s+/g, " ").trim();
    const lat = Number(columns[4]);
    const lng = Number(columns[5]);
    const population = Number(columns[14]) || 0;
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (/^(unknown|unnamed|ohne namen)$/i.test(name)) continue;

    const place = { name, lat, lng, population, featureCode: columns[7] };
    const key = normalize(name);
    const previous = byName.get(key);
    if (!previous || titleScore(place) > titleScore(previous)) byName.set(key, place);
  }

  return [...byName.values()]
    .sort((a, b) => titleScore(b) - titleScore(a) || a.name.localeCompare(b.name))
    .slice(0, limit)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function escapeText(value) {
  return JSON.stringify(value);
}

function cityArray(exportName, places, countryCode) {
  const rows = places.map(place =>
    `  { name: ${escapeText(place.name)}, lat: ${place.lat.toFixed(5)}, lng: ${place.lng.toFixed(5)} },`
  ).join("\n");
  return `import type { City } from "../types/game";\n\n/** GeoNames ${countryCode}, filtrerade bebodda platser. Genererad automatiskt. */\nexport const ${exportName}: City[] = [\n${rows}\n];\n`;
}

function swedishFile(places) {
  return `${cityArray("SWEDISH_CITIES", places, "SE")}\nimport type { Country, NordicCountry } from "../types/game";\nimport { NORWEGIAN_CITIES } from "./norwayCities";\nimport { FINNISH_CITIES } from "./finlandCities";\nimport { DANISH_CITIES } from "./denmarkCities";\nimport { GERMAN_CITIES } from "./germanyCities";\n\nconst normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase("sv-SE").trim();\n\nexport function citiesForCountry(country: NordicCountry): City[] {\n  if (country === "norway") return NORWEGIAN_CITIES;\n  if (country === "finland") return FINNISH_CITIES;\n  if (country === "denmark") return DANISH_CITIES;\n  if (country === "germany") return GERMAN_CITIES;\n  return SWEDISH_CITIES;\n}\n\nexport function getCities(country: Country, unlockedCountries: NordicCountry[] = []): City[] {\n  return [country, ...unlockedCountries.filter(item => item !== country)].flatMap(citiesForCountry);\n}\n\nexport function createCityMap(country: Country): Map<string, City> {\n  return new Map(getCities(country).map(city => [normalize(city.name), city]));\n}\n\nexport function searchCities(query: string, usedNames: Set<string>, country: Country, unlockedCountries: NordicCountry[] = [], limit = 10): City[] {\n  const q = normalize(query);\n  if (!q) return [];\n  const startsWith: City[] = [];\n  const contains: City[] = [];\n  for (const city of getCities(country, unlockedCountries)) {\n    const lower = normalize(city.name);\n    if (usedNames.has(lower)) continue;\n    if (lower.startsWith(q)) startsWith.push(city);\n    else if (lower.includes(q)) contains.push(city);\n  }\n  return [...startsWith, ...contains].slice(0, limit);\n}\n`;
}

const work = mkdtempSync(join(tmpdir(), "orten-geonames-"));
const counts = {};
try {
  for (const country of countries) {
    const zip = join(work, `${country.code}.zip`);
    execFileSync("curl", ["--fail", "--location", "--silent", "--show-error", `${SOURCE}/${country.code}.zip`, "--output", zip], { stdio: "inherit" });
    execFileSync("unzip", ["-q", "-o", zip, "-d", work], { stdio: "inherit" });
    const text = readFileSync(join(work, `${country.code}.txt`), "utf8");
    const places = parseCountry(text, country.limit);
    counts[country.key] = places.length;
    const output = country.key === "sweden" ? swedishFile(places) : cityArray(country.exportName, places, country.code);
    writeFileSync(new URL(country.file, DATA_DIR), output, "utf8");
  }
  writeFileSync(new URL("cityCounts.json", DATA_DIR), `${JSON.stringify(counts, null, 2)}\n`, "utf8");
  console.log("Ortdata uppdaterad:", counts);
} finally {
  rmSync(work, { recursive: true, force: true });
}
