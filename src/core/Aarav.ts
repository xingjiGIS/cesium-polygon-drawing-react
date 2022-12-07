// q@ts-nocheck
/* qeslint-disable */

import { defined, DeveloperError, Scene, Viewer } from 'cesium';
import logger from 'loglevel';

import packageJson from '../../package.json';
import { AaravViewer } from './AaravViewer';

class Aarav {
  /**
   * HTML root element Id : <div id="root"></div> to add cesium viewer as a child element
   */
  readonly rootElementId = 'root';

  readonly aaravViewer = new AaravViewer(this);

  constructor() {
    logger.setLevel('info');
  }

  start() {
    logger.info('Aarav-Web', packageJson.version);

    this.aaravViewer.createCesiumViewer();
  }

  cesiumViewer(): Viewer {
    // preConditionStart
    if (!defined(this.aaravViewer.cesiumViewer)) {
      throw new DeveloperError('cesiumViewer is required.');
    }
    // preConditionEnd

    return this.aaravViewer.cesiumViewer!;
  }

  get scene(): Scene {
    // preConditionStart
    if (!defined(this.aaravViewer.cesiumViewer)) {
      throw new DeveloperError('cesiumViewer is required.');
    }
    // preConditionEnd

    return this.aaravViewer.cesiumViewer!.scene;
  }
}

export { Aarav };
