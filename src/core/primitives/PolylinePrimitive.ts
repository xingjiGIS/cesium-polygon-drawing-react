// q@ts-nocheck
/* qeslint-disable */
import {
  ArcType,
  BoundingSphere,
  Cartesian3,
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
  Primitive
} from 'cesium';

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
}
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

  distanceFromPosition(pos: Cartesian3): {
    minHeight: number;
    segIdx: number;
    basePos: Cartesian3;
  } {
    const length = this._positions.length;
    let minHeight = Number.POSITIVE_INFINITY;
    let segIdx = -1;
    const basePos = new Cartesian3();

    for (let i = 0; i < length; i++) {
      const segStartPos = this._positions[i];
      const segEndPos = this._positions[(i + 1) % length];
      const a = Cartesian3.distance(segStartPos, segEndPos);
      const b = Cartesian3.distance(segStartPos, pos);
      const c = Cartesian3.distance(segEndPos, pos);
      const s = (a + b + c) / 2;
      // Heron's formula
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const height = area / a;

      if (minHeight > height) {
        minHeight = height;
        segIdx = i;

        const dbase = Math.sqrt(b * b - minHeight * minHeight) / a;
        const delta = new Cartesian3();
        Cartesian3.subtract(segEndPos, segStartPos, delta);
        Cartesian3.multiplyByScalar(delta, dbase, delta);
        Cartesian3.add(segStartPos, delta, basePos);
      }
    }
    return { minHeight, segIdx, basePos };
  }
}
