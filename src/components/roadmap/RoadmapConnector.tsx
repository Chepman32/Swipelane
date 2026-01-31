import React, { useMemo } from 'react';
import { Path, Skia, DashPathEffect } from '@shopify/react-native-skia';
import type { RoadmapConnectorDefinition, RoadmapCircleDefinition } from '../../types/roadmap';

interface RoadmapConnectorProps {
  connector: RoadmapConnectorDefinition;
  circles: RoadmapCircleDefinition[];
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  dashPattern: number[];
}

const RoadmapConnector: React.FC<RoadmapConnectorProps> = ({
  connector,
  circles,
  width,
  height,
  strokeColor,
  strokeWidth,
  dashPattern,
}) => {
  const path = useMemo(() => {
    const fromCircle = circles.find(c => c.id === connector.from);
    const toCircle = circles.find(c => c.id === connector.to);

    if (!fromCircle || !toCircle) {
      return null;
    }

    // Convert normalized positions to actual pixels
    const startX = fromCircle.position.x * width;
    const startY = fromCircle.position.y * height;
    const endX = toCircle.position.x * width;
    const endY = toCircle.position.y * height;

    // Offset start/end points to edge of circles
    const fromRadius = fromCircle.radius * Math.min(width, height);
    const toRadius = toCircle.radius * Math.min(width, height);

    // Calculate angle from start to first control point (or end if no control points)
    const cp1 = connector.controlPoints[0];
    const dirX1 = cp1 ? cp1.x * width - startX : endX - startX;
    const dirY1 = cp1 ? cp1.y * height - startY : endY - startY;
    const len1 = Math.sqrt(dirX1 * dirX1 + dirY1 * dirY1);
    const offsetStartX = startX + (dirX1 / len1) * fromRadius;
    const offsetStartY = startY + (dirY1 / len1) * fromRadius;

    // Calculate angle from last control point (or start) to end
    const cpLast = connector.controlPoints[connector.controlPoints.length - 1];
    const dirX2 = endX - (cpLast ? cpLast.x * width : startX);
    const dirY2 = endY - (cpLast ? cpLast.y * height : startY);
    const len2 = Math.sqrt(dirX2 * dirX2 + dirY2 * dirY2);
    const offsetEndX = endX - (dirX2 / len2) * toRadius;
    const offsetEndY = endY - (dirY2 / len2) * toRadius;

    const skPath = Skia.Path.Make();
    skPath.moveTo(offsetStartX, offsetStartY);

    if (connector.controlPoints.length === 2) {
      // Cubic bezier curve
      const cp1x = connector.controlPoints[0].x * width;
      const cp1y = connector.controlPoints[0].y * height;
      const cp2x = connector.controlPoints[1].x * width;
      const cp2y = connector.controlPoints[1].y * height;
      skPath.cubicTo(cp1x, cp1y, cp2x, cp2y, offsetEndX, offsetEndY);
    } else if (connector.controlPoints.length === 1) {
      // Quadratic bezier curve
      const cpx = connector.controlPoints[0].x * width;
      const cpy = connector.controlPoints[0].y * height;
      skPath.quadTo(cpx, cpy, offsetEndX, offsetEndY);
    } else {
      // Straight line
      skPath.lineTo(offsetEndX, offsetEndY);
    }

    return skPath;
  }, [connector, circles, width, height]);

  if (!path) {
    return null;
  }

  return (
    <Path
      path={path}
      color={strokeColor}
      style="stroke"
      strokeWidth={strokeWidth}
      strokeCap="round"
    >
      <DashPathEffect intervals={dashPattern} />
    </Path>
  );
};

export default RoadmapConnector;
