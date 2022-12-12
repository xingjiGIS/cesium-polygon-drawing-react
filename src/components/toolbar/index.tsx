import React from 'react';
import PolygonDrawingTool from './PolygonDrawingTool';
import LineDrawingTool from './LineDrawingTool';
import { ToolbarProps, ToolbarContainer } from './toolbar.styles';

const Toolbar = ({
  toolbarContainerOption,
  polygonDrawingToolOption,
  lineDrawingToolOption
}: ToolbarProps) => (
  <ToolbarContainer disp={toolbarContainerOption.disp}>
    <PolygonDrawingTool
      id={polygonDrawingToolOption!.id}
      enabled={polygonDrawingToolOption!.enabled}
    />
    <LineDrawingTool id={lineDrawingToolOption!.id} enabled={lineDrawingToolOption!.enabled} />
  </ToolbarContainer>
);

export default Toolbar;
