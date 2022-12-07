// q@ts-nocheck
/* qeslint-disable */

import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  // Cesium3DTileset,
  // Cesium3DTileFeature,
  defined,
  // Model,
  Ray,
  Scene
} from 'cesium';
import logger from 'loglevel';

const cartesianScratch = new Cartesian3();
const rayScratch = new Ray();

/**
 * Computes the world position on either the terrain or tileset from a mouse position.
 *
 * @param {Scene} scene The scene
 * @param {Cartesian2} mousePosition The mouse position
 * @param {Cartographic} result The result position
 * @returns {Cartographic} The position in world space
 */
export function getWorldCartographic(
  scene: Scene,
  mousePosition: Cartesian2,
  result: Cartographic
): Cartographic | undefined {
  if (!defined(scene) || !defined(mousePosition) || !defined(result)) {
    logger.error('getWorldCartographic has undefined parameter');
    return undefined;
  }

  if (!defined(scene.globe)) {
    return undefined;
  }

  const ray = scene.camera.getPickRay(mousePosition, rayScratch);

  const position = scene.globe.pick(ray!, scene, cartesianScratch);

  if (defined(position)) {
    const cartographic = Cartographic.fromCartesian(position!);
    return Cartographic.clone(cartographic, result);
  }

  return undefined;
}
