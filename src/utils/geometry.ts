import type { Point, LineSegment } from "../types/game";

/**
 * Check if two line segments intersect.
 * Lines that only meet at a shared endpoint do NOT count as intersecting.
 *
 * Uses the orientation test (cross product).
 */
export function segmentsIntersect(a: LineSegment, b: LineSegment): boolean {
  // If the segments share an endpoint, they don't count as crossing
  if (pointsEqual(a.from, b.from)) return false;
  if (pointsEqual(a.from, b.to)) return false;
  if (pointsEqual(a.to, b.from)) return false;
  if (pointsEqual(a.to, b.to)) return false;

  const o1 = orientation(a.from, a.to, b.from);
  const o2 = orientation(a.from, a.to, b.to);
  const o3 = orientation(b.from, b.to, a.from);
  const o4 = orientation(b.from, b.to, a.to);

  // General case: segments straddle each other
  if (o1 !== o2 && o3 !== o4) return true;

  // Special cases: collinear points
  // If any orientation is 0, check if the point lies on the segment
  if (o1 === 0 && onSegment(a.from, b.from, a.to)) return true;
  if (o2 === 0 && onSegment(a.from, b.to, a.to)) return true;
  if (o3 === 0 && onSegment(b.from, a.from, b.to)) return true;
  if (o4 === 0 && onSegment(b.from, a.to, b.to)) return true;

  return false;
}

/**
 * Find if a new line segment crosses any existing line segments.
 * Returns the pair of intersecting lines, or null if no crossing.
 */
export function findCrossing(
  newSegment: LineSegment,
  existingSegments: LineSegment[]
): [LineSegment, LineSegment] | null {
  for (const seg of existingSegments) {
    if (segmentsIntersect(newSegment, seg)) {
      return [seg, newSegment];
    }
  }
  return null;
}

/**
 * Orientation of ordered triplet (p, q, r).
 * Returns:
 *   0 → collinear
 *   1 → clockwise
 *   2 → counterclockwise
 */
function orientation(p: Point, q: Point, r: Point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-9) return 0;
  return val > 0 ? 1 : 2;
}

/**
 * Check if point q lies on segment pr (assuming collinear).
 */
function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    q.x <= Math.max(p.x, r.x) + 1e-9 &&
    q.x >= Math.min(p.x, r.x) - 1e-9 &&
    q.y <= Math.max(p.y, r.y) + 1e-9 &&
    q.y >= Math.min(p.y, r.y) - 1e-9
  );
}

function pointsEqual(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
}
