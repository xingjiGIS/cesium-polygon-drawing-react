// q@ts-nocheck
/* qeslint-disable */
import {
  ArcType,
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Color,
  ColorGeometryInstanceAttribute,
  createGuid,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  Ellipsoid,
  // @ts-ignore
  FrameState,
  GeometryInstance,
  GroundPolylinePrimitive,
  GroundPolylineGeometry,
  Material,
  PolylineColorAppearance,
  PolylineGeometry,
  PolylineMaterialAppearance,
  Primitive,
  Scene
} from 'cesium';

export interface NearestEdgeInfo {
  minHeight: number;
  segIdx: number;
  basePos: Cartesian3;
  minDist: number;
  vertexIdx: number;
  vertexPos: Cartesian3;
}

interface PolylinePrimitiveOptions {
  id?: string;
  color?: Color;
  show?: boolean;
  ellipsoid?: Ellipsoid;
  width?: number;
  positions?: Cartesian3[];
  dashed?: boolean;
  dashLength?: number;
  loop?: boolean;
  clamped?: boolean;
  depthTest?: boolean;
  scene?: Scene;
}

/**
 * Get distance between two Cartographics in Cartographic plane.
 * @param {Cartographic} a
 * @param {Cartographic} b
 * @returns {number}
 */
function distanceBetweenCarto(a: Cartographic, b: Cartographic) {
  return Math.sqrt(
    (a.longitude - b.longitude) * (a.longitude - b.longitude) +
      (a.latitude - b.latitude) * (a.latitude - b.latitude)
  );
}

const cart3Scratch = new Cartesian3();

/**
 * PolylinePrimitive represents lines geometry which is constructing polygon and draped over terrain or 3DTiles.
 * _id: primitive index
 * _color: line color
 * _width: line width
 * _positions: array for positions of vertex of line string
 * _primitive: Cesium GroundPrimitive or Primitive to save and render line string
 * _update: update lines or not (positions or options)
 * _allowPicking: When true, each geometry instance will only be pickable with Scene#pick. When false, GPU memory is saved.
 * _clamped: clamp on the terrain or not
 * _dashed: line style - solid or dash
 * _loop: closed line string or not
 * _depthTest: disable the depth test to camera or not
 *
 * Reference: https://cesium.com/learn/cesiumjs/ref-doc/GroundPrimitive.html?classFilter=ground
 */
export class PolylinePrimitive {
  public show: boolean = true;

  private _color: Color;
  private readonly _ellipsoid: Ellipsoid;
  private _id: string;
  private _width: number;
  private _update: boolean;
  private _primitive: GroundPolylinePrimitive | Primitive | undefined;
  private _positions: Cartesian3[];
  private readonly _boundingSphere: BoundingSphere;
  private _dashed: boolean;
  private readonly _dashLength: number;
  private _loop: boolean;
  private readonly _clamped: boolean;
  private readonly _depthTest: boolean;
  private readonly _scene: Scene;

  constructor(options: PolylinePrimitiveOptions) {
    this.show = defaultValue(options.show, true);

    this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
    this._width = defaultValue(options.width, 3);
    this._color = Color.clone(defaultValue(options.color, Color.WHITE));
    this._id = options.id ? options.id : createGuid();
    this._positions = defaultValue(options.positions, []);
    this._primitive = undefined;
    this._boundingSphere = new BoundingSphere();
    this._dashed = defaultValue(options.dashed, false);
    this._dashLength = defaultValue(options.dashLength, 16);
    this._loop = defaultValue(options.loop, false);
    this._clamped = defaultValue(options.clamped, true);
    this._depthTest = defaultValue(options.depthTest, false);
    this._scene = defaultValue(options.scene, undefined);

    this._update = true;
  }

  updatePosition(index: number, position: Cartesian3) {
    if (index >= this._positions.length) {
      throw new DeveloperError('invalid point index');
    }

    position.clone(this._positions[index]);
    this._update = true;
  }

  update(frameState: FrameState) {
    if (!this.show) {
      return;
    }

    let positions = this._positions;
    if (!defined(positions) || positions.length < 2) {
      if (this._primitive) {
        this._primitive.destroy();
        this._primitive = undefined;
      }

      return;
    }

    if (this._update) {
      this._update = false;

      if (this._primitive) this._primitive.destroy();

      if (this._loop) {
        positions = positions.slice();
        positions.push(positions[0]);
      }

      let geometry;

      if (this._clamped) {
        geometry = new GroundPolylineGeometry({
          positions: positions,
          width: this.width,
          // @ts-ignore
          vertexFormat: PolylineMaterialAppearance.VERTEX_FORMAT,
          ellipsoid: this._ellipsoid,
          arcType: ArcType.GEODESIC
        });
      } else {
        geometry = new PolylineGeometry({
          positions: positions,
          width: this.width,
          vertexFormat: PolylineMaterialAppearance.VERTEX_FORMAT,
          ellipsoid: this._ellipsoid,
          arcType: ArcType.NONE
        });
      }

      let appearance;

      if (this._dashed) {
        appearance = new PolylineMaterialAppearance({
          material: Material.fromType(Material.PolylineDashType, {
            color: this._color,
            dashLength: this._dashLength
          })
        });
      } else {
        appearance = new PolylineColorAppearance();
      }

      if (this._clamped) {
        this._primitive = new GroundPolylinePrimitive({
          geometryInstances: new GeometryInstance({
            geometry: geometry,
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(this._color),
              depthFailColor: ColorGeometryInstanceAttribute.fromColor(this._color)
            },
            id: this._id
          }),
          appearance: appearance,
          // @ts-ignore
          depthFailAppearance: this._depthTest ? undefined : appearance,
          asynchronous: false,
          allowPicking: true,
          debugShowBoundingVolume: false,
          debugShowShadowVolume: false
        });
      } else {
        this._primitive = new Primitive({
          geometryInstances: new GeometryInstance({
            geometry: geometry,
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(this._color),
              depthFailColor: ColorGeometryInstanceAttribute.fromColor(this._color)
            },
            id: this.id
          }),
          appearance: appearance,
          depthFailAppearance: this._depthTest ? undefined : appearance,
          asynchronous: false,
          allowPicking: false
        });
      }

