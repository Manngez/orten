import type { NordicCountry,Point } from "../types/game";
import { NORDIC_BOUNDS } from "../data/nordicOutline";

const mercator=(value:number)=>Math.log(Math.tan(Math.PI/4+value*Math.PI/360));
const REGIONS:Partial<Record<NordicCountry,{lngMin:number;lngMax:number;latMin:number;latMax:number;left:number;right:number;topY:number;bottomY:number}>>={
  germany:{lngMin:5.5,lngMax:15.5,latMin:47,latMax:55.2,left:72,right:252,topY:722,bottomY:947},
  netherlands:{lngMin:3.2,lngMax:7.3,latMin:50.7,latMax:53.7,left:47,right:119,topY:706,bottomY:784},
  belgium:{lngMin:2.4,lngMax:6.5,latMin:49.4,latMax:51.6,left:43,right:122,topY:770,bottomY:837},
  luxembourg:{lngMin:5.7,lngMax:6.6,latMin:49.4,latMax:50.2,left:102,right:126,topY:824,bottomY:858},
  france:{lngMin:-5.3,lngMax:9.8,latMin:41.2,latMax:51.2,left:17,right:226,topY:817,bottomY:1098}
};

export function project(lat:number,lng:number,country:NordicCountry|string="sweden"):Point{
  const region=REGIONS[country as NordicCountry];
  if(region){const top=mercator(region.latMax),bottom=mercator(region.latMin);return{x:region.left+(lng-region.lngMin)/(region.lngMax-region.lngMin)*(region.right-region.left),y:region.topY+(top-mercator(lat))/(top-bottom)*(region.bottomY-region.topY)}}
  const width=620,height=760,pad=22,top=mercator(NORDIC_BOUNDS.latMax),bottom=mercator(NORDIC_BOUNDS.latMin);
  return{x:pad+(lng-NORDIC_BOUNDS.lngMin)/(NORDIC_BOUNDS.lngMax-NORDIC_BOUNDS.lngMin)*(width-pad*2),y:pad+(top-mercator(lat))/(top-bottom)*(height-pad*2)};
}
