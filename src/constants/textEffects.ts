import { nanoid } from 'nanoid/non-secure';

export type TextEffectCategory =
  | 'fill'
  | 'stroke'
  | 'lighting'
  | 'compositing'
  | 'masking'
  | 'distortion'
  | 'texture'
  | 'special';

export type TextEffectLayer =
  | 'textFill'
  | 'textStroke'
  | 'overlay'
  | 'underlay'
  | 'background'
  | 'mask'
  | 'postprocess';

export type TextEffectParameterType =
  | 'color'
  | 'number'
  | 'slider'
  | 'angle'
  | 'vector2'
  | 'vector3'
  | 'option'
  | 'boolean'
  | 'gradient'
  | 'image'
  | 'noise'
  | 'time'
  | 'text';

export interface TextEffectParameterDefinition<TValue = any> {
  id: string;
  label: string;
  type: TextEffectParameterType;
  defaultValue: TValue;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export type RuntimeShaderVariant =
  | 'noise'
  | 'iridescence'
  | 'plasma'
  | 'fire'
  | 'chrome';

export type BlendModeVariant =
  | 'sourceOver'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'softLight'
  | 'hardLight'
  | 'colorBurn'
  | 'colorDodge'
  | 'lighten'
  | 'darken';

export type MediaMaskSource = 'image' | 'video' | 'shader';

export type TextEffectType =
  | 'animatedGradient'
  | 'patternFill'
  | 'runtimeShader'
  | 'gradientStroke'
  | 'multiStroke'
  | 'dashedStroke'
  | 'neonGlow'
  | 'softShadow'
  | 'longShadow'
  | 'bloom'
  | 'glassmorphism'
  | 'knockout'
  | 'blendMode'
  | 'mediaMask'
  | 'clipPath'
  | 'progressFill'
  | 'waveDistortion'
  | 'chromaticAberration'
  | 'glitch'
  | 'crt'
  | 'fisheye'
  | 'specularHighlight'
  | 'lightRays'
  | 'cmykMisprint'
  | 'letterpress'
  | 'textureOverlay'
  | 'chalk'
  | 'shineSweep'
  | 'particles'
  | 'glossy3d'
  | 'chrome3d';

export interface TextEffectDefinition {
  id: TextEffectType;
  name: string;
  category: TextEffectCategory;
  layer: TextEffectLayer;
  description: string;
  parameters: TextEffectParameterDefinition[];
  supportsAnimation?: boolean;
  canStackWithFill?: boolean;
  tags?: string[];
}

export interface TextEffectInstance {
  instanceId: string;
  type: TextEffectType;
  enabled: boolean;
  parameters: Record<string, any>;
  createdAt: number;
}

export const createTextEffectInstance = (
  type: TextEffectType,
  parameterDefaults?: Record<string, any>,
): TextEffectInstance => {
  const definition = TEXT_EFFECT_DEFINITIONS[type];
  const defaultsFromDefinition = definition?.parameters.reduce<
    Record<string, any>
  >((acc, param) => {
    acc[param.id] = param.defaultValue;
    return acc;
  }, {});

  return {
    instanceId: nanoid(10),
    type,
    enabled: true,
    parameters: {
      ...defaultsFromDefinition,
      ...(parameterDefaults || {}),
    },
    createdAt: Date.now(),
  };
};

const baseGradientStops = [
  { offset: 0, color: '#FF00FF' },
  { offset: 0.5, color: '#00FFFF' },
  { offset: 1, color: '#FFFF00' },
];

export const TEXT_EFFECT_DEFINITIONS: Record<
  TextEffectType,
  TextEffectDefinition
> = {
  animatedGradient: {
    id: 'animatedGradient',
    name: 'Animated Gradient',
    category: 'fill',
    layer: 'textFill',
    description: 'Animated multi-stop gradient sweeping across the text fill.',
    parameters: [
      {
        id: 'gradientStops',
        label: 'Gradient Stops',
        type: 'gradient',
        defaultValue: baseGradientStops,
      },
      {
        id: 'angle',
        label: 'Angle',
        type: 'angle',
        defaultValue: 45,
        min: 0,
        max: 360,
      },
      {
        id: 'speed',
        label: 'Animation Speed',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 3,
        step: 0.05,
      },
      {
        id: 'offsetVariation',
        label: 'Offset Variation',
        type: 'slider',
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  patternFill: {
    id: 'patternFill',
    name: 'Texture Fill',
    category: 'fill',
    layer: 'textFill',
    description: 'Fill the text with an image pattern or procedural texture.',
    parameters: [
      {
        id: 'patternSource',
        label: 'Pattern Source',
        type: 'option',
        defaultValue: 'fabric',
        options: [
          { value: 'fabric', label: 'Fabric' },
          { value: 'paper', label: 'Paper' },
          { value: 'metal', label: 'Metal' },
          { value: 'custom', label: 'Custom Image' },
        ],
      },
      {
        id: 'scale',
        label: 'Pattern Scale',
        type: 'slider',
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
      },
      {
        id: 'rotation',
        label: 'Rotation',
        type: 'angle',
        defaultValue: 0,
        min: 0,
        max: 360,
      },
      {
        id: 'opacity',
        label: 'Opacity',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  runtimeShader: {
    id: 'runtimeShader',
    name: 'Procedural Shader',
    category: 'fill',
    layer: 'textFill',
    description: 'Apply advanced SkSL shaders like noise, plasma, or chrome.',
    parameters: [
      {
        id: 'shaderVariant',
        label: 'Shader Variant',
        type: 'option',
        defaultValue: 'noise',
        options: [
          { value: 'noise', label: 'Noise' },
          { value: 'iridescence', label: 'Iridescence' },
          { value: 'plasma', label: 'Plasma' },
          { value: 'fire', label: 'Fire' },
          { value: 'chrome', label: 'Chrome' },
        ],
      },
      {
        id: 'timeScale',
        label: 'Time Scale',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
      },
      {
        id: 'detail',
        label: 'Detail',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  gradientStroke: {
    id: 'gradientStroke',
    name: 'Gradient Stroke',
    category: 'stroke',
    layer: 'textStroke',
    description: 'Apply gradient or textured strokes to the text outline.',
    parameters: [
      {
        id: 'gradientStops',
        label: 'Gradient Stops',
        type: 'gradient',
        defaultValue: baseGradientStops,
      },
      {
        id: 'strokeWidth',
        label: 'Stroke Width',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 30,
        step: 1,
      },
      {
        id: 'textureSource',
        label: 'Texture Source',
        type: 'option',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'noise', label: 'Noise' },
          { value: 'brushed', label: 'Brushed Metal' },
          { value: 'grain', label: 'Grain' },
        ],
      },
    ],
  },
  multiStroke: {
    id: 'multiStroke',
    name: 'Multi Stroke',
    category: 'stroke',
    layer: 'textStroke',
    description: 'Stack multiple stroke layers with individual colors.',
    parameters: [
      {
        id: 'strokeCount',
        label: 'Stroke Count',
        type: 'slider',
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 1,
      },
      {
        id: 'baseWidth',
        label: 'Base Width',
        type: 'slider',
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        id: 'widthIncrement',
        label: 'Width Increment',
        type: 'slider',
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
      },
      {
        id: 'colorPalette',
        label: 'Color Palette',
        type: 'gradient',
        defaultValue: [
          { offset: 0, color: '#FFFFFF' },
          { offset: 1, color: '#00FFFF' },
        ],
      },
    ],
  },
  dashedStroke: {
    id: 'dashedStroke',
    name: 'Dashed Stroke',
    category: 'stroke',
    layer: 'textStroke',
    description: 'Dashed or dotted stroke styles for outlined text.',
    parameters: [
      {
        id: 'strokeWidth',
        label: 'Stroke Width',
        type: 'slider',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        id: 'dashLength',
        label: 'Dash Length',
        type: 'slider',
        defaultValue: 6,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: 'gapLength',
        label: 'Gap Length',
        type: 'slider',
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: 'strokeColor',
        label: 'Stroke Color',
        type: 'color',
        defaultValue: '#FFFFFF',
      },
    ],
  },
  neonGlow: {
    id: 'neonGlow',
    name: 'Neon Glow',
    category: 'lighting',
    layer: 'overlay',
    description: 'Bright neon glow with blur-based duplicates.',
    parameters: [
      {
        id: 'glowColor',
        label: 'Glow Color',
        type: 'color',
        defaultValue: '#00FFFF',
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'spread',
        label: 'Spread',
        type: 'slider',
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
      },
      {
        id: 'pulse',
        label: 'Pulse Animation',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    supportsAnimation: true,
  },
  softShadow: {
    id: 'softShadow',
    name: 'Soft Shadow',
    category: 'lighting',
    layer: 'underlay',
    description: 'Soft drop shadow with adjustable blur and offset.',
    parameters: [
      {
        id: 'shadowColor',
        label: 'Shadow Color',
        type: 'color',
        defaultValue: 'rgba(0,0,0,0.6)',
      },
      {
        id: 'offset',
        label: 'Offset',
        type: 'vector2',
        defaultValue: { x: 8, y: 12 },
      },
      {
        id: 'blur',
        label: 'Blur',
        type: 'slider',
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
      },
    ],
  },
  longShadow: {
    id: 'longShadow',
    name: 'Long Shadow',
    category: 'lighting',
    layer: 'underlay',
    description: 'Layered offset duplicates to create a long trailing shadow.',
    parameters: [
      {
        id: 'length',
        label: 'Length',
        type: 'slider',
        defaultValue: 24,
        min: 4,
        max: 120,
        step: 4,
      },
      {
        id: 'angle',
        label: 'Angle',
        type: 'angle',
        defaultValue: 135,
        min: 0,
        max: 360,
      },
      {
        id: 'fade',
        label: 'Fade',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'shadowColor',
        label: 'Shadow Color',
        type: 'color',
        defaultValue: 'rgba(0,0,0,0.7)',
      },
    ],
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    category: 'lighting',
    layer: 'overlay',
    description: 'Bright halo bloom achieved with threshold and blur.',
    parameters: [
      {
        id: 'threshold',
        label: 'Threshold',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'radius',
        label: 'Radius',
        type: 'slider',
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  glassmorphism: {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    category: 'special',
    layer: 'background',
    description: 'Frosted glass backdrop with gradient transparency.',
    parameters: [
      {
        id: 'blurAmount',
        label: 'Blur Amount',
        type: 'slider',
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
      },
      {
        id: 'alphaGradient',
        label: 'Alpha Gradient',
        type: 'gradient',
        defaultValue: [
          { offset: 0, color: 'rgba(255,255,255,0.4)' },
          { offset: 1, color: 'rgba(255,255,255,0.1)' },
        ],
      },
      {
        id: 'borderColor',
        label: 'Border Color',
        type: 'color',
        defaultValue: 'rgba(255,255,255,0.4)',
      },
      {
        id: 'borderWidth',
        label: 'Border Width',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
      },
    ],
  },
  knockout: {
    id: 'knockout',
    name: 'Knockout',
    category: 'masking',
    layer: 'mask',
    description: 'Punch the text through to reveal the background behind it.',
    parameters: [
      {
        id: 'invert',
        label: 'Invert Mask',
        type: 'boolean',
        defaultValue: false,
      },
      {
        id: 'feather',
        label: 'Feather',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 30,
        step: 1,
      },
    ],
  },
  blendMode: {
    id: 'blendMode',
    name: 'Blend Mode',
    category: 'compositing',
    layer: 'overlay',
    description: 'Apply blend modes such as multiply, screen, or overlay.',
    parameters: [
      {
        id: 'mode',
        label: 'Blend Mode',
        type: 'option',
        defaultValue: 'overlay',
        options: [
          { value: 'sourceOver', label: 'Normal' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'screen', label: 'Screen' },
          { value: 'overlay', label: 'Overlay' },
          { value: 'softLight', label: 'Soft Light' },
          { value: 'hardLight', label: 'Hard Light' },
          { value: 'colorBurn', label: 'Color Burn' },
          { value: 'colorDodge', label: 'Color Dodge' },
          { value: 'lighten', label: 'Lighten' },
          { value: 'darken', label: 'Darken' },
        ],
      },
      {
        id: 'opacity',
        label: 'Opacity',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  mediaMask: {
    id: 'mediaMask',
    name: 'Media Mask',
    category: 'masking',
    layer: 'mask',
    description: 'Use text as a mask for images, video, or shader fills.',
    parameters: [
      {
        id: 'sourceType',
        label: 'Source Type',
        type: 'option',
        defaultValue: 'image',
        options: [
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'shader', label: 'Shader' },
        ],
      },
      {
        id: 'sourceUri',
        label: 'Source URI',
        type: 'text',
        defaultValue: '',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'slider',
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
      },
    ],
  },
  clipPath: {
    id: 'clipPath',
    name: 'Clip Path',
    category: 'masking',
    layer: 'mask',
    description: 'Clip the text with custom shapes or paths.',
    parameters: [
      {
        id: 'shape',
        label: 'Shape',
        type: 'option',
        defaultValue: 'ellipse',
        options: [
          { value: 'ellipse', label: 'Ellipse' },
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'triangle', label: 'Triangle' },
          { value: 'path', label: 'Custom Path' },
        ],
      },
      {
        id: 'feather',
        label: 'Feather',
        type: 'slider',
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
      },
      {
        id: 'offset',
        label: 'Offset',
        type: 'vector2',
        defaultValue: { x: 0, y: 0 },
      },
    ],
  },
  progressFill: {
    id: 'progressFill',
    name: 'Progress Fill',
    category: 'fill',
    layer: 'textFill',
    description: 'Animated fill that grows like a progress or liquid wave.',
    parameters: [
      {
        id: 'fillColor',
        label: 'Fill Color',
        type: 'color',
        defaultValue: '#00FFFF',
      },
      {
        id: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        defaultValue: 'rgba(255,255,255,0.1)',
      },
      {
        id: 'progress',
        label: 'Progress',
        type: 'slider',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        id: 'waveAmplitude',
        label: 'Wave Amplitude',
        type: 'slider',
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
      },
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        defaultValue: 0.8,
        min: 0,
        max: 3,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  waveDistortion: {
    id: 'waveDistortion',
    name: 'Wave Distortion',
    category: 'distortion',
    layer: 'postprocess',
    description: 'Displace text geometry to simulate waves or ripples.',
    parameters: [
      {
        id: 'direction',
        label: 'Direction',
        type: 'angle',
        defaultValue: 90,
        min: 0,
        max: 360,
      },
      {
        id: 'amplitude',
        label: 'Amplitude',
        type: 'slider',
        defaultValue: 6,
        min: 0,
        max: 40,
        step: 1,
      },
      {
        id: 'frequency',
        label: 'Frequency',
        type: 'slider',
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
      },
      {
        id: 'speed',
        label: 'Animation Speed',
        type: 'slider',
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  chromaticAberration: {
    id: 'chromaticAberration',
    name: 'Chromatic Aberration',
    category: 'distortion',
    layer: 'postprocess',
    description: 'Split RGB channels for a spectral edge effect.',
    parameters: [
      {
        id: 'radius',
        label: 'Radius',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
      },
      {
        id: 'angle',
        label: 'Angle',
        type: 'angle',
        defaultValue: 90,
        min: 0,
        max: 360,
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch',
    category: 'distortion',
    layer: 'postprocess',
    description:
      'Jittered bands, channel offsets, and posterization for glitch art.',
    parameters: [
      {
        id: 'bandCount',
        label: 'Band Count',
        type: 'slider',
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: 'channelShift',
        label: 'Channel Shift',
        type: 'slider',
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
      },
      {
        id: 'posterize',
        label: 'Posterize',
        type: 'slider',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        defaultValue: 1.2,
        min: 0,
        max: 5,
        step: 0.1,
      },
    ],
    supportsAnimation: true,
  },
  crt: {
    id: 'crt',
    name: 'CRT / VHS',
    category: 'distortion',
    layer: 'postprocess',
    description: 'Scanlines, noise, and VHS inspired distortions.',
    parameters: [
      {
        id: 'scanlineIntensity',
        label: 'Scanline Intensity',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'noise',
        label: 'Noise Amount',
        type: 'slider',
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'distortion',
        label: 'Warp Distortion',
        type: 'slider',
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  fisheye: {
    id: 'fisheye',
    name: 'Fisheye',
    category: 'distortion',
    layer: 'postprocess',
    description: 'Bulge or pinch the text like a fisheye lens.',
    parameters: [
      {
        id: 'strength',
        label: 'Strength',
        type: 'slider',
        defaultValue: 0.5,
        min: -1,
        max: 1,
        step: 0.05,
      },
      {
        id: 'radius',
        label: 'Radius',
        type: 'slider',
        defaultValue: 0.7,
        min: 0.1,
        max: 1.5,
        step: 0.05,
      },
      {
        id: 'center',
        label: 'Center Offset',
        type: 'vector2',
        defaultValue: { x: 0.5, y: 0.5 },
      },
    ],
  },
  specularHighlight: {
    id: 'specularHighlight',
    name: 'Specular Highlight',
    category: 'lighting',
    layer: 'overlay',
    description: 'Animated highlight sweep simulating specular reflections.',
    parameters: [
      {
        id: 'highlightColor',
        label: 'Highlight Color',
        type: 'color',
        defaultValue: 'rgba(255,255,255,0.9)',
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'width',
        label: 'Highlight Width',
        type: 'slider',
        defaultValue: 0.2,
        min: 0.05,
        max: 0.6,
        step: 0.05,
      },
      {
        id: 'speed',
        label: 'Sweep Speed',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
      },
    ],
    supportsAnimation: true,
  },
  lightRays: {
    id: 'lightRays',
    name: 'Volumetric Light',
    category: 'lighting',
    layer: 'overlay',
    description: 'Radial blur rays emanating from the text.',
    parameters: [
      {
        id: 'rayColor',
        label: 'Ray Color',
        type: 'color',
        defaultValue: 'rgba(255,255,200,0.6)',
      },
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'spread',
        label: 'Spread',
        type: 'slider',
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'decay',
        label: 'Decay',
        type: 'slider',
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  cmykMisprint: {
    id: 'cmykMisprint',
    name: 'CMYK Misprint',
    category: 'distortion',
    layer: 'postprocess',
    description: 'Offset CMYK channels with noise to mimic print misalignment.',
    parameters: [
      {
        id: 'offset',
        label: 'Offset',
        type: 'slider',
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
      },
      {
        id: 'noise',
        label: 'Noise Amount',
        type: 'slider',
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'bleed',
        label: 'Bleed',
        type: 'slider',
        defaultValue: 0.15,
        min: 0,
        max: 0.5,
        step: 0.01,
      },
    ],
  },
  letterpress: {
    id: 'letterpress',
    name: 'Letterpress',
    category: 'texture',
    layer: 'underlay',
    description: 'Inner shadow with subtle grain for debossed appearance.',
    parameters: [
      {
        id: 'depth',
        label: 'Depth',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
      },
      {
        id: 'grain',
        label: 'Grain Amount',
        type: 'slider',
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'highlight',
        label: 'Highlight Strength',
        type: 'slider',
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  textureOverlay: {
    id: 'textureOverlay',
    name: 'Texture Overlay',
    category: 'texture',
    layer: 'overlay',
    description:
      'Overlay textures like paper, fabric, or metal within the text.',
    parameters: [
      {
        id: 'textureType',
        label: 'Texture Type',
        type: 'option',
        defaultValue: 'paper',
        options: [
          { value: 'paper', label: 'Paper' },
          { value: 'fabric', label: 'Fabric' },
          { value: 'metal', label: 'Metal' },
          { value: 'grain', label: 'Grain' },
        ],
      },
      {
        id: 'opacity',
        label: 'Opacity',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'blendMode',
        label: 'Blend Mode',
        type: 'option',
        defaultValue: 'overlay',
        options: [
          { value: 'overlay', label: 'Overlay' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'screen', label: 'Screen' },
          { value: 'softLight', label: 'Soft Light' },
        ],
      },
    ],
  },
  chalk: {
    id: 'chalk',
    name: 'Chalk / Marker',
    category: 'texture',
    layer: 'textStroke',
    description: 'Noisy edges simulating chalk, marker, or pencil strokes.',
    parameters: [
      {
        id: 'density',
        label: 'Edge Density',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'roughness',
        label: 'Roughness',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'strokeWidth',
        label: 'Stroke Width',
        type: 'slider',
        defaultValue: 4,
        min: 1,
        max: 15,
        step: 1,
      },
    ],
  },
  shineSweep: {
    id: 'shineSweep',
    name: 'Shine Sweep',
    category: 'lighting',
    layer: 'overlay',
    description: 'Narrow moving highlight sweep across the text.',
    parameters: [
      {
        id: 'shineColor',
        label: 'Shine Color',
        type: 'color',
        defaultValue: 'rgba(255,255,255,0.8)',
      },
      {
        id: 'width',
        label: 'Shine Width',
        type: 'slider',
        defaultValue: 0.15,
        min: 0.05,
        max: 0.5,
        step: 0.05,
      },
      {
        id: 'speed',
        label: 'Speed',
        type: 'slider',
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.1,
      },
      {
        id: 'angle',
        label: 'Angle',
        type: 'angle',
        defaultValue: 45,
        min: 0,
        max: 360,
      },
    ],
    supportsAnimation: true,
  },
  particles: {
    id: 'particles',
    name: 'Particles',
    category: 'special',
    layer: 'overlay',
    description: 'Emit particles or sparks within the text mask.',
    parameters: [
      {
        id: 'particleColor',
        label: 'Particle Color',
        type: 'color',
        defaultValue: '#FFD700',
      },
      {
        id: 'spawnRate',
        label: 'Spawn Rate',
        type: 'slider',
        defaultValue: 25,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        id: 'particleSize',
        label: 'Particle Size',
        type: 'slider',
        defaultValue: 6,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: 'lifetime',
        label: 'Lifetime',
        type: 'slider',
        defaultValue: 1.5,
        min: 0.2,
        max: 5,
        step: 0.1,
      },
      {
        id: 'gravity',
        label: 'Gravity',
        type: 'slider',
        defaultValue: 0.2,
        min: -1,
        max: 1,
        step: 0.05,
      },
    ],
    supportsAnimation: true,
  },
  glossy3d: {
    id: 'glossy3d',
    name: 'Glossy 3D',
    category: 'lighting',
    layer: 'overlay',
    description: 'Glossy, embossed text with gradient fill, multiple strokes, and highlight shine.',
    parameters: [
      {
        id: 'fillColorTop',
        label: 'Fill Top Color',
        type: 'color',
        defaultValue: '#FF6B9D',
      },
      {
        id: 'fillColorBottom',
        label: 'Fill Bottom Color',
        type: 'color',
        defaultValue: '#C51162',
      },
      {
        id: 'outerStrokeColor',
        label: 'Outer Stroke Color',
        type: 'color',
        defaultValue: '#000000',
      },
      {
        id: 'outerStrokeWidth',
        label: 'Outer Stroke Width',
        type: 'slider',
        defaultValue: 6,
        min: 2,
        max: 12,
        step: 1,
      },
      {
        id: 'innerStrokeColor',
        label: 'Inner Stroke Color',
        type: 'color',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'innerStrokeWidth',
        label: 'Inner Stroke Width',
        type: 'slider',
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 0.5,
      },
      {
        id: 'highlightIntensity',
        label: 'Highlight Intensity',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'highlightHeight',
        label: 'Highlight Height',
        type: 'slider',
        defaultValue: 0.25,
        min: 0.1,
        max: 0.5,
        step: 0.05,
      },
      {
        id: 'shadowColor',
        label: 'Shadow Color',
        type: 'color',
        defaultValue: 'rgba(0,0,0,0.4)',
      },
      {
        id: 'shadowOffsetY',
        label: 'Shadow Offset',
        type: 'slider',
        defaultValue: 6,
        min: 2,
        max: 20,
        step: 1,
      },
      {
        id: 'shadowBlur',
        label: 'Shadow Blur',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 16,
        step: 1,
      },
    ],
  },
  chrome3d: {
    id: 'chrome3d',
    name: 'Chrome 3D',
    category: 'lighting',
    layer: 'overlay',
    description: 'Metallic chrome text with deep 3D extrusion and reflective shine.',
    parameters: [
      {
        id: 'metallicLight',
        label: 'Metallic Light',
        type: 'color',
        defaultValue: '#E8E8E8',
      },
      {
        id: 'metallicMid',
        label: 'Metallic Mid',
        type: 'color',
        defaultValue: '#A0A0A0',
      },
      {
        id: 'metallicDark',
        label: 'Metallic Dark',
        type: 'color',
        defaultValue: '#505050',
      },
      {
        id: 'extrusionDepth',
        label: 'Extrusion Depth',
        type: 'slider',
        defaultValue: 10,
        min: 4,
        max: 20,
        step: 1,
      },
      {
        id: 'extrusionColor',
        label: 'Extrusion Color',
        type: 'color',
        defaultValue: '#404040',
      },
      {
        id: 'outerStrokeColor',
        label: 'Outer Stroke Color',
        type: 'color',
        defaultValue: '#303030',
      },
      {
        id: 'outerStrokeWidth',
        label: 'Outer Stroke Width',
        type: 'slider',
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 0.5,
      },
      {
        id: 'innerStrokeColor',
        label: 'Inner Stroke Color',
        type: 'color',
        defaultValue: '#D0D0D0',
      },
      {
        id: 'innerStrokeWidth',
        label: 'Inner Stroke Width',
        type: 'slider',
        defaultValue: 2,
        min: 0.5,
        max: 6,
        step: 0.5,
      },
      {
        id: 'shineIntensity',
        label: 'Shine Intensity',
        type: 'slider',
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        id: 'shineAngle',
        label: 'Shine Angle',
        type: 'slider',
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 15,
      },
    ],
  },
};

export const TEXT_EFFECT_CATEGORIES: Array<{
  id: TextEffectCategory;
  label: string;
  sortOrder: number;
}> = [
  { id: 'fill', label: 'Fill', sortOrder: 1 },
  { id: 'stroke', label: 'Stroke', sortOrder: 2 },
  { id: 'lighting', label: 'Light & Glow', sortOrder: 3 },
  { id: 'texture', label: 'Texture', sortOrder: 4 },
  { id: 'masking', label: 'Masking', sortOrder: 5 },
  { id: 'distortion', label: 'Distortion', sortOrder: 6 },
  { id: 'compositing', label: 'Compositing', sortOrder: 7 },
  { id: 'special', label: 'Special', sortOrder: 8 },
];

export const TEXT_EFFECT_CATEGORY_GROUPS: Record<
  TextEffectCategory,
  TextEffectType[]
> = TEXT_EFFECT_CATEGORIES.reduce((acc, category) => {
  acc[category.id] = Object.values(TEXT_EFFECT_DEFINITIONS)
    .filter(definition => definition.category === category.id)
    .map(definition => definition.id)
    .sort((a, b) => {
      const nameA = TEXT_EFFECT_DEFINITIONS[a].name.toLowerCase();
      const nameB = TEXT_EFFECT_DEFINITIONS[b].name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  return acc;
}, {} as Record<TextEffectCategory, TextEffectType[]>);

export const getTextEffectDefinition = (
  type: TextEffectType,
): TextEffectDefinition | undefined => TEXT_EFFECT_DEFINITIONS[type];

export const getCategoryForEffect = (
  type: TextEffectType,
): TextEffectCategory | undefined => {
  const definition = getTextEffectDefinition(type);
  return definition?.category;
};

const SUPPORTED_EFFECT_TYPES_INTERNAL: TextEffectType[] = [
  'softShadow',
  'neonGlow',
  'longShadow',
  'bloom',
  'letterpress',
  'glossy3d',
  'chrome3d',
];

const SUPPORTED_EFFECT_TYPES_SET = new Set<TextEffectType>(
  SUPPORTED_EFFECT_TYPES_INTERNAL,
);

export const SUPPORTED_TEXT_EFFECT_TYPES: readonly TextEffectType[] =
  SUPPORTED_EFFECT_TYPES_INTERNAL;

export const isTextEffectSupported = (type: TextEffectType): boolean =>
  SUPPORTED_EFFECT_TYPES_SET.has(type);

export const getDefaultSupportedTextEffectCategory = (): TextEffectCategory => {
  const fallback = TEXT_EFFECT_CATEGORIES[0]?.id ?? 'fill';
  const found = TEXT_EFFECT_CATEGORIES.find(category =>
    SUPPORTED_TEXT_EFFECT_TYPES.some(effectType => {
      const definition = TEXT_EFFECT_DEFINITIONS[effectType];
      return definition?.category === category.id;
    }),
  );
  return found?.id ?? fallback;
};
