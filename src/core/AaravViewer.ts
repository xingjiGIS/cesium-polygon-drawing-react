import { defined, DeveloperError, Event } from 'cesium';
import { AaravMapViewer } from './AaravMapViewer';
import { Aarav } from './Aarav';
/**
 * Create a Cesium viewer for aarav
 * And attach it to a HTML element
 *
 * Cesium Events evtMapViewerCreated, evtMapViewerDestroyed will be assigned later.
 *
 */
class AaravViewer {
  readonly aarav: Aarav;
  mapContainer: HTMLElement | undefined;
  aaravMapViewer: AaravMapViewer | undefined;
  destroyingAaravMapViewer: boolean = false;

  // Cesium Event to process something when create mapviewer
  readonly evtMapViewerCreated = new Event();
  // Cesium Event to process something when destroy mapviewer
  readonly evtMapViewerDestroyed = new Event();

  constructor(aarav: Aarav) {
    this.aarav = aarav;
  }

  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  createAaravMapViewer() {
    // preConditionStart
    if (defined(this.aaravMapViewer)) {
      throw new DeveloperError('aaravMapViewer already created!');
    }
    // preConditionEnd

    const root = document.getElementById(this.aarav.rootElementId);

    const cesiumContainer = document.createElement('div');

    root!.append(cesiumContainer);
    const aaravMapViewer = new AaravMapViewer(cesiumContainer);

    this.aaravMapViewer = aaravMapViewer;

    // Trigger event
    this.evtMapViewerCreated.raiseEvent();

    return aaravMapViewer;
  }

  attach(mapContainer: HTMLElement) {
    // preConditionStart
    if (!defined(this.aaravMapViewer)) {
      throw new DeveloperError('aaravMapViewer required!');
    }
    // preConditionEnd

    this.mapContainer = mapContainer;

    // move from root html element to this.mapContainer html element
    this.mapContainer.append(this.aaravMapViewer!.viewer.container);
  }

  // remove mapContainer
  detach() {
    if (!this.mapContainer) {
      return;
    }

    this.destroyMapViewer();

    this.mapContainer = undefined;
  }

  // Destroy cesium viewer
  private destroyMapViewer() {
    if (this.destroyingAaravMapViewer) {
      return;
    }

    this.destroyingAaravMapViewer = true;

    const cesiumViewer = this.aaravMapViewer?.viewer;

    cesiumViewer!.destroy();
    this.evtMapViewerDestroyed.raiseEvent();

    this.aaravMapViewer = undefined;
    this.destroyingAaravMapViewer = false;
  }
}

export { AaravViewer };
