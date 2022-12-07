import { Cartographic, defined, Scene } from 'cesium';
import logger from 'loglevel';
/**
 * Computes the altitude on the terrain.
 *
 * @param {Scene} scene The scene
 * @param {Cartographic} result The position
 * @returns {number} The height
 */

export function getHeight(scene: Scene, cartographic: Cartographic): number | undefined {
  if (!defined(scene) || !defined(cartographic)) {
    logger.error('getHeight has undefined parameter');
    return undefined;
  }

  if (!defined(scene.globe)) {
    return undefined;
  }

  return scene.globe.getHeight(cartographic);
}
