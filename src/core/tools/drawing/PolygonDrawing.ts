// q@ts-nocheck
/* qeslint-disable */
import {
  Cartesian2,
  Cartesian3,
  createGuid,
  defined,
  destroyObject,
  DeveloperError,
  Event,
  PointPrimitive,
  PointPrimitiveCollection,
  PrimitiveCollection,
  Scene
} from 'cesium';
import { MapTool, MapToolConstructorOptions, MouseButton, MouseEvent } from '../../common';
import DrawingMode from './DrawingMode';
import { Polygon, Vertex } from './Polygon';
import { PointOptions, PolylineOptions, PolygonOptions } from './DrawingSettings';

const clickDistanceScratch = new Cartesian2();
const cart3Scratch = new Cartesian3();
// const cart3Scratch1 = new Cartesian3();
const mouseDelta = 10;
const ESC_KEY = 'Escape';
const DELETE_KEY = 'Delete';

const SNAP_PIXELSIZE_TO_VERTEX = 15;
const SNAP_PIXELSIZE_TO_SEGMENT = 10;

const enum SnapMode {
  NONE = -1,
  VERTEX = 0,
  SEGMENT = 1
}

/**
 * Options for polygon drawing tool
 */
export interface PolygonDrawingConstructorOptions extends MapToolConstructorOptions {
  primitives: PrimitiveCollection;
  polygons: Polygon[];
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
  polygonOptions: PolygonOptions;
  markerOptions: PointOptions;
  local?: string | string[];
}

export interface SnapPointOptions {
  segStartIdx: number;
  position: Cartesian3;
}

/**
 * PolygonDrawing is one kind of MapTool to draw and to edit polygon
 * _mode: to check if it's on drawing state, or finished drawing, or on editing state ...
 * _polygon: to store Polygon
 * _polygons: to store multiple polygons
 * _lastClickPosition: mouse position on UI, when click the MLB, mouse position will be saved
 * _tempNextPos: to store mouse position on cesium scene
 */
class PolygonDrawing extends MapTool {
  protected _mode: DrawingMode;
  protected _polygon!: Polygon;
  protected _polygons: Polygon[];
  protected readonly _lastClickPosition: Cartesian2;
  protected readonly _tempNextPos: Cartesian3;

  private readonly _scene: Scene;

  private readonly _options: PolygonDrawingConstructorOptions;
  private _focusedPointPrimitive: Vertex | undefined;

  // Event implementation
  private readonly _evtVertexCreatedWhileDrawing: Event;
  private readonly _evtPolygonCreated: Event;
  private readonly _evtVertexModifiedInPolygon: Event;
  private readonly _evtVertexAddedInPolygon: Event;
  private readonly _evtVertexDeletedInPolygon: Event;
  private readonly _evtPolygonDeleted: Event;

  // Marker point following mouse position
  private readonly _markerPointPrimitive: PointPrimitive;
  private readonly _markerPointCollection: PointPrimitiveCollection;

  // Is dragging
  private _isDrag: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on segment
  private _snapMode: SnapMode;
  // snapped point on line segment
  private _tempSnapPoint: SnapPointOptions | undefined;
  // vertex added on line segment from the snapped point
  private _snapVertex: Vertex | undefined;

  constructor(options: PolygonDrawingConstructorOptions) {
    super(options);

    const scene = this._viewer.scene;

    this._tempNextPos = new Cartesian3();
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition = new Cartesian2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    this._scene = scene;
    this._polygons = options.polygons;
    this._options = options;

    this._evtVertexCreatedWhileDrawing = new Event();
    this._evtPolygonCreated = new Event();
    this._evtVertexModifiedInPolygon = new Event();
    this._evtVertexAddedInPolygon = new Event();
    this._evtVertexDeletedInPolygon = new Event();
    this._evtPolygonDeleted = new Event();

    this._markerPointCollection = this.options.primitives.add(
      new PointPrimitiveCollection({ show: true })
    );
    this._markerPointPrimitive = this._markerPointCollection.add(this.options.markerOptions);

    this._isDrag = false;
    this._snapMode = SnapMode.NONE;
  }