      // @ts-ignore
      this._primitive.polylinePrimitive = this;

      BoundingSphere.fromPoints(positions, this._boundingSphere);
    }
    // @ts-ignore
    if (this._primitive) this._primitive.update(frameState);
  }

  // eslint-disable-next-line class-methods-use-this
  isDestroyed() {
    return false;
  }

  destroy() {
    if (this._primitive) this._primitive.destroy();
    return destroyObject(this);
  }

  get boundingVolume() {
    return this._boundingSphere;
  }

  get color() {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
    this._update = true;
  }

  get ellipsoid() {
    return this._ellipsoid;
  }

  get id() {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get positions() {
    return this._positions;
  }

  set positions(positions: Cartesian3[]) {
    this._positions = positions;
    this._update = true;
  }

  get width() {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  get dashed() {
    return this._dashed;
  }

  set dashed(value: boolean) {
    this._dashed = value;
    this._update = true;
  }

  get loop() {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
    this._update = true;
  }

  forceUpdate() {
    this._update = true;
  }

  /**
   * Get the nearest Edge and vertex from the position
   * @param {Cartesian3} pos
   * @returns {NearestEdgeInfo}
   */
  getNearestEdgeInfo(pos: Cartesian3): NearestEdgeInfo {
    const length = this._positions.length;
    // min distance from line Edge
    let minHeight = Number.POSITIVE_INFINITY;
    let minHeightCarto = Number.POSITIVE_INFINITY;
    let segIdx = -1;
    // min distance from vertex
    let minDist = Number.POSITIVE_INFINITY;
    let vertexIdx = -1;
    let vertexPos = new Cartesian3();

    const basePos = new Cartesian3();

    const scene = this._scene!;
    const ellipsoid = scene.globe.ellipsoid;

    const carto = new Cartographic();
    ellipsoid.cartesianToCartographic(pos, carto);

    for (let i = 0; i < length; i++) {
      const segStartPos = this._positions[i];
      const segStartCarto = new Cartographic();
      ellipsoid.cartesianToCartographic(segStartPos, segStartCarto);
      segStartCarto.height = 0;
      Cartesian3.fromRadians(
        segStartCarto.longitude,
        segStartCarto.latitude,
        scene.globe.getHeight(segStartCarto),
        ellipsoid,
        cart3Scratch
      );
      segStartPos.x = cart3Scratch.x;
      segStartPos.y = cart3Scratch.y;
      segStartPos.z = cart3Scratch.z;

      const segEndPos = this._positions[(i + 1) % length];
      const segEndCarto = new Cartographic();
      ellipsoid.cartesianToCartographic(segEndPos, segEndCarto);
      segEndCarto.height = 0;
      Cartesian3.fromRadians(
        segEndCarto.longitude,
        segEndCarto.latitude,
        scene.globe.getHeight(segEndCarto),
        ellipsoid,
        cart3Scratch
      );
      segEndPos.x = cart3Scratch.x;
      segEndPos.y = cart3Scratch.y;
      segEndPos.z = cart3Scratch.z;

      const segMidCarto = new Cartographic(
        (segStartCarto.longitude + segEndCarto.longitude) / 2,
        (segStartCarto.latitude + segEndCarto.latitude) / 2,
        0
      );

      const radius0 = distanceBetweenCarto(segMidCarto, segStartCarto);
      const radius1 = distanceBetweenCarto(segMidCarto, carto);
      const a = distanceBetweenCarto(segStartCarto, segEndCarto);
      const c = distanceBetweenCarto(segEndCarto, carto);
      const b = distanceBetweenCarto(segStartCarto, carto);

      const distanceToVertex = Cartesian3.distance(pos, segStartPos);

      if (minDist > distanceToVertex) {
        minDist = distanceToVertex;
        vertexIdx = i;
        vertexPos = segStartPos;
      }

      if (radius1 <= radius0) {
        const s = (a + b + c) / 2;
        // Heron's formula
        const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        const height = area / a;

        if (minHeightCarto > height) {
          minHeightCarto = height;
          segIdx = i;

          const dbase = Math.sqrt(b * b - minHeightCarto * minHeightCarto) / a;
          const delta = new Cartographic(
            (segEndCarto.longitude - segStartCarto.longitude) * dbase,
            (segEndCarto.latitude - segStartCarto.latitude) * dbase,
            0
          );

          const basePosCarto = new Cartographic(
            segStartCarto.longitude + delta.longitude,
            segStartCarto.latitude + delta.latitude,
            0
          );

          const altitude = scene.globe.getHeight(basePosCarto);

          Cartesian3.fromRadians(
            basePosCarto.longitude,
            basePosCarto.latitude,
            altitude,
            ellipsoid,
            cart3Scratch
          );

          basePos.x = cart3Scratch.x;
          basePos.y = cart3Scratch.y;
          basePos.z = cart3Scratch.z;

          minHeight = Cartesian3.distance(basePos, pos);
        }
      }
    }
    return { minHeight, segIdx, basePos, minDist, vertexIdx, vertexPos };
  }
}
