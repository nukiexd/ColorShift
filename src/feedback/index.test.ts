import * as Audio from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { createFeedback } from './index';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  preload: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const audio = Audio as jest.Mocked<typeof Audio>;
const haptics = Haptics as jest.Mocked<typeof Haptics>;

describe('feedback service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    audio.preload.mockResolvedValue(undefined);
  });

  test('preloads local effect sources and plays with capped calm volume', async () => {
    const player = { volume: 0, playbackRate: 1, seekTo: jest.fn(), play: jest.fn() };
    audio.createAudioPlayer.mockReturnValue(player as never);
    const feedback = createFeedback({ effectsVolume: 0.8, haptics: true, reducedMotion: false });

    await feedback.preload();
    feedback.play('cascade', 9);

    expect(audio.preload).toHaveBeenCalledTimes(5);
    expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(player.volume).toBeCloseTo(0.48);
    expect(player.playbackRate).toBeCloseTo(1.2);
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  test('honors disabled sound and haptics while containing device errors', async () => {
    audio.preload.mockRejectedValueOnce(new Error('audio unavailable'));
    audio.createAudioPlayer.mockImplementation(() => { throw new Error('player unavailable'); });
    haptics.impactAsync.mockRejectedValueOnce(new Error('haptics unavailable'));
    const feedback = createFeedback({ effectsVolume: 0, haptics: false, reducedMotion: false });

    await expect(feedback.preload()).resolves.toBeUndefined();
    expect(() => feedback.play('swap')).not.toThrow();
    expect(() => feedback.lightImpact()).not.toThrow();
    expect(haptics.impactAsync).not.toHaveBeenCalled();
  });

  test('contains asynchronous browser playback rejections', () => {
    const playback = { catch: jest.fn() };
    const player = { volume: 0, playbackRate: 1, seekTo: jest.fn(), play: jest.fn(() => playback) };
    audio.createAudioPlayer.mockReturnValue(player as never);
    const feedback = createFeedback({ effectsVolume: 0.8, haptics: true, reducedMotion: false });

    feedback.play('swap');

    expect(playback.catch).toHaveBeenCalledTimes(1);
  });
});
