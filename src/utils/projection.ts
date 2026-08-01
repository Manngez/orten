import type { NordicCountry,Point } from "../types/game";
import { NORDIC_BOUNDS } from "../data/nordicOutline";

const mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360));

/**
 * Projects cities into the coordinate system used by the rendered outlines.
 * Nordic countries retain their original 620x760 projection. Germany is drawn
 * as a southern expansion in the same SVG and therefore uses the exact map
 * rectangle occupied by GERMANY_EXPANSION_OUTLINE.
 */
export function project(lat:number,lng:number,country:NordicCountry|string="sweden"):Point{
  if(country==="germany"){
    const bounds={lngMin:5.5,lngMax:15.5,latMin:47.0,latMax:55.2};
    const left=72,right=252,topY=722,bottomY=947.3;
    const top=mercator(bounds.latMax),bottom=mercator(bounds.latMin);
    return {
      x:left+(lng-bounds.lngMin)/(bounds.lngMax-bounds.lngMin)*(right-left),
      y:topY+(top-mercator(lat))/(top-bottom)*(bottomY-topY)
    };
  }

  const width=620,height=760,pad=22;
  const top=mercator(NORDIC_BOUNDS.latMax),bottom=mercator(NORDIC_BOUNDS.latMin);
  return {
    x:pad+(lng-NORDIC_BOUNDS.lngMin)/(NORDIC_BOUNDS.lngMax-NORDIC_BOUNDS.lngMin)*(width-pad*2),
    y:pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)
  };
}