  /**
   * Whenever camera changed, update polygon primitives
   */
  updatePolygons() {
    const scene = this._scene;

    const camera = scene.camera;
    const frustum = camera.frustum;

    const cullingVolume = frustum.computeCullingVolume(
      camera.position,
      camera.direction,
      camera.up
    );

    this._polygons.forEach((polygon: Polygon) => {
      polygon.update(cullingVolume);
    });
  }

  get options() {
    return this._options;
  }

  activate() {
    super.activate();

    this._reset();

    return true;
  }

  deactivate() {
    super.deactivate();

    // this._reset();
  }

  get mode() {
    return this._mode;
  }

  set mode(value: number) {
    this._mode = value;
  }

  get polygons() {
    return this._polygons;
  }

  get evtVertexAddedInPolygon() {
    return this._evtVertexAddedInPolygon;
  }

  get evtVertexCreatedWhileDrawing() {
    return this._evtVertexCreatedWhileDrawing;
  }

  get evtVertexDeletedInPolygon() {
    return this._evtVertexDeletedInPolygon;
  }

  get evtVertexModifiedInPolygon() {
    return this._evtVertexModifiedInPolygon;
  }

  get evtPolygonDeleted() {
    return this._evtPolygonDeleted;
  }

  get evtPolygonCreated() {
    return this._evtPolygonCreated;
  }

  /**
   * Get polygon by id
   * @param {string} id
   * @returns
   */
  getPolygonById(id: string) {
    const polygons = this._polygons.filter((polygon: Polygon) => polygon.id === id);
    if (polygons.length > 0) {
      return polygons[0];
    }
    return null;
  }

  /**
   * Mouse event on canvas, triggered when MLB or MRB clicked
   * @param {MouseEvent} event
   * @returns
   */
  canvasPressEvent(event: MouseEvent) {
    if (event.button === MouseButton.LeftButton && this._mode !== DrawingMode.EditDraw) {
      const supportModifyPolygonVertex = false;

      const pointPrimitive = this._pickPointPrimitive(event.pos);

      if (supportModifyPolygonVertex && defined(pointPrimitive)) {
        // highlight a vertex for dragging
      } else {
        this._handleCanvasPressEventForDrawing(event);
      }
    } else if (event.button === MouseButton.RightButton && this._mode !== DrawingMode.EditDraw) {
      // expect point to be added by handleClick
      // this._mode = DrawingMode.AfterDraw;
      // this._mode = DrawingMode.EditDraw;
      // Sometimes a move event is fired between the ending
      // click and doubleClick events, so make sure the polyline
      // and polygon have the correct positions.

      if (!this._polygon) {
        // eslint-disable-next-line no-new
        new DeveloperError('Polygon did not initialized!');
        return;
      }
      this._polygon.finishDrawing();

      // if number of vertex < 3, remove and reset polygon
      if (this._polygon.positions.length < 3) {
        this.deletePolygon();
        return;
      }
      // add Polygon
      this._polygons.push(this._polygon);

      this._evtPolygonCreated.raiseEvent([this._polygon], [this]);

      const camera = this._scene.camera;

      const cullingVolume = camera.frustum.computeCullingVolume(
        camera.position,
        camera.direction,
        camera.up
      );
      this._polygon.update(cullingVolume);
    } else if (event.button === MouseButton.RightButton && this._mode === DrawingMode.EditDraw) {
      if (this._snapVertex) {
        // Delete vertex
        this.deleteVertex(this._snapVertex);
        // if number of vertex < 3, remove and reset polygon
        if (this._polygon.positions.length < 3) {
          this.deletePolygon();
          return;
        }
        console.info('removed vertex');
      }
    } else if (event.button === MouseButton.LeftButton && this._mode === DrawingMode.EditDraw) {
      this._isDrag = true;
    }

    if (
      event.button === MouseButton.LeftButton &&
      this._mode === DrawingMode.EditDraw &&
      this._snapMode === SnapMode.SEGMENT
    ) {
      // Add a vertex on polygon line segment
      if (this._tempSnapPoint) {
        this._snapVertex = this._polygon.insertVertex(
          this._tempSnapPoint.position,
          this._tempSnapPoint.segStartIdx
        );
      }
    }
  }

