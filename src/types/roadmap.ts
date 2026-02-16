import type { SlideBackgroundGradient } from '../services/StorageService';
import type { ProcessCardIconKind } from '../constants/processCardIcons';
import { PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID } from '../constants/processCardIcons';

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
  title?: string;
  contentType: 'text' | 'image' | 'empty';
  text?: string;
  imageUri?: string;
  textStyle?: {
    fontSize: number;
    color: string;
    fontFamily?: string;
  };
  iconKey?: ProcessCardIconKind;
  iconImageUri?: string;
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
  folderId?: string;
  isTrashed?: boolean;
}

// Helper to create default circle content for a template
export function createDefaultCircleContent(
  template: RoadmapTemplate,
): RoadmapCircleContent[] {
  if (template.id === 'bubble_timeline_6') {
    const percentages = ['61%', '48%', '3%', '8%', '54%'];
    const years = ['2012', '2013', '2014', '2015', '2016'];
    const colors = ['#C6A574', '#6F9E62', '#4B79A6', '#B9494D', '#F28F29'];
    return template.circles.map((circle, index) => {
      const year = years[index] || String(2012 + index);
      return {
        circleId: circle.id,
        label: percentages[index] || `${index + 1}%`,
        title: year,
        contentType: 'text' as const,
        text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        textStyle: { fontSize: 14, color: colors[index % colors.length] },
      };
    });
  }

  if (template.id === 'ribbon_steps_3') {
    return template.circles.map((circle, index) => ({
      circleId: circle.id,
      label: `STEP\n${String(index + 1).padStart(2, '0')}`,
      contentType: 'text' as const,
      text: 'LOREM IPSUM\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
    }));
  }

  if (template.id === 'grid_steps_6') {
    const defaultTitles = [
      'Define Your Vision',
      'Plan Your Path',
      'Plan Path',
      'Take Action',
      'Review & Adapt',
      'Achieve Success',
    ];
    const defaultDescriptions = [
      'Clarity is key',
      'Strategy matters',
      'Execution drives',
      'Execution drives',
      'Flexibility wins',
      'Consistency pays',
    ];
    return template.circles.map((circle, index) => ({
      circleId: circle.id,
      label: `${index + 1}`,
      title: defaultTitles[index] || `Step ${index + 1}`,
      contentType: 'text' as const,
      text: defaultDescriptions[index] || 'Add your description here.',
    }));
  }

  if (template.id === 'process_cards_10') {
    const defaultTitles = [
      'Initial Research',
      'Planning & Strategy',
      'Planning &',
      'Prototype Development',
      'User Testing',
      'Feedback Analysis',
      'Finalization',
      'Iterative Design',
      'Deployment',
      'Post-Launch Review',
    ];

    return template.circles.map((circle, index) => ({
      circleId: circle.id,
      label: `${index + 1}.`,
      title: defaultTitles[index] || `Step ${index + 1}`,
      contentType: 'text' as const,
      text: '',
      iconKey: PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[circle.id],
    }));
  }

  if (template.id === 'vertical_icon_rail_5') {
    return template.circles.map(circle => ({
      circleId: circle.id,
      label: 'Lorem Ipsum',
      contentType: 'text' as const,
      text: 'Some important note',
      iconKey: PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID[circle.id],
    }));
  }

  if (template.id === 'road_track_6') {
    return template.circles.map((circle, index) => ({
      circleId: circle.id,
      label: `Your Text ${index + 1}`,
      contentType: 'text' as const,
      text: 'Download this awesome diagram.\nCapture your audience\'s attention.',
    }));
  }

  if (template.id === 'radial_spokes_8') {
    return template.circles.map(circle => ({
      circleId: circle.id,
      label: 'Lorem Ipsum',
      contentType: 'text' as const,
      text: 'Lorem ipsum dolor sit amet,\nmagna maecenas, quam nec quis,\nlorem nunc.',
    }));
  }

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
