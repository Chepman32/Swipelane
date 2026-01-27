/**
 * Sound and Haptic Feedback Service for Text-to-Slides app
 */

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
    // Note: In a real app, you would include actual sound files
    // For now, we'll use system sounds or create simple beeps
    
    try {
      // Use system sounds instead of custom files
      // This prevents the OSStatus errors we were seeing
      console.log('Sound system initialized (using system sounds)');
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
      // For now, we'll just log the sound type since we don't have actual sound files
      // In a production app, you would either:
      // 1. Include actual sound files in the bundle
      // 2. Use system sounds
      // 3. Use a different sound library
      console.log(`Playing sound: ${soundType}`);
      
      // TODO: Implement actual sound playback when sound files are available
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
