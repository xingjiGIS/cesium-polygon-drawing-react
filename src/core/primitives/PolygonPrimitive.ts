// q@ts-nocheck
/* qeslint-disable */
import {
  BoundingSphere,
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  CoplanarPolygonGeometry,
  createGuid,
  defaultValue,
  destroyObject,
  DeveloperError,
  // @ts-ignore
  FrameState,
  GeometryInstance,
  GroundPrimitive,
  PerInstanceColorAppearance,
  Primitive,
  PolygonGeometry,
  PolygonHierarchy
} from 'cesium';

interface PolygonPrimitiveOptions {
  color: Color;
  show?: boolean;
  positions?: Cartesian3[];
  allowPicking?: boolean;
  clamped?: boolean;
}
/**
 * PolygonPrimitive represents polygon geometry draped over terrain or 3DTiles.
 * _id: primitive index
 * _color: color for inner transparent shading area
 * _positions: array for positions of vertex of polygon
 * _boundingSphere: a bounding sphere which contains polygon
 * _primitive: Cesium GroundPrimitive or Primitive to save and render polygon
 * _update: update polygon or not (positions or options)
 * _allowPicking: When true, each geometry instance will only be pickable with Scene#pick. When false, GPU memory is saved.
 * _clamped: clamp on the terrain or not
 * 
 * Reference: https://cesium.com/learn/cesiumjs/ref-doc/GroundPrimitive.html?classFilter=ground
 */
export class PolygonPrimitive {
  public show: boolean = true;

  private _id: string;
  private _color: Color;
  private readonly _depthFailColor: Color;
  private _positions: Cartesian3[];
  private _boundingSphere: BoundingSphere;
  private _primitive: GroundPrimitive | Primitive | undefined;
  private _update: boolean;
  private readonly _allowPicking: boolean;
  private _clamped: boolean;

  constructor(options: PolygonPrimitiveOptions) {
    this.show = defaultValue(options.show, true);
    const color = Color.clone(defaultValue(options.color, Color.WHITE));
    this._id = createGuid();
    this._color = color;
    this._depthFailColor = color;
    this._positions = defaultValue(options.positions, []);

    this._boundingSphere = new BoundingSphere();
    this._primitive = undefined;
    this._update = true;
    this._allowPicking = defaultValue(options.allowPicking, false);
    this._clamped = defaultValue(options.clamped, true);
  }

  update(frameState: FrameState) {
    if (!this.show) {
      return;
    }

    const positions = this._positions;

    if (positions.length < 3) {
      if (this._primitive) {
        this._primitive.destroy();
        this._primitive = undefined;
      }
      return;
    }

    if (this._update) {
      this._update = false;

      if (this._primitive) this._primitive.destroy();

      if (this._clamped) this._createGroundPolygonPrimitive(positions);
      else this._createCoplanarPolygonPrimitive(positions);

      this._boundingSphere = BoundingSphere.fromPoints(positions, this._boundingSphere);
    }
    // @ts-ignore
    if (this._primitive) this._primitive.update(frameState);
  }

  _createGroundPolygonPrimitive(positions: Cartesian3[]) {
    const geometry = new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(positions),
      perPositionHeight: true
      // vertexFormat : PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
    });

    this._primitive = new GroundPrimitive({
      geometryInstances: new GeometryInstance({
        geometry: geometry,
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(this._color)
          // depthFailColor : ColorGeometryInstanceAttribute.fromColor(this._depthFailColor)
        },
        id: this._id
      }),
      appearance: new PerInstanceColorAppearance({
        flat: false,
        closed: false,
        translucent: this._color.alpha < 1.0
      }),
      // depthFailAppearance : new PerInstanceColorAppearance({
      //     flat : true,
      //     closed : false,
      //     translucent : this._depthFailColor.alpha < 1.0
      // }),
      allowPicking: true,
      asynchronous: false,
      releaseGeometryInstances: false
    });
  }

  _createCoplanarPolygonPrimitive(positions: Cartesian3[]) {
    const geometry = CoplanarPolygonGeometry.fromPositions({
      positions: positions,
      vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
    });

    this._primitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: geometry,
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(this._color),
          depthFailColor: ColorGeometryInstanceAttribute.fromColor(this._depthFailColor)
        },
        id: this._id
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        closed: false,
        translucent: this._color.alpha < 1.0
      }),
      depthFailAppearance: new PerInstanceColorAppearance({
        flat: true,
        closed: false,
        translucent: this._depthFailColor.alpha < 1.0
      }),
      allowPicking: this._allowPicking,
      asynchronous: false,
      releaseGeometryInstances: false
    });
  }

  updatePosition(index: number, position: Cartesian3) {
    if (index >= this._positions.length) {
      throw new DeveloperError('invalid point index');
    }

    position.clone(this._positions[index]);
    this._update = true;
  }

  // eslint-disable-next-line class-methods-use-this
  isDestroyed() {
    return false;
  }

  destroy() {
    if (this._primitive) this._primitive.destroy();
    // this._primitive = this._primitive && this._primitive.destroy();
    return destroyObject(this);
  }

  get boundingSphere() {
    return this._boundingSphere;
  }

  get clamped() {
    return this._clamped;
  }

  set clamped(clamped: boolean) {
    this._clamped = clamped;
    this._update = true;
  }

  get color() {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
    this._update = true;
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

  get primitive() {
    return this._primitive;
  }

  forceUpdate() {
    this._update = true;
  }
}
