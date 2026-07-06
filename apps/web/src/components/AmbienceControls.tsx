'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';

/** 程序化雨声：白噪声经带通滤波 + 极慢起伏，无需任何音频文件（规避版权）。 */
function useRain() {
  const [on, setOn] = useState(false);
  const ref = useRef<{ ctx: AudioContext; gain: GainNode; src: AudioBufferSourceNode } | null>(null);

  const stop = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const { ctx, gain, src } = node;
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(() => {
      try {
        src.stop();
        void ctx.close();
      } catch {
        /* ignore */
      }
    }, 700);
    ref.current = null;
  }, []);

  const start = useCallback(() => {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const size = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 420;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1900;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    lfo.start();
    gain.gain.setTargetAtTime(0.06, ctx.currentTime, 1.4);
    ref.current = { ctx, gain, src };
  }, []);

  const toggle = useCallback(() => {
    setOn((prev) => {
      if (prev) stop();
      else start();
      return !prev;
    });
  }, [start, stop]);

  useEffect(() => () => stop(), [stop]);
  return { on, toggle };
}

/** 全站悬浮氛围控件：右缘竖排，昼/夜切换 + 雨声开关。不遮挡顶栏与底部导航。 */
export function AmbienceControls() {
  const { theme, toggle } = useTheme();
  const rain = useRain();

  return (
    <div className="fixed right-2 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
      <button
        onClick={toggle}
        aria-label={theme === 'night' ? '切到白天' : '切到夜晚'}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-letter/85 text-[15px] text-ink shadow-soft backdrop-blur transition-colors hover:text-stamp"
      >
        {theme === 'night' ? '🌙' : '☀️'}
      </button>
      <button
        onClick={rain.toggle}
        aria-label={rain.on ? '关闭雨声' : '打开雨声'}
        className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-soft backdrop-blur transition-colors ${
          rain.on ? 'border-stamp bg-stamp/90 text-letter' : 'border-line bg-letter/85 text-ink2 hover:text-stamp'
        }`}
      >
        🌧
      </button>
    </div>
  );
}
