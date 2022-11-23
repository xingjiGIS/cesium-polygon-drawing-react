import React from 'react';
import logger from 'loglevel';
import { PolygonDrawingToolProps } from './toolbar.styles';
import AaravContext, { AaravContextType } from '../../AaravContext';

const PolygonDrawingTool = ({ id, enabled }: PolygonDrawingToolProps) => {
  const { aaravMapViewer } = React.useContext(AaravContext) as AaravContextType;
  const viewer = aaravMapViewer.viewer;
  
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
  };

  return (
    <button type="button" id={id} disabled={!enabled} onClick={() => onClick()}>
      Draw
    </button>
  );
};

export default PolygonDrawingTool;
