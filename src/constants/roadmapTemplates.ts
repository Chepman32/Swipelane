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

// Template 1: Figure-8 loop with four side icons
// Image-backed; circles are used as editable tap targets near icons.
export const GRID_4_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'grid_4_circles',
  name: 'Figure 8 Loop',
  description: 'Big colorful 8 with icon-side content blocks',
  circleCount: 4,
  circles: [
    { id: 'c1', position: { x: 0.23, y: 0.34 }, radius: 0.048, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.77, y: 0.34 }, radius: 0.048, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.23, y: 0.69 }, radius: 0.048, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.77, y: 0.69 }, radius: 0.048, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Legacy Template: 3 circles
export const TEMPLATE_3_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'template_3_circles',
  name: '3 Circles',
  description: 'Three-step roadmap template',
  circleCount: 3,
  circles: [
    { id: 'c1', position: { x: 0.24, y: 0.31 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.50, y: 0.50 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.76, y: 0.69 }, radius: 0.09, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Legacy Template: 4 circles
export const TEMPLATE_4_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'template_4_circles',
  name: '4 Circles',
  description: 'Four-step roadmap template',
  circleCount: 4,
  circles: [
    { id: 'c1', position: { x: 0.25, y: 0.29 }, radius: 0.085, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.75, y: 0.29 }, radius: 0.085, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.25, y: 0.71 }, radius: 0.085, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.75, y: 0.71 }, radius: 0.085, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 2: Infinity loop with three colored circles
// Image-backed; circles are used as editable tap targets.
export const DIAGONAL_3_CIRCLES_TEMPLATE: RoadmapTemplate = {
  id: 'diagonal_3_circles',
  name: 'Infinity Loop',
  description: 'Three circle callouts under an infinity path',
  circleCount: 3,
  circles: [
    { id: 'c1', position: { x: 0.19, y: 0.56 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.50, y: 0.69 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.81, y: 0.56 }, radius: 0.055, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 3: Horizontal looped track (infinity zones)
// Image-backed; eight tap targets map to colored loop zones.
export const WINDING_5_ROAD_TEMPLATE: RoadmapTemplate = {
  id: 'winding_5_road',
  name: 'Horizontal Loop Track',
  description: 'Place text directly on colored infinity zones',
  circleCount: 8,
  circles: [
    { id: 'c1', position: { x: 0.21, y: 0.25 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.38, y: 0.15 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.63, y: 0.15 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.80, y: 0.25 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.80, y: 0.50 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c6', position: { x: 0.63, y: 0.61 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c7', position: { x: 0.38, y: 0.61 }, radius: 0.055, labelPosition: 'bottom' },
    { id: 'c8', position: { x: 0.21, y: 0.50 }, radius: 0.055, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 11: Vertical rail with five alternating icon/text rows
// Image-backed; five tap targets are aligned to large icons along the rail.
export const VERTICAL_ICON_RAIL_5_TEMPLATE: RoadmapTemplate = {
  id: 'vertical_icon_rail_5',
  name: 'Vertical Icon Rail',
  description: 'Five alternating icon and text callouts on a vertical rail',
  circleCount: 5,
  circles: [
    { id: 'c1', position: { x: 0.59, y: 0.14 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.435, y: 0.30 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.59, y: 0.47 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.435, y: 0.64 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.59, y: 0.81 }, radius: 0.058, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 12: Winding road with six map markers
// Image-backed; each pin controls one title/description callout block.
export const ROAD_TRACK_6_TEMPLATE: RoadmapTemplate = {
  id: 'road_track_6',
  name: 'Winding Road Track',
  description: 'Six marker callouts along a curved road',
  circleCount: 6,
  circles: [
    { id: 'c1', position: { x: 0.115, y: 0.685 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.74, y: 0.54 }, radius: 0.12, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.29, y: 0.37 }, radius: 0.156, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.565, y: 0.28 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.375, y: 0.23 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c6', position: { x: 0.895, y: 0.21 }, radius: 0.06, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 13: Zigzag alternating icon/text timeline (5 steps)
// Image-backed; five tap targets are aligned to large icons along a central rail.
export const ZIGZAG_TIMELINE_5_TEMPLATE: RoadmapTemplate = {
  id: 'zigzag_timeline_5',
  name: 'Zigzag Timeline',
  description: 'Five-step alternating icon and text callouts on a zigzag rail',
  circleCount: 5,
  circles: [
    { id: 'c1', position: { x: 0.72, y: 0.14 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.28, y: 0.32 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.72, y: 0.50 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.28, y: 0.68 }, radius: 0.058, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.72, y: 0.86 }, radius: 0.058, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 4: 4 circles in a horizontal chain
// Matching IMG_0497: linked circles connected by horizontal bar connectors
// Canvas is portrait 5:6; radius 0.09 gives ~7% width gap between adjacent circles
export const LINEAR_4_CHAIN_TEMPLATE: RoadmapTemplate = {
  id: 'linear_4_chain',
  name: '4-Step Chain',
  description: 'Four steps linked in a horizontal chain',
  circleCount: 4,
  circles: [
    { id: 'c1', position: { x: 0.12, y: 0.43 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.37, y: 0.43 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.63, y: 0.43 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.88, y: 0.43 }, radius: 0.09, labelPosition: 'bottom' },
  ],
  connectors: [
    // c1 to c2: straight horizontal
    {
      from: 'c1',
      to: 'c2',
      controlPoints: [
        { x: 0.21, y: 0.43 },
        { x: 0.28, y: 0.43 },
      ],
    },
    // c2 to c3: straight horizontal
    {
      from: 'c2',
      to: 'c3',
      controlPoints: [
        { x: 0.46, y: 0.43 },
        { x: 0.54, y: 0.43 },
      ],
    },
    // c3 to c4: straight horizontal
    {
      from: 'c3',
      to: 'c4',
      controlPoints: [
        { x: 0.72, y: 0.43 },
        { x: 0.79, y: 0.43 },
      ],
    },
  ],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 5: Bubble timeline with dynamic milestones
// Drawn procedurally to support bubble count (2-5) and per-bubble colors.
export const BUBBLE_TIMELINE_6_TEMPLATE: RoadmapTemplate = {
  id: 'bubble_timeline_6',
  name: 'Bubble Percentage',
  description: 'Alternating year milestones with percentage bubbles (2–5)',
  circleCount: 5,
  circles: [
    { id: 'c1', position: { x: 0.14, y: 0.52 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.32, y: 0.50 }, radius: 0.12, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.50, y: 0.53 }, radius: 0.075, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.68, y: 0.50 }, radius: 0.10, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.84, y: 0.51 }, radius: 0.13, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 6: Diagonal ribbons with 3 steps
// Image-backed; circles are used as editable tap targets on each colored ribbon.
export const RIBBON_STEPS_3_TEMPLATE: RoadmapTemplate = {
  id: 'ribbon_steps_3',
  name: 'Ribbon Steps',
  description: 'Three staggered ribbons with step labels and copy',
  circleCount: 3,
  circles: [
    { id: 'c1', position: { x: 0.205, y: 0.43 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.465, y: 0.635 }, radius: 0.09, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.735, y: 0.84 }, radius: 0.09, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 8: Vertical flow with 5 colored steps (alternating left/right icons)
// Image-backed; circles are invisible tap targets near each step's text area.
export const VERTICAL_FLOW_5_TEMPLATE: RoadmapTemplate = {
  id: 'vertical_flow_5',
  name: 'Vertical Ivory Flow',
  description: 'Five steps with alternating icons and colored titles',
  circleCount: 5,
  circles: [
    { id: 'c1', position: { x: 0.60, y: 0.11 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.35, y: 0.27 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.60, y: 0.43 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.32, y: 0.60 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.30, y: 0.78 }, radius: 0.04, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 9: 6-step grid with numbered circles on dark background
// Image-backed; two rows of three cards with mint-colored step numbers.
export const GRID_STEPS_6_TEMPLATE: RoadmapTemplate = {
  id: 'grid_steps_6',
  name: 'Grid Steps',
  description: 'Six numbered steps in a 2×3 card grid',
  circleCount: 6,
  circles: [
    { id: 'c1', position: { x: 0.18, y: 0.28 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.50, y: 0.28 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.82, y: 0.28 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.18, y: 0.70 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.50, y: 0.70 }, radius: 0.04, labelPosition: 'bottom' },
    { id: 'c6', position: { x: 0.82, y: 0.70 }, radius: 0.04, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 10: 10-step process cards on a soft grid background
// Rendered fully in Skia (no image asset) to keep it crisp across all screens.
export const PROCESS_CARDS_10_TEMPLATE: RoadmapTemplate = {
  id: 'process_cards_10',
  name: 'Process Cards',
  description: 'Ten-step alternating card layout with icon chips',
  circleCount: 10,
  circles: [
    { id: 'c1', position: { x: 0.2625, y: 0.1685 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c2', position: { x: 0.7375, y: 0.1685 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c3', position: { x: 0.2625, y: 0.3335 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c4', position: { x: 0.7375, y: 0.3335 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c5', position: { x: 0.2625, y: 0.4995 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c6', position: { x: 0.7375, y: 0.4995 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c7', position: { x: 0.2625, y: 0.6645 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c8', position: { x: 0.7375, y: 0.6645 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c9', position: { x: 0.2625, y: 0.8565 }, radius: 0.06, labelPosition: 'bottom' },
    { id: 'c10', position: { x: 0.7375, y: 0.8565 }, radius: 0.06, labelPosition: 'bottom' },
  ],
  connectors: [],
  defaultStrokeColor: ROADMAP_DEFAULTS.strokeColor,
  defaultStrokeWidth: ROADMAP_DEFAULTS.strokeWidth,
  defaultDashPattern: ROADMAP_DEFAULTS.dashPattern,
};

// Template 7: Multi-panel swipeable carousel
export const CAROUSEL_TEMPLATE: RoadmapTemplate = {
  id: 'carousel',
  name: 'LinkedIn Carousel',
  description: 'Multi-panel swipeable carousel (2–5 panels)',
  circleCount: 0,
  circles: [],
  connectors: [],
  defaultStrokeColor: '#F5A623',
  defaultStrokeWidth: 0,
  defaultDashPattern: [],
};

// All available templates
export const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  GRID_4_CIRCLES_TEMPLATE,
  TEMPLATE_3_CIRCLES_TEMPLATE,
  TEMPLATE_4_CIRCLES_TEMPLATE,
  DIAGONAL_3_CIRCLES_TEMPLATE,
  WINDING_5_ROAD_TEMPLATE,
  VERTICAL_ICON_RAIL_5_TEMPLATE,
  ROAD_TRACK_6_TEMPLATE,
  ZIGZAG_TIMELINE_5_TEMPLATE,
  LINEAR_4_CHAIN_TEMPLATE,
  BUBBLE_TIMELINE_6_TEMPLATE,
  RIBBON_STEPS_3_TEMPLATE,
  VERTICAL_FLOW_5_TEMPLATE,
  GRID_STEPS_6_TEMPLATE,
  PROCESS_CARDS_10_TEMPLATE,
  CAROUSEL_TEMPLATE,
];

// Get template by ID
export function getRoadmapTemplateById(id: string): RoadmapTemplate | undefined {
  return ROADMAP_TEMPLATES.find(t => t.id === id);
}
