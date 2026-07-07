import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AdaptiveBackground, adaptiveGlowConfig } from './AdaptiveBackground';

describe('AdaptiveBackground', () => {
  test('keeps navy base and exposes reduced-motion glow timing', async () => {
    expect(adaptiveGlowConfig('mint', false)).toMatchObject({ backgroundColor: 'rgba(113, 183, 151, 0.22)', transitionMs: 220 });
    expect(adaptiveGlowConfig('mint', true)).toMatchObject({ backgroundColor: 'rgba(113, 183, 151, 0.22)', transitionMs: 80 });
    expect(adaptiveGlowConfig(null, false)).toMatchObject({ backgroundColor: 'transparent' });

    const view = await render(
      <AdaptiveBackground color="mint" reducedMotion>
        <Text>board</Text>
      </AdaptiveBackground>,
    );
    expect(view.getByTestId('adaptive-background-glow').props.style).toEqual(expect.arrayContaining([expect.objectContaining({ opacity: 0.18 })]));
  });
});
