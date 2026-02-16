import React, { useCallback, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  Text as SkiaText,
  useFont,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import type { RoadmapCircleDefinition, RoadmapSlide } from '../../types/roadmap';
import { getRoadmapTemplateById, ROADMAP_BACKGROUNDS } from '../../constants/roadmapTemplates';
import {
  getRoadmapImageBackedTemplateConfig,
  type RoadmapImageTextAnchorConfig,
  type RoadmapImageTextFont,
} from '../../constants/roadmapTemplateAssets';
import {
  PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID,
  type ProcessCardIconKind,
} from '../../constants/processCardIcons';
import RoadmapCircle from './RoadmapCircle';
import RoadmapConnector from './RoadmapConnector';
import ProcessCardIconGlyph from './ProcessCardIconGlyph';

type Size = { width: number; height: number };
type RectFrame = { x: number; y: number; width: number; height: number };
type FontMeasurer = { measureText: (text: string) => { width: number } };
type BubbleTimelineNode = { cx: number; cy: number; r: number };
type BubbleTimelineLayout = {
  splitY: number;
  nodes: BubbleTimelineNode[];
};
type SafeRoundedRectInput = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};
type ProcessCardLayout = {
  circleId: string;
  isBlue: boolean;
  icon: ProcessCardIconKind;
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  iconCx: number;
  iconCy: number;
  iconRadius: number;
};
type ProcessCardLayoutInput = {
  circleId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlue: boolean;
  icon: ProcessCardIconKind;
};

type RgbColor = { r: number; g: number; b: number };

const PROCESS_CARDS_LAYOUT_INPUT: ProcessCardLayoutInput[] = [
  { circleId: 'c1', x: 0.06, y: 0.105, width: 0.41, height: 0.128, isBlue: true, icon: 'research' },
  { circleId: 'c2', x: 0.53, y: 0.105, width: 0.41, height: 0.128, isBlue: false, icon: 'plan' },
  { circleId: 'c3', x: 0.06, y: 0.273, width: 0.41, height: 0.128, isBlue: false, icon: 'idea' },
  { circleId: 'c4', x: 0.53, y: 0.273, width: 0.41, height: 0.128, isBlue: true, icon: 'prototype' },
  { circleId: 'c5', x: 0.06, y: 0.441, width: 0.41, height: 0.128, isBlue: true, icon: 'user' },
  { circleId: 'c6', x: 0.53, y: 0.441, width: 0.41, height: 0.128, isBlue: false, icon: 'feedback' },
  { circleId: 'c7', x: 0.06, y: 0.609, width: 0.41, height: 0.128, isBlue: false, icon: 'finalize' },
  { circleId: 'c8', x: 0.53, y: 0.609, width: 0.41, height: 0.128, isBlue: true, icon: 'idea' },
  { circleId: 'c9', x: 0.06, y: 0.777, width: 0.41, height: 0.128, isBlue: true, icon: 'deploy' },
  { circleId: 'c10', x: 0.53, y: 0.777, width: 0.41, height: 0.128, isBlue: false, icon: 'review' },
];

type SpineTimelineStepLayoutInput = {
  circleId: string;
  markerY: number;
  iconX: number;
  iconY: number;
  defaultIcon: ProcessCardIconKind;
  defaultIconColor: string;
  labelAnchor: RoadmapImageTextAnchorConfig;
  detailAnchor: RoadmapImageTextAnchorConfig;
};

const SPINE_TIMELINE_LAYOUT_INPUT: SpineTimelineStepLayoutInput[] = [
  {
    circleId: 'c1',
    markerY: 0.13,
    iconX: 0.73,
    iconY: 0.148,
    defaultIcon: 'idea',
    defaultIconColor: '#00BCD4',
    labelAnchor: { x: 0.12, y: 0.16, maxWidth: 0.34, align: 'left', font: 'titleLarge' },
    detailAnchor: {
      x: 0.12,
      y: 0.205,
      maxWidth: 0.34,
      align: 'left',
      font: 'body',
      lineHeightMultiplier: 1.16,
      maxLines: 4,
    },
  },
  {
    circleId: 'c2',
    markerY: 0.30,
    iconX: 0.27,
    iconY: 0.328,
    defaultIcon: 'plan',
    defaultIconColor: '#009688',
    labelAnchor: { x: 0.57, y: 0.34, maxWidth: 0.34, align: 'left', font: 'titleLarge' },
    detailAnchor: {
      x: 0.57,
      y: 0.385,
      maxWidth: 0.34,
      align: 'left',
      font: 'body',
      lineHeightMultiplier: 1.16,
      maxLines: 4,
    },
  },
  {
    circleId: 'c3',
    markerY: 0.47,
    iconX: 0.27,
    iconY: 0.508,
    defaultIcon: 'prototype',
    defaultIconColor: '#E59A00',
    labelAnchor: { x: 0.57, y: 0.52, maxWidth: 0.34, align: 'left', font: 'titleLarge' },
    detailAnchor: {
      x: 0.57,
      y: 0.565,
      maxWidth: 0.34,
      align: 'left',
      font: 'body',
      lineHeightMultiplier: 1.16,
      maxLines: 4,
    },
  },
  {
    circleId: 'c4',
    markerY: 0.64,
    iconX: 0.73,
    iconY: 0.688,
    defaultIcon: 'research',
    defaultIconColor: '#7E22CE',
    labelAnchor: { x: 0.12, y: 0.70, maxWidth: 0.34, align: 'left', font: 'titleLarge' },
    detailAnchor: {
      x: 0.12,
      y: 0.745,
      maxWidth: 0.34,
      align: 'left',
      font: 'body',
      lineHeightMultiplier: 1.16,
      maxLines: 4,
    },
  },
  {
    circleId: 'c5',
    markerY: 0.81,
    iconX: 0.27,
    iconY: 0.858,
    defaultIcon: 'deploy',
    defaultIconColor: '#D50000',
    labelAnchor: { x: 0.57, y: 0.87, maxWidth: 0.34, align: 'left', font: 'titleLarge' },
    detailAnchor: {
      x: 0.57,
      y: 0.915,
      maxWidth: 0.34,
      align: 'left',
      font: 'body',
      lineHeightMultiplier: 1.16,
      maxLines: 4,
    },
  },
];

const SPINE_TIMELINE_DEFAULT_LABEL_BY_CIRCLE_ID: Record<string, string> = {
  c1: 'Ideation',
  c2: 'Planning',
  c3: 'Execution',
  c4: 'Review',
  c5: 'Launch',
};

const SPINE_TIMELINE_DEFAULT_DETAIL_BY_CIRCLE_ID: Record<string, string> = {
  c1: '• Brainstorming\n• Concept Development\n• Research',
  c2: '• Strategy\n• Timeline\n• Resource Allocation',
  c3: '• Implementation\n• Testing\n• Feedback',
  c4: '• Analysis\n• Refinement\n• Approval',
  c5: '• Deployment\n• Monitoring\n• Evaluation',
};

const toSafeRoundedRect = ({
  x,
  y,
  width,
  height,
  radius,
}: SafeRoundedRectInput) => {
  if (![x, y, width, height, radius].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  return Skia.RRectXY(Skia.XYWHRect(x, y, width, height), safeRadius, safeRadius);
};

const getProcessCardsLayout = (width: number, height: number): ProcessCardLayout[] => {
  if (width <= 0 || height <= 0) return [];
  return PROCESS_CARDS_LAYOUT_INPUT.map(card => {
    const cardX = card.x * width;
    const cardY = card.y * height;
    const cardWidth = card.width * width;
    const cardHeight = card.height * height;
    const iconRadius = cardHeight * 0.28;
    const iconCx = cardX + cardWidth - iconRadius - cardWidth * 0.07;
    const iconCy = cardY + cardHeight * 0.31;
    return {
      circleId: card.circleId,
      isBlue: card.isBlue,
      icon: card.icon,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      iconCx,
      iconCy,
      iconRadius,
    };
  });
};

function wrapTextToLines(text: string, font: FontMeasurer, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ').filter(Boolean);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) result.push(current);
        current = word;
      }
    }
    if (current) result.push(current);
  }
  return result;
}

