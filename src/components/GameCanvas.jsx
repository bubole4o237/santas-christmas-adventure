import { forwardRef, useImperativeHandle, useRef } from 'react';
import useGame from '../hooks/useGame';

/** Canvas контейнер – React само предоставя елемента, а engine-ът рисува върху него. */
const GameCanvas = forwardRef(function GameCanvas({ levelIndex, score, lives, paused, callbacks }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useGame(canvasRef, { levelIndex, score, lives, paused, callbacks });

  useImperativeHandle(
    ref,
    () => ({
      unlockPortal: () => engineRef.current?.unlockPortal(),
      cancelPuzzle: () => engineRef.current?.cancelPuzzle(),
      setVirtual: (action, pressed) => engineRef.current?.input.setVirtual(action, pressed),
    }),
    [engineRef],
  );

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} className="game-canvas" aria-label="Игрово поле" />
    </div>
  );
});

export default GameCanvas;
