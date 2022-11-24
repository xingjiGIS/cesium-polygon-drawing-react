import { defined, DeveloperError, Viewer } from 'cesium';

import { DrawingToolsMixin } from './tools/drawing';

class AaravMapViewer {
  private _viewer: Viewer;

  constructor(container: HTMLElement) {
    if (!defined(container)) {
      throw new DeveloperError('container is required.');
    }

    const viewer: Viewer = new Viewer(container);
    // @ts-ignore
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
