import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AdaptiveBackground, adaptiveGlowConfig } from './AdaptiveBackground';

describe('AdaptiveBackground', () => {
  test('keeps navy base and exposes reduced-motion glow timing', async () => {
    expect(adaptiveGlowConfig('mint', false)).toMatchObject({ backgroundColor: 'rgba(113, 183, 151, 0.14)', opacity: 0.12, transitionMs: 320 });
    expect(adaptiveGlowConfig('mint', true)).toMatchObject({ backgroundColor: 'rgba(113, 183, 151, 0.14)', opacity: 0.1, transitionMs: 80 });
    expect(adaptiveGlowConfig(null, false)).toMatchObject({ backgroundColor: 'transparent' });

    const view = await render(
      <AdaptiveBackground color="mint" reducedMotion>
        <Text>board</Text>
      </AdaptiveBackground>,
    );
    expect(view.getByTestId('adaptive-background-glow').props.style).toEqual(expect.objectContaining({
      backgroundColor: 'rgba(113, 183, 151, 0.14)',
      opacity: 0.1,
    }));
    expect(view.getByTestId('adaptive-background-root').props.style).toEqual(expect.objectContaining({ overflow: 'hidden' }));
  });
});
