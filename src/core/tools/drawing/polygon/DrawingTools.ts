// q@ts-nocheck
import {
  Color,
  destroyObject,
  Ellipsoid,
  Event,
  Primitive,
  PrimitiveCollection,
  Viewer
} from 'cesium';

import { getMapToolCursorStyle, MapTools } from '../../../common';
import DrawingSettings from '../../common/DrawingSettings';
import { Polygon } from './Polygon';
import { PolygonDrawing } from './PolygonDrawing';

const DEFAULT_POLYGON_COLOR = Color.WHITE.withAlpha(0.2);
class DrawingTools extends MapTools {
  private readonly _polygons: {
    polygons: Polygon[];
  };

  private readonly _polygonDrawing: PolygonDrawing;
  private readonly _polygonDeleted: Event;

  constructor(options: { viewer: Viewer; ellipsoid?: Ellipsoid }) {
    super(options);

    this._polygons = {
      polygons: []
    };

    const primitiveCollection = new PrimitiveCollection();

    this._viewer = options.viewer;
    options.viewer.scene.primitives.add(primitiveCollection);

    this._polygonDrawing = new PolygonDrawing({
      viewer: options.viewer,
      name: 'PolygonDrawing',
      cursorStyle: getMapToolCursorStyle('./resources/cursors/mCapturePoint.svg'),
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.activeColor,
        ellipsoid: options.ellipsoid as Ellipsoid,
        dashed: false,
        loop: false
      }),
      polygonOptions: {
        color: DEFAULT_POLYGON_COLOR
      },
      primitives: primitiveCollection,
      polygons: this._polygons.polygons,
      markerOptions: DrawingSettings.getMarkerPointOptions()
    });

    this._polygonDeleted = new Event();
  }

  activateDrawing() {
    this._polygonDrawing.showMarker();
    // @ts-ignore
    this._viewer.setMapTool(this._polygonDrawing);
  }

  get polygonDrawing() {
    return this._polygonDrawing;
  }

  get polygonCount() {
    return this._polygons.polygons.length;
  }

  deletePolygon(id: string) {
    this._deletePolygonFromPolygons(id);

    this._polygonDeleted.raiseEvent([id]);
  }

  batchDeletePolygons(list: string[]) {
    list.forEach((id) => {
      this._deletePolygonFromPolygons(id);
    });
  }

  _deletePolygonFromPolygons(id: string) {
    let founded;
    let foundedIndex: number = -1;

    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      if (polygon.id === id) {
        founded = polygon;
        foundedIndex = i;
        break;
      }
    }

    if (!founded) {
      console.warn(`failed to find polygon id: ${id}`);
      return false;
    }

    this._polygons.polygons.splice(foundedIndex, 1);
    founded.show = false;
    founded.destroy();

    return true;
  }

  getPolygon(id: string) {
    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      if (polygon.id === id) return polygon;
    }

    return null;
  }

  getPolygons() {
    return this._polygons.polygons;
  }

  static destroy() {}

  get polygons() {
    return this._polygons;
  }

  findPolygon(primitive: Primitive) {
    if (!primitive.geometryInstances) return null;

    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      /*
        refer releaseGeometryInstances option in  https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html?classFilter=Primitive
      */
      // @ts-ignore
      if (polygon.polygon.id === primitive.geometryInstances.id) return polygon;
    }

    return null;
  }

  restoreOriginalColor(polygon: { polygon: { color: Color } }) {
    polygon.polygon.color = this._polygonDrawing.options.polygonOptions.color;
  }

  recalculateBoundingSphereOfAll() {
    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      if (polygon.show) {
        polygon.recalculateBoundingSphere();
      }
    }
  }

  forceUpdateAll() {
    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      if (polygon.show) {
        polygon.forceUpdate();
      }
    }
  }

  showHideAll(show: boolean) {
    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      polygon.show = show;
    }
  }

  get polygonDeleted() {
    return this._polygonDeleted;
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._polygonDrawing.destroy();

    for (let i = 0; i < this._polygons.polygons.length; i++) {
      const polygon = this._polygons.polygons[i];

      polygon.destroy();
    }

    destroyObject(this);
  }
}

export default DrawingTools;
