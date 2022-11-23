// q@ts-nocheck
/* qeslint-disable */

import {
  Cartesian2,
  Cartesian3,
  Cesium3DTileset,
  Cesium3DTileFeature,
  defined,
  Model,
  Ray,
  Scene
} from 'cesium';
import logger from 'loglevel';
import VisibilityState from './VisibilityState';

const cartesianScratch = new Cartesian3();
const rayScratch = new Ray();
const visibilityState = new VisibilityState();

/**
 * Computes the world position on either the terrain or tileset from a mouse position.
 *
 * @param {Scene} scene The scene
 * @ionsdk
 * @param {Cartesian2} mousePosition The mouse position
 * @param {Cartesian3} result The result position
 * @returns {Cartesian3} The position in world space
 */

export function getWorldPosition(
  scene: Scene,
  mousePosition: Cartesian2,
  result: Cartesian3
): Cartesian3 | undefined {
  if (!defined(scene) || !defined(mousePosition) || !defined(result)) {
    logger.error('getWorldPosition has undefined parameter');
    return undefined;
  }

  let position;
  if (scene.pickPositionSupported) {
    // Hide every primitive that isn't a tileset
    visibilityState.hide(scene);

    // Don't pick default 3x3, or scene.pick may allow a mousePosition that isn't on the tileset to pickPosition.
    const pickedObject = scene.pick(mousePosition, 1, 1);

    visibilityState.restore(scene);

    if (
      defined(pickedObject) &&
      (pickedObject instanceof Cesium3DTileFeature ||
        pickedObject.primitive instanceof Cesium3DTileset ||
        pickedObject.primitive instanceof Model)
    ) {
      // check to let us know if we should pick against the globe instead
      position = scene.pickPosition(mousePosition, cartesianScratch);

      if (defined(position)) {
        return Cartesian3.clone(position, result);
      }
    }
  }

  if (!defined(scene.globe)) {
    return undefined;
  }

  const ray = scene.camera.getPickRay(mousePosition, rayScratch);

  if (scene.cameraUnderground) {
    // @ts-ignore
    const subsurfaces = scene.subsurfaces;

    for (let i = 0; i < subsurfaces.length; i++) {
      position = subsurfaces[i].pick(ray, scene, cartesianScratch);

      if (defined(position)) return position;
    }
  } else {
    position = scene.globe.pick(ray!, scene, cartesianScratch);
  }

  if (defined(position)) {
    return Cartesian3.clone(position, result);
  }

  return undefined;
}
