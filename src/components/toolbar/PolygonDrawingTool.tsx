import React from 'react';
import logger from 'loglevel';
import { PolygonDrawingToolProps } from './toolbar.styles';
import AaravContext, { AaravContextType } from '../../AaravContext';

const PolygonDrawingTool = ({ id, enabled }: PolygonDrawingToolProps) => {
  const { aaravMapViewer } = React.useContext(AaravContext) as AaravContextType;
  const viewer = aaravMapViewer;

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
    const drawingTool = viewer.drawingTools.polygonDrawing;
    // @ts-ignore
    drawingTool.evtVertexCreatedWhileDrawing.addEventListener(() => {
      console.info('VertexCreatedWhileDrawing event triggered!');
    });
    // @ts-ignore
    drawingTool.evtPolygonCreated.addEventListener(() => {
      console.info('PolygonCreated event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexModifiedInPolygon.addEventListener(() => {
      console.info('VertexModifiedInPolygon event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexAddedInPolygon.addEventListener(() => {
      console.info('VertexAddedInPolygon event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexDeletedInPolygon.addEventListener(() => {
      console.info('VertexDeletedInPolygon event triggered!');
    });
    // @ts-ignore
    drawingTool.evtPolygonDeleted.addEventListener(() => {
      console.info('PolygonDeleted event triggered!');
    });
  };

  return (
    <button type="button" id={id} disabled={!enabled} onClick={() => onClick()}>
      Draw
    </button>
  );
};

export default PolygonDrawingTool;
