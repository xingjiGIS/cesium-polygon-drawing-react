import {
  Cartesian3,
  CesiumTerrainProvider,
  defined,
  DeveloperError,
  Event,
  Rectangle,
  UrlTemplateImageryProvider,
  Viewer
} from 'cesium';
import MVTImageryProvider, { StyleSpecification } from 'mvt-imagery-provider';
import { Aarav } from './Aarav';
import { DrawingToolsMixin } from './tools/drawing';

const rasterUrl =
  'https://plt-shared-dev.aereo.co.in:8001/ortho/{z}/{x}/{y}.png?key=rb-iterations-dev/orthomosaic/d4ca6a08-79c0-4d45-872e-9979cbe24bed_cog.tif';
const terrainURL =
  'https://plt-shared-dev.aereo.co.in:8002/?folder_name=d4ca6a08-79c0-4d45-872e-9979cbe24bed_tt&key=rb-iterations-dev/terrain_tiles/d4ca6a08-79c0-4d45-872e-9979cbe24bed_tt';
const mvtURL =
  'https://plt-shared-dev.aereo.co.in:8003/{z}/{x}/{y}.pbf?key=rb-iterations-dev/extracted_mbtiles/c6be9275-1af4-4820-8074-4b4a5a1f8ec3';
const viewBound = [87.01091189016857, 23.802298682242647, 87.02987852815343, 23.817440580860772];
const viewPoint = [87.0180062252, 23.8108504077, 5000.0];
const minZoom = 14;
const maxZoom = 19;
const mvtMinZoom = 16;
const mvtMaxZoom = 19;

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

    const terrainProvider = new CesiumTerrainProvider({
      url: terrainURL,
      requestVertexNormals: true
    });

    const viewer: Viewer = new Viewer(cesiumContainer, {
      terrainProvider: terrainProvider
    });

    // @ts-ignore
    viewer._element.style = 'width: 100vw;';

    this._cesiumViewer = viewer;
    this._initMixins();

    this._setupLayers();
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(viewPoint[0], viewPoint[1], viewPoint[2])
    });

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

  _setupLayers() {
    if (!this._cesiumViewer) {
      return;
    }
    // Imagery Provider
    const cesiumImageryLayer = new UrlTemplateImageryProvider({
      url: rasterUrl,
      rectangle: Rectangle.fromDegrees(viewBound[0], viewBound[1], viewBound[2], viewBound[3]),
      minimumLevel: minZoom,
      maximumLevel: maxZoom
    });
    const layers = this._cesiumViewer.scene.imageryLayers;
    const imageryLayer = layers.addImageryProvider(cesiumImageryLayer);
    imageryLayer.alpha = 1.0;

    // MVT Imagery Layer
    const mvtStyle = {
      version: 8,
      sources: {
        contours: {
          type: 'vector',
          tiles: [mvtURL]
        }
      },
      // glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      layers: [
        {
          id: '1',
          type: 'line',
          source: 'contours',
          'source-layer': 'output.kml',
          paint: {
            'line-color': '#854c17'
          }
        },
        {
          id: 'Freight/label/Default',
          type: 'symbol',
          source: 'contours',
          'source-layer': 'output.kml',
          minzoom: 13,
          layout: {
            'symbol-avoid-edges': true,
            'text-font': ['Arial Regular'],
            'text-size': 12,
            // 'text-letter-spacing': 0.05,
            // 'text-max-width': 8,
            // 'text-field': '{Name} m',
            'symbol-placement': 'line',
            'symbol-spacing': 500
          },
          paint: {
            'text-color': '#854c17',
            'text-halo-color': '#eceff1',
            'text-halo-width': 0.5
          }
        }
      ]
    };

    const mvtProvider = new MVTImageryProvider({
      style: mvtStyle as StyleSpecification,
      minimumLevel: mvtMinZoom,
      maximumLevel: mvtMaxZoom
    });
    mvtProvider.rectangle = Rectangle.fromDegrees(
      viewBound[0],
      viewBound[1],
      viewBound[2],
      viewBound[3]
    );
    mvtProvider.readyPromise.then(() => {
      // @ts-ignore
      layers.addImageryProvider(mvtProvider);
    });
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
