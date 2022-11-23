import React from 'react';
import PolygonDrawingTool from './PolygonDrawingTool';
import { ToolbarProps, ToolbarContainer } from './toolbar.styles';

const Toolbar = ({ toolbarContainerOption, polygonDrawingToolOption }: ToolbarProps) => (
  <ToolbarContainer disp={toolbarContainerOption.disp}>
    <PolygonDrawingTool
      id={polygonDrawingToolOption!.id}
      enabled={polygonDrawingToolOption!.enabled}
    />
  </ToolbarContainer>
);

export default Toolbar;
