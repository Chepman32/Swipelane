export interface OnboardingSlide {
  id: string;
  titleKey: string;
  descriptionKey: string;
  svgComponent: string;
  accentColor: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    titleKey: 'onboarding_slide_1_title',
    descriptionKey: 'onboarding_slide_1_description',
    svgComponent: 'TextBloomAnimation',
    accentColor: '#1a1a2e',
  },
  {
    id: '2',
    titleKey: 'onboarding_slide_2_title',
    descriptionKey: 'onboarding_slide_2_description',
    svgComponent: 'VoiceWaveAnimation',
    accentColor: '#1b0936',
  },
  {
    id: '3',
    titleKey: 'onboarding_slide_3_title',
    descriptionKey: 'onboarding_slide_3_description',
    svgComponent: 'FlowTuneAnimation',
    accentColor: '#10203a',
  },
  {
    id: '4',
    titleKey: 'onboarding_slide_4_title',
    descriptionKey: 'onboarding_slide_4_description',
    svgComponent: 'RoadmapPathAnimation',
    accentColor: '#1a0a00',
  },
  {
    id: '5',
    titleKey: 'onboarding_slide_5_title',
    descriptionKey: 'onboarding_slide_5_description',
    svgComponent: 'AutosaveShieldAnimation',
    accentColor: '#102d2d',
  },
];