  /**
   * Key press event, triggered when key pressed
   * @param {KeyboardEvent} event
   * @returns
   */
  keyPressEvent(event: KeyboardEvent) {
    if (this._mode !== DrawingMode.Drawing) {
      return;
    }

    if (event.key === ESC_KEY) {
      this.deletePolygon();
    }

    if (event.key === DELETE_KEY) {
      this._polygon.deleteLastPoint();
      this._polygon.updateLastPosition(this._tempNextPos);
    }
  }

  /**
   * Remove and reset  Polygon
   */
  deletePolygon() {
    this._polygon.positions = [];
    this._polygon._hideAllPrimitives();
    this._reset();

    if (this._mode === DrawingMode.EditDraw) {
      this._evtPolygonDeleted.raiseEvent([this._polygon], [this]);
    }
  }

  /**
   * Delete Vertex
   */
  deleteVertex(vertex: Vertex) {
    this._polygon.deletePoint(vertex.vertexIndex);
    this.evtVertexDeletedInPolygon.raiseEvent([vertex], [this._polygon], [this]);
  }

  /**
   * Highlight point primitive, eg., when mouse over
   * @param {Vertex} pointPrimitive
   */
  _setFocusedPointPrimitive(pointPrimitive: Vertex) {
    this._focusedPointPrimitive = pointPrimitive as Vertex;

    const scene = this._scene;
    scene.screenSpaceCameraController.enableRotate = false;
  }

  /**
   * reset focused point primitive
   */
  _resetFocusedPointPrimitive() {
    this._focusedPointPrimitive = undefined;
  }

  /**
   * Drawing on canvas by clicking canvas
   * @param {MouseEvent} event
   */
  _handleCanvasPressEventForDrawing(event: MouseEvent) {
    if (this._mode === DrawingMode.AfterDraw) {
      this._reset();
    }

    // Don't handle if clickPos is too close to previous click.
    // This typically indicates a double click handler will be fired next,
    // we don't expect the user to wait and click this point again.

    const lastClickPos = this._lastClickPosition;
    const distance = Cartesian2.magnitude(
      Cartesian2.subtract(lastClickPos, event.pos, clickDistanceScratch)
    );

    if (distance < mouseDelta) {
      return;
    }

    const position = this.getWorldPosition(event.pos, cart3Scratch);

    if (!defined(position) || !position) {
      return;
    }

    this._polygon.addPoint(Cartesian3.clone(position, new Cartesian3()));
    this._evtVertexCreatedWhileDrawing.raiseEvent(
      [Cartesian3.clone(position, new Cartesian3())],
      [this._polygon],
      [this]
    );
    if (this._mode !== DrawingMode.Drawing) this._mode = DrawingMode.Drawing;

    Cartesian2.clone(event.pos, lastClickPos);
  }

  /**
   * Triggered when mouse move on canvas
   * @param {MouseEvent} event
   * @returns
   */
  canvasMoveEvent(event: MouseEvent) {
    const nextPos = this.getWorldPosition(event.pos, cart3Scratch);
    if (!defined(nextPos) || !nextPos) {
      return;
    }

    this._markerPointPrimitive.position = Cartesian3.clone(nextPos, cart3Scratch);
    this._markerPointPrimitive.show = true;

    if (this._mode === DrawingMode.Drawing) {
      this._handleCanvasMoveEventForDrawing(event);
    } else if (this._mode === DrawingMode.AfterDraw) {
      this._handleCanvasMoveEventForAfterDraw(event);
    } else if (this._mode === DrawingMode.EditDraw) {
      this._handleCanvasMoveEventForEdit(event);
    }
  }

  /**
   * Triggered when mouse button released on canvas
   */
  canvasReleaseEvent(/* event */) {
    if (this._focusedPointPrimitive) {
      this._focusedPointPrimitive = undefined;
    }

    this._isDrag = false;
    this._snapVertex = undefined;
    this._snapMode = SnapMode.NONE;
    this._scene.screenSpaceCameraController.enableRotate = true;
    console.info('Canvas released');
  }

