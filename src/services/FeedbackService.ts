/**
 * Sound and Haptic Feedback Service for Text-to-Slides app
 */

import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import StorageService from './StorageService';

// Configure haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

class FeedbackService {
  private static instance: FeedbackService;
  private sounds: { [key: string]: Sound } = {};
  private soundEnabled: boolean = true;
  private hapticEnabled: boolean = true;

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  constructor() {
    this.initializeSounds();
    this.initializePreferences();
  }

  private initializeSounds() {
    // Initialize sound objects for different feedback types
    // We'll use system sounds to avoid file management issues
    
    try {
      // Initialize sound objects with system sounds
      // For iOS, we can use system sound IDs
      // For Android, we'll use the Sound library with simple tones
      
      // Create sound objects for different types
      this.sounds['tap'] = new Sound('tap.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load tap sound, will use system sound');
        }
      });
      
      this.sounds['success'] = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load success sound, will use system sound');
        }
      });
      
      this.sounds['error'] = new Sound('error.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load error sound, will use system sound');
        }
      });
      
      this.sounds['slide'] = new Sound('slide.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load slide sound, will use system sound');
        }
      });
      
      console.log('Sound system initialized');
    } catch (error) {
      console.log('Error initializing sounds:', error);
    }
  }

  private async initializePreferences() {
    try {
      const prefs = await StorageService.getPreferences();
      this.setSoundEnabled(prefs.soundEnabled);
      this.setHapticEnabled(prefs.hapticsEnabled);
    } catch (error) {
      console.log('Error initializing feedback preferences:', error);
    }
  }

  /**
   * Play a sound effect
   */
  public playSound(soundType: 'tap' | 'success' | 'error' | 'slide'): void {
    if (!this.soundEnabled) return;

    try {
      const sound = this.sounds[soundType];
      if (sound) {
        // Reset sound position to beginning and play
        sound.setCurrentTime(0);
        sound.play((success) => {
          if (!success) {
            console.log(`Failed to play ${soundType} sound`);
          }
        });
      } else {
        // Fallback: use system sound if available
        if (soundType === 'tap') {
          // Use system sound for tap (iOS system sound 1104)
          if (Platform.OS === 'ios') {
            const sound = new Sound(1104); // iOS system sound
            sound.play();
          }
        }
        console.log(`Playing sound: ${soundType}`);
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  /**
   * Trigger haptic feedback
   */
  public triggerHaptic(type: HapticFeedbackTypes): void {
    if (!this.hapticEnabled) return;

    try {
      ReactNativeHapticFeedback.trigger(type, hapticOptions);
    } catch (error) {
      console.log('Error triggering haptic feedback:', error);
    }
  }

  /**
   * Combined sound and haptic feedback for button taps
   */
  public buttonTap(): void {
    this.playSound('tap');
    this.triggerHaptic('impactLight');
  }

  /**
   * Combined sound and haptic feedback for successful actions
   */
  public success(): void {
    this.playSound('success');
    this.triggerHaptic('notificationSuccess');
  }

  /**
   * Combined sound and haptic feedback for errors
   */
  public error(): void {
    this.playSound('error');
    this.triggerHaptic('notificationError');
  }

  /**
   * Combined sound and haptic feedback for slide transitions
   */
  public slideTransition(): void {
    this.playSound('slide');
    this.triggerHaptic('selection');
  }

  /**
   * Haptic feedback for text dragging
   */
  public textDrag(): void {
    this.triggerHaptic('selection');
  }

  /**
   * Haptic feedback for text resize
   */
  public textResize(): void {
    this.triggerHaptic('impactMedium');
  }

  /**
   * Enable or disable sound effects
   */
  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Enable or disable haptic feedback
   */
  public setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Check if haptic feedback is enabled
   */
  public isHapticEnabled(): boolean {
    return this.hapticEnabled;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.release();
      }
    });
  }
}

export default FeedbackService.getInstance();
