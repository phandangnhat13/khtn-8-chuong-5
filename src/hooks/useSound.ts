import { useCallback, useRef } from "react";

type SoundType = "click" | "success" | "error" | "spark" | "switch" | "buzz";

const SOUNDS: Record<SoundType, { freq: number; type: OscillatorType; duration: number; gain: number; ramp?: number }> = {
  click: { freq: 800, type: "sine", duration: 0.05, gain: 0.15 },
  success: { freq: 520, type: "sine", duration: 0.25, gain: 0.2, ramp: 780 },
  error: { freq: 200, type: "sawtooth", duration: 0.3, gain: 0.12 },
  spark: { freq: 2000, type: "square", duration: 0.08, gain: 0.1 },
  switch: { freq: 600, type: "triangle", duration: 0.06, gain: 0.15 },
  buzz: { freq: 120, type: "sawtooth", duration: 0.5, gain: 0.08 },
};

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((type: SoundType) => {
    try {
      const ctx = getCtx();
      const s = SOUNDS[type];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
      if (s.ramp) {
        osc.frequency.linearRampToValueAtTime(s.ramp, ctx.currentTime + s.duration);
      }
      gain.gain.setValueAtTime(s.gain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + s.duration + 0.05);
    } catch {
      // Audio not supported
    }
  }, [getCtx]);

  return { play };
}
