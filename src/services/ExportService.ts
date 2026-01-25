import {
  BlurStyle,
  Canvas,
  CanvasKit,
  Skia,
  SkiaValue,
  Surface,
  Image as SkiaImage,
  Paint,
  Rect as SkiaRect,
  matchFont,
} from '@shopify/react-native-skia';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';
import type { SlideFontId } from '../constants/fonts';
import type { TextEffectInstance } from '../constants/textEffects';
import { isTextEffectSupported } from '../constants/textEffects';
import TextEffectsEngine from './TextEffectsEngine';

export interface ExportOptions {
  quality?: number;
  format?: 'png' | 'jpg';
  resolution?: number;
}

export interface Slide {
  id: number;
  text: string;
  image: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontFamily?: string;
  fontId?: SlideFontId;
  textEffects?: TextEffectInstance[];
}

interface TextDrawInstruction {
  line: string;
  x: number;
  y: number;
}

const applyTextEffectsToCanvas = (
  canvas: Canvas,
  font: ReturnType<typeof matchFont>,
  basePaint: Paint,
  instructions: TextDrawInstruction[],
  effects: TextEffectInstance[],
  textColor?: string,
) => {
  const enabledEffects = effects.filter(
    effect => effect.enabled !== false && isTextEffectSupported(effect.type),
  );

  enabledEffects.forEach(effect => {
    const params = effect.parameters || {};
    switch (effect.type) {
      case 'softShadow': {
        const color =
          typeof params.shadowColor === 'string'
            ? params.shadowColor
            : 'rgba(0,0,0,0.6)';
        const offset = params.offset || { x: 8, y: 12 };
        const blur = typeof params.blur === 'number' ? params.blur : 18;
        const paint = basePaint.copy();
        paint.setColor(Skia.Color(color));
        if (blur > 0) {
          const maskFilter = Skia.MaskFilter.MakeBlur(
            BlurStyle.Normal,
            blur / 2,
            true,
          );
          if (maskFilter) {
            paint.setMaskFilter(maskFilter);
          }
        }
        instructions.forEach(inst => {
          canvas.drawText(
            inst.line,
            inst.x + offset.x,
            inst.y + offset.y,
            paint,
            font,
          );
        });
        break;
      }
      case 'neonGlow': {
        const glowColor =
          typeof params.glowColor === 'string' ? params.glowColor : '#00FFFF';
        const spread = typeof params.spread === 'number' ? params.spread : 12;
        const intensity =
          typeof params.intensity === 'number' ? params.intensity : 0.8;
        const paint = basePaint.copy();
        paint.setColor(Skia.Color(glowColor));
        paint.setAlphaf(Math.min(1, 0.6 + intensity * 0.4));
        const maskFilter = Skia.MaskFilter.MakeBlur(
          BlurStyle.Normal,
          Math.max(2, spread / 2),
          true,
        );
        if (maskFilter) {
          paint.setMaskFilter(maskFilter);
        }
        instructions.forEach(inst => {
          canvas.drawText(inst.line, inst.x, inst.y, paint, font);
        });
        basePaint.setColor(Skia.Color(glowColor));
        break;
      }
      case 'longShadow': {
        const length = Math.max(4, Math.min(120, Number(params.length) || 24));
        const angle = ((params.angle ?? 135) * Math.PI) / 180;
        const fade = typeof params.fade === 'number' ? params.fade : 0.6;
        const shadowColor =
          typeof params.shadowColor === 'string'
            ? params.shadowColor
            : 'rgba(0,0,0,0.7)';
        const steps = Math.min(25, Math.max(6, Math.round(length / 4)));
        const stepX = (Math.cos(angle) * length) / steps;
        const stepY = (Math.sin(angle) * length) / steps;
        for (let index = 0; index < steps; index++) {
          const paint = basePaint.copy();
          paint.setColor(Skia.Color(shadowColor));
          const opacity = Math.pow(1 - fade, index);
          paint.setAlphaf(Math.min(1, 0.7 * opacity));
          const dx = stepX * (index + 1);
          const dy = stepY * (index + 1);
          instructions.forEach(inst => {
            canvas.drawText(inst.line, inst.x + dx, inst.y + dy, paint, font);
          });
        }
        break;
      }
      case 'bloom': {
        const radius = typeof params.radius === 'number' ? params.radius : 16;
        const intensity =
          typeof params.intensity === 'number' ? params.intensity : 0.75;

        // Create multiple bloom layers with vibrant colors
        const bloomColors = ['#FF6B35', '#F7931E', '#FF1493', '#00BFFF'];

        bloomColors.forEach((color, index) => {
          const paint = basePaint.copy();
          const layerRadius = radius * (2 - index * 0.3);
          const layerOpacity = (intensity * 0.4) / (index + 1);

          paint.setColor(Skia.Color(color));
          paint.setAlphaf(layerOpacity);

          const maskFilter = Skia.MaskFilter.MakeBlur(
            BlurStyle.Normal,
            Math.max(4, layerRadius),
            true,
          );
          if (maskFilter) {
            paint.setMaskFilter(maskFilter);
          }

          instructions.forEach(inst => {
            canvas.drawText(inst.line, inst.x, inst.y, paint, font);
          });
        });

        // Draw final white core text
        const corePaint = basePaint.copy();
        corePaint.setColor(Skia.Color('#FFFFFF'));
        corePaint.setAlphaf(1);
        const coreBlur = Skia.MaskFilter.MakeBlur(
          BlurStyle.Normal,
          Math.max(2, radius * 0.3),
          true,
        );
        if (coreBlur) {
          corePaint.setMaskFilter(coreBlur);
        }
        instructions.forEach(inst => {
          canvas.drawText(inst.line, inst.x, inst.y, corePaint, font);
        });

        break;
      }
      case 'letterpress': {
        const depth = typeof params.depth === 'number' ? params.depth : 4;
        const paintShadow = basePaint.copy();
        paintShadow.setColor(Skia.Color('rgba(0,0,0,0.35)'));
        instructions.forEach(inst => {
          canvas.drawText(
            inst.line,
            inst.x - depth / 3,
            inst.y + depth / 3,
            paintShadow,
            font,
          );
        });
        break;
      }
      default:
        break;
    }
  });
};

