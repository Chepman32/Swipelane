export interface RoadmapImageBackedTemplateConfig {
  source: number;
  originalWidth: number;
  originalHeight: number;
  textMode: 'linear_under_arrows' | 'winding_above_and_below';
  canvasBackgroundColor: string;
}

export const ROADMAP_TEMPLATE_IMAGES = {
  grid_4_circles: require('../assets/templates/template_4_circles.png'),
  diagonal_3_circles: require('../assets/templates/template_3_circles.png'),
  winding_5_road: require('../assets/templates/IMG_0498.png'),
  linear_4_chain: require('../assets/templates/IMG_0497.png'),
} as const;

type RoadmapTemplateImageId = keyof typeof ROADMAP_TEMPLATE_IMAGES;

export const ROADMAP_IMAGE_BACKED_TEMPLATE_CONFIG: Record<
  'winding_5_road' | 'linear_4_chain',
  RoadmapImageBackedTemplateConfig
> = {
  winding_5_road: {
    source: ROADMAP_TEMPLATE_IMAGES.winding_5_road,
    originalWidth: 1536,
    originalHeight: 1084,
    textMode: 'winding_above_and_below',
    canvasBackgroundColor: '#E7E7E7',
  },
  linear_4_chain: {
    source: ROADMAP_TEMPLATE_IMAGES.linear_4_chain,
    originalWidth: 6144,
    originalHeight: 3140,
    textMode: 'linear_under_arrows',
    canvasBackgroundColor: '#E7E7E7',
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
