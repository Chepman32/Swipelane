import React from 'react';
import { Circle, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import {
  PROCESS_CARD_VARIANT_COUNT,
  type ProcessCardBaseIconKind,
  type ProcessCardIconKind,
} from '../../constants/processCardIcons';

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
  filled?: boolean;
}

const resolveIconVariant = (
  icon: ProcessCardIconKind
): { baseIcon: ProcessCardBaseIconKind; variantIndex: number } => {
  const match = icon.match(/^(.*?)(?:_(\d+))?$/);
  const base = (match?.[1] || icon) as ProcessCardBaseIconKind;
  const variantIndexRaw = Number(match?.[2] || '1');
  const variantIndex = Number.isFinite(variantIndexRaw)
    ? Math.max(1, Math.min(PROCESS_CARD_VARIANT_COUNT, variantIndexRaw))
    : 1;
  return { baseIcon: base, variantIndex };
};

const ICON_BASE_ORDER: ProcessCardBaseIconKind[] = [
  'research',
  'plan',
  'idea',
  'prototype',
  'user',
  'feedback',
  'finalize',
  'deploy',
  'review',
];

const resolveVariantBaseIcon = (
  baseIcon: ProcessCardBaseIconKind,
  variantIndex: number,
): ProcessCardBaseIconKind => {
  const currentIndex = ICON_BASE_ORDER.indexOf(baseIcon);
  if (currentIndex < 0) return baseIcon;
  if (variantIndex <= 1) return baseIcon;
  return ICON_BASE_ORDER[(currentIndex + variantIndex - 1) % ICON_BASE_ORDER.length];
};