  /**
   * update next point with current mouse position
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForDrawing(event: MouseEvent) {
    const nextPos = this.getWorldPosition(event.pos, cart3Scratch);

    if (!defined(nextPos) || !nextPos) {
      return;
    }

    Cartesian3.clone(nextPos, this._tempNextPos);
    this._polygon.updateLastPosition(this._tempNextPos);
  }

  /**
   * Edit polygon
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForAfterDraw(event: MouseEvent) {
    if (this._focusedPointPrimitive) {
      const position = this.getWorldPosition(event.pos, cart3Scratch);

      if (!defined(position)) return;

      const polygon = this._focusedPointPrimitive.polygon;

      if (this._focusedPointPrimitive.isMainVertex) {
        polygon.updateMainVertex(this._focusedPointPrimitive, position!);
      } else {
        const mainVertexPointPrimitive = polygon.insertPoint(this._focusedPointPrimitive);

        this._setFocusedPointPrimitive(mainVertexPointPrimitive as Vertex);
      }
    }
  }

  /**
   * This function is Edit polygon (snapping)
   * @param {MouseEvent} event
   */
  _handleCanvasMoveEventForEdit(event: MouseEvent) {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    const polyline = this._polygon.polyline;
    if (!position || !polyline) {
      return;
    }

    const distance = polyline.getNearestSegmentInfo(position);

    const scene = this._scene;
    const drawingBufferWidth = scene.drawingBufferWidth;
    const drawingBufferHeight = scene.drawingBufferHeight;

    const metersPerPixel = scene.camera.getPixelSize(
      this._polygon.boundingSphere,
      drawingBufferWidth,
      drawingBufferHeight
    );

    const pixelDistFromSeg = distance.minHeight / metersPerPixel;
    const pixelDistFromVertex = distance.minDist / metersPerPixel;

    if (pixelDistFromVertex < SNAP_PIXELSIZE_TO_VERTEX) {
      this._markerPointPrimitive.position = distance.vertexPos;
      this._snapVertex = {
        vertexIndex: distance.vertexIdx,
        isMainVertex: true,
        polylinePrimitive: this._polygon.polyline,
        polygonPrimitive: this._polygon.polygon
      } as Vertex;

      this._snapMode = SnapMode.VERTEX;
    } else if (pixelDistFromSeg < SNAP_PIXELSIZE_TO_SEGMENT) {
      this._markerPointPrimitive.position = distance.basePos;
      this._resetFocusedPointPrimitive();

      this._snapMode = SnapMode.SEGMENT;
    } else {
      this._resetFocusedPointPrimitive();
      this._snapMode = SnapMode.NONE;
    }

    // Vertex snapped or line snapped
    if (this._snapMode === SnapMode.VERTEX && !this._snapVertex) {
      console.info('dragging vertex');
    } else if (this._snapMode === SnapMode.SEGMENT) {
      console.info('dragging line');
      this._tempSnapPoint = { segStartIdx: distance.segIdx, position: distance.basePos };
    }

    if (this._isDrag && this._snapVertex) {
      this._scene.screenSpaceCameraController.enableRotate = false;
      this._polygon.updateMainVertex(this._snapVertex, position);
    }
  }

  /**
   * Pick point primitive by using scene.pick
   * @param {Cartesian2} position
   * @returns
   * Reference https://cesium.com/learn/cesiumjs/ref-doc/Scene.html?classFilter=scene
   */
  _pickPointPrimitive(position: Cartesian2) {
    const scene = this._scene;

    const pickedObject = scene.pick(position, 1, 1);

    if (!defined(pickedObject)) return null;

    if (!defined(pickedObject.primitive)) {
      return null;
    }

    if (pickedObject.primitive.constructor.name !== 'PointPrimitive') {
      return null;
    }

    return pickedObject.primitive;
  }

  _reset() {
    const count = this._polygons.length;

    this._polygon = new Polygon({
      id: createGuid(),
      name: `Polygon${count}`,
      scene: this._scene,
      primitives: this._options.primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      polygonOptions: this._options.polygonOptions,
      createVertices: true,
      locale: this._options.local
    });

    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition.x = Number.POSITIVE_INFINITY;
    this._lastClickPosition.y = Number.POSITIVE_INFINITY;
  }

  /**
   * @returns {Boolean} true if the object has been destroyed, false otherwise.
   */
  static isDestroyed() {
    return false;
  }

  destroy() {
    return destroyObject(this);
  }
}

export { PolygonDrawing };
