export type EffectId =
  | 'neon'
  | 'gradientFill'
  | 'textureFill'
  | 'runtimeShaderFill'
  | 'gradientStroke'
  | 'multiStroke'
  | 'dashHatch'
  | 'softShadow'
  | 'longShadow'
  | 'bloomHalo'
  | 'glassmorphism'
  | 'knockout'
  | 'blendMode'
  | 'textMask'
  | 'clipPath'
  | 'progressFillStatic'
  | 'waveDisplaceStatic'
  | 'chromaticAberration'
  | 'glitchStatic'
  | 'crtScanlines'
  | 'fisheye'
  | 'specularContour'
  | 'lightRaysStatic'
  | 'cmykMisprint'
  | 'letterpress'
  | 'materialTexture'
  | 'chalkEdge'
  | 'shineStatic'
  | 'particlesStatic'
  | 'glossy3d';

export type EffectParam =
  | {
      key: string;
      type: 'number';
      min: number;
      max: number;
      step?: number;
      default: number;
      unit?: string;
    }
  | { key: string; type: 'color'; default: string }
  | { key: string; type: 'enum'; options: string[]; default: string }
  | { key: string; type: 'boolean'; default: boolean };

export interface EffectSpec {
  id: EffectId;
  name: string; // localized display name (fallback to id)
  params: EffectParam[];
}

export interface EffectInstance {
  id: EffectId;
  enabled: boolean;
  values: Record<string, number | string | boolean>;
}
