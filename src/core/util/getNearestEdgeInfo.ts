import { Cartesian3, Cartographic, Scene } from 'cesium';

export interface NearestEdgeInfo {
  minHeight: number;
  segIdx: number;
  basePos: Cartesian3;
  minDist: number;
  vertexIdx: number;
  vertexPos: Cartesian3;
}

const cart3Scratch = new Cartesian3();

/**
 * Get distance between two Cartographics in Cartographic plane.
 * @param {Cartographic} a
 * @param {Cartographic} b
 * @returns {number}
 */
function distanceBetweenCarto(a: Cartographic, b: Cartographic) {
  return Math.sqrt(
    (a.longitude - b.longitude) * (a.longitude - b.longitude) +
      (a.latitude - b.latitude) * (a.latitude - b.latitude)
  );
}

/**
 * Get the nearest Edge and vertex from polygon contructed by positions
 * @param {Scene} scene
 * @param {Cartesian3[]} positions
 * @param {Cartesian3} pos
 * @returns {NearestEdgeInfo}
 */
export function getNearestEdgeInfo(
  scene: Scene,
  positions: Cartesian3[],
  pos: Cartesian3
): NearestEdgeInfo {
  const length = positions.length;
  // min distance from line Edge
  let minHeight = Number.POSITIVE_INFINITY;
  let minHeightCarto = Number.POSITIVE_INFINITY;
  let segIdx = -1;
  // min distance from vertex
  let minDist = Number.POSITIVE_INFINITY;
  let vertexIdx = -1;
  let vertexPos = new Cartesian3();

  const basePos = new Cartesian3();

  const ellipsoid = scene.globe.ellipsoid;

  const carto = new Cartographic();
  ellipsoid.cartesianToCartographic(pos, carto);

  for (let i = 0; i < length; i++) {
    const segStartPos = positions[i];
    const segStartCarto = new Cartographic();
    ellipsoid.cartesianToCartographic(segStartPos, segStartCarto);
    segStartCarto.height = 0;
    Cartesian3.fromRadians(
      segStartCarto.longitude,
      segStartCarto.latitude,
      scene.globe.getHeight(segStartCarto),
      ellipsoid,
      cart3Scratch
    );
    segStartPos.x = cart3Scratch.x;
    segStartPos.y = cart3Scratch.y;
    segStartPos.z = cart3Scratch.z;

    const segEndPos = positions[(i + 1) % length];
    const segEndCarto = new Cartographic();
    ellipsoid.cartesianToCartographic(segEndPos, segEndCarto);
    segEndCarto.height = 0;
    Cartesian3.fromRadians(
      segEndCarto.longitude,
      segEndCarto.latitude,
      scene.globe.getHeight(segEndCarto),
      ellipsoid,
      cart3Scratch
    );
    segEndPos.x = cart3Scratch.x;
    segEndPos.y = cart3Scratch.y;
    segEndPos.z = cart3Scratch.z;

    const segMidCarto = new Cartographic(
      (segStartCarto.longitude + segEndCarto.longitude) / 2,
      (segStartCarto.latitude + segEndCarto.latitude) / 2,
      0
    );

    const radius0 = distanceBetweenCarto(segMidCarto, segStartCarto);
    const radius1 = distanceBetweenCarto(segMidCarto, carto);
    const a = distanceBetweenCarto(segStartCarto, segEndCarto);
    const c = distanceBetweenCarto(segEndCarto, carto);
    const b = distanceBetweenCarto(segStartCarto, carto);

    const distanceToVertex = Cartesian3.distance(pos, segStartPos);

    if (minDist > distanceToVertex) {
      minDist = distanceToVertex;
      vertexIdx = i;
      vertexPos = segStartPos;
    }

    if (radius1 <= radius0) {
      const s = (a + b + c) / 2;
      // Heron's formula
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const height = area / a;

      if (minHeightCarto > height) {
        minHeightCarto = height;
        segIdx = i;

        const dbase = Math.sqrt(b * b - minHeightCarto * minHeightCarto) / a;
        const delta = new Cartographic(
          (segEndCarto.longitude - segStartCarto.longitude) * dbase,
          (segEndCarto.latitude - segStartCarto.latitude) * dbase,
          0
        );

        const basePosCarto = new Cartographic(
          segStartCarto.longitude + delta.longitude,
          segStartCarto.latitude + delta.latitude,
          0
        );

        const altitude = scene.globe.getHeight(basePosCarto);

        Cartesian3.fromRadians(
          basePosCarto.longitude,
          basePosCarto.latitude,
          altitude,
          ellipsoid,
          cart3Scratch
        );

        basePos.x = cart3Scratch.x;
        basePos.y = cart3Scratch.y;
        basePos.z = cart3Scratch.z;

        minHeight = Cartesian3.distance(basePos, pos);
      }
    }
  }
  return { minHeight, segIdx, basePos, minDist, vertexIdx, vertexPos };
}
