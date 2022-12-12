import { Cartesian3, Cartographic, PointPrimitive, Scene } from 'cesium';

const scratchCarto = new Cartographic();
const scratchCarte = new Cartesian3();

export function updateHeightOfPointPrimitives(scene: Scene, pointPrimitives: PointPrimitive[]) {
  const ellipsoid = scene.globe.ellipsoid;

  pointPrimitives.forEach((pointPrimitive) => {
    ellipsoid.cartesianToCartographic(pointPrimitive.position, scratchCarto);

    scratchCarto.height = 0;

    const height = scene.globe.getHeight(scratchCarto);

    Cartesian3.fromRadians(
      scratchCarto.longitude,
      scratchCarto.latitude,
      height,
      ellipsoid,
      scratchCarte
    );

    pointPrimitive.position.x = scratchCarte.x;
    pointPrimitive.position.y = scratchCarte.y;
    pointPrimitive.position.z = scratchCarte.z;
  });
}
