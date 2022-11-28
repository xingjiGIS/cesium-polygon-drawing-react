import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { PolygonDrawingToolProps } from './toolbar.styles';
import AaravContext, { AaravContextType } from '../../AaravContext';

const PolygonDrawingTool = ({ id, enabled }: PolygonDrawingToolProps) => {
  const { aaravViewer } = React.useContext(AaravContext) as AaravContextType;
  const viewer = aaravViewer.cesiumViewer;
  const [aaravViewerCreated, setAaravViewerCreated] = useState(viewer !== undefined);

  useEffect(() => {
    // Event
    const onAaravViewerCreated = () => {
      if (!aaravViewerCreated) {
        setAaravViewerCreated(true);
      }
    };

    aaravViewer.evtAaravViewerCreated.addEventListener(onAaravViewerCreated);

    return function () {
      aaravViewer.evtAaravViewerCreated.removeEventListener(onAaravViewerCreated);
    };
  }, []);
  // Enable drawing tool
  const onClick = () => {
    if (!viewer) {
      logger.error('Viewer is being loaded');
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
    <div>
      {aaravViewerCreated && (
        <button type="button" id={id} disabled={!enabled} onClick={() => onClick()}>
          Draw
        </button>
      )}
    </div>
  );
};

export default PolygonDrawingTool;