interface SkiaRoadmapRendererProps {
  slide: RoadmapSlide;
  style?: StyleProp<ViewStyle>;
  previewTextScale?: number;
  selectedCircleId?: string | null;
  onCircleTap?: (circleId: string, x: number, y: number) => void;
  selectedPanelIndex?: number;
  onPanelTap?: (panelIndex: number) => void;
}

interface CornerImageLayerProps {
  corner: RoadmapSlide['cornerImages'][number];
  width: number;
  height: number;
}

interface CircleImageFillProps {
  imageUri?: string;
  circle?: RoadmapCircleDefinition;
  frame?: RectFrame;
  geometry?: { cx: number; cy: number; r: number };
}
interface ProcessCardIconImageProps {
  imageUri?: string;
  cx: number;
  cy: number;
  radius: number;
}

const getContainFrame = (
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): RectFrame => {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const containerRatio = containerWidth / containerHeight;
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > containerRatio) {
    const width = containerWidth;
    const height = width / imageRatio;
    return {
      x: 0,
      y: (containerHeight - height) / 2,
      width,
      height,
    };
  }

  const height = containerHeight;
  const width = height * imageRatio;
  return {
    x: (containerWidth - width) / 2,
    y: 0,
    width,
    height,
  };
};

const getCircleGeometry = (
  circle: RoadmapCircleDefinition,
  frame: RectFrame,
) => {
  const minDimension = Math.min(frame.width, frame.height);
  return {
    cx: frame.x + circle.position.x * frame.width,
    cy: frame.y + circle.position.y * frame.height,
    r: circle.radius * minDimension,
  };
};

const parsePercentFromLabel = (label: string | undefined): number | null => {
  if (!label) return null;
  const numeric = Number(label.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, numeric));
};

const getBubbleTimelineLayout = (
  width: number,
  height: number,
  circles: RoadmapSlide['circles'],
): BubbleTimelineLayout => {
  const safeCount = Math.max(2, Math.min(5, circles.length));
  const splitY = height * 0.5;
  const minDim = Math.min(width, height);
  const minRadius = minDim * 0.055;
  const maxRadius = minDim * 0.145;
  const fallbackPercents = [61, 48, 3, 8, 54];
  const percents = Array.from({ length: safeCount }, (_, i) => {
    return parsePercentFromLabel(circles[i]?.label) ?? fallbackPercents[i % fallbackPercents.length];
  });
  const radii = percents.map(percent => minRadius + (percent / 100) * (maxRadius - minRadius));
  const maxR = Math.max(...radii, minRadius);
  const edgePadding = Math.max(12, maxR + minDim * 0.015);
  const startX = edgePadding;
  const endX = Math.max(startX, width - edgePadding);
  const gap = safeCount > 1 ? (endX - startX) / (safeCount - 1) : 0;

  const nodes = Array.from({ length: safeCount }, (_, i) => ({
    cx: startX + i * gap,
    cy: splitY,
    r: radii[i],
  }));
  return { splitY, nodes };
};

const CornerImageLayer: React.FC<CornerImageLayerProps> = ({ corner, width, height }) => {
  const image = useImage(corner.imageUri ?? null);
  if (!image) return null;

  const minDimension = Math.min(width, height);
  const imgSize = corner.size * minDimension;
  const padding = corner.padding * minDimension;

  let x = 0;
  let y = 0;

  switch (corner.position) {
    case 'topLeft':
      x = padding;
      y = padding;
      break;
    case 'topRight':
      x = width - imgSize - padding;
      y = padding;
      break;
    case 'bottomLeft':
      x = padding;
      y = height - imgSize - padding;
      break;
    case 'bottomRight':
      x = width - imgSize - padding;
      y = height - imgSize - padding;
      break;
  }

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={imgSize}
      height={imgSize}
      fit="contain"
    />
  );
};

const CircleImageFill: React.FC<CircleImageFillProps> = ({ imageUri, circle, frame, geometry: rawGeometry }) => {
  const image = useImage(imageUri ?? null);
  const geometry = useMemo(() => {
    if (rawGeometry) return rawGeometry;
    if (!circle || !frame) return { cx: 0, cy: 0, r: 0 };
    return getCircleGeometry(circle, frame);
  }, [circle, frame, rawGeometry]);
  const fillRadius = geometry.r * 1.06;
  const clipPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (fillRadius > 0) {
      path.addCircle(geometry.cx, geometry.cy, fillRadius);
    }
    return path;
  }, [fillRadius, geometry.cx, geometry.cy]);

  if (!image || geometry.r <= 0) return null;

  return (
    <Group clip={clipPath} invertClip={false}>
      <Image
        image={image}
        x={geometry.cx - fillRadius}
        y={geometry.cy - fillRadius}
        width={fillRadius * 2}
        height={fillRadius * 2}
        fit="cover"
      />
    </Group>
  );
};

const ProcessCardIconImage: React.FC<ProcessCardIconImageProps> = ({ imageUri, cx, cy, radius }) => {
  const image = useImage(imageUri ?? null);
  const clipPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (radius > 0) {
      path.addCircle(cx, cy, radius);
    }
    return path;
  }, [cx, cy, radius]);

  if (!image || radius <= 0) return null;

  return (
    <Group clip={clipPath} invertClip={false}>
      <Image
        image={image}
        x={cx - radius}
        y={cy - radius}
        width={radius * 2}
        height={radius * 2}
        fit="cover"
      />
    </Group>
  );
};

const parseColorToRgb = (color: string | undefined): RgbColor | null => {
  if (!color) return null;
  const trimmed = color.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = Number.parseInt(`${hex[0]}${hex[0]}`, 16);
      const g = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
      const b = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
      if ([r, g, b].every(Number.isFinite)) return { r, g, b };
      return null;
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].every(Number.isFinite)) return { r, g, b };
      return null;
    }
    return null;
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i);
  if (!rgbMatch) return null;
  const r = Number.parseFloat(rgbMatch[1]);
  const g = Number.parseFloat(rgbMatch[2]);
  const b = Number.parseFloat(rgbMatch[3]);
  if (![r, g, b].every(Number.isFinite)) return null;
  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  };
};

const getRelativeLuminance = ({ r, g, b }: RgbColor): number => {
  const normalize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  const rn = normalize(r);
  const gn = normalize(g);
  const bn = normalize(b);
  return 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
};

const isDarkColor = (color: string | undefined): boolean => {
  const rgb = parseColorToRgb(color);
  if (!rgb) return false;
  return getRelativeLuminance(rgb) < 0.35;
};

