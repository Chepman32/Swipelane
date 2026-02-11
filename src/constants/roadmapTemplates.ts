import type { RoadmapTemplate } from '../types/roadmap';

// Default styling for roadmap elements
export const ROADMAP_DEFAULTS = {
  strokeColor: '#F5D547', // Yellow from template images
  strokeWidth: 4,
  dashPattern: [12, 8],
  circleRadius: 0.11, // Normalized radius
  labelBadgeColor: '#F5D547',
  labelTextColor: '#000000',
};

// Dark gradient backgrounds suitable for roadmaps
export const ROADMAP_BACKGROUNDS = [
  {
    id: 'dark_smoke',
    name: 'Dark Smoke',
    colors: ['#1a1a2e', '#16213e', '#0f0f23'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: ['#0f0c29', '#302b63', '#24243e'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'deep_void',
    name: 'Deep Void',
    colors: ['#000000', '#1a1a2e', '#0d0d0d'],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    colors: ['#232526', '#414345'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
];

// Template 1: 4 circles in 2x2 grid with S-curve connectors
// Matching the first attached image
export const GRID_4_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'grid_4_circles',
  name: '4-Step Journey',
  description: 'Four steps in a 2x2 grid with flowing path',
  circleCount: 4,
  circles: [
    { id: 'c1', position: { x: 0.22, y: 0.25 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.78, y: 0.25 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.22, y: 0.65 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.78, y: 0.75 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
  ],
  connectors: [
    // c1 to c2: horizontal curve going right
    {
      from: 'c1',
      to: 'c2',
      controlPoints: [
        { x: 0.40, y: 0.18 },
        { x: 0.60, y: 0.18 },
      ],
    },
    // c2 to c3: diagonal S-curve going down-left
    {
      from: 'c2',
      to: 'c3',
      controlPoints: [
        { x: 0.78, y: 0.45 },
        { x: 0.22, y: 0.45 },
      ],
    },
    // c3 to c4: curve going right and slightly down
    {
      from: 'c3',
      to: 'c4',
      controlPoints: [
        { x: 0.40, y: 0.80 },
        { x: 0.60, y: 0.70 },
      ],
    },
  ],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 2: 3 circles in diagonal arrangement
// Matching the second attached image
export const DIAGONAL_3_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'diagonal_3_circles',
  name: '3-Step Path',
  description: 'Three steps in a diagonal ascending path',
  circleCount: 3,
  circles: [
    { id: 'c1', position: { x: 0.25, y: 0.70 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.55, y: 0.50 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.75, y: 0.25 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
  ],
  connectors: [
    // c1 to c2: curve going up-right
    {
      from: 'c1',
      to: 'c2',
      controlPoints: [
        { x: 0.35, y: 0.55 },
        { x: 0.45, y: 0.55 },
      ],
    },
    // c2 to c3: curve continuing up-right, with loop around c2
    {
      from: 'c2',
      to: 'c3',
      controlPoints: [
        { x: 0.65, y: 0.60 },
        { x: 0.70, y: 0.40 },
      ],
    },
  ],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 3: 5 circles alternating above/below a winding S-road
// Matching IMG_0497: sinusoidal road with icons along the path
export const WINDING_5_ROAD_TEMPLATE: RoadmapTemplate = {
  id: 'winding_5_road',
  name: '5-Step Winding Road',
  description: 'Five steps along a winding road path',
  circleCount: 5,
  circles: [
    { id: 'c1', position: { x: 0.14, y: 0.38 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'top' },
    { id: 'c2', position: { x: 0.34, y: 0.60 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.50, y: 0.38 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'top' },
    { id: 'c4', position: { x: 0.66, y: 0.60 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.84, y: 0.38 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'top' },
  ],
  connectors: [
    // c1 to c2: curve down-right
    {
      from: 'c1',
      to: 'c2',
      controlPoints: [
        { x: 0.20, y: 0.40 },
        { x: 0.28, y: 0.58 },
      ],
    },
    // c2 to c3: curve up-right
    {
      from: 'c2',
      to: 'c3',
      controlPoints: [
        { x: 0.40, y: 0.62 },
        { x: 0.44, y: 0.38 },
      ],
    },
    // c3 to c4: curve down-right
    {
      from: 'c3',
      to: 'c4',
      controlPoints: [
        { x: 0.56, y: 0.38 },
        { x: 0.60, y: 0.58 },
      ],
    },
    // c4 to c5: curve up-right
    {
      from: 'c4',
      to: 'c5',
      controlPoints: [
        { x: 0.72, y: 0.62 },
        { x: 0.78, y: 0.38 },
      ],
    },
  ],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 4: 4 circles in a horizontal chain
// Matching IMG_0498: linked circles connected by horizontal bar connectors
export const LINEAR_4_CHAIN_TEMPLATE: RoadmapTemplate = {
  id: 'linear_4_chain',
  name: '4-Step Chain',
  description: 'Four steps linked in a horizontal chain',
  circleCount: 4,
  circles: [
    { id: 'c1', position: { x: 0.12, y: 0.45 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.37, y: 0.45 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.63, y: 0.45 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.88, y: 0.45 }, radius: ROADMAP_DEFAULTS.circleRadius, labelPosition: 'bottom' },
  ],
  connectors: [
    // c1 to c2: horizontal
    {
      from: 'c1',
      to: 'c2',
      controlPoints: [
        { x: 0.21, y: 0.45 },
        { x: 0.28, y: 0.45 },
      ],
    },
    // c2 to c3: horizontal
    {
      from: 'c2',
      to: 'c3',
      controlPoints: [
        { x: 0.46, y: 0.45 },
        { x: 0.54, y: 0.45 },
      ],
    },
    // c3 to c4: horizontal
    {
      from: 'c3',
      to: 'c4',
      controlPoints: [
        { x: 0.72, y: 0.45 },
        { x: 0.79, y: 0.45 },
      ],
    },
  ],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// All available templates
export const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  GRID_4_CIRCLES_TEMPLATE,
  DIAGONAL_3_CIRCLES_TEMPLATE,
  WINDING_5_ROAD_TEMPLATE,
  LINEAR_4_CHAIN_TEMPLATE,
];

// Get template by ID
export function getRoadmapTemplateById(id: string): RoadmapTemplate | undefined {
  return ROADMAP_TEMPLATES.find(t => t.id === id);
}
