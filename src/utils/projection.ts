import type { Country, Point } from "../types/game";

/**
 * Project latitude/longitude to SVG coordinates.
 *
 * Sweden bounding box (approximate):
 *   Latitude:  55.2 to 69.1
 *   Longitude: 10.9 to 24.3
 *
 * SVG viewBox: 0 0 320 700
 *   Padding: 20px on each side
 *   Usable: 280 x 660
 */
const LAT_MIN = 55.2;
const LAT_MAX = 69.1;
const LNG_MIN = 10.9;
const LNG_MAX = 24.3;

const SVG_WIDTH = 320;
const SVG_HEIGHT = 700;
const PADDING_X = 25;
const PADDING_Y = 25;

const USABLE_W = SVG_WIDTH - PADDING_X * 2;
const USABLE_H = SVG_HEIGHT - PADDING_Y * 2;

export function project(lat: number, lng: number, country:Country="sweden"): Point {
  const bounds=country==="norway"?{latMin:57.7,latMax:71.3,lngMin:4,lngMax:31.5}:{latMin:LAT_MIN,latMax:LAT_MAX,lngMin:LNG_MIN,lngMax:LNG_MAX};
  const x = PADDING_X + ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * USABLE_W;
  // Latitude is inverted: higher lat = higher on map = lower y
  const y = PADDING_Y + ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * USABLE_H;
  return { x, y };
}

export interface ProjectionBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  svgWidth: number;
  svgHeight: number;
}

export function getProjectionBounds(): ProjectionBounds {
  return {
    latMin: LAT_MIN,
    latMax: LAT_MAX,
    lngMin: LNG_MIN,
    lngMax: LNG_MAX,
    svgWidth: SVG_WIDTH,
    svgHeight: SVG_HEIGHT,
  };
}
