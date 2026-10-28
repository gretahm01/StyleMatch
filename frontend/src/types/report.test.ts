import { describe, expect, it } from 'vitest';
import { initialValuesForPresentationCase, presentationTestCases } from './report';

describe('casos de presentación', () => {
  it('applies defaults only when selected again and keeps final filters independently editable', () => {
    const preset = presentationTestCases.find((item) => item.id === 'fashion_casual')!;
    const initial = initialValuesForPresentationCase(preset);
    const edited = { ...initial, occasion: 'work' as const, budget: { maxPrice: 900 } };
    expect(preset.occasion).toBe('casual');
    expect(edited.occasion).toBe('work');
    expect(initialValuesForPresentationCase(preset)).toEqual({ category: 'fashion', occasion: 'casual', budget: { maxPrice: 1800 } });
  });
});
