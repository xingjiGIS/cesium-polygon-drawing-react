// q@ts-nocheck
/* qeslint-disable */
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import {
  Cartesian2,
  // Cartesian3,
  defined,
  DeveloperError,
  Event,
  KeyboardEventModifier,
  Viewer
} from 'cesium';

/**
 * Abstract base class for all map tools
 * Map tools are user interactive tools for manipulating the canvas
 */

import { getWorldPosition } from '../util';
import { MouseButton } from './global';

let oldCursorStyle: string | undefined;

function getMapToolCursorStyle(imageUrl: string, centerX = 12, centerY = 12) {
  return `url('${imageUrl}') ${centerX} ${centerY}, auto`;
}

export interface MouseEvent {
  pos: Cartesian2;
  button: MouseButton;
  keyboardEventModifier: KeyboardEventModifier;
}

export interface MapToolConstructorOptions {
  viewer: Viewer;
  name: string;
  cursorStyle: string | undefined;
}

class MapTool {
  protected _viewer: Viewer;
  protected _name: string;
  protected _cursorStyle: string | undefined;
  private readonly _activated: Event;
  private readonly _deactivated: Event;

  constructor(options: MapToolConstructorOptions) {
    if (this.constructor === MapTool) {
      throw new TypeError('Abstract class "MapTool" cannot be instantiated directly.');
    }

    if (!defined(options.viewer)) {
      throw new DeveloperError('viewer is required');
    }

    if (!defined(options.name)) {
      throw new DeveloperError('name should be given');
    }

    this._viewer = options.viewer;
    this._name = options.name;
    this._cursorStyle = options.cursorStyle;

    this._activated = new Event();
    this._deactivated = new Event();
  }

  isActive() {
    // @ts-ignore
    return this._viewer.mapTool === this;
  }

  activate() {
    this._activated.raiseEvent();

    if (this._cursorStyle !== undefined) {
      oldCursorStyle = this._viewer.canvas.style.cursor;
      this._viewer.canvas.style.cursor = this._cursorStyle;
    }

    return true;
  }

  setOverrideCursorWait() {
    this._viewer.canvas.style.cursor = 'wait';
  }

  restoreOverrideCursor() {
    if (this.isActive() && this._cursorStyle !== undefined) {
      this._viewer.canvas.style.cursor = this._cursorStyle;
    } else {
      this._viewer.canvas.style.cursor = 'default';
    }
  }

  deactivate() {
    this._deactivated.raiseEvent();

    if (defined(this._cursorStyle)) {
      this._viewer.canvas.style.cursor = oldCursorStyle!;
    }
  }

  disableOrigCesiumWidgetScreenSpaceHandler() {
    const { scene } = this._viewer;

    scene.screenSpaceCameraController.enableRotate = false;
  }

  enableOrigCesiumWidgetScreenSpaceHandler() {
    const { scene } = this._viewer;

    scene.screenSpaceCameraController.enableRotate = true;
  }

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars,  @typescript-eslint/no-unused-vars
  canvasMoveEvent(event: MouseEvent) {}

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasDoubleClickEvent(event: MouseEvent) {}

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasPressEvent(event: MouseEvent) {}

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasReleaseEvent(event: MouseEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  wheelEvent(event: MouseEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  keyPressEvent(event: KeyboardEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  keyReleaseEvent(event: KeyboardEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasClickEvent(event: KeyboardEvent) {}

  get name() {
    return this._name;
  }

  get activated() {
    return this._activated;
  }

  get deactivated() {
    return this._deactivated;
  }

  /**
   * @param {Cartesian2} mousePosition
   * @param {Cartesian3} result
   * @return {Cartesian3|undefined}
   */
  getWorldPosition(mousePosition: any, result: any) {
    const viewer = this._viewer;
    const { scene } = viewer;

    return getWorldPosition(scene, mousePosition, result);
  }
}

export { getMapToolCursorStyle, MapTool };
