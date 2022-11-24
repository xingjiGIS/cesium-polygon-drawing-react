/**
 * Event definition for polygon drawing
 */
import { Cartesian3 } from 'cesium';
import logger from 'loglevel';
import DrawingMode from '../core/tools/drawing/DrawingMode';
import { Polygon, Vertex } from '../core/tools/drawing/Polygon';
import { PolygonDrawing } from '../core/tools/drawing/PolygonDrawing';

export const onVertexCreatedWhileDrawing = (
  vertex: Cartesian3[],
  polygon: Polygon[],
  tool: PolygonDrawing[]
) => {
  if (!vertex) {
    logger.error('vertex is not created - 0');
    return;
  }

  if (vertex.length === 0) {
    logger.error('vertex is not created - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (!polygon) {
    logger.error('Polygon is not created - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not created - 1');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  logger.info('Vertex Created : ', vertex);
};

export const onPolygonCreated = (polygon: Polygon[], tool: PolygonDrawing[]) => {
  if (!polygon) {
    logger.error('Polygon is not created - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not created - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  const polycon = polygon[0];
  const toolcon = tool[0];

  logger.info('Polygon Created : ', polycon);

  toolcon.mode = DrawingMode.EditDraw;
  logger.info('Changed Edit Mode');
};

export const onVertexModifiedInPolygon = (
  vertex: Vertex[],
  polygon: Polygon[],
  tool: PolygonDrawing[]
) => {
  if (!vertex) {
    logger.error('vertex is not created - 0');
    return;
  }

  if (vertex.length === 0) {
    logger.error('vertex is not created - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (!polygon) {
    logger.error('Polygon is not created - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not created - 1');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  logger.info('Vertex Modified : ', vertex);
};

export const onVertexAddedInPolygon = (
  vertex: Vertex[],
  polygon: Polygon[],
  tool: PolygonDrawing[]
) => {
  if (!vertex) {
    logger.error('vertex is not created - 0');
    return;
  }

  if (vertex.length === 0) {
    logger.error('vertex is not created - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (!polygon) {
    logger.error('Polygon is not created - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not created - 1');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  logger.info('Vertex Added : ', vertex);
};

export const onVertexDeletedInPolygon = (
  vertex: Vertex[],
  polygon: Polygon[],
  tool: PolygonDrawing[]
) => {
  if (!vertex) {
    logger.error('vertex is not created - 0');
    return;
  }

  if (vertex.length === 0) {
    logger.error('vertex is not created - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (!polygon) {
    logger.error('Polygon is not created - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not created - 1');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  logger.info('Vertex Deleted : ', vertex);
};

export const onPolygonDeleted = (polygon: Polygon[], tool: PolygonDrawing[]) => {
  if (!polygon) {
    logger.error('Polygon is not deleted - 0');
    return;
  }

  if (polygon.length === 0) {
    logger.error('Polygon is not deleted - 1');
    return;
  }

  if (!tool) {
    logger.error('Drawing Tool is not defined - 0');
    return;
  }

  if (tool.length === 0) {
    logger.error('Drawing Tool is not defined - 1');
    return;
  }

  const polycon = polygon[0];

  logger.info('Polygon Deleted : ', polycon);
};
