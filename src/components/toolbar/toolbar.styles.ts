import styled from 'styled-components';

export interface PolygonDrawingToolProps {
  id: string;
  enabled: boolean;
}

export interface ToolbarProps {
  toolbarContainerOption: ToolbarContainerProps;
  polygonDrawingToolOption: PolygonDrawingToolProps | undefined;
}

export interface ToolbarContainerProps {
  disp: boolean;
}

export const ToolbarContainer = styled.div<ToolbarContainerProps>`
  display: ${(props: ToolbarContainerProps) => (props.disp ? 'block' : 'none')};
  width: 250px;
  height: 100px;
  padding: 10px 20px;
  box-sizing: border-box;
  position: absolute;
  top: 60px;
  left: 20px;
  z-index: 100;
  background-color: #707070aa;
  border-radius: 5px;
`;
