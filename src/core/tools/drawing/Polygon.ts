// q@ts-nocheck
/* qeslint-disable */
import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Color,
  combine,
  CullingVolume,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  Event,
  Intersect,
  PointPrimitive,
  PointPrimitiveCollection,
  PrimitiveCollection,
  Scene
} from 'cesium';

import logger from 'loglevel';
import { PolygonPrimitive, PolylinePrimitive } from '../../primitives';
import { getHeight } from '../../util';
import { PointOptions } from './DrawingSettings';

const HIGHLIGHTED_POINT_PRIMITIVE_COLOR = Color.RED;
const HIGHLIGHTED_POINT_PRIMITIVE_PIXEL_SIZE_OFFSET = 5;

const SELECTED_POLYGON_PRIMITIVE_COLOR = Color.YELLOW.withAlpha(0.5);

const scratchCarto = new Cartographic();
const scratchCartesian = new Cartesian3();

const POLYGON_MINIMUM_PIXEL_SIZE = 20;
const POLYLINE_MINIMUM_PIXEL_SIZE = 100;
const MAIN_VERTICES_MINIMUM_PIXEL_SIZE = 400;
const SUB_VERTICES_MINIMUM_PIXEL_SIZE = 500;

function _updateHeightOfPointPrimitives(scene: Scene, pointPrimitives: PointPrimitive[]) {
  const ellipsoid = scene.globe.ellipsoid;

  pointPrimitives.forEach((pointPrimitive) => {
    ellipsoid.cartesianToCartographic(pointPrimitive.position, scratchCarto);

    scratchCarto.height = 0;

    const height = getHeight(scene, scratchCarto);

    Cartesian3.fromRadians(
      scratchCarto.longitude,
      scratchCarto.latitude,
      height,
      ellipsoid,
      scratchCartesian
    );

    pointPrimitive.position = scratchCartesian;
  });
}

/**
 * Vertex interface which construct a polygon
 * mainVertexPointPrimitive: Vertex which construct a polygon
 * subVertexPointPrimitive: Vertex lying on middle of one segment of polygon
 * Reference https://cesium.com/learn/cesiumjs/ref-doc/PointPrimitive.html?classFilter=pointpri
 */
export interface Vertex extends PointPrimitive {
  vertexIndex: number;
  isMainVertex: boolean;
  polylinePrimitive: PolylinePrimitive;
  polygonPrimitive: PolygonPrimitive;
  polygon: Polygon;
  mainVertexPointPrimitive: Vertex;
  subVertexPointPrimitive: PointPrimitive;
}

/**
 * Polygon is constructed from vertex and line segments.
 * PolygonConstructorOptions is options for vertex, segments and polygon itself.
 */
export interface PolygonConstructorOptions {
  id: string;
  name?: string;
  show?: boolean;
  scene: Scene;
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: {
    color: Color;
  };
  polygonOptions: {
    color: Color;
  };
  positions?: Cartesian3[] | undefined;
  createVertices: boolean;
  locale?: string | string[];
}

/**
 * Polygon represents polygon primitive on the scene
 * _primitives: store all primitives to be rendered for polygon, ex., vertex, polyline(segment).
 * _show: show/hide polygon
 * _show_Vertices: show/hide vertex
 * _id: primitive index
 * _name: primitive name
 * _mainVertexPointCollection: store vertex which construct polygon
 * _subVertexPointCollection: store vertex lying on middle point of polyline segment
 */
export class Polygon {
  private readonly _scene: Scene;
  private _positions: Cartesian3[];
  private readonly _primitives: PrimitiveCollection;

  private readonly _pointOptions: PointOptions;

  private _show: boolean;
  private _showVertices: boolean;
  private _id: string;
  private _name: string;

  private _mainVertexPointCollection: PointPrimitiveCollection | undefined;
  private _subVertexPointCollection: PointPrimitiveCollection | undefined;

  private _mainVertexPointPrimitives: Vertex[] | undefined;
  private _subVertexPointPrimitives: Vertex[] | undefined;
  private readonly _polygonPrimitive: PolygonPrimitive;
  private readonly _polylinePrimitive: PolylinePrimitive;

  private _focusedPointPrimitive: PointPrimitive | undefined;

  private readonly _subVertexPointPrimitivePixelSize: number;
  private readonly _selectedLocale: string | string[] | undefined;

