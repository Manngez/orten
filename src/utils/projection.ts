import type { Point } from "../types/game";
import { EUROPE_BOUNDS } from "../data/europeOutlines";

const WIDTH=620,HEIGHT=1160,PAD=18;
const mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360));

/** Samma Web Mercator-projektion används för både landsgränser och samtliga orter. */
export function project(lat:number,lng:number,_country?:string):Point{
  const top=mercator(EUROPE_BOUNDS.latMax),bottom=mercator(EUROPE_BOUNDS.latMin);
  return {
    x:PAD+(lng-EUROPE_BOUNDS.lngMin)/(EUROPE_BOUNDS.lngMax-EUROPE_BOUNDS.lngMin)*(WIDTH-PAD*2),
    y:PAD+(top-mercator(lat))/(top-bottom)*(HEIGHT-PAD*2)
  };
}
