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
  private _cesiumViewer: Viewer | undefined;
  readonly aarav: Aarav;
  mapContainer: HTMLElement | undefined;
  destroyingCesiumViewer: boolean = false;

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

  createCesiumViewer() {
    // preConditionStart
    if (defined(this._cesiumViewer)) {
      throw new DeveloperError('cesiumViewer already created!');
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

    this._cesiumViewer = viewer;
    this._initMixins();

    // Trigger event
    this.evtAaravViewerCreated.raiseEvent();

    return this._cesiumViewer;
  }

  _initMixins() {
    const viewer = this._cesiumViewer;

    viewer!.extend(DrawingToolsMixin);
  }

  get cesiumViewer() {
    return this._cesiumViewer;
  }

  attach(mapContainer: HTMLElement) {
    // preConditionStart
    if (!defined(this._cesiumViewer)) {
      throw new DeveloperError('cesiumViewer required!');
    }
    // preConditionEnd

    this.mapContainer = mapContainer;

    // move from root html element to this.mapContainer html element
    this.mapContainer.append(this._cesiumViewer!.container);
  }

  // remove mapContainer
  detach() {
    if (!this.mapContainer) {
      return;
    }

    this.destroyCesiumViewer();

    this.mapContainer = undefined;
  }

  // Destroy cesium viewer
  private destroyCesiumViewer() {
    if (this.destroyingCesiumViewer) {
      return;
    }

    this.destroyingCesiumViewer = true;

    const cesiumViewer = this._cesiumViewer;

    cesiumViewer!.destroy();
    this.evtAaravViewerDestroyed.raiseEvent();

    this._cesiumViewer = undefined;
    this.destroyingCesiumViewer = false;
  }
}

export { AaravViewer };
