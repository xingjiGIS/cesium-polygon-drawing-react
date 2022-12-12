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
import { MapTool, MapToolConstructorOptions, MouseButton, MouseEvent } from '../../../common';
import DrawingMode from '../../common/DrawingMode';
import { Vertex, Line } from './Line';
import { PointOptions, PolylineOptions } from '../../common/DrawingSettings';

const clickDistanceScratch = new Cartesian2();
const cart3Scratch = new Cartesian3();
// const cart3Scratch1 = new Cartesian3();
const mouseDelta = 10;
const ESC_KEY = 'Escape';

const SNAP_PIXELSIZE_TO_VERTEX = 15;
const SNAP_PIXELSIZE_TO_EDGE = 10;
const MIN_LINE_VERTEX_NUM = 2;

const enum SnapMode {
  NONE = -1,
  VERTEX = 0,
  EDGE = 1
}

/**
 * Check if number of vertex is greater than minimum number of line vertices
 * @param {number} n
 * @returns {boolean}
 */
const isLine = (n: number) => n >= MIN_LINE_VERTEX_NUM;

/**
 * Options for line drawing tool
 */
export interface LineDrawingConstructorOptions extends MapToolConstructorOptions {
  lines: Line[];
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
  markerOptions: PointOptions;
  local?: string | string[];
}

export interface SnapPointOptions {
  segStartIdx: number;
  position: Cartesian3;
}

/**
 * LineDrawing is one kind of MapTool to draw and to edit line
 * _mode: to check if it's on drawing state, or finished drawing, or on editing state ...
 * _line: to store Line
 * _lines: to store multiple lines
 * _lastClickPosition: mouse position on UI, when click the MLB, mouse position will be saved
 * _tempNextPos: to store mouse position on cesium scene
 */
class LineDrawing extends MapTool {
  protected _mode: DrawingMode;
  protected _line!: Line;
  protected _lines: Line[];
  protected readonly _lastClickPosition: Cartesian2;
  protected readonly _tempNextPos: Cartesian3;

  private readonly _scene: Scene;

  private readonly _options: LineDrawingConstructorOptions;
  private _focusedPointPrimitive: Vertex | undefined;

  // Event implementation
  private readonly _evtVertexCreatedWhileDrawing: Event;
  private readonly _evtLineCreated: Event;
  private readonly _evtVertexModifiedInLine: Event;
  private readonly _evtVertexAddedInLine: Event;
  private readonly _evtVertexDeletedInLine: Event;
  private readonly _evtLineDeleted: Event;

  // Marker point following mouse position
  private readonly _markerPointPrimitive: PointPrimitive;
  private readonly _markerPointCollection: PointPrimitiveCollection;

  // Is dragging
  private _isDrag: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on edge
  private _snapMode: SnapMode;
  // snapped point on line edge
  private _focusedSnapPoint: SnapPointOptions | undefined;
  // vertex added on line edge from the snapped point
  private _snapVertex: Vertex | undefined;

  constructor(options: LineDrawingConstructorOptions) {
    super(options);

    const scene = this._viewer.scene;

    this._tempNextPos = new Cartesian3();
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition = new Cartesian2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    this._scene = scene;
    this._lines = options.lines;
    this._options = options;

    this._evtVertexCreatedWhileDrawing = new Event();
    this._evtLineCreated = new Event();
    this._evtVertexModifiedInLine = new Event();
    this._evtVertexAddedInLine = new Event();
    this._evtVertexDeletedInLine = new Event();
    this._evtLineDeleted = new Event();

    this._markerPointCollection = this.options.primitives.add(
      new PointPrimitiveCollection({ show: true })
    );
    this._markerPointPrimitive = this._markerPointCollection.add(this.options.markerOptions);

    this._isDrag = false;
    this._snapMode = SnapMode.NONE;

    scene.camera.moveEnd.addEventListener(() => {
      if (this.lines) {
        for (let i = 0; i < this.lines.length; i++) {
          this.lines[i].updateHeightOfPoint();
        }
      }
    });
  }

