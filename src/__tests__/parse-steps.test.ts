import { parseSteps } from '../lib/parse-steps';

describe('parseSteps', () => {
  it('parses numbered list instructions', () => {
    const input = '1. Boil water\n2. Add pasta\n3. Cook for 8 minutes';
    expect(parseSteps(input)).toEqual(['Boil water', 'Add pasta', 'Cook for 8 minutes']);
  });

  it('parses step-labelled instructions', () => {
    const input = 'Step 1: Boil water\nStep 2: Add pasta';
    expect(parseSteps(input)).toEqual(['Boil water', 'Add pasta']);
  });

  it('parses step-labelled with period', () => {
    const input = 'Step 1. Boil water\nStep 2. Add pasta';
    expect(parseSteps(input)).toEqual(['Boil water', 'Add pasta']);
  });

  it('parses bare paragraph instructions', () => {
    const input = 'Boil water.\n\nAdd pasta and cook for 8 minutes.';
    expect(parseSteps(input)).toEqual(['Boil water.', 'Add pasta and cook for 8 minutes.']);
  });

  it('treats single paragraph with no newlines as one step', () => {
    const input = 'Boil water, add pasta, cook for 8 minutes, drain and serve.';
    expect(parseSteps(input)).toEqual(['Boil water, add pasta, cook for 8 minutes, drain and serve.']);
  });

  it('filters empty lines', () => {
    const input = '1. Boil water\n\n\n2. Add pasta\n\n';
    expect(parseSteps(input)).toEqual(['Boil water', 'Add pasta']);
  });

  it('returns empty array for empty string', () => {
    expect(parseSteps('')).toEqual([]);
  });

  it('handles uppercase STEP prefix', () => {
    const input = 'STEP 1: Boil water\nSTEP 2: Add pasta';
    expect(parseSteps(input)).toEqual(['Boil water', 'Add pasta']);
  });
});
