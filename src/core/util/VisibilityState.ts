// q@ts-nocheck
/* qeslint-disable */
/* eslint-disable import/no-duplicates, no-var, vars-on-top, no-continue */
import {
  // @ts-ignore
  ManagedArray,
  Cesium3DTileset,
  Model,
  PrimitiveCollection,
  Scene
} from 'cesium';

class VisibilityState {
  states: ManagedArray;
  count: number;

  constructor() {
    this.states = new ManagedArray();
    this.count = 0;
  }

  hidePrimitiveCollection(primitiveCollection: PrimitiveCollection) {
    const primitivesLength = primitiveCollection.length;
    for (let i = 0; i < primitivesLength; ++i) {
      const primitive = primitiveCollection.get(i);
      if (primitive instanceof PrimitiveCollection) {
        this.hidePrimitiveCollection(primitive);
        continue;
      }

      this.states.push(primitive.show);

      if (primitive instanceof Cesium3DTileset || primitive instanceof Model) {
        continue;
      }
      primitive.show = false;
    }
  }

  restorePrimitiveCollection(primitiveCollection: PrimitiveCollection) {
    const primitivesLength = primitiveCollection.length;
    for (let i = 0; i < primitivesLength; ++i) {
      const primitive = primitiveCollection.get(i);
      if (primitive instanceof PrimitiveCollection) {
        this.restorePrimitiveCollection(primitive);
        continue;
      }

      primitive.show = this.states.get(this.count++);
    }
  }

  hide(scene: Scene) {
    this.states.length = 0;

    this.hidePrimitiveCollection(scene.primitives);
    this.hidePrimitiveCollection(scene.groundPrimitives);
  }

  restore(scene: Scene) {
    this.count = 0;

    this.restorePrimitiveCollection(scene.primitives);
    this.restorePrimitiveCollection(scene.groundPrimitives);
  }
}

export default VisibilityState;
