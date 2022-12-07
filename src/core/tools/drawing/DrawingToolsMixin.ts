import { defined, DeveloperError, Viewer } from 'cesium';
import DrawingTools from './DrawingTools';
/**
 * DrawingTools Mixin
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function DrawingToolsMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const drawingTools = new DrawingTools({ viewer });

  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    drawingTools: {
      get: function () {
        return drawingTools;
      },
      configurable: true
    }
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    drawingTools.destroy();
  };
}

export default DrawingToolsMixin;
