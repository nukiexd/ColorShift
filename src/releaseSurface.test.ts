const { readdirSync, readFileSync } = jest.requireActual('fs') as {
  readonly readdirSync: (path: string) => string[];
  readonly readFileSync: (path: string, encoding: 'utf8') => string;
};

describe('release route surface', () => {
  it('exposes only Endless MVP routes', () => {
    const routeFiles = readdirSync('src/app')
      .filter((file) => file.endsWith('.tsx') && file !== '_layout.tsx')
      .sort();

    expect(routeFiles).toEqual(['game.tsx', 'index.tsx', 'results.tsx']);
  });

  it('exposes checked state on web switches', () => {
    const settingsSheetSource = readFileSync('src/components/sheets/SettingsSheet.tsx', 'utf8');

    expect(settingsSheetSource).toContain('aria-checked={checked}');
  });
});
