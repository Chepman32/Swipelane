import type { SlideBackgroundGradient } from '../services/StorageService';

export const GRADIENT_VARIANTS: SlideBackgroundGradient[] = [
  {
    id: 'ocean_blue',
    colors: ['#0EA5E9', '#2563EB'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'sunset_glow',
    colors: ['#F97316', '#EF4444'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'aurora_green',
    colors: ['#22C55E', '#14B8A6'],
    start: { x: 0, y: 0.2 },
    end: { x: 1, y: 0.8 },
  },
  {
    id: 'royal_purple',
    colors: ['#7C3AED', '#4F46E5'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.9 },
  },
  {
    id: 'midnight_ink',
    colors: ['#0F172A', '#1E293B'],
    start: { x: 0, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  {
    id: 'rose_blush',
    colors: ['#FB7185', '#F472B6'],
    start: { x: 0, y: 0.1 },
    end: { x: 1, y: 0.9 },
  },
  {
    id: 'golden_hour',
    colors: ['#F59E0B', '#FDE047'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'cool_sky',
    colors: ['#38BDF8', '#A5F3FC'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'deep_space',
    colors: ['#111827', '#4C1D95'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'electric_violet',
    colors: ['#A855F7', '#EC4899'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.8 },
  },
  {
    id: 'forest_mist',
    colors: ['#065F46', '#34D399'],
    start: { x: 0.1, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  {
    id: 'ember',
    colors: ['#B91C1C', '#F97316'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
];

export const DEFAULT_GRADIENT: SlideBackgroundGradient = GRADIENT_VARIANTS[0];

export const getGradientById = (id: string | undefined | null): SlideBackgroundGradient => {
  if (!id) {
    return DEFAULT_GRADIENT;
  }
  return GRADIENT_VARIANTS.find(gradient => gradient.id === id) ?? DEFAULT_GRADIENT;
};

