export type ProcessCardIconKind =
  | 'research'
  | 'plan'
  | 'idea'
  | 'prototype'
  | 'user'
  | 'feedback'
  | 'finalize'
  | 'deploy'
  | 'review';

export const PROCESS_CARD_ICON_OPTIONS: Array<{
  id: ProcessCardIconKind;
  name: string;
}> = [
  { id: 'research', name: 'Research' },
  { id: 'plan', name: 'Plan' },
  { id: 'idea', name: 'Idea' },
  { id: 'prototype', name: 'Prototype' },
  { id: 'user', name: 'User' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'finalize', name: 'Finalize' },
  { id: 'deploy', name: 'Deploy' },
  { id: 'review', name: 'Review' },
];

export const PROCESS_CARD_DEFAULT_ICON_BY_CIRCLE_ID: Record<string, ProcessCardIconKind> = {
  c1: 'research',
  c2: 'plan',
  c3: 'idea',
  c4: 'prototype',
  c5: 'user',
  c6: 'feedback',
  c7: 'finalize',
  c8: 'idea',
  c9: 'deploy',
  c10: 'review',
};
