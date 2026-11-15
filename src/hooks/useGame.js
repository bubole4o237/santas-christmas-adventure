import { useEffect, useRef } from 'react';
import GameEngine from '../game/GameEngine';

/**
 * Свързва React с игровия engine. Engine-ът се създава веднъж при монтиране
 * (повторно стартиране става чрез смяна на `key` на компонента) и се унищожава при демонтиране.
 * Позицията на героя и физиката никога не минават през React state.
 */
export default function useGame(canvasRef, { levelIndex, score, lives, paused, callbacks }) {
  const engineRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const initial = useRef({ score, lives });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const engine = new GameEngine(canvas, {
      levelIndex,
      score: initial.current.score,
      lives: initial.current.lives,
      callbacks: callbacksRef,
    });
    engineRef.current = engine;
    engine.start();

    const onResize = () => engine.resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    const onVisibility = () => {
      if (document.hidden) callbacksRef.current.onRequestPause?.();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      engine.destroy();
      engineRef.current = null;
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [canvasRef, levelIndex]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  return engineRef;
}
