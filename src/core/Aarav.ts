// q@ts-nocheck
/* qeslint-disable */

import { defined, DeveloperError, Scene, Viewer } from 'cesium';
import logger from 'loglevel';
import { emitCustomEvent } from 'react-custom-events';

import packageJson from '../../package.json';
import { SET_STATUS_MESSAGE, SHOW_MESSAGE } from '../types/events';
import { AaravViewer } from './AaravViewer';

class Aarav {
  /**
   * HTML root element Id : <div id="root"></div> to add cesium viewer as a child element
   */
  readonly rootElementId = 'root';

  readonly mainViewer = new AaravViewer(this);

  constructor() {
    logger.setLevel('info');
  }

  start() {
    logger.info('Aarav-Web', packageJson.version);

    this.mainViewer.createAaravMapViewer();
  }

  cesiumViewer(): Viewer {
    // preConditionStart
    if (!defined(this.mainViewer.viewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }
    // preConditionEnd

    return this.mainViewer.viewer!;
  }

  get scene(): Scene {
    // preConditionStart
    if (!defined(this.mainViewer.viewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }
    // preConditionEnd

    return this.mainViewer.viewer!.scene;
  }

  // eslint-disable-next-line class-methods-use-this
  showMessage(param: { type: 'warning' | 'info' | 'error'; message: string }) {
    emitCustomEvent(SHOW_MESSAGE, param);
  }

  // eslint-disable-next-line class-methods-use-this
  setStatusMessage(message: string) {
    emitCustomEvent(SET_STATUS_MESSAGE, { message });
  }

  get mapViewer(): Viewer {
    if (!defined(this.mainViewer.viewer)) {
      throw new DeveloperError('aaravMapViewer is required.');
    }

    return this.mainViewer.viewer!;
  }
}

export { Aarav };
