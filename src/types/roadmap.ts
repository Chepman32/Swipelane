import type { SlideBackgroundGradient } from '../services/StorageService';

// ─── CAROUSEL TYPES ──────────────────────────────────────────────────────────

export interface CarouselCoverContent {
  subtitle: string;
  titlePart1: string;
  titlePart2: string;
  titleHighlight: string;
  description: string;
  buttonText: string;
  authorName: string;
  authorTitle: string;
  mainImageUri?: string;
  authorAvatarUri?: string;
}

export interface CarouselStepContent {
  titlePart1: string;
  titleHighlight: string;
  description: string;
}

export interface CarouselData {
  panelCount: number;
  backgroundColor: string;
  dividerColor: string;
  accentColor: string;
  shapeColor: string;
  showShapes: boolean;
  cover: CarouselCoverContent;
  steps: CarouselStepContent[];
}

// Circle position within a template (normalized 0-1 coordinates)
export interface RoadmapCircleDefinition {
  id: string;
  position: { x: number; y: number };
  radius: number;
  labelPosition: 'bottom' | 'top';
}

// Bezier curve connector between circles
export interface RoadmapConnectorDefinition {
  from: string;
  to: string;
  controlPoints: Array<{ x: number; y: number }>;
}

// Template definition (static configuration)
export interface RoadmapTemplate {
  id: string;
  name: string;
  description: string;
  circleCount: number;
  circles: RoadmapCircleDefinition[];
  connectors: RoadmapConnectorDefinition[];
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
  defaultDashPattern: number[];
}

// Content for a single circle in a slide
export interface RoadmapCircleContent {
  circleId: string;
  label: string;
  contentType: 'text' | 'image' | 'empty';
  text?: string;
  imageUri?: string;
  textStyle?: {
    fontSize: number;
    color: string;
    fontFamily?: string;
  };
}

// Corner image configuration
export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface CornerImage {
  position: CornerPosition;
  imageUri: string;
  size: number; // Normalized size (0-1)
  padding: number;
}

// Complete roadmap slide data
export interface RoadmapSlide {
  id: string;
  templateId: string;
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundGradient?: SlideBackgroundGradient | null;
  backgroundColor?: string;
  backgroundImageUri?: string;
  strokeColor: string;
  strokeWidth: number;
  circles: RoadmapCircleContent[];
  cornerImages: CornerImage[];
  carouselData?: CarouselData;
}

// Roadmap project state (for storage)
export interface RoadmapProjectState {
  id: string;
  type: 'roadmap';
  name: string;
  templateId: string;
  slide: RoadmapSlide;
  lastModified: string;
  isCompleted: boolean;
}

// Helper to create default circle content for a template
export function createDefaultCircleContent(
  template: RoadmapTemplate,
): RoadmapCircleContent[] {
  return template.circles.map((circle, index) => ({
    circleId: circle.id,
    label: `Step ${index + 1}`,
    contentType: 'empty' as const,
  }));
}

// Helper to create a new roadmap slide from a template
export function createRoadmapSlideFromTemplate(
  template: RoadmapTemplate,
  slideId: string,
): RoadmapSlide {
  return {
    id: slideId,
    templateId: template.id,
    backgroundType: 'gradient',
    backgroundGradient: null,
    strokeColor: template.defaultStrokeColor,
    strokeWidth: template.defaultStrokeWidth,
    circles: createDefaultCircleContent(template),
    cornerImages: [],
  };
}

export function createDefaultCarouselData(panelCount: number = 3): CarouselData {
  return {
    panelCount,
    backgroundColor: '#F5A623',
    dividerColor: '#D4920F',
    accentColor: '#2E4BFF',
    shapeColor: '#D4920F30',
    showShapes: true,
    cover: {
      subtitle: 'Learn how to turn an idea into a success',
      titlePart1: 'Unlock Your',
      titlePart2: 'Entrepreneurial',
      titleHighlight: 'Potential',
      description: 'Entrepreneurship is about taking risks, being creative and responding to the needs of customers.',
      buttonText: 'Swipe >',
      authorName: 'Your Name',
      authorTitle: 'Your Title',
      mainImageUri: undefined,
      authorAvatarUri: undefined,
    },
    steps: Array.from({ length: panelCount - 1 }, (_, i) => ({
      titlePart1: `Define Your`,
      titleHighlight: `Step ${i + 1}`,
      description: 'Add your description here to explain this step in detail.',
    })),
  };
}

// Helper to create a new roadmap project
export function createRoadmapProject(
  template: RoadmapTemplate,
  projectId?: string,
): RoadmapProjectState {
  const id = projectId || `roadmap_${Date.now()}`;
  return {
    id,
    type: 'roadmap',
    name: template.name,
    templateId: template.id,
    slide: createRoadmapSlideFromTemplate(template, `${id}_slide_1`),
    lastModified: new Date().toISOString(),
    isCompleted: false,
  };
}