  private _boundingSphere: BoundingSphere;
  private readonly _showChanged: Event;

  constructor(options: PolygonConstructorOptions) {
    const scene = options.scene;

    const primitives = defaultValue(options.primitives, scene.primitives);

    const pointOptions = options.pointOptions;
    const polylineOptions = options.polylineOptions;
    const polygonOptions = options.polygonOptions;

    this._scene = scene;
    this._positions = defaultValue(options.positions, []);
    this._primitives = primitives;

    this._pointOptions = pointOptions;
    this._polygonPrimitive = primitives.add(
      new PolygonPrimitive(
        combine(
          {
            show: options.show,
            positions: options.positions,
            allowPicking: true
          },
          polygonOptions
        )
      )
    );
    this._polylinePrimitive = primitives.add(
      new PolylinePrimitive(
        combine(
          {
            show: options.show,
            positions: options.positions
          },
          polylineOptions
        )
      )
    );

    if (options.createVertices) {
      this._createVertices(options);
    }

    this._selectedLocale = options.locale;

    this._subVertexPointPrimitivePixelSize = this._pointOptions.pixelSize - 3;

    this._id = options.id;
    this._name = defaultValue(options.name, '');
    this._show = defaultValue(options.show, true);
    this._showVertices = false;

    this._boundingSphere = new BoundingSphere();
    BoundingSphere.fromPoints(this._positions, this._boundingSphere);

    this._showChanged = new Event();
  }

  /**
   * Create a new polygon
   * @param {PolygonConstructorOptions} options
   */
  _createVertices(options: PolygonConstructorOptions) {
    const primitives = this._primitives;

    this._mainVertexPointCollection = primitives.add(
      new PointPrimitiveCollection({
        show: options.show
      })
    );
    this._subVertexPointCollection = primitives.add(
      new PointPrimitiveCollection({
        show: options.show
      })
    );

    this._mainVertexPointPrimitives = [];
    this._subVertexPointPrimitives = [];

    for (let i = 0; i < this._positions.length; i++) {
      this._newMainVertexPointPrimitive(
        i,
        this._positions[i],
        this._polygonPrimitive,
        this._polylinePrimitive
      );
    }
  }

  /**
   * this is invoked whenever camera is changed
   *
   * 1 update show property of primitives
   * 2 update the height of vertices
   */
  update(cullingVolume: CullingVolume) {
    if (!this._show) return;

    const scene = this._scene;

    const intersect = cullingVolume.computeVisibility(this._boundingSphere);

    if (intersect === Intersect.OUTSIDE) {
      this._hideAllPrimitives();
      return;
    }

    const drawingBufferWidth = scene.drawingBufferWidth;
    const drawingBufferHeight = scene.drawingBufferHeight;

    const metersPerPixel = scene.camera.getPixelSize(
      this._boundingSphere,
      drawingBufferWidth,
      drawingBufferHeight
    );

    if (metersPerPixel === 0) {
      logger.warn(
        "zero metersPerPixel! maybe the camera is contained in polygon's bounding sphere."
      );
      this._hideAllPrimitives();
      return;
    }

    const pixelsPerMeter = 1.0 / metersPerPixel;
    const maxPixelSize = Math.max(drawingBufferWidth, drawingBufferHeight);
    const diameterInPixels = Math.min(
      pixelsPerMeter * (2.0 * this._boundingSphere.radius),
      maxPixelSize
    );

    if (diameterInPixels >= POLYGON_MINIMUM_PIXEL_SIZE) {
      this._polygonPrimitive.show = true;
    } else {
      this._hideAllPrimitives();
      return;
    }

    if (diameterInPixels >= POLYLINE_MINIMUM_PIXEL_SIZE) {
      this._polylinePrimitive.show = true;
    } else {
      this._polylinePrimitive.show = false;

      if (defined(this._mainVertexPointPrimitives)) this._mainVertexPointCollection!.show = false;

      if (defined(this._subVertexPointPrimitives)) this._subVertexPointCollection!.show = false;

      return;
    }

    if (this._showVertices) {
      if (diameterInPixels >= MAIN_VERTICES_MINIMUM_PIXEL_SIZE) {
        if (defined(this._mainVertexPointPrimitives)) {
          this._mainVertexPointCollection!.show = true;
          _updateHeightOfPointPrimitives(
            this._scene,
            this._mainVertexPointPrimitives as PointPrimitive[]
          );
        }
      } else {
        if (defined(this._mainVertexPointPrimitives)) {
          this._mainVertexPointCollection!.show = false;
          this._subVertexPointCollection!.show = false;
        }

        return;
      }

      if (diameterInPixels >= SUB_VERTICES_MINIMUM_PIXEL_SIZE) {
        if (this._subVertexPointPrimitives) {
          this._subVertexPointCollection!.show = true;
          _updateHeightOfPointPrimitives(this._scene, this._subVertexPointPrimitives);
        }
      } else if (defined(this._subVertexPointPrimitives)) {
        this._subVertexPointCollection!.show = false;
      }
    } else {
      this._mainVertexPointCollection!.show = false;
      this._subVertexPointCollection!.show = false;
    }
  }

