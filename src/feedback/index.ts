import { createAudioPlayer, preload } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Settings } from '../storage/schema';

export type FeedbackCue = 'swap' | 'match' | 'cascade' | 'special' | 'shuffle';

export interface Feedback {
  preload(): Promise<void>;
  play(cue: FeedbackCue, cascadeDepth?: number): void;
  lightImpact(): void;
}

const SOURCES: Record<FeedbackCue, number> = {
  swap: require('../../assets/audio/swap.wav'),
  match: require('../../assets/audio/match.wav'),
  cascade: require('../../assets/audio/cascade.wav'),
  special: require('../../assets/audio/special.wav'),
  shuffle: require('../../assets/audio/shuffle.wav'),
};

export function createFeedback(settings: Settings): Feedback {
  const volume = Math.min(0.6, Math.max(0, settings.effectsVolume * 0.6));

  return {
    async preload() {
      await Promise.all(Object.values(SOURCES).map(async (source) => {
        try {
          await preload(source);
        } catch {
          // Device audio availability must never affect gameplay state.
        }
      }));
    },
    play(cue, cascadeDepth = 1) {
      if (volume <= 0) return;
      try {
        const player = createAudioPlayer(SOURCES[cue], { updateInterval: 1000, keepAudioSessionActive: false });
        player.volume = volume;
        player.playbackRate = cue === 'cascade' ? cascadeRate(cascadeDepth) : 1;
        player.seekTo(0);
        const playback = player.play() as unknown;
        if (playback && typeof (playback as { catch?: unknown }).catch === 'function') {
          void (playback as Promise<void>).catch(() => undefined);
        }
      } catch {
        // Feedback is best-effort and intentionally isolated from session flow.
      }
    },
    lightImpact() {
      if (!settings.haptics) return;
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      } catch {
        // Haptics are optional and may be unavailable on some platforms.
      }
    },
  };
}

function cascadeRate(depth: number): number {
  if (!Number.isFinite(depth)) return 1;
  return 1 + Math.min(5, Math.max(1, Math.trunc(depth))) * 0.04;
}
