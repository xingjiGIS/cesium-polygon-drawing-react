// q@ts-nocheck
/* qeslint-disable */
/* eslint-disable no-proto */
import { defined, DeveloperError, Viewer } from 'cesium';

import CanvasEventHandler from './CanvasEventHandler';
import { MapTool } from './MapTool';

/**
 * a set of map tool
 */

export class MapTools {
  protected _viewer: Viewer;

  /**
   * @param options
   * @param options.viewer
   */
  constructor(options: any) {
    if (!defined(options.viewer)) {
      throw Error('options.viewer required!');
    }

    const { viewer } = options;

    if (!viewer._canvasEventHandler) {
      // current active map tool
      viewer._mapTool = null;

      const canvasEventHandler = new CanvasEventHandler({ viewer });

      canvasEventHandler.activate();

      viewer._canvasEventHandler = canvasEventHandler;

      Object.defineProperties(viewer.__proto__, {
        // eslint-disable-next-line object-shorthand
        mapTool: {
          get() {
            return this._mapTool;
          },
          configurable: true
        },
        // eslint-disable-next-line object-shorthand
        canvasEventHandler: {
          get() {
            return this._canvasEventHandler;
          },
          configurable: true
        }
      });

      /**
       * @param {MapTool} mapTool
       * @param {object} activateOptions
       */

      viewer.__proto__.setMapTool = function (mapTool: MapTool) {
        if (!defined(mapTool)) {
          throw new DeveloperError('mapTool is required');
        }

        if (this._mapTool) {
          this._mapTool.deactivate();
          this._mapTool = null;
        }

        if (mapTool.activate()) {
          this._mapTool = mapTool;
          return true;
        }

        return false;
      };

      viewer.__proto__.deactivateCurrentMapTool = function () {
        if (this._mapTool) {
          this._mapTool.deactivate();

          this._mapTool = null;
        }
      };
    }

    this._viewer = viewer;
  }
}