  /**
   * Hide all primitives(vertex, polyline, ...)
   */
  _hideAllPrimitives() {
    this._polygonPrimitive.show = false;
    this._polylinePrimitive.show = false;

    if (defined(this._mainVertexPointPrimitives)) this._mainVertexPointCollection!.show = false;

    if (defined(this._subVertexPointPrimitives)) this._subVertexPointCollection!.show = false;
  }

  /**
   * Just update _boundingSphere from this._positions
   */
  updateBoundingSphere() {
    BoundingSphere.fromPoints(this._positions, this._boundingSphere);
  }

  /**
   * Just update _boundingSphere based on terrain of globe or subsurface
   */
  recalculateBoundingSphere() {
    const scene = this._scene;
    const ellipsoid = scene.globe.ellipsoid;
    const positions = this._positions;

    for (let i = 0; i < positions.length; i++) {
      ellipsoid.cartesianToCartographic(positions[i], scratchCarto);

      scratchCarto.height = 0;

      const height = getHeight(scene, scratchCarto);

      if (!defined(height)) logger.warn('invalid height');

      Cartesian3.fromRadians(
        scratchCarto.longitude,
        scratchCarto.latitude,
        height,
        ellipsoid,
        this._positions[i]
      );
    }

    BoundingSphere.fromPoints(this._positions, this._boundingSphere);
  }

  forceUpdate() {
    this._polylinePrimitive.forceUpdate();
    this._polygonPrimitive.forceUpdate();
  }

  get positions() {
    return this._positions;
  }