const ProcessCardIconGlyph: React.FC<ProcessCardIconGlyphProps> = ({
  icon,
  cx,
  cy,
  radius,
  color,
  strokeWidth,
  filled = false,
}) => {
  const { baseIcon, variantIndex } = resolveIconVariant(icon);
  const variantBaseIcon = resolveVariantBaseIcon(baseIcon, variantIndex);
  const overlayVariantIndex = ((variantIndex - 1) % 7) + 1;
  const styleFamilyIndex = Math.floor((variantIndex - 1) / 7);
  const drawStyle = filled ? 'fill' as const : 'stroke' as const;
  const lineColor = color;
  const s = radius;
  const variantStrokeWidth = strokeWidth * (0.92 + overlayVariantIndex * 0.05 + styleFamilyIndex * 0.04);
  const tinyStroke = Math.max(1, variantStrokeWidth * 0.85);
  const accentStroke = Math.max(1.2, variantStrokeWidth * 0.9);

  const variantOverlay = (() => {
    if (overlayVariantIndex === 1) return null;
    if (overlayVariantIndex === 2) {
      return (
        <Group>
          <Circle cx={cx} cy={cy - s * 0.62} r={s * 0.1} color={lineColor} />
          <Circle cx={cx + s * 0.54} cy={cy - s * 0.44} r={s * 0.08} color={lineColor} />
        </Group>
      );
    }
    if (overlayVariantIndex === 3) {
      const topLine = makeLinePath([
        { x: cx - s * 0.34, y: cy - s * 0.64 },
        { x: cx + s * 0.34, y: cy - s * 0.64 },
      ]);
      const bottomLine = makeLinePath([
        { x: cx - s * 0.36, y: cy + s * 0.6 },
        { x: cx + s * 0.36, y: cy + s * 0.6 },
      ]);
      return (
        <Group>
          <Path path={topLine} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
          <Path path={bottomLine} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
        </Group>
      );
    }
    if (overlayVariantIndex === 4) {
      const link = makeLinePath([
        { x: cx - s * 0.52, y: cy },
        { x: cx + s * 0.52, y: cy },
      ]);
      return (
        <Group>
          <Path path={link} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
          <Circle cx={cx - s * 0.54} cy={cy} r={s * 0.08} color={lineColor} />
          <Circle cx={cx + s * 0.54} cy={cy} r={s * 0.08} color={lineColor} />
        </Group>
      );
    }
    if (overlayVariantIndex === 5) {
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
          <Path path={crossVertical} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
          <Path path={crossHorizontal} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
        </Group>
      );
    }
    if (overlayVariantIndex === 6) {
      const ring = makeLinePath([
        { x: cx + s * 0.36, y: cy - s * 0.50 },
        { x: cx + s * 0.58, y: cy - s * 0.34 },
      ]);
      return (
        <Group>
          <Circle
            cx={cx + s * 0.5}
            cy={cy - s * 0.5}
            r={s * 0.12}
            color={lineColor}
            style={drawStyle}
            strokeWidth={accentStroke}
          />
          <Path path={ring} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
        </Group>
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
        <Path path={topLine} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
        <Path path={bottomLine} color={lineColor} style={drawStyle} strokeWidth={accentStroke} />
      </Group>
    );
  })();

  const decorate = (glyph: React.ReactNode) => (
    <Group>
      {glyph}
      {variantOverlay}
    </Group>
  );

  if (variantBaseIcon === 'research') {
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
          style={drawStyle}
          strokeWidth={variantStrokeWidth}
        />
        <Path path={clipTopLine} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Circle cx={cx + s * 0.1} cy={cy + s * 0.02} r={s * 0.3} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={handle} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (variantBaseIcon === 'plan') {
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
          style={drawStyle}
          strokeWidth={variantStrokeWidth}
        />
        <Path path={fold} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={line1} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={line2} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (variantBaseIcon === 'idea') {
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
        <Circle cx={cx} cy={cy - s * 0.03} r={s * 0.33} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={base1} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={base2} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={rayTop} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={rayLeft} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={rayRight} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (variantBaseIcon === 'prototype') {
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
          style={drawStyle}
          strokeWidth={tinyStroke}
        />
        <RoundedRect
          x={cx - s * 0.16}
          y={cy - s * 0.34}
          width={s * 0.48}
          height={s * 0.62}
          r={s * 0.07}
          color={lineColor}
          style={drawStyle}
          strokeWidth={variantStrokeWidth}
        />
        <Path path={line1} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={line2} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Circle cx={gearCenterX} cy={gearCenterY} r={gearOuter} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Circle cx={gearCenterX} cy={gearCenterY} r={gearOuter * 0.45} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (variantBaseIcon === 'user') {
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
        <Path path={shoulders} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={cross1} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={cross2} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
      </Group>
    );
  }

  if (variantBaseIcon === 'feedback') {
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
        <Path path={topArc} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={topArrow} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={bottomArc} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Path path={bottomArrow} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (variantBaseIcon === 'finalize') {
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
          style={drawStyle}
          strokeWidth={variantStrokeWidth}
        />
        <Path path={clip} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={check} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
      </Group>
    );
  }

  if (variantBaseIcon === 'deploy') {
    const body = Skia.Path.Make();
    body.moveTo(cx, cy - s * 0.48);
    body.cubicTo(cx + s * 0.14, cy - s * 0.48, cx + s * 0.24, cy - s * 0.3, cx + s * 0.24, cy - s * 0.06);
    body.lineTo(cx + s * 0.24, cy + s * 0.18);
    body.lineTo(cx - s * 0.24, cy + s * 0.18);
    body.lineTo(cx - s * 0.24, cy - s * 0.06);
    body.cubicTo(cx - s * 0.24, cy - s * 0.3, cx - s * 0.14, cy - s * 0.48, cx, cy - s * 0.48);
    body.close();
    const leftFin = Skia.Path.Make();
    leftFin.moveTo(cx - s * 0.24, cy + s * 0.06);
    leftFin.lineTo(cx - s * 0.42, cy + s * 0.32);
    leftFin.lineTo(cx - s * 0.24, cy + s * 0.18);
    leftFin.close();
    const rightFin = Skia.Path.Make();
    rightFin.moveTo(cx + s * 0.24, cy + s * 0.06);
    rightFin.lineTo(cx + s * 0.42, cy + s * 0.32);
    rightFin.lineTo(cx + s * 0.24, cy + s * 0.18);
    rightFin.close();
    const flame = Skia.Path.Make();
    flame.moveTo(cx - s * 0.14, cy + s * 0.18);
    flame.quadTo(cx - s * 0.08, cy + s * 0.34, cx, cy + s * 0.48);
    flame.quadTo(cx + s * 0.08, cy + s * 0.34, cx + s * 0.14, cy + s * 0.18);
    return decorate(
      <Group>
        <Path path={body} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
        <Circle cx={cx} cy={cy - s * 0.18} r={s * 0.1} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={leftFin} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={rightFin} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
        <Path path={flame} color={lineColor} style={drawStyle} strokeWidth={tinyStroke} />
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
      <Path path={arrow} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
      <Path path={arrowHead} color={lineColor} style={drawStyle} strokeWidth={variantStrokeWidth} />
    </Group>
  );
};

export default ProcessCardIconGlyph;
