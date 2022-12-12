import { defined, DeveloperError, Viewer } from 'cesium';
import PolygonDrawingTools from './polygon/DrawingTools';
import LineDrawingTools from './line/DrawingTools';
/**
 * DrawingTools Mixin
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function DrawingToolsMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const polygonDrawingTools = new PolygonDrawingTools({ viewer });
  const lineDrawingTools = new LineDrawingTools({ viewer });
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    lineDrawingTools: {
      get: function () {
        return lineDrawingTools;
      },
      configurable: true
    },
    polygonDrawingTools: {
      get: function () {
        return polygonDrawingTools;
      },
      configurable: true
    }
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    lineDrawingTools.destroy();
    polygonDrawingTools.destroy();
  };
}

export default DrawingToolsMixin;