  /**
   * reconstruct polygon from given positions
   */
  set positions(positions) {
    this._positions = positions;

    // note that bounding sphere might not be correct if positions do not contains height values.
    this._boundingSphere = BoundingSphere.fromPoints(positions, this._boundingSphere);
    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;

    this._mainVertexPointCollection!.removeAll();
    this._mainVertexPointPrimitives! = [];

    for (let i = 0; i < positions.length; i++) {
      this._newMainVertexPointPrimitive(
        i,
        positions[i],
        this._polygonPrimitive,
        this._polylinePrimitive
      );
    }
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get show() {
    return this._show;
  }

  set show(show) {
    if (this._show === show) {
      return;
    }

    this._show = show;

    if (show) {
      const camera = this._scene.camera;
      const frustum = camera.frustum;

      const cullingVolume = frustum.computeCullingVolume(
        camera.position,
        camera.direction,
        camera.up
      );

      this.update(cullingVolume);
    } else {
      this._hideAllPrimitives();
    }

    this._showChanged.raiseEvent([show]);
    this._scene.requestRender();
  }

  set showVertices(show: boolean) {
    this._showVertices = show;

    if (show) {
      // show property of all point primitives will be updated in update function
    } else {
      if (defined(this._mainVertexPointCollection)) {
        this._mainVertexPointCollection!.show = false;
      }

      if (defined(this._subVertexPointCollection)) {
        this._subVertexPointCollection!.show = false;
      }
    }
  }

  get showChanged() {
    return this._showChanged;
  }

  get polygon() {
    return this._polygonPrimitive;
  }

  get polyline() {
    return this._polylinePrimitive;
  }

  /**
   * Highlight point when mouse is over the point
   * @param {PointPrimitive} pointPrimitive
   */
  _setFocusedPointPrimitive(pointPrimitive: PointPrimitive) {
    this._highlightPointPrimitive(pointPrimitive);

    this._focusedPointPrimitive = pointPrimitive;

    this._scene.screenSpaceCameraController.enableRotate = false;
  }

  /**
   * Add a new vertex and reconstruct polygon (just for subvertex)
   * @param {Vertex} focusedSubVertexPointPrimitive
   * @returns {void}
   */
  insertPoint(focusedSubVertexPointPrimitive: Vertex) {
    const position = focusedSubVertexPointPrimitive.position;

    const mainVertexPrimitive = focusedSubVertexPointPrimitive.mainVertexPointPrimitive;
    const vertexIndex = mainVertexPrimitive.vertexIndex;

    const polylinePrimitive = mainVertexPrimitive.polylinePrimitive;
    const polygonPrimitive = mainVertexPrimitive.polygonPrimitive;

    const newPos = new Cartesian3();

    position.clone(newPos);

    this._positions.splice(vertexIndex + 1, 0, newPos);

    // change vertexIndex property of all main vertex from starting
    for (let i = vertexIndex + 1; i < this._mainVertexPointPrimitives!.length; i++)
      this._mainVertexPointPrimitives![i].vertexIndex += 1;

    const pointPrimitive = this._newMainVertexPointPrimitive(
      vertexIndex + 1,
      position,
      polygonPrimitive,
      polylinePrimitive
    );

    return pointPrimitive;
  }

  insertVertex(position: Cartesian3, segStartIdx: number) {
    console.info('Vertex inserted');

    const polylinePrimitive = this._polylinePrimitive;
    const polygonPrimitive = this._polygonPrimitive;

    for (let i = 0; i < this._mainVertexPointPrimitives!.length; i++) {
      if (this._mainVertexPointPrimitives![i].vertexIndex > segStartIdx) {
        this._mainVertexPointPrimitives![i].vertexIndex += 1;
      }
    }

    const newPos = new Cartesian3();

    position.clone(newPos);
    this._positions.splice(segStartIdx + 1, 0, newPos);

    const pointPrimitive = this._newMainVertexPointPrimitive(
      segStartIdx + 1,
      position,
      polygonPrimitive,
      polylinePrimitive
    );

    return pointPrimitive;
  }

  updateMainVertex(focusedPointPrimitive: PointPrimitive, position: Cartesian3) {
    // @ts-ignore
    const vertexIndex = focusedPointPrimitive.vertexIndex;

    position.clone(this._positions[vertexIndex]);

    focusedPointPrimitive.position = position;

    // @ts-ignore
    const polylinePrimitive = focusedPointPrimitive.polylinePrimitive;
    // @ts-ignore
    const polygonPrimitive = focusedPointPrimitive.polygonPrimitive;

    // @ts-ignore
    polylinePrimitive.updatePosition(vertexIndex, position);
    // @ts-ignore
    polygonPrimitive.updatePosition(vertexIndex, position);
  }

  /**
   * Add vertex to polygon
   * @param {Catesian3} position
   */
  addPoint(position: Cartesian3) {
    const positions = this._positions;

    positions.push(position);

    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;

    this._newMainVertexPointPrimitive(
      positions.length - 1,
      position,
      this._polygonPrimitive,
      this._polylinePrimitive
    );

    this._polygonPrimitive.show = true;
    this._polylinePrimitive.show = true;

    BoundingSphere.fromPoints(positions, this._boundingSphere);
  }

  /**
   * Delete Last point from the polygon
   * @returns
   */
  deleteLastPoint() {
    if (!this._mainVertexPointCollection) {
      return;
    }

    const positions = this._positions;
    positions.pop();
    this._positions = positions;

    const length = this._mainVertexPointCollection.length;
    if (length > 0) {
      const lastPoint = this._mainVertexPointCollection.get(length - 1);
      this._mainVertexPointCollection.remove(lastPoint);
    }

    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;
  }

  /**
   * Delete Main Vertex
   */
  deletePoint(idx: number) {
    if (!this._mainVertexPointCollection) {
      return;
    }

    if (idx > this._positions.length - 1 || idx < 0) {
      return;
    }

    this._positions.splice(idx, 1);

    const selectedPoint = this._mainVertexPointCollection.get(idx);
    this._mainVertexPointCollection.remove(selectedPoint);

    this._polygonPrimitive.positions = this._positions;
    this._polylinePrimitive.positions = this._positions;
  }

  /**
   * To store mouse position while moving.
   * Note that we do not actually insert position this._positions
   * @param {Cartesian3} position
   */
  updateLastPosition(position: Cartesian3) {
    const positions = this._positions.slice();

    positions.push(position);

    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;
  }

  /**
   * Polygon drawing finished
   */
  finishDrawing() {
    const positions = this._positions;

    this._polylinePrimitive.positions = positions;
    this._polylinePrimitive.loop = true;
    this._polylinePrimitive.color = Color.fromCssColorString('#ffcc33');
    this._polygonPrimitive.positions = positions;
  }

  /**
   * Clear highlited style on point primitive
   */
  _clearHighlightedPointPrimitive() {
    if (this._mainVertexPointPrimitives)
      for (let index = 0; index < this._mainVertexPointCollection!.length; index++) {
        const pointPrimitive = this._mainVertexPointCollection!.get(index);

        pointPrimitive.color = this._pointOptions.color;
        pointPrimitive.pixelSize = this._pointOptions.pixelSize;
      }

    if (this._subVertexPointPrimitives)
      for (let index = 0; index < this._subVertexPointCollection!.length; index++) {
        const pointPrimitive = this._subVertexPointCollection!.get(index);

        pointPrimitive.color = this._pointOptions.color;
        pointPrimitive.pixelSize = this._subVertexPointPrimitivePixelSize;
      }
  }

  /**
   * Highlight point primitive, eg., when mouse over
   * @param {PointPrimitive} pointPrimitive
   */
  _highlightPointPrimitive(pointPrimitive: PointPrimitive) {
    pointPrimitive.color = HIGHLIGHTED_POINT_PRIMITIVE_COLOR;
    pointPrimitive.pixelSize =
      this._pointOptions.pixelSize + HIGHLIGHTED_POINT_PRIMITIVE_PIXEL_SIZE_OFFSET;
  }

  /**
   * @param {number} vertexIndex
   * @param {Cartesian3} position
   * @param {PolygonPrimitive} polygonPrimitive
   * @param {PolylinePrimitive} polylinePrimitive
   * @returns {Vertex}
   */
  // @ts-ignore
  _newMainVertexPointPrimitive(
    vertexIndex: number,
    position: Cartesian3,
    // @ts-ignore
    polygonPrimitive: PolygonPrimitive,
    // @ts-ignore
    polylinePrimitive: PolylinePrimitive
  ) {
    const pointPrimitive = this._mainVertexPointCollection!.add(this._pointOptions) as Vertex;

    pointPrimitive.position = Cartesian3.clone(position, new Cartesian3());
    pointPrimitive.show = true;
    pointPrimitive.polygon = this;
    pointPrimitive.polygonPrimitive = polygonPrimitive;
    pointPrimitive.polylinePrimitive = polylinePrimitive;
    pointPrimitive.vertexIndex = vertexIndex;
    pointPrimitive.isMainVertex = true;

    this._mainVertexPointPrimitives!.splice(vertexIndex, 0, pointPrimitive);

    return pointPrimitive;
  }

  /**
   * When draw multiple polgon, change color for selected polygon
   */
  changePolygonColorForSelectState() {
    this._polygonPrimitive.color = SELECTED_POLYGON_PRIMITIVE_COLOR;
  }

  get boundingSphere() {
    return this._boundingSphere;
  }

  /**
   * @returns {Boolean} true if the object has been destroyed, false otherwise.
   */
  static isDestroyed() {
    return false;
  }

  /**
   * Update height of point primitives
   */
  updateHeightOfPointPrimitives() {
    // preConditionStart

    if (!defined(this._mainVertexPointPrimitives)) {
      throw new DeveloperError('_mainVertexPointPrimitives required');
    }

    if (!defined(this._subVertexPointPrimitives)) {
      throw new DeveloperError('_subVertexPointPrimitives required');
    }

    // PreConditionEnd

    _updateHeightOfPointPrimitives(
      this._scene,
      this._mainVertexPointPrimitives as PointPrimitive[]
    );
    _updateHeightOfPointPrimitives(this._scene, this._subVertexPointPrimitives as PointPrimitive[]);
  }

  destroy() {
    return destroyObject(this);
  }
}
