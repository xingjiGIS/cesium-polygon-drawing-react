import {
  // @ts-ignore
  createDefaultImageryProviderViewModels,
  defined,
  DeveloperError,
  // @ts-ignore
  VERSION,
  Viewer
} from 'cesium';
import logger from 'loglevel';

import { DrawingToolsMixin } from './tools/drawing';

class AaravMapViewer {
  private readonly _baseImageryProviders: any;
  private _viewer: Viewer;

  constructor(container: HTMLElement) {
    if (!defined(container)) {
      throw new DeveloperError('container is required.');
    }

    if (VERSION !== '1.99') {
      logger.warn('subsurface rendering engine may not work at this cesium js version');
    }

    // @ts-ignore
    this._baseImageryProviders = createDefaultImageryProviderViewModels();
    const viewer: any = new Viewer(container);
    viewer._element.style = 'width: 100vw;';

    this._viewer = viewer;
    this._initMixins();
  }

  _initMixins() {
    const viewer = this._viewer;

    viewer.extend(DrawingToolsMixin);
  }

  get viewer() {
    return this._viewer;
  }
}

export { AaravMapViewer };
