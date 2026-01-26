export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  svgComponent: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Transform your words into stunning visual presentations instantly',
    description: 'Watch your text come to life with beautiful, professionally designed slides',
    svgComponent: 'TextTransformAnimation'
  },
  {
    id: '2', 
    title: 'Never struggle with slide design again - our AI creates perfect layouts automatically',
    description: 'Advanced AI algorithms ensure every slide looks perfect',
    svgComponent: 'AIDesignAnimation'
  },
  {
    id: '3',
    title: 'Speak your ideas into beautiful slides - no typing required',
    description: 'Simply speak and watch as your words transform into elegant presentations',
    svgComponent: 'VoiceToSlideAnimation'
  },
  {
    id: '4',
    title: 'Create professional presentations that captivate your audience every time',
    description: 'Impress with stunning visuals that keep your audience engaged',
    svgComponent: 'ProfessionalSlidesAnimation'
  },
  {
    id: '5',
    title: 'From boring text to breathtaking visuals in seconds, not hours',
    description: 'Transform mundane content into extraordinary presentations instantly',
    svgComponent: 'TextToVisualAnimation'
  },
  {
    id: '6',
    title: 'Your personal presentation designer that fits in your pocket',
    description: 'Professional design power available wherever you go',
    svgComponent: 'PocketDesignerAnimation'
  },
  {
    id: '7',
    title: 'Impress colleagues and clients with slides that look like a design team made them',
    description: 'Achieve professional results that rival expert designers',
    svgComponent: 'DesignTeamAnimation'
  },
  {
    id: '8',
    title: 'Break free from clichés - create unique, stunning presentations that stand out',
    description: 'Original designs that make your message unforgettable',
    svgComponent: 'UniqueDesignAnimation'
  }
];
