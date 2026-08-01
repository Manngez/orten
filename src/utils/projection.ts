import type { NordicCountry,Point } from "../types/game";
import { NORDIC_BOUNDS } from "../data/nordicOutline";

const mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360));

/** Shared Web Mercator projection for Nordic countries, plus a dedicated German view. */
export function project(lat:number,lng:number,country:NordicCountry|string="sweden"):Point{
  const width=620,height=760,pad=country==="germany"?30:22;
  const bounds=country==="germany"
    ? {lngMin:5.5,lngMax:15.5,latMin:47.0,latMax:55.2}
    : NORDIC_BOUNDS;
  const top=mercator(bounds.latMax),bottom=mercator(bounds.latMin);
  return{x:pad+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*(width-pad*2),y:pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)};
}