  /**
   * Whenever camera changed, update line primitives
   * Use this function to calculate lines culling volume in multi-line drawing mode (not now)
   * When drawing a lot of lines and zooming camera, very small lines(i.e. with very small culling volume)
   * should be invisible so that the render efficiency would be high.
   * Reference for Culling Volume : https://cesium.com/learn/cesiumjs/ref-doc/CullingVolume.html
   */
  updateLines() {
    const scene = this._scene;

    const camera = scene.camera;
    const frustum = camera.frustum;

    const cullingVolume = frustum.computeCullingVolume(
      camera.position,
      camera.direction,
      camera.up
    );

    this._lines.forEach((line: Line) => {
      line.update(cullingVolume);
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
    this.hideMarker();
    // this._reset();
  }

  get mode() {
    return this._mode;
  }

  set mode(value: number) {
    this._mode = value;
  }

  get lines() {
    return this._lines;
  }

  get evtVertexAddedInLine() {
    return this._evtVertexAddedInLine;
  }

  get evtVertexCreatedWhileDrawing() {
    return this._evtVertexCreatedWhileDrawing;
  }

  get evtVertexDeletedInLine() {
    return this._evtVertexDeletedInLine;
  }

  get evtVertexModifiedInLine() {
    return this._evtVertexModifiedInLine;
  }

  get evtLineDeleted() {
    return this._evtLineDeleted;
  }

  get evtLineCreated() {
    return this._evtLineCreated;
  }

  /**
   * Get line by id
   * @param {string} id
   * @returns
   */
  getLineById(id: string) {
    const lines = this._lines.filter((line: Line) => line.id === id);
    if (lines.length > 0) {
      return lines[0];
    }
    return null;
  }

  /**
   * Show marker point
   */
  showMarker() {
    this._markerPointPrimitive.show = true;
  }

  /**
   * Hide marker point
   */
  hideMarker() {
    this._markerPointPrimitive.show = false;
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
      if (!this._line) {
        // eslint-disable-next-line no-new
        new DeveloperError('Line did not initialized!');
        return;
      }
      // On right-clicking while drawing:
      this._line.finishDrawing();
      this._evtLineCreated.raiseEvent([this._line], [this]);
      this._mode = DrawingMode.EditDraw;

      if (!isLine(this._line.positions.length)) {
        this.deleteLine();
        return;
      }
      // line created
      this._lines.push(this._line);
    } else if (event.button === MouseButton.RightButton && this._mode === DrawingMode.EditDraw) {
      if (this._snapVertex) {
        // Right-clicking on a vertex
        this.deleteVertex(this._snapVertex);
        // if number of vertex < 3, remove and reset line
        if (!isLine(this._line.positions.length)) {
          this.deleteLine();
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
        this._snapVertex = this._line.insertVertex(
          this._focusedSnapPoint.position,
          this._focusedSnapPoint.segStartIdx
        );
        this._evtVertexAddedInLine.raiseEvent([this._snapVertex], [this._line], [this]);
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
      this.deleteLine();
    }
  }

  /**
   * Remove and reset  Line
   */
  deleteLine() {
    this._line.positions = [];
    this._line._hideAllPrimitives();
    this._reset();

    if (this._mode === DrawingMode.EditDraw) {
      this._evtLineDeleted.raiseEvent([this._line], [this]);
    }
  }

  /**
   * Delete Vertex
   */
  deleteVertex(vertex: Vertex) {
    this._line.deletePoint(vertex.vertexIndex);
    this.evtVertexDeletedInLine.raiseEvent([vertex], [this._line], [this]);
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

    const vertex = this._line.addPoint(Cartesian3.clone(position, new Cartesian3()));
    this._evtVertexCreatedWhileDrawing.raiseEvent([vertex], [this._line], [this]);

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
    this.showMarker();

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

    Cartesian3.clone(nextPos, this._tempNextPos);
    this._line.updateLastPosition(this._tempNextPos);
  }

  /**
   * Edit Line
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForAfterDraw(event: MouseEvent) {
    if (this._focusedPointPrimitive) {
      const position = this.getWorldPosition(event.pos, cart3Scratch);

      if (!defined(position)) return;

      const line = this._focusedPointPrimitive.line;

      if (this._focusedPointPrimitive.isMainVertex) {
        line.updateMainVertex(this._focusedPointPrimitive, position!);
      }
    }
  }

  /**
   * This function is Edit line (snapping)
   * @param {MouseEvent} event
   */
  _handleCanvasMoveEventForEdit(event: MouseEvent) {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    const polyline = this._line.polyline;
    if (!position || !polyline) {
      return;
    }

    const nearestInfo = this.getNearestEdgeInfo(this._line.polyline.positions, position);

    const scene = this._scene;
    const drawingBufferWidth = scene.drawingBufferWidth;
    const drawingBufferHeight = scene.drawingBufferHeight;

    const metersPerPixel = scene.camera.getPixelSize(
      this._line.boundingSphere,
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
        polylinePrimitive: this._line.polyline
      } as Vertex;

      this._snapMode = SnapMode.VERTEX;
    } else if (
      pixelDistFromSeg < SNAP_PIXELSIZE_TO_EDGE &&
      nearestInfo.segIdx !== this._line.polyline.positions.length - 1
    ) {
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
      this._line.updateMainVertex(this._snapVertex, position);
      if (this._snapMode === SnapMode.VERTEX) {
        this._evtVertexModifiedInLine.raiseEvent([this._snapVertex], [this._line], [this]);
      } else if (this._snapMode === SnapMode.EDGE) {
        // this._evtVertexModifiedInLine.raiseEvent([this._snapVertex], [this._line], [this]);
      }
    }
  }

  _reset() {
    const count = this._lines.length;

    this._line = new Line({
      id: createGuid(),
      name: `Line${count}`,
      scene: this._scene,
      primitives: this._options.primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      createVertices: true,
      locale: this._options.local
    });

    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition.x = Number.POSITIVE_INFINITY;
    this._lastClickPosition.y = Number.POSITIVE_INFINITY;
  }

  _resetAll() {
    if (!this.lines) {
      const count = this._lines.length;
      for (let i = 0; i < count; i++) {
        this._lines[i].destroy();
      }
      this._lines = [];
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

export { LineDrawing };
