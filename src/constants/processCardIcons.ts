export type ProcessCardBaseIconKind =
  | 'research'
  | 'plan'
  | 'idea'
  | 'prototype'
  | 'user'
  | 'feedback'
  | 'finalize'
  | 'deploy'
  | 'review';

export type ProcessCardIconKind =
  | ProcessCardBaseIconKind
  | `${ProcessCardBaseIconKind}_${number}`;

export const PROCESS_CARD_VARIANT_COUNT = 35;

const BASE_ICON_OPTIONS: Array<{ id: ProcessCardBaseIconKind; name: string }> = [
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

export const PROCESS_CARD_ICON_OPTIONS: Array<{
  id: ProcessCardIconKind;
  name: string;
}> = BASE_ICON_OPTIONS.flatMap(base =>
  Array.from({ length: PROCESS_CARD_VARIANT_COUNT }, (_, index) => {
    const variantNumber = index + 1;
    return {
      id:
        variantNumber === 1
          ? base.id
          : `${base.id}_${variantNumber}` as ProcessCardIconKind,
      name: variantNumber === 1 ? base.name : `${base.name} ${variantNumber}`,
    };
  }));

const POPULAR_PROCESS_ICON_VARIANTS = new Set<number>(
  Array.from({ length: 18 }, (_, index) => index + 1),
);

export const PROCESS_CARD_ICON_CATALOG_OPTIONS: Array<{
  id: ProcessCardIconKind;
  name: string;
}> = PROCESS_CARD_ICON_OPTIONS.filter(option => {
  const variantMatch = String(option.id).match(/_(\d+)$/);
  const variantNumber = variantMatch ? Number(variantMatch[1]) : 1;
  return POPULAR_PROCESS_ICON_VARIANTS.has(variantNumber);
});

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
