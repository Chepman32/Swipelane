import type { RNImageManipulatorResult } from 'react-native-image-manipulator';

type RGB = { r: number; g: number; b: number };

export type AiSuggestedEffectType = 'neonGlow' | 'glossy3d' | 'chrome3d';

export interface AiEffectSuggestion {
  type: AiSuggestedEffectType;
  parameters?: Record<string, any>;
}

export interface AiStyleSuggestion {
  dominantColor: string;
  dominantRgb: RGB;
  dominantLuminance: number;
  averageLuminance: number;
  averageBrightness: number;
  brightnessPercentile: number;
  isDark: boolean;
  textColor: string;
  backgroundColor: string;
  overlayAlpha: number;
  effect: AiEffectSuggestion;
  sourceImageUri: string;
}

const TARGET_SIZE = 64;
const SAMPLE_STRIDE = 4;
const QUANTIZATION_BIN_SIZE = 16; // 16 bins per channel
const MIN_ALPHA = 16;
const BRIGHTNESS_THRESHOLD = 0.5;

const clamp255 = (value: number): number => Math.max(0, Math.min(255, value));

const toHex = ({ r, g, b }: RGB): string =>
  `#${[r, g, b]
    .map(channel => clamp255(Math.round(channel)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

const sanitizeFileUri = (uri: string): string =>
  uri.startsWith('file://') ? uri.slice('file://'.length) : uri;

type RNFSModule = typeof import('react-native-fs');
type RNImageManipulatorModule = typeof import('react-native-image-manipulator');
type RNImageManipulatorApi = RNImageManipulatorModule['default'];
type SkiaModule = typeof import('@shopify/react-native-skia');

let rnfsModule: RNFSModule | null = null;
let imageManipulatorApi: RNImageManipulatorApi | null = null;
let skiaModule: SkiaModule | null = null;

const getRNFS = (): RNFSModule => {
  if (!rnfsModule) {
    rnfsModule = require('react-native-fs') as RNFSModule;
  }
  return rnfsModule;
};

const getImageManipulator = (): RNImageManipulatorApi => {
  if (!imageManipulatorApi) {
    const module = require('react-native-image-manipulator') as RNImageManipulatorModule;
    imageManipulatorApi =
      module.default ?? (module as unknown as RNImageManipulatorApi);
  }
  return imageManipulatorApi;
};

const getSkiaModule = (): SkiaModule => {
  if (!skiaModule) {
    skiaModule = require('@shopify/react-native-skia') as SkiaModule;
  }
  return skiaModule;
};

const srgbChannelToLinear = (channel: number): number => {
  const normalized = clamp255(channel) / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const relativeLuminance = ({ r, g, b }: RGB): number => {
  const rLin = srgbChannelToLinear(r);
  const gLin = srgbChannelToLinear(g);
  const bLin = srgbChannelToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};

const mix = (base: RGB, overlay: RGB, alpha: number): RGB => {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const inv = 1 - clampedAlpha;
  return {
    r: base.r * inv + overlay.r * clampedAlpha,
    g: base.g * inv + overlay.g * clampedAlpha,
    b: base.b * inv + overlay.b * clampedAlpha,
  };
};

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

const isDarkBrightness = (brightness: number): boolean =>
  brightness < BRIGHTNESS_THRESHOLD;

const computeNeonEffectParameters = (
  dominantColor: string,
  isDark: boolean,
): AiEffectSuggestion['parameters'] => ({
  glowColor: dominantColor,
  intensity: isDark ? 0.9 : 0.72,
  spread: isDark ? 18 : 12,
  pulse: false,
});

const computeAverageRgb = (
  pixels: Uint8Array,
  width: number,
  height: number,
): RGB => {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sampleCount = 0;

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < MIN_ALPHA) {
        continue;
      }

      sumR += r;
      sumG += g;
      sumB += b;
      sampleCount += 1;
    }
  }

  if (sampleCount === 0) {
    return { r: 128, g: 128, b: 128 };
  }

  return {
    r: sumR / sampleCount,
    g: sumG / sampleCount,
    b: sumB / sampleCount,
  };
};

const colorChroma = ({ r, g, b }: RGB): number =>
  Math.max(r, g, b) - Math.min(r, g, b);

const rgbToHsv = ({ r, g, b }: RGB): { h: number; s: number; v: number } => {
  const rn = clamp255(r) / 255;
  const gn = clamp255(g) / 255;
  const bn = clamp255(b) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
};

const isRedOrPink = (rgb: RGB): boolean => {
  const { h, s, v } = rgbToHsv(rgb);
  const isHueRedPink = h >= 300 || h <= 35;
  return isHueRedPink && s >= 0.25 && v >= 0.2;
};

const computeVibrantRgb = (
  pixels: Uint8Array,
  width: number,
  height: number,
): RGB | null => {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sampleCount = 0;

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < MIN_ALPHA) {
        continue;
      }

      const { s, v } = rgbToHsv({ r, g, b });
      if (s < 0.25 || v < 0.2) {
        continue;
      }

      sumR += r;
      sumG += g;
      sumB += b;
      sampleCount += 1;
    }
  }

  if (sampleCount === 0) {
    return null;
  }

  return {
    r: sumR / sampleCount,
    g: sumG / sampleCount,
    b: sumB / sampleCount,
  };
};

const pickTextRgb = (dominant: RGB, average: RGB): RGB =>
  colorChroma(dominant) >= colorChroma(average) ? dominant : average;

const pickRandomBackgroundColor = (
  base: RGB,
): { color: string; alpha: number } => {
  const alpha = Number((0.35 + Math.random() * 0.25).toFixed(2));
  const mixTarget = Math.random() < 0.5 ? WHITE : BLACK;
  const mixAmount = 0.2 + Math.random() * 0.45;
  const mixed = mix(base, mixTarget, mixAmount);
  return {
    color: `rgba(${Math.round(mixed.r)},${Math.round(mixed.g)},${Math.round(
      mixed.b,
    )},${alpha})`,
    alpha,
  };
};

type QuantizedBucket = {
  weight: number;
  samples: number;
  sumR: number;
  sumG: number;
  sumB: number;
};

const quantizeChannel = (channel: number): number =>
  Math.floor(channel / QUANTIZATION_BIN_SIZE);

const computeDominantRgb = (
  pixels: Uint8Array,
  width: number,
  height: number,
): RGB => {
  const buckets = new Map<string, QuantizedBucket>();

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < MIN_ALPHA) {
        continue;
      }

      const key = `${quantizeChannel(r)}-${quantizeChannel(g)}-${quantizeChannel(b)}`;
      const weight = a;

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.weight += weight;
        bucket.samples += 1;
        bucket.sumR += r;
        bucket.sumG += g;
        bucket.sumB += b;
      } else {
        buckets.set(key, {
          weight,
          samples: 1,
          sumR: r,
          sumG: g,
          sumB: b,
        });
      }
    }
  }

  if (buckets.size === 0) {
    return { r: 128, g: 128, b: 128 };
  }

  let dominantBucket: QuantizedBucket | null = null;
  for (const bucket of buckets.values()) {
    if (!dominantBucket || bucket.weight > dominantBucket.weight) {
      dominantBucket = bucket;
    }
  }

  if (!dominantBucket || dominantBucket.samples === 0) {
    return { r: 128, g: 128, b: 128 };
  }

  const resolvedDominant = dominantBucket;
  return {
    r: resolvedDominant.sumR / resolvedDominant.samples,
    g: resolvedDominant.sumG / resolvedDominant.samples,
    b: resolvedDominant.sumB / resolvedDominant.samples,
  };
};

const computeAverageLuminance = (
  pixels: Uint8Array,
  width: number,
  height: number,
): number => {
  let luminanceSum = 0;
  let sampleCount = 0;

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < MIN_ALPHA) {
        continue;
      }

      luminanceSum += relativeLuminance({ r, g, b });
      sampleCount += 1;
    }
  }

  if (sampleCount === 0) {
    return 0.5;
  }

  return luminanceSum / sampleCount;
};

const computeBrightnessStats = (
  pixels: Uint8Array,
  width: number,
  height: number,
): { average: number; percentile: number } => {
  let brightnessSum = 0;
  let sampleCount = 0;
  const samples: number[] = [];

  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < MIN_ALPHA) {
        continue;
      }

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      brightnessSum += brightness;
      sampleCount += 1;
      samples.push(brightness);
    }
  }

  if (sampleCount === 0) {
    return { average: 0.5, percentile: 0.5 };
  }

  samples.sort((a, b) => a - b);
  const percentileIndex = Math.min(
    samples.length - 1,
    Math.floor(samples.length * 0.8),
  );

  return {
    average: brightnessSum / sampleCount,
    percentile: samples[percentileIndex],
  };
};

class ColorAnalysisService {
  private static instance: ColorAnalysisService;

  static getInstance(): ColorAnalysisService {
    if (!ColorAnalysisService.instance) {
      ColorAnalysisService.instance = new ColorAnalysisService();
    }
    return ColorAnalysisService.instance;
  }

  private async resizeForAnalysis(imageUri: string): Promise<string | null> {
    try {
      const RNImageManipulator = getImageManipulator();
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(
          imageUri,
          [{ resize: { width: TARGET_SIZE, height: TARGET_SIZE } }],
          {
            compress: 1,
            format: 'png',
          },
        );
      return result.uri;
    } catch (error) {
      console.error('Failed to resize image for color analysis:', error);
      return null;
    }
  }

  private async decodePixels(
    imageUri: string,
  ): Promise<{ pixels: Uint8Array; width: number; height: number } | null> {
    try {
      const RNFS = getRNFS();
      const { AlphaType, ColorType, Skia } = getSkiaModule();
      const resizedUri = await this.resizeForAnalysis(imageUri);
      const analysisUri = resizedUri ?? imageUri;
      const imagePath = sanitizeFileUri(analysisUri);

      const base64 = await RNFS.readFile(imagePath, 'base64');
      const image = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
      if (!image) {
        return null;
      }

      const cpuImage = image.makeNonTextureImage();
      const info = cpuImage.getImageInfo();
      const pixelInfo = {
        width: info.width,
        height: info.height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Premul,
      };
      const pixels = cpuImage.readPixels(0, 0, pixelInfo);
      if (!pixels || pixels.length === 0) {
        return null;
      }

      return {
        pixels: pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels),
        width: info.width,
        height: info.height,
      };
    } catch (error) {
      console.error('Failed to decode pixels for color analysis:', error);
      return null;
    }
  }

  async suggestStylesForImage(imageUri: string): Promise<AiStyleSuggestion | null> {
    if (!imageUri) {
      return null;
    }

    const decoded = await this.decodePixels(imageUri);
    if (!decoded) {
      return null;
    }

    const dominantRgb = computeDominantRgb(
      decoded.pixels,
      decoded.width,
      decoded.height,
    );
    const averageRgb = computeAverageRgb(
      decoded.pixels,
      decoded.width,
      decoded.height,
    );
    const vibrantRgb = computeVibrantRgb(
      decoded.pixels,
      decoded.width,
      decoded.height,
    );
    const dominantColor = toHex(dominantRgb);
    const dominantLuminance = relativeLuminance(dominantRgb);
    const averageLuminance = computeAverageLuminance(
      decoded.pixels,
      decoded.width,
      decoded.height,
    );
    const brightnessStats = computeBrightnessStats(
      decoded.pixels,
      decoded.width,
      decoded.height,
    );
    const effectiveBrightness = Math.max(
      brightnessStats.average,
      brightnessStats.percentile,
    );
    const isDark = isDarkBrightness(effectiveBrightness);
    const textRgb = vibrantRgb ?? pickTextRgb(dominantRgb, averageRgb);
    const textColor = toHex(textRgb);
    const backgroundBase = vibrantRgb ?? dominantRgb;
    const { color: backgroundColor, alpha: overlayAlpha } =
      pickRandomBackgroundColor(backgroundBase);
    const shouldUseGlossy =
      isRedOrPink(vibrantRgb ?? dominantRgb) || isRedOrPink(averageRgb);
    const chromeChance = 0.08;
    const effectType: AiSuggestedEffectType = shouldUseGlossy
      ? 'glossy3d'
      : Math.random() < chromeChance
      ? 'chrome3d'
      : 'neonGlow';
    const effect: AiEffectSuggestion =
      effectType === 'neonGlow'
        ? {
            type: 'neonGlow',
            parameters: computeNeonEffectParameters(dominantColor, isDark),
          }
        : { type: effectType };

    return {
      dominantColor,
      dominantRgb,
      dominantLuminance,
      averageLuminance,
      averageBrightness: brightnessStats.average,
      brightnessPercentile: brightnessStats.percentile,
      isDark,
      textColor,
      backgroundColor,
      overlayAlpha,
      effect,
      sourceImageUri: imageUri,
    };
  }
}

export default ColorAnalysisService.getInstance();
