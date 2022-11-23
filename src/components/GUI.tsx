// q@ts-nocheck
/* qeslint-disable */
import React from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import logger from 'loglevel';
import AaravContext, { AaravContextType } from '../AaravContext';
import Toolbar from './toolbar';
import AaravViewerWrapper from './AaravViewerWrapper';

const GUI = () => {
  const { aaravMapViewer, aaravMainViewer } = React.useContext(AaravContext) as AaravContextType;

  if (!aaravMapViewer) {
    logger.error('failed to get aaravMapViewer in GUI');
    return null;
  }

  const toolbarContainerOption = {
    disp: true
  };

  const polygonDrawingToolOption = {
    enabled: true,
    id: 'aarav-tool-polygon-drawing'
  };

  return (
    <ReactFlowProvider>
      <Toolbar
        toolbarContainerOption={toolbarContainerOption}
        polygonDrawingToolOption={polygonDrawingToolOption}
      />
      <AaravViewerWrapper aaravMainViewer={aaravMainViewer} />
    </ReactFlowProvider>
  );
};

export default GUI;
