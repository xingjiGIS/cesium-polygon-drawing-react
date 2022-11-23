// q@ts-nocheck
/* qeslint-disable */

import { defined, DeveloperError, Scene, Viewer } from 'cesium';
import logger from 'loglevel';
import * as Cesium from 'cesium';
import { emitCustomEvent } from 'react-custom-events';

import { AaravMapViewer } from './AaravMapViewer';
import packageJson from '../../package.json';
import { SET_STATUS_MESSAGE, SHOW_MESSAGE } from '../types/events';
import { AaravViewer } from './AaravViewer';

class Aarav {
  /**
   * HTML root element Id : <div id="root"></div> to add cesium viewer as a child element
   */
  readonly rootElementId = 'root';

  readonly mainViewer = new AaravViewer(this);
  readonly isDevelopmentMode = true;
  // process?.env?.NODE_ENV === 'development';

  constructor() {
    if (this.isDevelopmentMode) {
      logger.setLevel('trace');
    } else {
      logger.setLevel('info');
    }
  }

  start() {
    logger.info('Aarav-Web', packageJson.version);

    if (this.isDevelopmentMode) {
      // @ts-ignore
      logger.info('CesiumJs', Cesium.VERSION);
      this.mainViewer.createAaravMapViewer();
    }
  }

  cesiumViewer(): Viewer {
    // preConditionStart
    if (!defined(this.mainViewer.aaravMapViewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }
    // preConditionEnd

    return this.mainViewer.aaravMapViewer!.viewer;
  }

  get scene(): Scene {
    // preConditionStart
    if (!defined(this.mainViewer.aaravMapViewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }
    // preConditionEnd

    return this.mainViewer.aaravMapViewer!.viewer.scene;
  }

  // eslint-disable-next-line class-methods-use-this
  showMessage(param: { type: 'warning' | 'info' | 'error'; message: string }) {
    emitCustomEvent(SHOW_MESSAGE, param);
  }

  // eslint-disable-next-line class-methods-use-this
  setStatusMessage(message: string) {
    emitCustomEvent(SET_STATUS_MESSAGE, { message });
  }

  get mapViewer(): AaravMapViewer {
    if (!defined(this.mainViewer.aaravMapViewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }

    return this.mainViewer.aaravMapViewer as AaravMapViewer;
  }
}

export { Aarav };
