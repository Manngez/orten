import type { Point } from "../types/game";
import { EUROPE_BOUNDS,EUROPE_HEIGHT,EUROPE_PADDING,EUROPE_WIDTH } from "../data/europeOutlines";

const mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360));

/** Samma Web Mercator-projektion används för både landsgränser och samtliga orter. */
export function project(lat:number,lng:number,_country?:string):Point{
  const top=mercator(EUROPE_BOUNDS.latMax),bottom=mercator(EUROPE_BOUNDS.latMin);
  return {
    x:EUROPE_PADDING+(lng-EUROPE_BOUNDS.lngMin)/(EUROPE_BOUNDS.lngMax-EUROPE_BOUNDS.lngMin)*(EUROPE_WIDTH-EUROPE_PADDING*2),
    y:EUROPE_PADDING+(top-mercator(lat))/(top-bottom)*(EUROPE_HEIGHT-EUROPE_PADDING*2)
  };
}
