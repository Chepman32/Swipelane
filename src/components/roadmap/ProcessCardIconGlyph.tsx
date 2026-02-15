import React from 'react';
import { Circle, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import type { ProcessCardBaseIconKind, ProcessCardIconKind } from '../../constants/processCardIcons';

const makeLinePath = (points: Array<{ x: number; y: number }>) => {
  const path = Skia.Path.Make();
  if (!points.length) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    path.lineTo(points[index].x, points[index].y);
  }
  return path;
};

interface ProcessCardIconGlyphProps {
  icon: ProcessCardIconKind;
  cx: number;
  cy: number;
  radius: number;
  color: string;
  strokeWidth: number;
}

const resolveIconVariant = (
  icon: ProcessCardIconKind
): { baseIcon: ProcessCardBaseIconKind; variantIndex: number } => {
  const match = icon.match(/^(.*?)(?:_(\d+))?$/);
  const base = (match?.[1] || icon) as ProcessCardBaseIconKind;
  const variantIndexRaw = Number(match?.[2] || '1');
  const variantIndex = Number.isFinite(variantIndexRaw)
    ? Math.max(1, Math.min(7, variantIndexRaw))
    : 1;
  return { baseIcon: base, variantIndex };
};

const ProcessCardIconGlyph: React.FC<ProcessCardIconGlyphProps> = ({
  icon,
  cx,
  cy,
  radius,
  color,
  strokeWidth,
}) => {
  const { baseIcon, variantIndex } = resolveIconVariant(icon);
  const lineColor = color;
  const s = radius;
  const variantStrokeWidth = strokeWidth * (0.88 + variantIndex * 0.06);
  const tinyStroke = Math.max(1, variantStrokeWidth * 0.85);
  const accentStroke = Math.max(1, variantStrokeWidth * 0.85);

  const variantOverlay = (() => {
    if (variantIndex === 1) return null;
    if (variantIndex === 2) {
      return <Circle cx={cx} cy={cy - s * 0.62} r={s * 0.09} color={lineColor} />;
    }
    if (variantIndex === 3) {
      const bottomLine = makeLinePath([
        { x: cx - s * 0.38, y: cy + s * 0.58 },
        { x: cx + s * 0.38, y: cy + s * 0.58 },
      ]);
      return <Path path={bottomLine} color={lineColor} style="stroke" strokeWidth={accentStroke} />;
    }
    if (variantIndex === 4) {
      return (
        <Group>
          <Circle cx={cx - s * 0.58} cy={cy} r={s * 0.08} color={lineColor} />
          <Circle cx={cx + s * 0.58} cy={cy} r={s * 0.08} color={lineColor} />
        </Group>
      );
    }
    if (variantIndex === 5) {
      const crossVertical = makeLinePath([
        { x: cx, y: cy - s * 0.66 },
        { x: cx, y: cy - s * 0.46 },
      ]);
      const crossHorizontal = makeLinePath([
        { x: cx - s * 0.1, y: cy - s * 0.56 },
        { x: cx + s * 0.1, y: cy - s * 0.56 },
      ]);
      return (
        <Group>
          <Path path={crossVertical} color={lineColor} style="stroke" strokeWidth={accentStroke} />
          <Path path={crossHorizontal} color={lineColor} style="stroke" strokeWidth={accentStroke} />
        </Group>
      );
    }
    if (variantIndex === 6) {
      return (
        <Circle
          cx={cx + s * 0.5}
          cy={cy - s * 0.5}
          r={s * 0.12}
          color={lineColor}
          style="stroke"
          strokeWidth={accentStroke}
        />
      );
    }
    const topLine = makeLinePath([
      { x: cx - s * 0.24, y: cy - s * 0.66 },
      { x: cx + s * 0.24, y: cy - s * 0.66 },
    ]);
    const bottomLine = makeLinePath([
      { x: cx - s * 0.24, y: cy + s * 0.66 },
      { x: cx + s * 0.24, y: cy + s * 0.66 },
    ]);
    return (
      <Group>
        <Path path={topLine} color={lineColor} style="stroke" strokeWidth={accentStroke} />
        <Path path={bottomLine} color={lineColor} style="stroke" strokeWidth={accentStroke} />
      </Group>
    );
  })();

  const decorate = (glyph: React.ReactNode) => (
    <Group>
      {glyph}
      {variantOverlay}
    </Group>
  );

  if (baseIcon === 'research') {
    const clipTopLine = makeLinePath([
      { x: cx - s * 0.25, y: cy - s * 0.34 },
      { x: cx + s * 0.02, y: cy - s * 0.34 },
    ]);
    const handle = makeLinePath([
      { x: cx + s * 0.22, y: cy + s * 0.18 },
      { x: cx + s * 0.42, y: cy + s * 0.38 },
    ]);
    return decorate(
      <Group>
        <RoundedRect
          x={cx - s * 0.45}
          y={cy - s * 0.38}
          width={s * 0.58}
          height={s * 0.72}
          r={s * 0.08}
          color={lineColor}
          style="stroke"
          strokeWidth={variantStrokeWidth}
        />
        <Path path={clipTopLine} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Circle cx={cx + s * 0.1} cy={cy + s * 0.02} r={s * 0.3} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={handle} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (baseIcon === 'plan') {
    const fold = makeLinePath([
      { x: cx + s * 0.15, y: cy - s * 0.37 },
      { x: cx + s * 0.3, y: cy - s * 0.22 },
      { x: cx + s * 0.14, y: cy - s * 0.22 },
    ]);
    const line1 = makeLinePath([
      { x: cx - s * 0.2, y: cy - s * 0.03 },
      { x: cx + s * 0.22, y: cy - s * 0.03 },
    ]);
    const line2 = makeLinePath([
      { x: cx - s * 0.2, y: cy + s * 0.12 },
      { x: cx + s * 0.14, y: cy + s * 0.12 },
    ]);
    return decorate(
      <Group>
        <RoundedRect
          x={cx - s * 0.3}
          y={cy - s * 0.38}
          width={s * 0.6}
          height={s * 0.76}
          r={s * 0.09}
          color={lineColor}
          style="stroke"
          strokeWidth={variantStrokeWidth}
        />
        <Path path={fold} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={line1} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={line2} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (baseIcon === 'idea') {
    const base1 = makeLinePath([
      { x: cx - s * 0.15, y: cy + s * 0.28 },
      { x: cx + s * 0.15, y: cy + s * 0.28 },
    ]);
    const base2 = makeLinePath([
      { x: cx - s * 0.11, y: cy + s * 0.38 },
      { x: cx + s * 0.11, y: cy + s * 0.38 },
    ]);
    const rayTop = makeLinePath([
      { x: cx, y: cy - s * 0.62 },
      { x: cx, y: cy - s * 0.47 },
    ]);
    const rayLeft = makeLinePath([
      { x: cx - s * 0.5, y: cy - s * 0.08 },
      { x: cx - s * 0.36, y: cy - s * 0.03 },
    ]);
    const rayRight = makeLinePath([
      { x: cx + s * 0.36, y: cy - s * 0.03 },
      { x: cx + s * 0.5, y: cy - s * 0.08 },
    ]);
    return decorate(
      <Group>
        <Circle cx={cx} cy={cy - s * 0.03} r={s * 0.33} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={base1} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={base2} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={rayTop} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={rayLeft} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={rayRight} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (baseIcon === 'prototype') {
    const gearOuter = s * 0.14;
    const gearCenterX = cx + s * 0.23;
    const gearCenterY = cy + s * 0.23;
    const line1 = makeLinePath([
      { x: cx - s * 0.02, y: cy - s * 0.1 },
      { x: cx + s * 0.2, y: cy - s * 0.1 },
    ]);
    const line2 = makeLinePath([
      { x: cx - s * 0.02, y: cy + s * 0.02 },
      { x: cx + s * 0.16, y: cy + s * 0.02 },
    ]);
    return decorate(
      <Group>
        <RoundedRect
          x={cx - s * 0.4}
          y={cy - s * 0.22}
          width={s * 0.48}
          height={s * 0.62}
          r={s * 0.07}
          color={lineColor}
          style="stroke"
          strokeWidth={tinyStroke}
        />
        <RoundedRect
          x={cx - s * 0.16}
          y={cy - s * 0.34}
          width={s * 0.48}
          height={s * 0.62}
          r={s * 0.07}
          color={lineColor}
          style="stroke"
          strokeWidth={variantStrokeWidth}
        />
        <Path path={line1} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={line2} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Circle cx={gearCenterX} cy={gearCenterY} r={gearOuter} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Circle cx={gearCenterX} cy={gearCenterY} r={gearOuter * 0.45} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (baseIcon === 'user') {
    const shoulders = makeLinePath([
      { x: cx - s * 0.3, y: cy + s * 0.3 },
      { x: cx + s * 0.3, y: cy + s * 0.3 },
    ]);
    const cross1 = makeLinePath([
      { x: cx + s * 0.24, y: cy + s * 0.1 },
      { x: cx + s * 0.38, y: cy + s * 0.24 },
    ]);
    const cross2 = makeLinePath([
      { x: cx + s * 0.38, y: cy + s * 0.1 },
      { x: cx + s * 0.24, y: cy + s * 0.24 },
    ]);
    return decorate(
      <Group>
        <Circle cx={cx} cy={cy - s * 0.06} r={s * 0.2} color={lineColor} />
        <RoundedRect
          x={cx - s * 0.31}
          y={cy + s * 0.12}
          width={s * 0.62}
          height={s * 0.24}
          r={s * 0.12}
          color={lineColor}
        />
        <Path path={shoulders} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={cross1} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={cross2} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (baseIcon === 'feedback') {
    const topArc = Skia.Path.Make();
    topArc.moveTo(cx - s * 0.42, cy - s * 0.08);
    topArc.quadTo(cx, cy - s * 0.54, cx + s * 0.4, cy - s * 0.08);
    const topArrow = makeLinePath([
      { x: cx + s * 0.3, y: cy - s * 0.2 },
      { x: cx + s * 0.42, y: cy - s * 0.08 },
      { x: cx + s * 0.28, y: cy - s * 0.02 },
    ]);
    const bottomArc = Skia.Path.Make();
    bottomArc.moveTo(cx + s * 0.42, cy + s * 0.08);
    bottomArc.quadTo(cx, cy + s * 0.54, cx - s * 0.4, cy + s * 0.08);
    const bottomArrow = makeLinePath([
      { x: cx - s * 0.3, y: cy + s * 0.2 },
      { x: cx - s * 0.42, y: cy + s * 0.08 },
      { x: cx - s * 0.28, y: cy + s * 0.02 },
    ]);
    return decorate(
      <Group>
        <Path path={topArc} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={topArrow} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={bottomArc} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Path path={bottomArrow} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (baseIcon === 'finalize') {
    const clip = makeLinePath([
      { x: cx - s * 0.12, y: cy - s * 0.35 },
      { x: cx + s * 0.12, y: cy - s * 0.35 },
    ]);
    const check = makeLinePath([
      { x: cx - s * 0.18, y: cy + s * 0.04 },
      { x: cx - s * 0.04, y: cy + s * 0.18 },
      { x: cx + s * 0.2, y: cy - s * 0.08 },
    ]);
    return decorate(
      <Group>
        <RoundedRect
          x={cx - s * 0.3}
          y={cy - s * 0.4}
          width={s * 0.6}
          height={s * 0.8}
          r={s * 0.09}
          color={lineColor}
          style="stroke"
          strokeWidth={variantStrokeWidth}
        />
        <Path path={clip} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={check} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (baseIcon === 'deploy') {
    const body = Skia.Path.Make();
    body.moveTo(cx - s * 0.08, cy + s * 0.35);
    body.quadTo(cx - s * 0.3, cy + s * 0.05, cx - s * 0.14, cy - s * 0.28);
    body.quadTo(cx + s * 0.02, cy - s * 0.52, cx + s * 0.22, cy - s * 0.26);
    body.quadTo(cx + s * 0.36, cy - s * 0.02, cx + s * 0.16, cy + s * 0.28);
    body.close();
    const fin = makeLinePath([
      { x: cx - s * 0.08, y: cy + s * 0.35 },
      { x: cx - s * 0.28, y: cy + s * 0.42 },
      { x: cx - s * 0.1, y: cy + s * 0.16 },
    ]);
    const flame = makeLinePath([
      { x: cx - s * 0.19, y: cy + s * 0.38 },
      { x: cx - s * 0.27, y: cy + s * 0.56 },
      { x: cx - s * 0.1, y: cy + s * 0.48 },
    ]);
    return decorate(
      <Group>
        <Path path={body} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
        <Circle cx={cx + s * 0.05} cy={cy - s * 0.16} r={s * 0.09} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={fin} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
        <Path path={flame} color={lineColor} style="stroke" strokeWidth={tinyStroke} />
      </Group>
    );
  }

  const arrow = makeLinePath([
    { x: cx - s * 0.38, y: cy + s * 0.2 },
    { x: cx - s * 0.08, y: cy - s * 0.02 },
    { x: cx + s * 0.1, y: cy - s * 0.2 },
    { x: cx + s * 0.34, y: cy - s * 0.35 },
  ]);
  const arrowHead = makeLinePath([
    { x: cx + s * 0.24, y: cy - s * 0.35 },
    { x: cx + s * 0.34, y: cy - s * 0.35 },
    { x: cx + s * 0.32, y: cy - s * 0.24 },
  ]);
  return decorate(
    <Group>
      <RoundedRect x={cx - s * 0.38} y={cy + s * 0.14} width={s * 0.1} height={s * 0.24} r={s * 0.03} color={lineColor} />
      <RoundedRect x={cx - s * 0.2} y={cy + s * 0.02} width={s * 0.1} height={s * 0.36} r={s * 0.03} color={lineColor} />
      <RoundedRect x={cx - s * 0.02} y={cy - s * 0.14} width={s * 0.1} height={s * 0.5} r={s * 0.03} color={lineColor} />
      <Path path={arrow} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
      <Path path={arrowHead} color={lineColor} style="stroke" strokeWidth={variantStrokeWidth} />
    </Group>
  );
};

export default ProcessCardIconGlyph;
