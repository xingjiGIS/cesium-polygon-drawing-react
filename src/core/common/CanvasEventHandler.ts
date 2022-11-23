// q@ts-nocheck
import {
  Cartesian2,
  KeyboardEventModifier,
  ScreenSpaceEventHandler,
  Scene,
  ScreenSpaceEventType,
  Viewer
} from 'cesium';

import { MouseButton } from './global';

interface ScratchMouseEvent {
  pos: Cartesian2;
  button: MouseButton | undefined;
  keyboardModifier: KeyboardEventModifier | undefined;
}
const scratchMouseEvent: ScratchMouseEvent = {
  pos: new Cartesian2(),
  button: undefined,
  keyboardModifier: undefined
};

class CanvasEventHandler {
  private _viewer: Viewer;
  private _sseh: ScreenSpaceEventHandler;
  private _scene: Scene;

  constructor(options: { viewer: Viewer }) {
    this._viewer = options.viewer;

    const { scene } = options.viewer;

    this._sseh = new ScreenSpaceEventHandler(scene.canvas);
    this._scene = scene;
  }

  activate() {
    const sseh = this._sseh;

    sseh.setInputAction(this._mouseMove.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
    sseh.setInputAction(
      this._mouseMoveCtrl.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.CTRL
    );
    sseh.setInputAction(
      this._mouseMoveShift.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.SHIFT
    );

    sseh.setInputAction(
      this._leftButtonDoubleClick.bind(this),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    sseh.setInputAction(this._leftDown.bind(this), ScreenSpaceEventType.LEFT_DOWN);
    sseh.setInputAction(this._rightDown.bind(this), ScreenSpaceEventType.RIGHT_DOWN);

    sseh.setInputAction(this._leftUp.bind(this), ScreenSpaceEventType.LEFT_UP);
    sseh.setInputAction(
      this._leftUpCtrl.bind(this),
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.CTRL
    );
    sseh.setInputAction(
      this._leftUpShift.bind(this),
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.SHIFT
    );

    sseh.setInputAction(this._rightUp.bind(this), ScreenSpaceEventType.RIGHT_UP);
    sseh.setInputAction(
      this._rightUpCtrl.bind(this),
      ScreenSpaceEventType.RIGHT_UP,
      KeyboardEventModifier.CTRL
    );
    sseh.setInputAction(
      this._rightUpShift.bind(this),
      ScreenSpaceEventType.RIGHT_UP,
      KeyboardEventModifier.SHIFT
    );

    // sseh.setInputAction(
    //   (wheel: Cartesian2) => {
    //   this._wheel(wheel);
    // }, ScreenSpaceEventType.WHEEL);
    // sseh.setInputAction(
    //   (wheel: Cartesian2) => {
    //     this._wheelCtrl(wheel);
    //   },
    //   ScreenSpaceEventType.WHEEL,
    //   KeyboardEventModifier.CTRL
    // );

    sseh.setInputAction(this._leftClick.bind(this), ScreenSpaceEventType.LEFT_CLICK);
    sseh.setInputAction(
      this._leftClickShift.bind(this),
      ScreenSpaceEventType.LEFT_CLICK,
      KeyboardEventModifier.SHIFT
    );

    const { canvas } = this._scene;

    // needed to put focus on the canvas
    canvas.setAttribute('tabindex', '0');

    canvas.onclick = function () {
      canvas.focus();
    };

    canvas.addEventListener('keydown', this._handleKeyDown.bind(this));
    canvas.addEventListener('keyup', this._handleKeyUp.bind(this));
  }

  deactivate() {
    const sseh = this._sseh;

    sseh.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_CLICK, KeyboardEventModifier.SHIFT);

    sseh.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    sseh.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_UP);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  static _makeMouseEvent(
    pos: Cartesian2,
    button: MouseButton | undefined,
    keyboardModifier: KeyboardEventModifier | undefined
  ) {
    Cartesian2.clone(pos, scratchMouseEvent.pos);
    if (button) {
      scratchMouseEvent.button = button;
    }
    if (keyboardModifier) {
      scratchMouseEvent.keyboardModifier = keyboardModifier;
    }

    return scratchMouseEvent;
  }

  static _makeWheelEvent(
    wheel: Cartesian2,
    button: MouseButton | undefined,
    keyboardModifier: KeyboardEventModifier | undefined
  ) {
    return {
      wheel,
      button,
      keyboardModifier
    };
  }

  /**
   * @param {Object} movement
   * @param {Cartesian2} movement.startPosition
   * @param {Cartesian2} movement.endPosition
   * @private
   */
  _mouseMove(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }

    const event = CanvasEventHandler._makeMouseEvent(movement.endPosition, undefined, undefined);

    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  _mouseMoveCtrl(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }

    const event = CanvasEventHandler._makeMouseEvent(
      movement.endPosition,
      undefined,
      KeyboardEventModifier.CTRL
    );
    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  _mouseMoveShift(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }
    const event = CanvasEventHandler._makeMouseEvent(
      movement.endPosition,
      undefined,
      KeyboardEventModifier.SHIFT
    );
    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftButtonDoubleClick(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined
    );

    this._handleDoubleClick(event);
  }

  _handleDoubleClick(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasDoubleClickEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftDown(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined
    );

    this._handleDown(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightDown(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      undefined
    );

    this._handleDown(event);
  }

  _handleDown(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasPressEvent(event);
    }
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUp(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined
    );

    this._handleUp(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUpCtrl(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.CTRL
    );

    this._handleUp(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUpShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.SHIFT
    );

    this._handleUp(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUp(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      undefined
    );

    this._handleUp(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUpCtrl(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      KeyboardEventModifier.CTRL
    );

    this._handleUp(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUpShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      KeyboardEventModifier.SHIFT
    );

    this._handleUp(event);
  }

  _handleUp(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasReleaseEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftClick(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined
    );

    this._handleClick(event);
  }

  /**
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftClickShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.SHIFT
    );

    this._handleClick(event);
  }

  _handleClick(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasClickEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * @param {Number} wheel
   * @private
   */
  _wheel(wheel: Cartesian2) {
    const event = CanvasEventHandler._makeWheelEvent(wheel, undefined, undefined);

    this._handleWheel(event);
  }

  /**
   * @param {Number} wheel
   * @private
   */
  _wheelCtrl(wheel: Cartesian2) {
    const event = CanvasEventHandler._makeWheelEvent(wheel, undefined, KeyboardEventModifier.CTRL);

    this._handleWheel(event);
  }

  _handleWheel(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.wheelEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.keyPressEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyUp(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.keyReleaseEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }
}

export default CanvasEventHandler;