const SkiaRoadmapRenderer: React.FC<SkiaRoadmapRendererProps> = ({
  slide,
  style,
  previewTextScale = 1,
  selectedCircleId,
  onCircleTap,
  selectedPanelIndex,
  onPanelTap,
}) => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const isCarousel = slide.templateId === 'carousel';
  const isBubbleTimeline = slide.templateId === 'bubble_timeline_6';
  const isProcessCardsTemplate = slide.templateId === 'process_cards_10';
  const isThreeCircleImageTemplate = slide.templateId === 'template_3_circles';
  const isVerticalIconRailTemplate = slide.templateId === 'vertical_icon_rail_5';
  const isZigzagTimelineTemplate = slide.templateId === 'zigzag_timeline_5';
  const isSpineTimelineTemplate = slide.templateId === 'spine_timeline_5';
  const isRoadTrackTemplate = slide.templateId === 'road_track_6';

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }, [size.height, size.width]);

  // Get the template for this slide
  const template = useMemo(() => {
    return getRoadmapTemplateById(slide.templateId);
  }, [slide.templateId]);

  const imageTemplateConfig = useMemo(
    () => getRoadmapImageBackedTemplateConfig(slide.templateId),
    [slide.templateId],
  );

  const imageTemplateAsset = useImage(imageTemplateConfig ? imageTemplateConfig.source : null);

  const imageTemplateFrame = useMemo(() => {
    if (!imageTemplateConfig) return null;
    const containedFrame = getContainFrame(
      size.width,
      size.height,
      imageTemplateConfig.originalWidth,
      imageTemplateConfig.originalHeight,
    );
    const scale = imageTemplateConfig.contentScale ?? 1;
    if (scale === 1) return containedFrame;
    const scaledWidth = containedFrame.width * scale;
    const scaledHeight = containedFrame.height * scale;
    return {
      x: containedFrame.x - (scaledWidth - containedFrame.width) / 2,
      y: containedFrame.y - (scaledHeight - containedFrame.height) / 2,
      width: scaledWidth,
      height: scaledHeight,
    };
  }, [imageTemplateConfig, size.height, size.width]);

  const imageTemplateReady = Boolean(
    imageTemplateConfig &&
      imageTemplateAsset &&
      imageTemplateFrame &&
      imageTemplateFrame.width > 0 &&
      imageTemplateFrame.height > 0,
  );

  const bubbleTimelineLayout = useMemo(
    () => getBubbleTimelineLayout(size.width, size.height, slide.circles),
    [size.height, size.width, slide.circles],
  );
  const processCardsLayout = useMemo(
    () => getProcessCardsLayout(size.width, size.height),
    [size.height, size.width],
  );

  const effectivePanelWidth = useMemo(() => {
    if (isCarousel && slide.carouselData) {
      return size.width / slide.carouselData.panelCount;
    }
    return size.width;
  }, [isCarousel, slide.carouselData, size.width]);
  const textScale = useMemo(
    () => Math.max(0.5, Math.min(1, previewTextScale)),
    [previewTextScale],
  );

  const titleFontSize = useMemo(() => {
    const baseSize = isCarousel
      ? Math.max(10, Math.min(20, effectivePanelWidth * 0.09))
      : Math.max(12, Math.min(24, size.width * 0.04));
    return baseSize * textScale;
  }, [isCarousel, effectivePanelWidth, size.width, textScale]);

  const bodyFontSize = useMemo(() => {
    const baseSize = isCarousel
      ? Math.max(8, Math.min(16, effectivePanelWidth * 0.065))
      : Math.max(11, Math.min(20, size.width * 0.032));
    return baseSize * textScale;
  }, [isCarousel, effectivePanelWidth, size.width, textScale]);

  const smallFontSize = useMemo(() => {
    const baseSize = Math.max(7, Math.min(12, effectivePanelWidth * 0.05));
    return baseSize * textScale;
  }, [effectivePanelWidth, textScale]);

  const titleFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    titleFontSize,
  );
  const bodyFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    bodyFontSize,
  );
  const boldFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    titleFontSize,
  );
  const smallFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    smallFontSize,
  );
  const bodyBoldFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    bodyFontSize,
  );
  const roadStepSmallFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    bodyFontSize * 1.4,
  );
  const bodyBold2xFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    bodyFontSize * 3.375,
  );
  const smallBoldFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    smallFontSize,
  );
  const titleLargeFontSize = useMemo(() => titleFontSize * 1.5, [titleFontSize]);
  const bodyLargeFontSize = useMemo(() => bodyFontSize * 1.35, [bodyFontSize]);
  const titleLargeFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    titleLargeFontSize,
  );
  const bodyLargeFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    bodyLargeFontSize,
  );
  const processNumberFontSize = useMemo(() => {
    const baseSize = Math.max(10, Math.min(46, size.width * 0.068));
    return baseSize * textScale;
  }, [size.width, textScale]);
  const processTitleFontSize = useMemo(() => {
    const baseSize = Math.max(7, Math.min(28, size.width * 0.034));
    return baseSize * textScale;
  }, [size.width, textScale]);
  const processNumberFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    processNumberFontSize,
  );
  const processTitleFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    processTitleFontSize,
  );

  const textSlotsByCircleId = useMemo(() => {
    const slotMap = new Map<string, NonNullable<typeof imageTemplateConfig>['textSlots'][number]>();
    for (const slot of imageTemplateConfig?.textSlots ?? []) {
      slotMap.set(slot.circleId, slot);
    }
    return slotMap;
  }, [imageTemplateConfig]);

  const shouldUseLightMainText = useMemo(() => {
    if (slide.backgroundType === 'solid' && slide.backgroundColor) {
      return isDarkColor(slide.backgroundColor);
    }
    if (slide.backgroundType === 'gradient') {
      const gradientColors = slide.backgroundGradient?.colors ?? ROADMAP_BACKGROUNDS[0].colors;
      const parsed = gradientColors.map(parseColorToRgb).filter(Boolean) as RgbColor[];
      if (!parsed.length) return false;
      const avgLuminance =
        parsed.reduce((total, rgb) => total + getRelativeLuminance(rgb), 0) / parsed.length;
      return avgLuminance < 0.35;
    }
    if (imageTemplateConfig?.canvasBackgroundColor) {
      return isDarkColor(imageTemplateConfig.canvasBackgroundColor);
    }
    return false;
  }, [
    imageTemplateConfig?.canvasBackgroundColor,
    slide.backgroundColor,
    slide.backgroundGradient?.colors,
    slide.backgroundType,
  ]);

  const getTemplateTextFont = useCallback((font: RoadmapImageTextFont | undefined) => {
    switch (font) {
      case 'titleLarge':
        return titleLargeFont;
      case 'bodyLarge':
        return bodyLargeFont;
      case 'bodyBold':
        return bodyBoldFont;
      case 'smallBold':
        return smallBoldFont;
      case 'small':
        return smallFont;
      case 'body':
        return bodyFont;
      case 'title':
      default:
        return titleFont;
    }
  }, [bodyBoldFont, bodyFont, bodyLargeFont, smallBoldFont, smallFont, titleFont, titleLargeFont]);

  const getTemplateTextFontSize = useCallback((font: RoadmapImageTextFont | undefined) => {
    switch (font) {
      case 'titleLarge':
        return titleLargeFontSize;
      case 'bodyLarge':
        return bodyLargeFontSize;
      case 'bodyBold':
        return bodyFontSize;
      case 'smallBold':
        return smallFontSize;
      case 'small':
        return smallFontSize;
      case 'body':
        return bodyFontSize;
      case 'title':
      default:
        return titleFontSize;
    }
  }, [bodyFontSize, bodyLargeFontSize, smallFontSize, titleFontSize, titleLargeFontSize]);

  const renderTemplateTextLines = useCallback(
    (
      text: string,
      anchor: RoadmapImageTextAnchorConfig | undefined,
      keyPrefix: string,
      frame: RectFrame,
      fallbackColor: string,
      slotKind: 'label' | 'title' | 'detail',
    ) => {
      const trimmed = text.trim();
      if (!trimmed || !anchor) return null;

      const baseFontType = anchor.font;
      const baseFont = getTemplateTextFont(baseFontType);
      if (!baseFont) return null;
      const isGridStepsNumberLabel = slide.templateId === 'grid_steps_6' && keyPrefix.endsWith('-label');
      const emphasizedBaseFont = isGridStepsNumberLabel ? (bodyBold2xFont || baseFont) : baseFont;

      const maxWidth = Math.max(1, anchor.maxWidth * frame.width);
      const forceWhiteForMainText = shouldUseLightMainText && slotKind === 'detail';
      const baseColor = forceWhiteForMainText ? '#FFFFFF' : (anchor.color || fallbackColor);
      type TextLineConfig = {
        text: string;
        fontType: RoadmapImageTextFont | undefined;
        color: string;
      };
      const preparedLines: TextLineConfig[] = [];

      if (anchor.firstLineFont && trimmed.includes('\n')) {
        const [firstRawLine, ...remainingParts] = trimmed.split('\n');
        const firstLine = firstRawLine.trim();
        if (firstLine) {
          preparedLines.push({
            text: firstLine,
            fontType: anchor.firstLineFont,
            color: forceWhiteForMainText ? '#FFFFFF' : (anchor.firstLineColor || baseColor),
          });
        }
        const remainingText = remainingParts.join('\n').trim();
        if (remainingText) {
          const remainingLines = wrapTextToLines(remainingText, emphasizedBaseFont, maxWidth);
          for (const line of remainingLines) {
            preparedLines.push({
              text: line,
              fontType: baseFontType,
              color: baseColor,
            });
          }
        }
      } else {
        const wrappedLines = wrapTextToLines(trimmed, emphasizedBaseFont, maxWidth);
        for (const line of wrappedLines) {
          preparedLines.push({
            text: line,
            fontType: baseFontType,
            color: baseColor,
          });
        }
      }

      if (!preparedLines.length) return null;
      const lines = anchor.maxLines ? preparedLines.slice(0, anchor.maxLines) : preparedLines;
      const anchorX = frame.x + anchor.x * frame.width;
      const anchorY = frame.y + anchor.y * frame.height;
      const lineHeightMultiplier = anchor.lineHeightMultiplier ?? 1.25;

      let currentY = anchorY;
      return lines.map((line, index) => {
        const lineFont = isGridStepsNumberLabel
          ? (bodyBold2xFont || getTemplateTextFont(line.fontType) || baseFont)
          : (getTemplateTextFont(line.fontType) || baseFont);
        const lineHeightBase = isGridStepsNumberLabel
          ? bodyFontSize * 3.375
          : getTemplateTextFontSize(line.fontType);
        const lineHeight = lineHeightBase * lineHeightMultiplier;
        const y = currentY;
        currentY += lineHeight;

        const lineWidth = lineFont.measureText(line.text).width;
        const align = anchor.align ?? 'left';
        let x = anchorX;

        if (align === 'center') {
          x = anchorX - lineWidth / 2;
        } else if (align === 'right') {
          x = anchorX - lineWidth;
        }

        return (
          <SkiaText
            key={`${keyPrefix}-${index}`}
            x={x}
            y={y}
            text={line.text}
            font={lineFont}
            color={line.color}
          />
        );
      });
    },
    [
      bodyBold2xFont,
      bodyFontSize,
      getTemplateTextFont,
      getTemplateTextFontSize,
      shouldUseLightMainText,
      slide.templateId,
    ],
  );

  // Carousel-specific image hooks (always called, return null when not carousel)
  const carouselMainImage = useImage(slide.carouselData?.cover.mainImageUri ?? null);
  const carouselAvatarImage = useImage(slide.carouselData?.cover.authorAvatarUri ?? null);

  // Background gradient points
  const gradientPoints = useMemo(() => {
    if (!slide.backgroundGradient) {
      // Use default dark gradient
      const defaultBg = ROADMAP_BACKGROUNDS[0];
      return {
        start: vec(size.width * defaultBg.start.x, size.height * defaultBg.start.y),
        end: vec(size.width * defaultBg.end.x, size.height * defaultBg.end.y),
        colors: defaultBg.colors,
      };
    }
    return {
      start: vec(
        size.width * slide.backgroundGradient.start.x,
        size.height * slide.backgroundGradient.start.y
      ),
      end: vec(
        size.width * slide.backgroundGradient.end.x,
        size.height * slide.backgroundGradient.end.y
      ),
      colors: slide.backgroundGradient.colors,
    };
  }, [slide.backgroundGradient, size]);

  // Load background image if needed
  const backgroundImage = useImage(
    slide.backgroundType === 'image' && slide.backgroundImageUri
      ? slide.backgroundImageUri
      : null
  );

  // Handle tap to detect which circle or panel was tapped
  const handleCanvasTap = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // Carousel: detect which panel was tapped
    if (isCarousel && slide.carouselData && onPanelTap) {
      const panelWidth = size.width / slide.carouselData.panelCount;
      const panelIdx = Math.max(0, Math.min(
        slide.carouselData.panelCount - 1,
        Math.floor(locationX / panelWidth),
      ));
      onPanelTap(panelIdx);
      return;
    }

    if (!template || !onCircleTap) return;

    if (isProcessCardsTemplate) {
      for (const card of processCardsLayout) {
        if (
          locationX >= card.cardX &&
          locationX <= card.cardX + card.cardWidth &&
          locationY >= card.cardY &&
          locationY <= card.cardY + card.cardHeight
        ) {
          onCircleTap(
            card.circleId,
            card.cardX + card.cardWidth * 0.5,
            card.cardY + card.cardHeight * 0.5,
          );
          return;
        }
      }
      return;
    }

    if (isBubbleTimeline) {
      for (let i = 0; i < bubbleTimelineLayout.nodes.length; i += 1) {
        const node = bubbleTimelineLayout.nodes[i];
        const content = slide.circles[i];
        if (!node || !content) continue;
        const distance = Math.sqrt(
          Math.pow(locationX - node.cx, 2) + Math.pow(locationY - node.cy, 2),
        );
        if (distance <= node.r * 1.08) {
          onCircleTap(content.circleId, node.cx, node.cy);
          return;
        }
      }
      return;
    }

    const frame =
      imageTemplateConfig && imageTemplateFrame
        ? imageTemplateFrame
        : { x: 0, y: 0, width: size.width, height: size.height };

    // Check if tap is within any circle
    for (const circle of template.circles) {
      const { cx, cy, r } = getCircleGeometry(circle, frame);

      const distance = Math.sqrt(
        Math.pow(locationX - cx, 2) + Math.pow(locationY - cy, 2)
      );

      if (distance <= r * 1.2) {
        onCircleTap(circle.id, cx, cy);
        return;
      }
    }
  }, [
    isCarousel,
    slide.carouselData,
    slide.circles,
    onPanelTap,
    isProcessCardsTemplate,
    processCardsLayout,
    isBubbleTimeline,
    bubbleTimelineLayout.nodes,
    imageTemplateConfig,
    imageTemplateFrame,
    onCircleTap,
    size.height,
    size.width,
    template,
  ]);

  if (!template) {
    return null;
  }

  // Render all carousel panels as Skia elements
  const renderCarouselPanels = () => {
    const cd = slide.carouselData!;
    const panelWidth = size.width / cd.panelCount;
    const panelHeight = size.height;
    const pad = panelWidth * 0.08;
    const textAreaWidth = panelWidth - 2 * pad;

    return Array.from({ length: cd.panelCount }, (_, panelIndex) => {
      const panelX = panelIndex * panelWidth;
      const panelClip = Skia.XYWHRect(panelX, 0, panelWidth, panelHeight);

      if (panelIndex === 0) {
        const cover = cd.cover;
        const effectiveTextW = carouselMainImage ? textAreaWidth * 0.88 : textAreaWidth;
        const subtitleY = panelHeight * 0.14;
        const titleY = panelHeight * 0.24;
        const titleLineH = titleFontSize * 1.45;
        const descTopY = titleY + titleLineH * 3 + titleFontSize * 0.3;
        const descLineH = bodyFontSize * 1.5;
        const descLines = bodyFont ? wrapTextToLines(cover.description, bodyFont, effectiveTextW) : [];
        const buttonY = descTopY + descLines.length * descLineH + titleFontSize * 0.5;
        const buttonH = titleFontSize * 1.6;
        const buttonPad = titleFontSize * 0.5;
        const avatarR = Math.min(panelWidth * 0.07, 16);
        const avatarCx = panelX + pad + avatarR;
        const avatarCy = panelHeight * 0.84;
        const avatarClipPath = Skia.Path.Make();
        avatarClipPath.addCircle(avatarCx, avatarCy, avatarR);

        return (
          <Group key="panel-0" clip={panelClip}>
            {/* Cover background */}
            {slide.backgroundType === 'image' && backgroundImage ? (
              <Image image={backgroundImage} x={0} y={0} width={size.width} height={panelHeight} fit="cover" />
            ) : slide.backgroundType === 'solid' && slide.backgroundColor ? (
              <Rect x={0} y={0} width={size.width} height={panelHeight} color={slide.backgroundColor} />
            ) : (
              <Rect x={0} y={0} width={size.width} height={panelHeight}>
                <LinearGradient start={gradientPoints.start} end={gradientPoints.end} colors={gradientPoints.colors} />
              </Rect>
            )}

            {/* Main image */}
            {carouselMainImage && (
              <Image
                image={carouselMainImage}
                x={panelX + panelWidth * 0.5}
                y={panelHeight * 0.08}
                width={panelWidth * 0.52}
                height={panelHeight * 0.78}
                fit="contain"
              />
            )}

            {/* Subtitle */}
            {smallFont && cover.subtitle ? (
              <SkiaText x={panelX + pad} y={subtitleY} text={cover.subtitle} font={smallFont} color="rgba(255,255,255,0.65)" />
            ) : null}

            {/* Title lines */}
            {boldFont && [cover.titlePart1, cover.titlePart2, cover.titleHighlight].map((line, i) =>
              line ? (
                <SkiaText
                  key={i}
                  x={panelX + pad}
                  y={titleY + i * titleLineH}
                  text={line}
                  font={boldFont}
                  color={i === 2 ? cd.accentColor : '#FFFFFF'}
                />
              ) : null
            )}

            {/* Description */}
            {bodyFont && descLines.map((line, i) =>
              line ? (
                <SkiaText key={i} x={panelX + pad} y={descTopY + i * descLineH} text={line} font={bodyFont} color="rgba(255,255,255,0.8)" />
              ) : null
            )}

            {/* Swipe button pill */}
            {boldFont && cover.buttonText && (() => {
              const bw = boldFont.measureText(cover.buttonText).width + buttonPad * 2;
              const btnRRect = toSafeRoundedRect({
                x: panelX + pad,
                y: buttonY,
                width: bw,
                height: buttonH,
                radius: buttonH / 2,
              });
              if (!btnRRect) return null;
              const btnPath = Skia.Path.Make();
              btnPath.addRRect(btnRRect);
              return (
                <>
                  <Path path={btnPath} color={cd.accentColor} />
                  <SkiaText x={panelX + pad + buttonPad} y={buttonY + buttonH * 0.68} text={cover.buttonText} font={boldFont} color="#FFFFFF" />
                </>
              );
            })()}

            {/* Author avatar */}
            {carouselAvatarImage ? (
              <Group clip={avatarClipPath} invertClip={false}>
                <Image image={carouselAvatarImage} x={avatarCx - avatarR} y={avatarCy - avatarR} width={avatarR * 2} height={avatarR * 2} fit="cover" />
              </Group>
            ) : (
              <Circle cx={avatarCx} cy={avatarCy} r={avatarR} color="rgba(255,255,255,0.2)" />
            )}

            {/* Author name */}
            {smallFont && cover.authorName ? (
              <SkiaText x={avatarCx + avatarR + pad * 0.6} y={avatarCy - avatarR * 0.1} text={cover.authorName} font={smallFont} color="#FFFFFF" />
            ) : null}

            {/* Author title */}
            {smallFont && cover.authorTitle ? (
              <SkiaText x={avatarCx + avatarR + pad * 0.6} y={avatarCy + avatarR * 0.9} text={cover.authorTitle} font={smallFont} color="rgba(255,255,255,0.65)" />
            ) : null}

            {/* Selected panel highlight */}
            {selectedPanelIndex === 0 && (
              <Rect x={panelX + 1} y={1} width={panelWidth - 2} height={panelHeight - 2} color="rgba(0,122,255,0.1)" />
            )}

            {/* Right divider */}
            <Rect x={panelX + panelWidth - 1} y={0} width={2} height={panelHeight} color={cd.dividerColor} />
          </Group>
        );
      }

      // Step panel
      const step = cd.steps[panelIndex - 1];
      if (!step) return null;

      const badgeR = Math.min(panelWidth * 0.09, 18);
      const badgeCx = panelX + pad + badgeR;
      const badgeCy = panelHeight * 0.14 + badgeR;
      const part1W = boldFont ? boldFont.measureText(step.titlePart1).width : 0;
      const highlightW = boldFont ? boldFont.measureText(step.titleHighlight).width : 0;
      const titleFitsOneLine = part1W + titleFontSize * 0.3 + highlightW <= textAreaWidth;
      const titleTopY = badgeCy + badgeR + titleFontSize * 1.5;
      const titleTotalLines = titleFitsOneLine ? 1 : 2;
      const descTopY = titleTopY + titleTotalLines * titleFontSize * 1.45 + titleFontSize * 0.3;
      const descLineH = bodyFontSize * 1.5;
      const descLines = bodyFont ? wrapTextToLines(step.description, bodyFont, textAreaWidth) : [];
      const shapeR1 = panelWidth * 0.45;
      const shape1Cx = panelX + panelWidth * 0.82;
      const shape1Cy = panelHeight * 0.12;
      const shapeR2 = panelWidth * 0.35;
      const shape2Cx = panelX + panelWidth * 0.18;
      const shape2Cy = panelHeight * 0.88;

      return (
        <Group key={`panel-${panelIndex}`} clip={panelClip}>
          {/* Background */}
          <Rect x={panelX} y={0} width={panelWidth} height={panelHeight} color={cd.backgroundColor} />

          {/* Decorative shapes */}
          {cd.showShapes && (
            <>
              <Circle cx={shape1Cx} cy={shape1Cy} r={shapeR1} color={cd.shapeColor} />
              <Circle cx={shape2Cx} cy={shape2Cy} r={shapeR2} color={cd.shapeColor} />
            </>
          )}

          {/* Selected panel highlight */}
          {selectedPanelIndex === panelIndex && (
            <Rect x={panelX + 1} y={1} width={panelWidth - 2} height={panelHeight - 2} color="rgba(0,122,255,0.1)" />
          )}

          {/* Number badge */}
          <Circle cx={badgeCx} cy={badgeCy} r={badgeR} color={cd.accentColor} />
          {boldFont && (
            <SkiaText
              x={badgeCx - boldFont.measureText(String(panelIndex)).width / 2}
              y={badgeCy + titleFontSize * 0.38}
              text={String(panelIndex)}
              font={boldFont}
              color="#FFFFFF"
            />
          )}

          {/* Two-part title */}
          {boldFont && (
            <>
              <SkiaText x={panelX + pad} y={titleTopY} text={step.titlePart1} font={boldFont} color="#FFFFFF" />
              <SkiaText
                x={titleFitsOneLine ? panelX + pad + part1W + titleFontSize * 0.3 : panelX + pad}
                y={titleFitsOneLine ? titleTopY : titleTopY + titleFontSize * 1.45}
                text={step.titleHighlight}
                font={boldFont}
                color={cd.accentColor}
              />
            </>
          )}

          {/* Description */}
          {bodyFont && descLines.map((line, i) =>
            line ? (
              <SkiaText key={i} x={panelX + pad} y={descTopY + i * descLineH} text={line} font={bodyFont} color="rgba(255,255,255,0.82)" />
            ) : null
          )}

          {/* Right divider (not on last panel) */}
          {panelIndex < cd.panelCount - 1 && (
            <Rect x={panelX + panelWidth - 1} y={0} width={2} height={panelHeight} color={cd.dividerColor} />
          )}
        </Group>
      );
    });
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
      {size.width > 0 && size.height > 0 && (
        <Canvas
          style={{ width: size.width, height: size.height }}
          onTouchEnd={handleCanvasTap}
        >
          {/* Carousel rendering */}
          {isCarousel && slide.carouselData && renderCarouselPanels()}

          {/* Non-carousel: background + template + circles */}
          {!isCarousel && (
            <>

          {/* Background layer */}
          {slide.backgroundType === 'image' && backgroundImage ? (
            <Image
              image={backgroundImage}
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fit="cover"
            />
          ) : slide.backgroundType === 'solid' && slide.backgroundColor ? (
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              color={slide.backgroundColor}
            />
          ) : slide.backgroundType === 'gradient' ? (
            <Rect x={0} y={0} width={size.width} height={size.height}>
              <LinearGradient
                start={gradientPoints.start}
                end={gradientPoints.end}
                colors={gradientPoints.colors}
              />
            </Rect>
          ) : imageTemplateConfig?.canvasBackgroundColor ? (
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              color={imageTemplateConfig.canvasBackgroundColor}
            />
          ) : (
            <Rect x={0} y={0} width={size.width} height={size.height}>
              <LinearGradient
                start={gradientPoints.start}
                end={gradientPoints.end}
                colors={gradientPoints.colors}
              />
            </Rect>
          )}

          {/* Circle image fills for editable image-backed circles (drawn below template asset) */}
          {!isBubbleTimeline &&
            isThreeCircleImageTemplate &&
            imageTemplateReady &&
            imageTemplateConfig &&
            imageTemplateFrame && (
            <Group>
              {/* template_3_circles uses image-backed artwork; these match visible ring centers */}
              {(() => {
                const minDimension = Math.min(imageTemplateFrame.width, imageTemplateFrame.height);
                const overrides: Record<string, { cx: number; cy: number; r: number }> = {
                  c1: {
                    cx: imageTemplateFrame.x + 0.220 * imageTemplateFrame.width,
                    cy: imageTemplateFrame.y + 0.577 * imageTemplateFrame.height,
                    r: 0.126 * minDimension,
                  },
                  c2: {
                    cx: imageTemplateFrame.x + 0.814 * imageTemplateFrame.width,
                    cy: imageTemplateFrame.y + 0.251 * imageTemplateFrame.height,
                    r: 0.126 * minDimension,
                  },
                  c3: {
                    cx: imageTemplateFrame.x + 0.664 * imageTemplateFrame.width,
                    cy: imageTemplateFrame.y + 0.704 * imageTemplateFrame.height,
                    r: 0.126 * minDimension,
                  },
                };

                return template.circles.map(circle => {
                  const content = slide.circles.find(c => c.circleId === circle.id);
                  if (!content?.imageUri || content.contentType !== 'image') return null;

                  return (
                    <CircleImageFill
                      key={`${circle.id}-image-fill`}
                      imageUri={content.imageUri}
                      geometry={overrides[circle.id] || getCircleGeometry(circle, imageTemplateFrame)}
                    />
                  );
                });
              })()}
            </Group>
          )}

          {/* Image template asset on top of selected background */}
          {!isBubbleTimeline &&
            imageTemplateReady &&
            imageTemplateConfig &&
            imageTemplateFrame &&
            imageTemplateAsset && (
            <Image
              image={imageTemplateAsset}
              x={imageTemplateFrame.x}
              y={imageTemplateFrame.y}
              width={imageTemplateFrame.width}
              height={imageTemplateFrame.height}
              fit="fill"
            />
          )}

          {/* Template overlays */}
          {isBubbleTimeline ? (
            <Group>
              {bubbleTimelineLayout.nodes.map((node, index) => {
                const content = slide.circles[index];
                if (!content) return null;
                const isTopText = index % 2 === 0;
                const detailText = content.text?.trim() || '';
                let yearLine = content.title?.trim() || '';
                let bodyText = detailText;
                if (!yearLine && detailText.includes('\n')) {
                  const [firstLine, ...restLines] = detailText.split('\n');
                  if (/^\d{4}$/.test(firstLine.trim())) {
                    yearLine = firstLine.trim();
                    bodyText = restLines.join('\n').trim();
                  }
                }
                const bubbleColor = content.textStyle?.color || '#6F9E62';

                const dotGap = Math.max(6, node.r * 0.22);
                const segment = Math.max(3, Math.floor(node.r * 0.8 / dotGap));
                const stemDirection = isTopText ? -1 : 1;
                const stemStartY = node.cy + stemDirection * node.r;
                const stemEndY = node.cy + stemDirection * (node.r + segment * dotGap);
                const textAnchorY = isTopText
                  ? Math.max(20, stemEndY - 50)
                  : Math.min(size.height - 56, stemEndY + 54);

                const yearFont = bodyBoldFont || titleFont;
                const bodyFontResolved = smallFont || bodyFont;
                const percentFont = node.r < Math.min(size.width, size.height) * 0.1 ? bodyBoldFont : titleFont;

                return (
                  <Group key={`bubble-${content.circleId}`}>
                    <Circle
                      cx={node.cx}
                      cy={node.cy}
                      r={Math.max(0, node.r - Math.max(1, slide.strokeWidth * 0.8))}
                      color={bubbleColor}
                    />
                    <Circle
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r}
                      color={slide.strokeColor}
                      style="stroke"
                      strokeWidth={Math.max(1, slide.strokeWidth * 0.8)}
                    />
                    {percentFont ? (
                      <SkiaText
                        x={node.cx - percentFont.measureText(content.label).width / 2}
                        y={node.cy + getTemplateTextFontSize(node.r < Math.min(size.width, size.height) * 0.1 ? 'bodyBold' : 'title') * 0.35}
                        text={content.label}
                        font={percentFont}
                        color="#F4F4F4"
                      />
                    ) : null}

                    {Array.from({ length: segment }).map((_, dotIndex) => (
                      <Circle
                        key={`dot-${content.circleId}-${dotIndex}`}
                        cx={node.cx}
                        cy={stemStartY + stemDirection * dotGap * (dotIndex + 1)}
                        r={Math.max(1.5, node.r * 0.05)}
                        color={slide.strokeColor}
                      />
                    ))}
                    <Circle
                      cx={node.cx}
                      cy={stemEndY}
                      r={Math.max(3, node.r * 0.1)}
                      color={slide.strokeColor}
                    />

                    {yearFont && yearLine?.trim() ? (
                      <SkiaText
                        x={node.cx - yearFont.measureText(yearLine.trim()).width / 2}
                        y={textAnchorY}
                        text={yearLine.trim()}
                        font={yearFont}
                        color="#F2F2F2"
                      />
                    ) : null}
                    {bodyFontResolved && bodyText ? (
                      renderTemplateTextLines(
                        bodyText,
                        {
                          x: Math.max(0.1, Math.min(0.9, node.cx / Math.max(1, size.width))),
                          y: isTopText
                            ? (textAnchorY + 12) / Math.max(1, size.height)
                            : (textAnchorY + 14) / Math.max(1, size.height),
                          maxWidth:
                            index === 0 || index === bubbleTimelineLayout.nodes.length - 1
                              ? 0.24
                              : 0.2,
                          align: 'center',
                          color: '#EDEDED',
                          font: 'small',
                          maxLines: 4,
                          lineHeightMultiplier: 1.18,
                        },
                        `${content.circleId}-bubble-body`,
                        { x: 0, y: 0, width: size.width, height: size.height },
                        '#EDEDED',
                        'detail',
                      )
                    ) : null}
                  </Group>
                );
              })}
            </Group>
          ) : isProcessCardsTemplate ? (
            <Group>
              {Array.from({ length: 14 }).map((_, columnIndex) => {
                const x = (columnIndex / 13) * size.width;
                return (
                  <Rect
                    key={`process-grid-col-${columnIndex}`}
                    x={x}
                    y={0}
                    width={Math.max(1, size.width * 0.0012)}
                    height={size.height}
                    color="rgba(149,171,205,0.14)"
                  />
                );
              })}
              {Array.from({ length: 21 }).map((_, rowIndex) => {
                const y = (rowIndex / 20) * size.height;
                return (
                  <Rect
                    key={`process-grid-row-${rowIndex}`}
                    x={0}
                    y={y}
                    width={size.width}
                    height={Math.max(1, size.height * 0.0011)}
                    color="rgba(149,171,205,0.11)"
                  />
                );
              })}

              {processCardsLayout.map((card, index) => {
                const content = slide.circles.find(c => c.circleId === card.circleId);
                const iconKind =
                  content?.iconKey ||
                  PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[card.circleId] ||
                  card.icon;
                const iconImageUri = content?.iconImageUri;
                const labelText = content?.label?.trim() || `${index + 1}.`;
                const titleText = content?.title?.trim() || content?.text?.trim() || '';
                const titleLines =
                  processTitleFont && titleText
                    ? wrapTextToLines(titleText, processTitleFont, card.cardWidth * 0.54).slice(0, 2)
                    : [];
                const cardRadius = card.cardHeight * 0.25;
                const shadowOffset = Math.max(1, size.height * 0.0055);
                const cardRRect = toSafeRoundedRect({
                  x: card.cardX,
                  y: card.cardY,
                  width: card.cardWidth,
                  height: card.cardHeight,
                  radius: cardRadius,
                });
                if (!cardRRect) return null;
                const cardPath = Skia.Path.Make();
                cardPath.addRRect(cardRRect);
                const shadowRRect = toSafeRoundedRect({
                  x: card.cardX,
                  y: card.cardY + shadowOffset,
                  width: card.cardWidth,
                  height: card.cardHeight,
                  radius: cardRadius,
                });
                const shadowPath = shadowRRect ? (() => {
                  const path = Skia.Path.Make();
                  path.addRRect(shadowRRect);
                  return path;
                })() : null;
                const numberColor = card.isBlue ? '#F4F8FF' : '#0B203B';
                const titleColor = card.isBlue ? '#F4F8FF' : '#0B203B';
                const numberX = card.cardX + card.cardWidth * 0.10;
                const numberY = card.cardY + card.cardHeight * 0.40;
                const titleX = card.cardX + card.cardWidth * 0.10;
                const titleStartY = card.cardY + card.cardHeight * 0.70;
                const titleLineHeight = processTitleFontSize * 1.12;
                const iconStrokeWidth = Math.max(1, card.iconRadius * 0.08);
                const isWhiteCard = !card.isBlue;
                const iconCircleFill = isWhiteCard ? '#7CA4E7' : '#F8FBFF';
                const iconGlyphColor = content?.iconColor || (isWhiteCard ? '#FFFFFF' : '#2E547D');

                return (
                  <Group key={`process-card-${card.circleId}`}>
                    {shadowPath && (
                      <Path
                        path={shadowPath}
                        color={card.isBlue ? 'rgba(90,118,168,0.24)' : 'rgba(113,132,161,0.18)'}
                      />
                    )}
                    {card.isBlue ? (
                      <Path path={cardPath}>
                        <LinearGradient
                          start={vec(card.cardX, card.cardY)}
                          end={vec(card.cardX + card.cardWidth, card.cardY + card.cardHeight)}
                          colors={['#7CA4E7', '#A9C1F2']}
                        />
                      </Path>
                    ) : (
                      <Path path={cardPath} color="#F8FAFE" />
                    )}
                    <Path
                      path={cardPath}
                      color={card.isBlue ? 'rgba(73,101,151,0.25)' : 'rgba(123,142,171,0.18)'}
                      style="stroke"
                      strokeWidth={Math.max(1, size.width * 0.0015)}
                    />
                    {selectedCircleId === card.circleId && (
                      <Path
                        path={cardPath}
                        color="#0A84FF"
                        style="stroke"
                        strokeWidth={Math.max(2, size.width * 0.004)}
                      />
                    )}

                    <Circle
                      cx={card.iconCx}
                      cy={card.iconCy + shadowOffset * 1.05}
                      r={card.iconRadius * 1.04}
                      color="rgba(75,99,134,0.18)"
                    />
                    <Circle
                      cx={card.iconCx}
                      cy={card.iconCy + shadowOffset * 0.72}
                      r={card.iconRadius}
                      color="rgba(75,99,134,0.34)"
                    />
                    <Circle cx={card.iconCx} cy={card.iconCy} r={card.iconRadius} color={iconCircleFill} />
                    {iconImageUri ? (
                      <ProcessCardIconImage
                        imageUri={iconImageUri}
                        cx={card.iconCx}
                        cy={card.iconCy}
                        radius={card.iconRadius * 0.98}
                      />
                    ) : (
                      <ProcessCardIconGlyph
                        icon={iconKind}
                        cx={card.iconCx}
                        cy={card.iconCy}
                        radius={card.iconRadius * 1.74}
                        color={iconGlyphColor}
                        strokeWidth={iconStrokeWidth}
                      />
                    )}

                    {processNumberFont ? (
                      <SkiaText
                        x={numberX}
                        y={numberY}
                        text={labelText}
                        font={processNumberFont}
                        color={numberColor}
                      />
                    ) : null}

                    {processTitleFont &&
                      titleLines.map((line, lineIndex) => (
                        <SkiaText
                          key={`process-card-${card.circleId}-title-${lineIndex}`}
                          x={titleX}
                          y={titleStartY + lineIndex * titleLineHeight}
                          text={line}
                          font={processTitleFont}
                          color={titleColor}
                        />
                      ))}
                  </Group>
                );
              })}
            </Group>
          ) : isSpineTimelineTemplate ? (
            <Group>
              {(() => {
                const frame = { x: 0, y: 0, width: size.width, height: size.height };
                const minDimension = Math.min(size.width, size.height);
                const spineX = size.width * 0.49;
                const railTop = size.height * 0.06;
                const railBottom = size.height * 0.93;
                const railHeight = railBottom - railTop;
                const railWidth = Math.max(2, minDimension * 0.0088);
                const railGap = railWidth * 0.58;
                const railRadius = railWidth * 0.72;
                const majorDotRadius = minDimension * 0.032;
                const minorDotRadius = majorDotRadius * 0.57;
                const majorOuterRadius = majorDotRadius * 1.14;
                const minorOuterRadius = minorDotRadius * 1.18;
                const majorDotStroke = Math.max(1.1, minDimension * 0.0032);
                const iconRadius = minDimension * 0.1404;
                const iconStrokeWidth = Math.max(1.4, iconRadius * 0.074);
                const majorMarkerYs = SPINE_TIMELINE_LAYOUT_INPUT.map(step => step.markerY * size.height);
                const contentByCircleId = new Map(slide.circles.map(content => [content.circleId, content]));

                const stepColors = SPINE_TIMELINE_LAYOUT_INPUT.map(step => {
                  const content = contentByCircleId.get(step.circleId);
                  return content?.iconColor || step.defaultIconColor;
                });

                const minorMarkerItems = majorMarkerYs.slice(0, -1).map((startY, index) => {
                  const endY = majorMarkerYs[index + 1];
                  const markerY = (startY + endY) / 2;
                  const markerColor = index === 0
                    ? stepColors[0]
                    : stepColors[Math.min(stepColors.length - 1, index + 1)];
                  return {
                    id: `minor-${index}`,
                    markerY,
                    markerColor,
                  };
                });

                const labelFallback = shouldUseLightMainText ? '#F6F7FC' : '#101114';
                const detailFallback = shouldUseLightMainText ? '#EEF2FA' : '#111111';

                return (
                  <>
                    <RoundedRect
                      x={spineX - railGap / 2 - railWidth + railWidth * 0.9}
                      y={railTop + railWidth * 0.65}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="rgba(78,86,101,0.22)"
                    />
                    <RoundedRect
                      x={spineX + railGap / 2 + railWidth * 0.9}
                      y={railTop + railWidth * 0.65}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="rgba(78,86,101,0.20)"
                    />
                    <RoundedRect
                      x={spineX - railGap / 2 - railWidth}
                      y={railTop}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="#EEF2F8"
                    />
                    <RoundedRect
                      x={spineX + railGap / 2}
                      y={railTop}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="#FCFDFF"
                    />
                    <RoundedRect
                      x={spineX - railGap / 2 - railWidth}
                      y={railTop}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="rgba(172,183,199,0.70)"
                      style="stroke"
                      strokeWidth={Math.max(0.8, minDimension * 0.0015)}
                    />
                    <RoundedRect
                      x={spineX + railGap / 2}
                      y={railTop}
                      width={railWidth}
                      height={railHeight}
                      r={railRadius}
                      color="rgba(172,183,199,0.56)"
                      style="stroke"
                      strokeWidth={Math.max(0.8, minDimension * 0.0015)}
                    />

                    {minorMarkerItems.map(item => (
                      <Group key={item.id}>
                        <Circle
                          cx={spineX + minorDotRadius * 0.62}
                          cy={item.markerY + minorDotRadius * 0.56}
                          r={minorOuterRadius * 1.04}
                          color="rgba(61,71,88,0.28)"
                        />
                        <Circle cx={spineX} cy={item.markerY} r={minorOuterRadius} color="#EFF3F9" />
                        <Circle
                          cx={spineX}
                          cy={item.markerY}
                          r={minorOuterRadius}
                          color="rgba(168,180,198,0.72)"
                          style="stroke"
                          strokeWidth={majorDotStroke * 0.65}
                        />
                        <Circle cx={spineX} cy={item.markerY} r={minorDotRadius} color={item.markerColor} />
                      </Group>
                    ))}

                    {SPINE_TIMELINE_LAYOUT_INPUT.map((step, index) => {
                      const content = contentByCircleId.get(step.circleId);
                      if (!content) return null;

                      const markerY = step.markerY * size.height;
                      const iconCx = step.iconX * size.width;
                      const iconCy = step.iconY * size.height;
                      const iconColor = content.iconColor || step.defaultIconColor;
                      const icon =
                        content.iconKey ||
                        step.defaultIcon ||
                        PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[step.circleId] ||
                        'idea';
                      const iconImageUri = content.iconImageUri;
                      const labelText =
                        content.label?.trim() ||
                        SPINE_TIMELINE_DEFAULT_LABEL_BY_CIRCLE_ID[step.circleId] ||
                        `Step ${index + 1}`;
                      const detailText =
                        content.text?.trim() ||
                        SPINE_TIMELINE_DEFAULT_DETAIL_BY_CIRCLE_ID[step.circleId] ||
                        '';

                      return (
                        <Group key={`spine-step-${step.circleId}`}>
                          <Circle
                            cx={spineX + majorDotRadius * 0.6}
                            cy={markerY + majorDotRadius * 0.56}
                            r={majorOuterRadius * 1.05}
                            color="rgba(61,71,88,0.31)"
                          />
                          <Circle cx={spineX} cy={markerY} r={majorOuterRadius} color="#EFF3F9" />
                          <Circle
                            cx={spineX}
                            cy={markerY}
                            r={majorOuterRadius}
                            color="rgba(168,180,198,0.72)"
                            style="stroke"
                            strokeWidth={majorDotStroke}
                          />
                          <Circle cx={spineX} cy={markerY} r={majorDotRadius} color={iconColor} />
                          {selectedCircleId === step.circleId && (
                            <Circle
                              cx={spineX}
                              cy={markerY}
                              r={majorOuterRadius * 1.28}
                              color="#0A84FF"
                              style="stroke"
                              strokeWidth={Math.max(2, minDimension * 0.004)}
                            />
                          )}

                          {iconImageUri ? (
                            <ProcessCardIconImage
                              imageUri={iconImageUri}
                              cx={iconCx}
                              cy={iconCy}
                              radius={iconRadius * 0.98}
                            />
                          ) : (
                            <ProcessCardIconGlyph
                              icon={icon}
                              cx={iconCx}
                              cy={iconCy}
                              radius={iconRadius}
                              color={iconColor}
                              strokeWidth={iconStrokeWidth}
                            />
                          )}

                          {renderTemplateTextLines(
                            labelText,
                            { ...step.labelAnchor, color: iconColor },
                            `${step.circleId}-spine-label`,
                            frame,
                            labelFallback,
                            'label',
                          )}
                          {renderTemplateTextLines(
                            detailText,
                            step.detailAnchor,
                            `${step.circleId}-spine-detail`,
                            frame,
                            detailFallback,
                            'detail',
                          )}
                        </Group>
                      );
                    })}
                  </>
                );
              })()}
            </Group>
          ) : imageTemplateReady && imageTemplateConfig && imageTemplateFrame ? (
            <Group>
              {isVerticalIconRailTemplate &&
                template.circles.map(circle => {
                  const content = slide.circles.find(c => c.circleId === circle.id);
                  if (!content) return null;

                  const geometry = getCircleGeometry(circle, imageTemplateFrame);
                  const textSlot = textSlotsByCircleId.get(circle.id);
                  const iconColor = content.iconColor || textSlot?.label?.color || '#2D85B7';
                  const railDefaultIconByCircleId: Record<string, ProcessCardIconKind> = {
                    c1: 'idea',
                    c2: 'plan',
                    c3: 'prototype',
                    c4: 'research',
                    c5: 'deploy',
                  };
                  const icon =
                    content.iconKey ||
                    railDefaultIconByCircleId[circle.id] ||
                    PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[circle.id] ||
                    'idea';
                  const iconImageUri = content.iconImageUri;
                  const iconRadius = Math.min(imageTemplateFrame.width, imageTemplateFrame.height) * 0.043;
                  const strokeWidth = Math.max(1.2, iconRadius * 0.072);

                  return iconImageUri ? (
                    <ProcessCardIconImage
                      key={`${circle.id}-icon-image`}
                      imageUri={iconImageUri}
                      cx={geometry.cx}
                      cy={geometry.cy}
                      radius={iconRadius * 0.98}
                    />
                  ) : (
                    <ProcessCardIconGlyph
                      key={`${circle.id}-icon-glyph`}
                      icon={icon}
                      cx={geometry.cx}
                      cy={geometry.cy}
                      radius={iconRadius}
                      color={iconColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}
              {isZigzagTimelineTemplate &&
                template.circles.map(circle => {
                  const content = slide.circles.find(c => c.circleId === circle.id);
                  if (!content) return null;

                  const geometry = getCircleGeometry(circle, imageTemplateFrame);
                  const textSlot = textSlotsByCircleId.get(circle.id);
                  const iconColor = content.iconColor || textSlot?.label?.color || '#2D85B7';
                  const zigzagDefaultIconByCircleId: Record<string, ProcessCardIconKind> = {
                    c1: 'idea',
                    c2: 'plan',
                    c3: 'prototype',
                    c4: 'research',
                    c5: 'deploy',
                  };
                  const icon =
                    content.iconKey ||
                    zigzagDefaultIconByCircleId[circle.id] ||
                    PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[circle.id] ||
                    'idea';
                  const iconImageUri = content.iconImageUri;
                  const iconRadius = Math.min(imageTemplateFrame.width, imageTemplateFrame.height) * 0.14;
                  const strokeWidth = Math.max(1.2, iconRadius * 0.065);

                  return iconImageUri ? (
                    <ProcessCardIconImage
                      key={`${circle.id}-icon-image`}
                      imageUri={iconImageUri}
                      cx={geometry.cx}
                      cy={geometry.cy}
                      radius={iconRadius * 0.98}
                    />
                  ) : (
                    <ProcessCardIconGlyph
                      key={`${circle.id}-icon-glyph`}
                      icon={icon}
                      cx={geometry.cx}
                      cy={geometry.cy}
                      radius={iconRadius}
                      color={iconColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}
              {isRoadTrackTemplate &&
                bodyBoldFont &&
                roadStepSmallFont &&
                template.circles.map((circle, index) => {
                  const geometry = getCircleGeometry(circle, imageTemplateFrame);
                  const step = String(index + 1).padStart(2, '0');
                  const stepColors = ['#2F8ECC', '#D86666', '#7B57B8', '#35B4B4', '#2F8ECC', '#7A57B5'];
                  const stepColor = stepColors[index % stepColors.length];
                  const isLargeStep = index === 0 || index === 1 || index === 5;
                  const font = isLargeStep ? roadStepSmallFont : bodyBoldFont;
                  const fontSize = isLargeStep ? bodyFontSize * 1.4 : bodyFontSize;
                  const textWidth = font.measureText(step).width;
                  const x = geometry.cx - textWidth / 2;
                  const y = geometry.cy + fontSize * 0.36;

                  return (
                    <SkiaText
                      key={`${circle.id}-road-step`}
                      x={x}
                      y={y}
                      text={step}
                      font={font}
                      color={stepColor}
                    />
                  );
                })}
              {template.circles.map(circle => {
                const content = slide.circles.find(c => c.circleId === circle.id);
                if (!content) return null;

                const labelText = content.label?.trim() || '';
                const titleText = content.title?.trim() || '';
                const detailText = slide.templateId === 'vertical_icon_rail_5'
                  ? 'Some important note'
                  : content.text?.trim() || '';
                const textSlot = textSlotsByCircleId.get(circle.id);

                return (
                  <Group key={circle.id}>
                    {renderTemplateTextLines(
                      labelText,
                      textSlot?.label,
                      `${circle.id}-label`,
                      imageTemplateFrame,
                      '#2D2D2D',
                      'label',
                    )}
                    {renderTemplateTextLines(
                      titleText,
                      textSlot?.title,
                      `${circle.id}-title`,
                      imageTemplateFrame,
                      '#FFFFFF',
                      'title',
                    )}
                    {renderTemplateTextLines(
                      detailText,
                      textSlot?.detail,
                      `${circle.id}-detail`,
                      imageTemplateFrame,
                      '#3D3D3D',
                      'detail',
                    )}
                  </Group>
                );
              })}
            </Group>
          ) : (
            <>
              {/* Connectors layer (behind circles) */}
              <Group>
                {template.connectors.map((connector, index) => (
                  <RoadmapConnector
                    key={`connector-${index}`}
                    connector={connector}
                    circles={template.circles}
                    width={size.width}
                    height={size.height}
                    strokeColor={slide.strokeColor}
                    strokeWidth={slide.strokeWidth}
                    dashPattern={template.defaultDashPattern}
                  />
                ))}
              </Group>

              {/* Circles layer */}
              <Group>
                {template.circles.map(circle => {
                  const content = slide.circles.find(c => c.circleId === circle.id);
                  if (!content) return null;

                  return (
                    <RoadmapCircle
                      key={circle.id}
                      circle={circle}
                      content={content}
                      width={size.width}
                      height={size.height}
                      strokeColor={slide.strokeColor}
                      strokeWidth={slide.strokeWidth}
                      isSelected={selectedCircleId === circle.id}
                    />
                  );
                })}
              </Group>
            </>
          )}

            </> /* end !isCarousel */
          )}

          {/* Corner images layer */}
          <Group>
            {slide.cornerImages.map((corner, index) => (
              <CornerImageLayer
                key={`corner-${corner.position}-${corner.imageUri || index}`}
                corner={corner}
                width={size.width}
                height={size.height}
              />
            ))}
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default SkiaRoadmapRenderer;
