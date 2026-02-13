export type RoadmapImageTextAlign = 'left' | 'center' | 'right';
export type RoadmapImageTextFont = 'title' | 'body' | 'small' | 'bodyBold' | 'smallBold';

export interface RoadmapImageTextAnchorConfig {
  x: number;
  y: number;
  maxWidth: number;
  align?: RoadmapImageTextAlign;
  color?: string;
  font?: RoadmapImageTextFont;
  firstLineFont?: RoadmapImageTextFont;
  firstLineColor?: string;
  lineHeightMultiplier?: number;
  maxLines?: number;
}

export interface RoadmapImageTextSlotConfig {
  circleId: string;
  label?: RoadmapImageTextAnchorConfig;
  detail?: RoadmapImageTextAnchorConfig;
}

export interface RoadmapImageBackedTemplateConfig {
  source: number;
  originalWidth: number;
  originalHeight: number;
  contentScale?: number;
  canvasBackgroundColor?: string;
  textSlots: RoadmapImageTextSlotConfig[];
}

export const ROADMAP_TEMPLATE_IMAGES = {
  grid_4_circles: require('../assets/templates/694FFAFD-27CF-4DC0-94BA-6FF46B70664D.png'),
  template_3_circles: require('../assets/templates/template_4_circles.png'),
  template_4_circles: require('../assets/templates/template_3_circles.png'),
  diagonal_3_circles: require('../assets/templates/084C532A-15B3-478C-8F7B-724D433963B4.png'),
  winding_5_road: require('../assets/templates/C08B69DD-104A-4963-B5E0-D5D820319629.png'),
  linear_4_chain: require('../assets/templates/IMG_0497.png'),
  bubble_timeline_6: require('../assets/templates/45982A3E-171A-4953-9D3C-623C72B2CC5B.png'),
  ribbon_steps_3: require('../assets/templates/F24B4734-F6F7-4DD6-8344-4782A1F3BF1C.png'),
} as const;

type RoadmapTemplateImageId = keyof typeof ROADMAP_TEMPLATE_IMAGES;

export const ROADMAP_IMAGE_BACKED_TEMPLATE_CONFIG: Partial<
  Record<RoadmapTemplateImageId, RoadmapImageBackedTemplateConfig>
