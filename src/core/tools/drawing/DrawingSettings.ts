// q@ts-nocheck
/* qeslint-disable */
/* eslint-disable no-param-reassign */
import {
  defaultValue,
  defined,
  Cartesian2,
  Cartesian3,
  Color,
  Ellipsoid,
  HorizontalOrigin,
  VerticalOrigin,
  ClassificationType
} from 'cesium';
import logger from 'loglevel';
import DrawingMode from './DrawingMode';

import { Polygon } from './Polygon';
import { PolygonDrawing } from './PolygonDrawing';

const defaultLabelPixelOffset = new Cartesian2(0, -9);

export interface PointOptions {
  color: Color;
  disableDepthTestDistance: number;
  pixelSize: number;
  position: Cartesian3;
  show: boolean;
}

export interface LabelOptions {
  backgroundColor: Color;
  backgroundPadding: Cartesian2;
  disableDepthTestDistance: number;
  fillColor: Color;
  font: string;
  horizontalOrigin: number;
  pixelOffset: Cartesian2;
  position: Cartesian3;
  scale: number;
  show: boolean;
  showBackground: boolean;
  verticalOrigin: VerticalOrigin;
}

export interface PolylineOptions {
  color: Color;
  ellipsoid: Ellipsoid;
  dashed: boolean;
  dashLength?: number;
  show?: boolean;
  width?: number;
  depthFailColor?: Color;
  id?: string;
  positions?: Cartesian3[];
  loop?: boolean;
  clampToGround?: boolean;
  classificationType?: any;
  allowPicking?: boolean;
}

export interface PolygonOptions {
  color: Color;
}

class DrawingSettings {
  // public static color = Color.YELLOW;
  public static color = Color.fromCssColorString('#ffcc33', new Color());
  public static activeColor = Color.fromCssColorString('#3f95fd');
  public static labelFont = '16px Lucida Console';
  public static markerPointId = 'marker_point_primitive';
  public static textColor = Color.WHITE;

  public static backgroundColor = new Color(0.165, 0.165, 0.165, 0.8);

  public static backgroundPadding = new Cartesian2(7, 5);

  // return line options, almost are style
  public static getPolylineOptions = function (options: PolylineOptions) {
    options = defaultValue(options, {});

    return {
      show: options.show,
      ellipsoid: options.ellipsoid,
      width: defaultValue(options.width, 3),
      color: defaultValue(options.color, DrawingSettings.color),
      depthFailColor: defaultValue(
        defaultValue(options.depthFailColor, options.color),
        DrawingSettings.color
      ),
      id: options.id,
      positions: options.positions,
      loop: options.loop,
      clampToGround: options.clampToGround,
      classificationType: options.classificationType,
      allowPicking: defaultValue(options.allowPicking, true),
      dashed: defaultValue(options.dashed, false),
      dashLength: defaultValue(options.dashLength, 16)
    };
  };

  // return polygon options
  public static getPolygonOptions = function (options: {
    show: boolean;
    ellipsoid: Ellipsoid;
    color: Color;
    depthFailColor: Color;
    id: string;
    positions: Cartesian3[];
    clampToGround: boolean;
    classificationType: ClassificationType;
    allowPicking: boolean;
  }) {
    options = defaultValue(options, {});

    return {
      show: options.show,
      ellipsoid: options.ellipsoid,
      color: defaultValue(options.color, DrawingSettings.color),
      depthFailColor: defaultValue(
        defaultValue(options.depthFailColor, options.color),
        DrawingSettings.color
      ),
      id: options.id,
      positions: options.positions,
      clampToGround: options.clampToGround,
      classificationType: options.classificationType,
      allowPicking: defaultValue(options.allowPicking, false)
    };
  };

  // return point options
  public static getPointOptions = function () {
    return {
      pixelSize: 10,
      color: DrawingSettings.color,
      position: new Cartesian3(),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      show: false
    };
  };

  // return marker options
  public static getMarkerPointOptions = function () {
    return {
      pixelSize: 9,
      color: DrawingSettings.activeColor,
      position: new Cartesian3(),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      show: false,
      outlineColor: Color.WHITE,
      outlineWidth: 1,
      id: DrawingSettings.markerPointId
    };
  };

  // return label options
  public static getLabelOptions = function (
    options:
      | {
          scale: number;
          horizontalOrigin: HorizontalOrigin;
          verticalOrigin: VerticalOrigin;
          pixelOffset: Cartesian2;
          fillColor?: Color;
          backgroundColor?: Color;
          backgroundPadding?: Cartesian2;
        }
      | undefined
  ) {
    options = defaultValue(options, {});

    return {
      show: false,
      font: DrawingSettings.labelFont,
      // @ts-ignore
      scale: defaultValue(options.scale, 1.0),
      // @ts-ignore
      fillColor: defaultValue(options.fillColor, DrawingSettings.textColor),
      showBackground: false,
      // @ts-ignore
      backgroundColor: defaultValue(options.backgroundColor, DrawingSettings.backgroundColor),
      // @ts-ignore
      backgroundPadding: defaultValue(
        options!.backgroundPadding,
        DrawingSettings.backgroundPadding
      ),
      // @ts-ignore
      horizontalOrigin: defaultValue(options.horizontalOrigin, HorizontalOrigin.CENTER),
      // @ts-ignore
      verticalOrigin: defaultValue(options.verticalOrigin, VerticalOrigin.BOTTOM),
      // @ts-ignore
      pixelOffset: defined(options.pixelOffset)
        ? options!.pixelOffset
        : Cartesian2.clone(defaultLabelPixelOffset),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      position: new Cartesian3()
    };
  };

  // Polygon Drawing Event Definition
  public static onPolygonCreated = (polygon: Polygon[], tool: PolygonDrawing[]) => {
    if (!polygon) {
      logger.error('Polygon is not created - 0');
      return;
    }

    if (polygon.length === 0) {
      logger.error('Polygon is not created - 1');
      return;
    }

    if (!tool) {
      logger.error('Drawing Tool is not defined - 0');
      return;
    }

    if (tool.length === 0) {
      logger.error('Drawing Tool is not defined - 1');
    }

    const polycon = polygon[0];
    const toolcon = tool[0];

    logger.info('Polygon Created : ', polycon);

    toolcon.mode = DrawingMode.EditDraw;
    logger.info('Changed Edit Mode');
  };
}

export default DrawingSettings;
