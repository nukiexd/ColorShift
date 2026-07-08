import { sheetPaddingBottom } from './SheetFrame';

describe('SheetFrame safe area spacing', () => {
  test('adds bottom inset so sheet controls clear Android navigation bars', () => {
    expect(sheetPaddingBottom(0)).toBe(24);
    expect(sheetPaddingBottom(28)).toBe(44);
  });
});
