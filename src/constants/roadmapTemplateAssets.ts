export type RoadmapImageTextAlign = 'left' | 'center' | 'right';
export type RoadmapImageTextFont = 'title' | 'body' | 'small';

export interface RoadmapImageTextAnchorConfig {
  x: number;
  y: number;
  maxWidth: number;
  align?: RoadmapImageTextAlign;
  color?: string;
  font?: RoadmapImageTextFont;
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
  canvasBackgroundColor: string;
  textSlots: RoadmapImageTextSlotConfig[];
}

export const ROADMAP_TEMPLATE_IMAGES = {
  grid_4_circles: require('../assets/templates/694FFAFD-27CF-4DC0-94BA-6FF46B70664D.jpg'),
  diagonal_3_circles: require('../assets/templates/084C532A-15B3-478C-8F7B-724D433963B4.png'),
  winding_5_road: require('../assets/templates/C08B69DD-104A-4963-B5E0-D5D820319629.png'),
  linear_4_chain: require('../assets/templates/IMG_0497.png'),
} as const;

type RoadmapTemplateImageId = keyof typeof ROADMAP_TEMPLATE_IMAGES;

export const ROADMAP_IMAGE_BACKED_TEMPLATE_CONFIG: Record<
  RoadmapTemplateImageId,
  RoadmapImageBackedTemplateConfig
> = {
  grid_4_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.grid_4_circles,
    originalWidth: 1044,
    originalHeight: 896,
    canvasBackgroundColor: '#E7E7E7',
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.17, y: 0.30, maxWidth: 0.18, align: 'right', color: '#D85D4C', font: 'title' },
        detail: {
          x: 0.17,
          y: 0.35,
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
        label: { x: 0.82, y: 0.30, maxWidth: 0.16, align: 'left', color: '#3FAFC4', font: 'title' },
        detail: {
          x: 0.82,
          y: 0.35,
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
        label: { x: 0.82, y: 0.66, maxWidth: 0.16, align: 'left', color: '#649366', font: 'title' },
        detail: {
          x: 0.82,
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
  diagonal_3_circles: {
    source: ROADMAP_TEMPLATE_IMAGES.diagonal_3_circles,
    originalWidth: 1024,
    originalHeight: 1024,
    canvasBackgroundColor: '#1B2A3C',
    textSlots: [
      {
        circleId: 'c1',
        label: { x: 0.19, y: 0.76, maxWidth: 0.24, align: 'center', color: '#583BEE', font: 'title' },
        detail: {
          x: 0.19,
          y: 0.81,
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
        label: { x: 0.50, y: 0.88, maxWidth: 0.24, align: 'center', color: '#F23B67', font: 'title' },
        detail: {
          x: 0.50,
          y: 0.93,
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
        label: { x: 0.81, y: 0.76, maxWidth: 0.24, align: 'center', color: '#F78435', font: 'title' },
        detail: {
          x: 0.81,
          y: 0.81,
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
    canvasBackgroundColor: '#E7E7E7',
    textSlots: [
      { circleId: 'c1', label: { x: 0.20, y: 0.24, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c2', label: { x: 0.38, y: 0.15, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c3', label: { x: 0.63, y: 0.15, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c4', label: { x: 0.80, y: 0.24, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c5', label: { x: 0.80, y: 0.52, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c6', label: { x: 0.63, y: 0.62, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c7', label: { x: 0.38, y: 0.62, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
      { circleId: 'c8', label: { x: 0.20, y: 0.52, maxWidth: 0.15, align: 'center', color: '#FFFFFF', font: 'body' } },
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
