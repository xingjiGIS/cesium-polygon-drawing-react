import React from 'react';
import logger from 'loglevel';
import { PolygonDrawingToolProps } from './toolbar.styles';
import AaravContext, { AaravContextType } from '../../AaravContext';
import {
  onPolygonCreated,
  onPolygonDeleted,
  onVertexAddedInPolygon,
  onVertexCreatedWhileDrawing,
  onVertexDeletedInPolygon,
  onVertexModifiedInPolygon
} from '../Events';

const PolygonDrawingTool = ({ id, enabled }: PolygonDrawingToolProps) => {
  const { aaravMapViewer } = React.useContext(AaravContext) as AaravContextType;
  const viewer = aaravMapViewer!.viewer;

  // Enable drawing tool
  const onClick = () => {
    if (!viewer) {
      logger.error('AaravMapViewer is being loaded');
      return;
    }
    // @ts-ignore
    viewer.deactivateCurrentMapTool();
    // @ts-ignore
    viewer.drawingTools.activatePolygonDrawing();
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtVertexCreatedWhileDrawing.addEventListener(
      onVertexCreatedWhileDrawing
    );
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtPolygonCreated.addEventListener(onPolygonCreated);
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtVertexModifiedInPolygon.addEventListener(
      onVertexModifiedInPolygon
    );
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtVertexAddedInPolygon.addEventListener(
      onVertexAddedInPolygon
    );
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtVertexDeletedInPolygon.addEventListener(
      onVertexDeletedInPolygon
    );
    // @ts-ignore
    viewer.drawingTools.polygonDrawing._evtPolygonDeleted.addEventListener(onPolygonDeleted);

    // Another Example;
    // viewer.drawingTools.polygonDrawing._evtPolygonDeleted.addEventListener(() => {
    //   console.info('Polygon Deleted');
    // });
  };

  return (
    <button type="button" id={id} disabled={!enabled} onClick={() => onClick()}>
      Draw
    </button>
  );
};

export default PolygonDrawingTool;
