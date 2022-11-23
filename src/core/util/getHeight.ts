// q@ts-nocheck
/* qeslint-disable */
import { Cartographic, Scene } from 'cesium';

function getHeight(scene: Scene, cartographic: Cartographic) {
  let closetSubsurface = null;

  if (scene.cameraUnderground || !scene.globe.show) {
    // @ts-ignore
    closetSubsurface = scene.getClosestSubsurfaceFromCamera();
  }

  if (closetSubsurface) {
    return closetSubsurface.getHeight(cartographic);
  }

  return scene.globe.getHeight(cartographic);
}

export { getHeight };
