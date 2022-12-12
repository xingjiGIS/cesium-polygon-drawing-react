import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { LineDrawingToolProps } from './toolbar.styles';
import AaravContext, { AaravContextType } from '../../AaravContext';

const LineDrawingTool = ({ id, enabled }: LineDrawingToolProps) => {
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
    viewer.lineDrawingTools.activateDrawing();
    // @ts-ignore
    const drawingTool = viewer.lineDrawingTools.lineDrawing;
    // @ts-ignore
    drawingTool.evtVertexCreatedWhileDrawing.addEventListener(() => {
      console.info('VertexCreatedWhileDrawing event triggered!');
    });
    // @ts-ignore
    drawingTool.evtLineCreated.addEventListener(() => {
      console.info('LineCreated event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexModifiedInLine.addEventListener(() => {
      console.info('VertexModifiedInLine event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexAddedInLine.addEventListener(() => {
      console.info('VertexAddedInLine event triggered!');
    });
    // @ts-ignore
    drawingTool.evtVertexDeletedInLine.addEventListener(() => {
      console.info('VertexDeletedInLine event triggered!');
    });
    // @ts-ignore
    drawingTool.evtLineDeleted.addEventListener(() => {
      console.info('LineDeleted event triggered!');
    });
  };

  return (
    <div>
      {aaravViewerCreated && (
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClick()}
        >
          Draw Line
        </button>
      )}
    </div>
  );
};

export default LineDrawingTool;