class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to save slides',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  private async measureViewSize(
    viewRef: React.RefObject<any>,
  ): Promise<{ width: number; height: number } | null> {
    const view = viewRef?.current;

    if (!view || typeof view.measure !== 'function') {
      return null;
    }

    return new Promise(resolve => {
      const resolveWith = (value: { width: number; height: number } | null) => {
        resolve(value);
      };

      setTimeout(() => {
        try {
          view.measure(
            (_x: number, _y: number, width: number, height: number) => {
              if (width > 0 && height > 0) {
                resolveWith({ width, height });
                return;
              }

              if (typeof view.measureInWindow === 'function') {
                view.measureInWindow(
                  (
                    __x: number,
                    __y: number,
                    winWidth: number,
                    winHeight: number,
                  ) => {
                    if (winWidth > 0 && winHeight > 0) {
                      resolveWith({ width: winWidth, height: winHeight });
                    } else {
                      resolveWith(null);
                    }
                  },
                );
              } else {
                resolveWith(null);
              }
            },
          );
        } catch (error) {
          console.warn('Unable to measure view for export:', error);
          resolveWith(null);
        }
      }, 0);
    });
  }

  public async exportSlides(
    slides: Slide[],
    viewRefs: React.RefObject<any>[],
    options: ExportOptions = {},
  ): Promise<{ success: boolean; savedPaths: string[]; error?: string }> {
    const {
      quality = 0.9,
      format = 'png',
      resolution = 1080,
    } = options;

    try {
      // Request storage permission
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        return {
          success: false,
          savedPaths: [],
          error: 'Storage permission denied',
        };
      }

      const savedPaths: string[] = [];

      // Export each slide
      for (let i = 0; i < viewRefs.length; i++) {
        const viewRef = viewRefs[i];

        if (!viewRef?.current) {
          console.warn(`Slide ${i + 1} ref is null, skipping`);
          continue;
        }

        try {
          const measuredSize = await this.measureViewSize(viewRef);
          const captureOptions: Parameters<typeof captureRef>[1] = {
            format,
            result: 'tmpfile',
          };

          if (format === 'jpg') {
            captureOptions.quality = quality;
          }

          if (
            measuredSize &&
            measuredSize.width > 0 &&
            measuredSize.height > 0
          ) {
            const aspectRatio = measuredSize.width / measuredSize.height;
            let targetWidth = measuredSize.width;
            let targetHeight = measuredSize.height;

            if (resolution && resolution > 0) {
              if (aspectRatio >= 1) {
                targetWidth = resolution;
                targetHeight = resolution / (aspectRatio || 1);
              } else {
                targetHeight = resolution;
                targetWidth = resolution * aspectRatio;
              }
            }

            captureOptions.width = Math.max(1, Math.round(targetWidth));
            captureOptions.height = Math.max(1, Math.round(targetHeight));
          }

          // Capture the view
          const uri = await captureRef(viewRef, captureOptions);

          // Save to camera roll
          const savedPath = await CameraRoll.save(uri, {
            type: 'photo',
            album: 'Text to Slides',
          });

          savedPaths.push(savedPath);
        } catch (slideError) {
          console.error(`Error exporting slide ${i + 1}:`, slideError);
        }
      }

      if (savedPaths.length === 0) {
        return {
          success: false,
          savedPaths: [],
          error: 'No slides were exported successfully',
        };
      }

      return {
        success: true,
        savedPaths,
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        savedPaths: [],
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  public async exportSlidesWithSkia(
    slides: Slide[],
    canvasSize: { width: number; height: number } = {
      width: 1080,
      height: 1920,
    },
  ): Promise<{ success: boolean; savedPaths: string[]; error?: string }> {
    const savedPaths: string[] = [];
    const textEffectsEngine = TextEffectsEngine.getInstance();

    try {
      const platformKey =
        Platform.OS === 'ios'
          ? 'ios'
          : Platform.OS === 'android'
          ? 'android'
          : 'default';
      for (const slide of slides) {
        // Create a surface for rendering
        const surface = Skia.Surface.MakeOffscreen(
          canvasSize.width,
          canvasSize.height,
        );

        if (!surface) {
          console.error('Failed to create surface for slide');
          continue;
        }

        const canvas = surface.getCanvas();

        // Clear canvas with background color
        canvas.clear(Skia.Color('white'));

        // Draw background image if exists
        if (slide.image) {
          try {
            // Load image from URI
            const imageData = await RNFS.readFile(slide.image, 'base64');
            const image = Skia.Image.MakeImageFromEncoded(
              Skia.Data.fromBase64(imageData),
            );

            if (image) {
              const srcRect = Skia.XYWHRect(
                0,
                0,
                image.width(),
                image.height(),
              );
              const dstRect = Skia.XYWHRect(
                0,
                0,
                canvasSize.width,
                canvasSize.height,
              );

              const paint = Skia.Paint();
              canvas.drawImageRect(image, srcRect, dstRect, paint);
            }
          } catch (imageError) {
            console.error('Error loading background image:', imageError);
          }
        }

        const legacyFontId =
          slide.fontId === LEGACY_SYSTEM_FONT_ID
            ? DEFAULT_SLIDE_FONT_ID
            : slide.fontId;
        const fontOption = legacyFontId
          ? getSlideFontById(legacyFontId)
          : getSlideFontByFamily(slide.fontFamily);
        const resolvedFontFamily =
          resolveFontFamilyForPlatform(fontOption, platformKey) || 'System';
        const font = matchFont({
          fontFamily: resolvedFontFamily,
          fontSize: slide.fontSize,
          fontWeight:
            resolvedFontFamily !== 'System'
              ? 'normal'
              : slide.fontWeight || 'normal',
        });
        const textPaint = Skia.Paint();
        textPaint.setColor(Skia.Color(slide.color));

        const slideEffects = (slide.textEffects ?? []).filter(effect =>
          isTextEffectSupported(effect.type),
        );
        const preparedEffectLayers =
          textEffectsEngine.prepareLayers(slideEffects);
        if (preparedEffectLayers.length > 0) {
          // TODO: invoke textEffectsEngine.applyEffects once layer-specific
          // renderers are implemented. This will require drawing text to an
          // offscreen surface so we can composite fill/stroke/overlay stacks.
        }

        const lines = slide.text ? slide.text.split('\n') : [''];
        const paddingX = Math.max(12, slide.fontSize * 0.55);
        const paddingY = Math.max(16, slide.fontSize * 0.65);
        const lineHeight = slide.fontSize * 1.35;
        const maxBackgroundWidth = canvasSize.width * 0.9;

        const lineWidths = lines.map(line =>
          font.getTextWidth(line, textPaint),
        );
        const rawTextWidth = Math.max(slide.fontSize, ...lineWidths);
        const backgroundWidth = Math.min(
          rawTextWidth + paddingX * 2,
          maxBackgroundWidth,
        );
        const backgroundHeight =
          lineHeight * Math.max(lines.length, 1) + paddingY * 2;

        // Draw text overlay background
        const textBackgroundPaint = Skia.Paint();
        textBackgroundPaint.setColor(Skia.Color(slide.backgroundColor));
        textBackgroundPaint.setAntiAlias(true);

        const textBgRect = Skia.XYWHRect(
          slide.position.x,
          slide.position.y,
          backgroundWidth,
          backgroundHeight,
        );
        const borderRadius = Math.min(Math.max(12, slide.fontSize * 0.6), 30);
        const roundedRect = Skia.RRectXY(
          textBgRect,
          borderRadius,
          borderRadius,
        );
        canvas.drawRRect(roundedRect, textBackgroundPaint);

        const textDrawInstructions: TextDrawInstruction[] = lines.map(
          (line, index) => {
            const lineWidth = lineWidths[index] ?? 0;
            let textX = slide.position.x + paddingX;

            if (slide.textAlign === 'center') {
              textX = slide.position.x + backgroundWidth / 2 - lineWidth / 2;
            } else if (slide.textAlign === 'right') {
              textX = slide.position.x + backgroundWidth - paddingX - lineWidth;
            }

            const textY =
              slide.position.y + paddingY + slide.fontSize + index * lineHeight;
            return { line, x: textX, y: textY };
          },
        );

        applyTextEffectsToCanvas(
          canvas,
          font,
          textPaint,
          textDrawInstructions,
          slideEffects,
          slide.color,
        );

        textDrawInstructions.forEach(instruction => {
          canvas.drawText(
            instruction.line,
            instruction.x,
            instruction.y,
            textPaint,
            font,
          );
        });

        // Save the image
        const image = surface.makeImageSnapshot();
        const data = image.encodeToBase64('png');

        // Save to temp file
        const tempPath = `${RNFS.TemporaryDirectoryPath}/slide_${slide.id}.png`;
        await RNFS.writeFile(tempPath, data, 'base64');

        // Save to camera roll
        const savedPath = await CameraRoll.save(tempPath, {
          type: 'photo',
          album: 'Text to Slides',
        });

        savedPaths.push(savedPath);

        // Clean up temp file
        await RNFS.unlink(tempPath).catch(() => {});
      }

      return {
        success: savedPaths.length > 0,
        savedPaths,
      };
    } catch (error) {
      console.error('Skia export error:', error);
      return {
        success: false,
        savedPaths: [],
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  public showExportSuccess(count: number, t: (key: string, options?: any) => string) {
    Alert.alert(
      t('success'),
      t('export_success', { count: count, plural: count > 1 ? 's' : '' }),
      [
        {
          text: t('view_in_photos'),
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('photos-redirect://');
            }
          },
        },
        { text: t('ok'), style: 'default' },
      ],
    );
  }

}

export default ExportService.getInstance();
