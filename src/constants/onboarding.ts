export interface OnboardingSlide {
  id: string;
  titleKey: string;
  descriptionKey: string;
  svgComponent: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    titleKey: 'onboarding_slide_1_title',
    descriptionKey: 'onboarding_slide_1_description',
    svgComponent: 'TextTransformAnimation'
  },
  {
    id: '3',
    titleKey: 'onboarding_slide_3_title',
    descriptionKey: 'onboarding_slide_3_description',
    svgComponent: 'VoiceToSlideAnimation'
  },
  {
    id: '4',
    titleKey: 'onboarding_slide_4_title',
    descriptionKey: 'onboarding_slide_4_description',
    svgComponent: 'ProfessionalSlidesAnimation'
  },
  {
    id: '5',
    titleKey: 'onboarding_slide_5_title',
    descriptionKey: 'onboarding_slide_5_description',
    svgComponent: 'TextToVisualAnimation'
  },
  {
    id: '6',
    titleKey: 'onboarding_slide_6_title',
    descriptionKey: 'onboarding_slide_6_description',
    svgComponent: 'PocketDesignerAnimation'
  }
];
