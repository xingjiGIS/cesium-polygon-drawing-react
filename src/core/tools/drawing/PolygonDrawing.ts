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

const SNAP_PIXELSIZE_TO_VERTEX = 15;
const SNAP_PIXELSIZE_TO_EDGE = 10;
const MIN_POLYGON_VERTEX_NUM = 3;

const enum SnapMode {
  NONE = -1,
  VERTEX = 0,
  EDGE = 1
}

/**
 * Check if number of vertex is greater than minimum number of polygon vertices
 * @param {number} n
 * @returns {boolean}
 */
const isPolygon = (n: number) => n >= MIN_POLYGON_VERTEX_NUM;

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

  // Is snapped to the first vertex
  private _isSnappedToFirstVertex: boolean;
  // Is dragging
  private _isDrag: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on edge
  private _snapMode: SnapMode;
  // snapped point on line edge
  private _focusedSnapPoint: SnapPointOptions | undefined;
  // vertex added on line edge from the snapped point
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
    this._isSnappedToFirstVertex = false;
    this._snapMode = SnapMode.NONE;
  }

  /**
   * Whenever camera changed, update polygon primitives
   * Use this function to calculate polygons culling volume in multi-polygon drawing mode (not now)
   * When drawing a lot of polygons and zooming camera, very small polygons(i.e. with very small culling volume)
   * should be invisible so that the render efficiency would be high.
   * Reference for Culling Volume : https://cesium.com/learn/cesiumjs/ref-doc/CullingVolume.html
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
    this._resetAll();

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
      this._handleCanvasPressEventForDrawing(event);
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
      // On right-clicking while drawing:
      this._polygon.finishDrawing();
      this._evtPolygonCreated.raiseEvent([this._polygon], [this]);
      this._mode = DrawingMode.EditDraw;

      if (!isPolygon(this._polygon.positions.length)) {
        this.deletePolygon();
        return;
      }
      // polygon created
      this._polygons.push(this._polygon);
    } else if (event.button === MouseButton.RightButton && this._mode === DrawingMode.EditDraw) {
      if (this._snapVertex) {
        // Right-clicking on a vertex
        this.deleteVertex(this._snapVertex);
        // if number of vertex < 3, remove and reset polygon
        if (!isPolygon(this._polygon.positions.length)) {
          this.deletePolygon();
          return;
        }
      }
    } else if (event.button === MouseButton.LeftButton && this._mode === DrawingMode.EditDraw) {
      this._isDrag = true;
    }

    if (
      event.button === MouseButton.LeftButton &&
      this._mode === DrawingMode.EditDraw &&
      this._snapMode === SnapMode.EDGE
    ) {
      // Creating a new vertex on edge
      if (this._focusedSnapPoint) {
        this._snapVertex = this._polygon.insertVertex(
          this._focusedSnapPoint.position,
          this._focusedSnapPoint.segStartIdx
        );
        this._evtVertexAddedInPolygon.raiseEvent([this._snapVertex], [this._polygon], [this]);
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

    if (!this._isSnappedToFirstVertex) {
      const vertex = this._polygon.addPoint(Cartesian3.clone(position, new Cartesian3()));
      this._evtVertexCreatedWhileDrawing.raiseEvent([vertex], [this._polygon], [this]);
      if (this._mode !== DrawingMode.Drawing) this._mode = DrawingMode.Drawing;
    } else {
      // On placing the point on the first point:
      this._polygon.finishDrawing();
      this._evtPolygonCreated.raiseEvent([this._polygon], [this]);
      this._mode = DrawingMode.EditDraw;
    }

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

    // To snap to first vertex while drawing;
    const polyline = this._polygon.polyline;
    if (isPolygon(polyline.positions.length)) {
      const distance = Cartesian3.distance(polyline.positions[0], nextPos);
      const scene = this._scene;
      const drawingBufferWidth = scene.drawingBufferWidth;
      const drawingBufferHeight = scene.drawingBufferHeight;

      const metersPerPixel = scene.camera.getPixelSize(
        this._polygon.boundingSphere,
        drawingBufferWidth,
        drawingBufferHeight
      );

      const pixelDistFromVertex = distance / metersPerPixel;

      if (pixelDistFromVertex < SNAP_PIXELSIZE_TO_VERTEX) {
        this._isSnappedToFirstVertex = true;
        this._markerPointPrimitive.position = polyline.positions[0];
        Cartesian3.clone(polyline.positions[0], nextPos);
      } else {
        this._isSnappedToFirstVertex = false;
      }
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

    const nearestInfo = polyline.getNearestEdgeInfo(position);

    const scene = this._scene;
    const drawingBufferWidth = scene.drawingBufferWidth;
    const drawingBufferHeight = scene.drawingBufferHeight;

    const metersPerPixel = scene.camera.getPixelSize(
      this._polygon.boundingSphere,
      drawingBufferWidth,
      drawingBufferHeight
    );

    const pixelDistFromSeg = nearestInfo.minHeight / metersPerPixel;
    const pixelDistFromVertex = nearestInfo.minDist / metersPerPixel;

    if (!this._isDrag) {
      this._snapVertex = undefined;
    }

    if (pixelDistFromVertex < SNAP_PIXELSIZE_TO_VERTEX) {
      this._markerPointPrimitive.position = nearestInfo.vertexPos;
      this._snapVertex = {
        vertexIndex: nearestInfo.vertexIdx,
        isMainVertex: true,
        polylinePrimitive: this._polygon.polyline,
        polygonPrimitive: this._polygon.polygon
      } as Vertex;

      this._snapMode = SnapMode.VERTEX;
    } else if (pixelDistFromSeg < SNAP_PIXELSIZE_TO_EDGE) {
      this._markerPointPrimitive.position = nearestInfo.basePos;
      this._resetFocusedPointPrimitive();

      this._snapMode = SnapMode.EDGE;
    } else {
      this._resetFocusedPointPrimitive();
      this._snapMode = SnapMode.NONE;
    }

    // line snapped
    if (this._snapMode === SnapMode.EDGE) {
      this._focusedSnapPoint = { segStartIdx: nearestInfo.segIdx, position: nearestInfo.basePos };
    }

    // Dragging Vertex
    if (this._isDrag && this._snapVertex) {
      this._scene.screenSpaceCameraController.enableRotate = false;
      this._polygon.updateMainVertex(this._snapVertex, position);
      if (this._snapMode === SnapMode.VERTEX) {
        this._evtVertexModifiedInPolygon.raiseEvent([this._snapVertex], [this._polygon], [this]);
      } else if (this._snapMode === SnapMode.EDGE) {
        // this._evtVertexModifiedInPolygon.raiseEvent([this._snapVertex], [this._polygon], [this]);
      }
    }
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

  _resetAll() {
    if (!this.polygons) {
      const count = this._polygons.length;
      for (let i = 0; i < count; i++) {
        this._polygons[i].destroy();
      }
      this._polygons = [];
    }
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