> = {
  grid_4_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.grid_4_circles,
    originalWidth: 1044,
    originalHeight: 896,
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.16, y: 0.33, maxWidth: 0.18, align: 'right', color: '#D85D4C', font: 'title' },
        detail: {
          x: 0.16,
          y: 0.38,
          maxWidth: 0.18,
          align: 'right',
          color: '#515151',
          font: 'small',
          lineHeightMultiplier: 1.28,
          maxLines: 4,
        },
      },
      {
        circleId: 'c2',
        label: { x: 0.84, y: 0.31, maxWidth: 0.16, align: 'left', color: '#3FAFC4', font: 'title' },
        detail: {
          x: 0.84,
          y: 0.36,
          maxWidth: 0.16,
          align: 'left',
          color: '#515151',
          font: 'small',
          lineHeightMultiplier: 1.28,
          maxLines: 4,
        },
      },
      {
        circleId: 'c3',
        label: { x: 0.17, y: 0.66, maxWidth: 0.18, align: 'right', color: '#CD9525', font: 'title' },
        detail: {
          x: 0.17,
          y: 0.71,
          maxWidth: 0.18,
          align: 'right',
          color: '#515151',
          font: 'small',
          lineHeightMultiplier: 1.28,
          maxLines: 4,
        },
      },
      {
        circleId: 'c4',
        label: { x: 0.84, y: 0.66, maxWidth: 0.16, align: 'left', color: '#649366', font: 'title' },
        detail: {
          x: 0.84,
          y: 0.71,
          maxWidth: 0.16,
          align: 'left',
          color: '#515151',
          font: 'small',
          lineHeightMultiplier: 1.28,
          maxLines: 4,
        },
      },
    ],
  },
  template_3_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.template_3_circles,
    originalWidth: 1024,
    originalHeight: 1024,
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.22, y: 0.72, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.23, y: 0.82, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
      {
        circleId: 'c2',
        label: { x: 0.82, y: 0.40, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.82, y: 0.49, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
      {
        circleId: 'c3',
        label: { x: 0.67, y: 0.85, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.66, y: 0.96, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
    ],
  },
  template_4_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.template_4_circles,
    originalWidth: 1024,
    originalHeight: 1024,
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.19, y: 0.36, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.19, y: 0.46, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
      {
        circleId: 'c2',
        label: { x: 0.82, y: 0.385, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.82, y: 0.49, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
      {
        circleId: 'c3',
        label: { x: 0.21, y: 0.75, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.21, y: 0.85, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
      {
        circleId: 'c4',
        label: { x: 0.81, y: 0.81, maxWidth: 0.16, align: 'center', color: '#000000', font: 'body' },
        detail: { x: 0.81, y: 0.91, maxWidth: 0.20, align: 'center', color: '#000000', font: 'small', maxLines: 3 },
      },
    ],
  },
  diagonal_3_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.diagonal_3_circles,
    originalWidth: 1024,
    originalHeight: 1024,
    canvasBackgroundColor: '#1B2A3C',
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.19, y: 0.66, maxWidth: 0.24, align: 'center', color: '#583BEE', font: 'title' },
        detail: {
          x: 0.19,
          y: 0.71,
          maxWidth: 0.26,
          align: 'center',
          color: '#F5F5F5',
          font: 'small',
          lineHeightMultiplier: 1.22,
          maxLines: 4,
        },
      },
      {
        circleId: 'c2',
        label: { x: 0.50, y: 0.78, maxWidth: 0.24, align: 'center', color: '#F23B67', font: 'title' },
        detail: {
          x: 0.50,
          y: 0.83,
          maxWidth: 0.26,
          align: 'center',
          color: '#F5F5F5',
          font: 'small',
          lineHeightMultiplier: 1.22,
          maxLines: 4,
        },
      },
      {
        circleId: 'c3',
        label: { x: 0.85, y: 0.66, maxWidth: 0.24, align: 'center', color: '#F78435', font: 'title' },
        detail: {
          x: 0.85,
          y: 0.71,
          maxWidth: 0.26,
          align: 'center',
          color: '#F5F5F5',
          font: 'small',
          lineHeightMultiplier: 1.22,
          maxLines: 4,
        },
      },
    ],
  },
  winding_5_road: {
    source: ROADMAP_TEMPLATE_IMAGES.winding_5_road,
    originalWidth: 1536,
    originalHeight: 1024,
    textSlots: [
      { circleId: 'c1', label: { x: 0.16, y: 0.39, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c2', label: { x: 0.40, y: 0.24, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c3', label: { x: 0.64, y: 0.23, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c4', label: { x: 0.84, y: 0.39, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c5', label: { x: 0.83, y: 0.60, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c6', label: { x: 0.66, y: 0.76, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c7', label: { x: 0.36, y: 0.74, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c8', label: { x: 0.18, y: 0.60, maxWidth: 0.12, align: 'center', color: '#FFFFFF', font: 'body' } },
    ],
  },
  linear_4_chain: {
    source: ROADMAP_TEMPLATE_IMAGES.linear_4_chain,
    originalWidth: 6144,
    originalHeight: 3140,
    canvasBackgroundColor: '#000000',
    textSlots: [
      { circleId: 'c1', label: { x: 0.12, y: 0.70, maxWidth: 0.16, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c2', label: { x: 0.37, y: 0.70, maxWidth: 0.16, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c3', label: { x: 0.63, y: 0.70, maxWidth: 0.16, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c4', label: { x: 0.88, y: 0.70, maxWidth: 0.16, align: 'center', color: '#FFFFFF', font: 'body' } },
    ],
  },
  ribbon_steps_3: {
    source: ROADMAP_TEMPLATE_IMAGES.ribbon_steps_3,
    originalWidth: 1024,
    originalHeight: 1024,
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.115, y: 0.35, maxWidth: 0.14, align: 'center', color: '#FFFFFF', font: 'title' },
        detail: {
          x: 0.035,
          y: 0.125,
          maxWidth: 0.29,
          align: 'left',
          color: '#AD5838',
          font: 'small',
          lineHeightMultiplier: 1.12,
          maxLines: 4,
        },
      },
      {
        circleId: 'c2',
        label: { x: 0.385, y: 0.585, maxWidth: 0.14, align: 'center', color: '#FFFFFF', font: 'title' },
        detail: {
          x: 0.305,
          y: 0.365,
          maxWidth: 0.29,
          align: 'left',
          color: '#D79C45',
          font: 'small',
          lineHeightMultiplier: 1.12,
          maxLines: 4,
        },
      },
      {
        circleId: 'c3',
        label: { x: 0.625, y: 0.84, maxWidth: 0.14, align: 'center', color: '#FFFFFF', font: 'title' },
        detail: {
          x: 0.585,
          y: 0.605,
          maxWidth: 0.29,
          align: 'left',
          color: '#2E8E9C',
          font: 'small',
          lineHeightMultiplier: 1.12,
          maxLines: 4,
        },
      },
    ],
  },
};

export function getRoadmapTemplateImageSource(templateId: string): number | undefined {
  return ROADMAP_TEMPLATE_IMAGES[templateId as RoadmapTemplateImageId];
}

export function getRoadmapImageBackedTemplateConfig(
  templateId: string,
): RoadmapImageBackedTemplateConfig | null {
  return ROADMAP_IMAGE_BACKED_TEMPLATE_CONFIG[
    templateId as keyof typeof ROADMAP_IMAGE_BACKED_TEMPLATE_CONFIG
  ] || null;
}

export function isRoadmapImageBackedTemplate(templateId: string): boolean {
  return getRoadmapImageBackedTemplateConfig(templateId) !== null;
}
