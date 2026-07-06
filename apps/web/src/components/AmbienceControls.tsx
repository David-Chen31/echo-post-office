'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

  // 以 ref 为准判断是否在播放，避免把副作用放进 setState updater
  // （StrictMode 下 updater 会被调用两次，导致启两条音轨、只停掉一条而关不掉）
  const toggle = useCallback(() => {
    if (ref.current) {
      stop();
      setOn(false);
    } else {
      start();
      setOn(true);
    }
  }, [start, stop]);

  useEffect(() => () => stop(), [stop]);
  return { on, toggle };
}

/** 全站悬浮氛围控件：右缘竖排，昼/夜切换 + 雨声开关。首次到访给一次轻提示。 */
export function AmbienceControls() {
  const { theme, toggle } = useTheme();
  const rain = useRain();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('ambience-hint-seen')) {
        setHint(true);
        const t = setTimeout(() => setHint(false), 8000);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismissHint = () => {
    setHint(false);
    try {
      localStorage.setItem('ambience-hint-seen', '1');
    } catch {
      /* ignore */
    }
  };

  const onTheme = () => {
    dismissHint();
    toggle();
  };
  const onRain = () => {
    dismissHint();
    rain.toggle();
  };

  return (
    <div className="fixed right-2 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2">
      <AnimatePresence>
        {hint && (
          <motion.button
            key="hint"
            type="button"
            onClick={dismissHint}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="max-w-[150px] rounded-2xl border border-line bg-letter/95 px-3 py-2 text-left font-ui text-[12px] leading-snug text-ink shadow-paper backdrop-blur"
          >
            <span className="text-stamp">🌙 夜晚 · 🌧 雨声</span>
            <br />
            在这里，试试营造写信的氛围
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <motion.button
          onClick={onTheme}
          whileTap={{ scale: 0.86 }}
          aria-label={theme === 'night' ? '切到白天' : '切到夜晚'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-line bg-letter/85 text-[15px] text-ink shadow-soft backdrop-blur transition-colors hover:text-stamp ${
            hint ? 'ring-2 ring-stamp/50' : ''
          }`}
        >
          {theme === 'night' ? '🌙' : '☀️'}
        </motion.button>
        <motion.button
          onClick={onRain}
          whileTap={{ scale: 0.86 }}
          aria-label={rain.on ? '关闭雨声' : '打开雨声'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-soft backdrop-blur transition-colors ${
            rain.on ? 'border-stamp bg-stamp/90 text-letter' : 'border-line bg-letter/85 text-ink2 hover:text-stamp'
          } ${hint ? 'ring-2 ring-stamp/50' : ''}`}
        >
          🌧
        </motion.button>
      </div>
    </div>
  );
}
