import { defined, DeveloperError, Event, Viewer } from 'cesium';
import { Aarav } from './Aarav';
import { DrawingToolsMixin } from './tools/drawing';
/**
 * Create a Cesium viewer for aarav
 * And attach it to a HTML element
 *
 * Cesium Events evtAaravViewerCreated, evtAaravViewerDestroyed will be assigned later.
 *
 */
class AaravViewer {
  private _viewer: Viewer | undefined;
  readonly aarav: Aarav;
  mapContainer: HTMLElement | undefined;
  destroyingAaravViewer: boolean = false;

  // Cesium Event to process something when create aaravViewer
  readonly evtAaravViewerCreated = new Event();
  // Cesium Event to process something when destroy aaravViewer
  readonly evtAaravViewerDestroyed = new Event();

  constructor(aarav: Aarav) {
    this.aarav = aarav;
  }

  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  createAaravViewer() {
    // preConditionStart
    if (defined(this._viewer)) {
      throw new DeveloperError('aaravViewer already created!');
    }
    // preConditionEnd

    const root = document.getElementById(this.aarav.rootElementId);

    const cesiumContainer = document.createElement('div');

    root!.append(cesiumContainer);

    if (!defined(cesiumContainer)) {
      throw new DeveloperError('container is required.');
    }

    const viewer: Viewer = new Viewer(cesiumContainer);
    // @ts-ignore
    viewer._element.style = 'width: 100vw;';

    this._viewer = viewer;
    this._initMixins();

    // Trigger event
    this.evtAaravViewerCreated.raiseEvent();

    return this._viewer;
  }

  _initMixins() {
    const viewer = this._viewer;

    viewer!.extend(DrawingToolsMixin);
  }

  get viewer() {
    return this._viewer;
  }

  attach(mapContainer: HTMLElement) {
    // preConditionStart
    if (!defined(this._viewer)) {
      throw new DeveloperError('aaravViewer required!');
    }
    // preConditionEnd

    this.mapContainer = mapContainer;

    // move from root html element to this.mapContainer html element
    this.mapContainer.append(this._viewer!.container);
  }

  // remove mapContainer
  detach() {
    if (!this.mapContainer) {
      return;
    }

    this.destroyAaravViewer();

    this.mapContainer = undefined;
  }

  // Destroy cesium viewer
  private destroyAaravViewer() {
    if (this.destroyingAaravViewer) {
      return;
    }

    this.destroyingAaravViewer = true;

    const cesiumViewer = this._viewer;

    cesiumViewer!.destroy();
    this.evtAaravViewerDestroyed.raiseEvent();

    this._viewer = undefined;
    this.destroyingAaravViewer = false;
  }
}

export { AaravViewer };
