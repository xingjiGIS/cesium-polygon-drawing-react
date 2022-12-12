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
import { Line } from './Line';
import { LineDrawing } from './LineDrawing';

class DrawingTools extends MapTools {
  private readonly _lines: {
    lines: Line[];
  };

  private readonly _lineDrawing: LineDrawing;
  private readonly _lineDeleted: Event;

  constructor(options: { viewer: Viewer; ellipsoid?: Ellipsoid }) {
    super(options);

    this._lines = {
      lines: []
    };

    const primitiveCollection = new PrimitiveCollection();

    this._viewer = options.viewer;
    options.viewer.scene.primitives.add(primitiveCollection);

    this._lineDrawing = new LineDrawing({
      viewer: options.viewer,
      name: 'LineDrawing',
      cursorStyle: getMapToolCursorStyle('./resources/cursors/mCapturePoint.svg'),
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.activeColor,
        ellipsoid: options.ellipsoid as Ellipsoid,
        dashed: false,
        loop: false
      }),
      primitives: primitiveCollection,
      lines: this._lines.lines,
      markerOptions: DrawingSettings.getMarkerPointOptions()
    });

    this._lineDeleted = new Event();
  }

  activateDrawing() {
    this._lineDrawing.showMarker();
    // @ts-ignore
    this._viewer.setMapTool(this._lineDrawing);
  }

  get lineDrawing() {
    return this._lineDrawing;
  }

  get lineCount() {
    return this._lines.lines.length;
  }

  deleteLine(id: string) {
    this._deleteLineFromLines(id);

    this._lineDeleted.raiseEvent([id]);
  }

  batchDeleteLines(list: string[]) {
    list.forEach((id) => {
      this._deleteLineFromLines(id);
    });
  }

  _deleteLineFromLines(id: string) {
    let founded;
    let foundedIndex: number = -1;

    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      if (line.id === id) {
        founded = line;
        foundedIndex = i;
        break;
      }
    }

    if (!founded) {
      console.warn(`failed to find line id: ${id}`);
      return false;
    }

    this._lines.lines.splice(foundedIndex, 1);
    founded.show = false;
    founded.destroy();

    return true;
  }

  getLine(id: string) {
    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      if (line.id === id) return line;
    }

    return null;
  }

  getLines() {
    return this._lines.lines;
  }

  static destroy() {}

  get lines() {
    return this._lines;
  }

  findLine(primitive: Primitive) {
    if (!primitive.geometryInstances) return null;

    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      /*
        refer releaseGeometryInstances option in  https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html?classFilter=Primitive
      */
      // @ts-ignore
      if (line.line.id === primitive.geometryInstances.id) return line;
    }

    return null;
  }

  restoreOriginalColor(line: { line: { color: Color } }) {
    line.line.color = this._lineDrawing.options.polylineOptions.color;
  }

  recalculateBoundingSphereOfAll() {
    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      if (line.show) {
        line.recalculateBoundingSphere();
      }
    }
  }

  forceUpdateAll() {
    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      if (line.show) {
        line.forceUpdate();
      }
    }
  }

  showHideAll(show: boolean) {
    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      line.show = show;
    }
  }

  get lineDeleted() {
    return this._lineDeleted;
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._lineDrawing.destroy();

    for (let i = 0; i < this._lines.lines.length; i++) {
      const line = this._lines.lines[i];

      line.destroy();
    }

    destroyObject(this);
  }
}

export default DrawingTools;
