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

    this.aaravViewer.createAaravViewer();
  }

  cesiumViewer(): Viewer {
    // preConditionStart
    if (!defined(this.aaravViewer.viewer)) {
      throw new DeveloperError('Viewer is required.');
    }
    // preConditionEnd

    return this.aaravViewer.viewer!;
  }

  get scene(): Scene {
    // preConditionStart
    if (!defined(this.aaravViewer.viewer)) {
      throw new DeveloperError('Viewer is required.');
    }
    // preConditionEnd

    return this.aaravViewer.viewer!.scene;
  }

  get viewer(): Viewer {
    if (!defined(this.aaravViewer.viewer)) {
      throw new DeveloperError('Viewer is required.');
    }

    return this.aaravViewer.viewer!;
  }
}

export { Aarav };
