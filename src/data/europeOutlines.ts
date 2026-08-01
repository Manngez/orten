/** Reservdata. Ersätts automatiskt med riktiga GeoJSON-gränser före varje bygge. */
export const EUROPE_VIEWBOX="0 0 620 1160";
export const EUROPE_BOUNDS={lngMin:-10,lngMax:32,latMin:41,latMax:72} as const;
const empty={path:"",main:""};
export const EUROPE_OUTLINES={sweden:empty,norway:empty,finland:empty,denmark:empty,germany:empty,netherlands:empty,belgium:empty,luxembourg:empty,france:empty} as const;
