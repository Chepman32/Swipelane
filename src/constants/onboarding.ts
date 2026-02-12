export interface OnboardingSlide {
  id: string;
  titleKey: string;
  descriptionKey: string;
  lottieSource: any;
  accentColor: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    titleKey: 'onboarding_slide_1_title',
    descriptionKey: 'onboarding_slide_1_description',
    lottieSource: require('../assets/animations/Your Words.json'),
    accentColor: '#1a1a2e',
  },
  {
    id: '2',
    titleKey: 'onboarding_slide_2_title',
    descriptionKey: 'onboarding_slide_2_description',
    lottieSource: require('../assets/animations/Stop Polishing.json'),
    accentColor: '#1b0936',
  },
  {
    id: '3',
    titleKey: 'onboarding_slide_3_title',
    descriptionKey: 'onboarding_slide_3_description',
    lottieSource: require('../assets/animations/Messy thoughts.json'),
    accentColor: '#10203a',
  },
  {
    id: '4',
    titleKey: 'onboarding_slide_4_title',
    descriptionKey: 'onboarding_slide_4_description',
    lottieSource: require('../assets/animations/Vision.json'),
    accentColor: '#1a0a00',
  },
  {
    id: '5',
    titleKey: 'onboarding_slide_5_title',
    descriptionKey: 'onboarding_slide_5_description',
    lottieSource: require('../assets/animations/Close the app.json'),
    accentColor: '#102d2d',
  },
];
