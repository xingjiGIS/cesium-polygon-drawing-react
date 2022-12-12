// q@ts-nocheck
/* qeslint-disable */
import React from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import logger from 'loglevel';
import AaravContext, { AaravContextType } from '../AaravContext';
import Toolbar from './toolbar';
import AaravViewerWrapper from './AaravViewerWrapper';

const GUI = () => {
  const { aaravViewer } = React.useContext(AaravContext) as AaravContextType;
  const viewer = aaravViewer.cesiumViewer;

  if (!viewer) {
    logger.error('failed to get viewer in GUI');
    return null;
  }

  const toolbarContainerOption = {
    disp: true
  };

  const polygonDrawingToolOption = {
    enabled: true,
    id: 'aarav-tool-polygon-drawing'
  };

  const lineDrawingToolOption = {
    enabled: true,
    id: 'aarav-tool-line-drawing'
  };

  return (
    <ReactFlowProvider>
      <Toolbar
        toolbarContainerOption={toolbarContainerOption}
        polygonDrawingToolOption={polygonDrawingToolOption}
        lineDrawingToolOption={lineDrawingToolOption}
      />
      <AaravViewerWrapper aaravViewer={aaravViewer} />
    </ReactFlowProvider>
  );
};

export default GUI;
