import type { NordicCountry,Point } from "../types/game";
import { NORDIC_BOUNDS } from "../data/nordicOutline";

/** Shared Web Mercator projection for every Nordic country and city. */
export function project(lat:number,lng:number,_country:NordicCountry="sweden"):Point{
  const width=620,height=760,pad=22,mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360)),top=mercator(NORDIC_BOUNDS.latMax),bottom=mercator(NORDIC_BOUNDS.latMin);
  return{x:pad+(lng-NORDIC_BOUNDS.lngMin)/(NORDIC_BOUNDS.lngMax-NORDIC_BOUNDS.lngMin)*(width-pad*2),y:pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)};
}
