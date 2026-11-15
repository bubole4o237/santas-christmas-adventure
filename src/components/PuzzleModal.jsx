import { useCallback, useEffect, useMemo, useState } from 'react';
import { PUZZLES } from '../data/puzzles';
import { shuffle } from '../utils/helpers';
import audio from '../audio/AudioManager';

function pickPuzzle(levelId, exclude) {
  const list = PUZZLES[levelId] || PUZZLES[1];
  const pool = list.length > 1 ? list.filter((p) => p !== exclude) : list;
  const puzzle = pool[Math.floor(Math.random() * pool.length)];
  const options = shuffle(puzzle.options.map((text, i) => ({ text, correct: i === puzzle.answer })));
  return { puzzle, options };
}

/** Модален прозорец с логическа загадка. Играта е на пауза, докато е отворен. */
export default function PuzzleModal({ levelId, final, onSolved, onClose }) {
  const [current, setCurrent] = useState(() => pickPuzzle(levelId));
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [selected, setSelected] = useState(null);

  const answer = useCallback(
    (idx) => {
      if (status !== 'idle') return;
      setSelected(idx);
      if (current.options[idx].correct) {
        setStatus('correct');
        audio.play('correct');
      } else {
        setStatus('wrong');
        audio.play('wrong');
      }
    },
    [status, current],
  );

  const retry = useCallback(() => {
    audio.play('click');
    setStatus('idle');
    setSelected(null);
    setCurrent((c) => ({ ...c, options: shuffle(c.options) }));
  }, []);

  const another = useCallback(() => {
    audio.play('click');
    setStatus('idle');
    setSelected(null);
    setCurrent((c) => pickPuzzle(levelId, c.puzzle));
  }, [levelId]);

  useEffect(() => {
    const onKey = (e) => {
      if (status === 'idle') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= current.options.length) answer(n - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (status === 'correct') onSolved();
        else retry();
      }
      if (e.key === 'Escape' && status !== 'correct') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, current, answer, retry, onSolved, onClose]);

  const letters = useMemo(() => ['А', 'Б', 'В', 'Г', 'Д'], []);

  return (
    <div className="overlay puzzle-overlay">
      <div className={`panel puzzle-panel pop-in ${status === 'wrong' ? 'shake' : ''} ${final ? 'final' : ''}`} role="dialog" aria-modal="true">
        <div className="puzzle-deco" aria-hidden="true">
          🎄 ✨ 🎁 ✨ 🎄
        </div>
        <h2 className="panel-title">{final ? 'Финалната загадка' : 'Загадката на портала'}</h2>
        <p className="puzzle-intro">Реши задачата, за да отключиш магическия портал!</p>
        <p className="puzzle-question">{current.puzzle.question}</p>

        <div className="puzzle-options">
          {current.options.map((opt, i) => {
            let cls = 'puzzle-option';
            if (selected === i && status === 'correct') cls += ' correct';
            if (selected === i && status === 'wrong') cls += ' wrong';
            return (
              <button key={opt.text} className={cls} onClick={() => answer(i)} disabled={status !== 'idle'}>
                <span className="opt-letter">{letters[i]}</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        <div className="puzzle-feedback" aria-live="polite">
          {status === 'wrong' && <p className="feedback wrong">Опитай отново! Не се отказвай!</p>}
          {status === 'correct' && <p className="feedback correct">Браво! Порталът е отключен!</p>}
        </div>

        <div className="puzzle-actions">
          {status === 'wrong' && (
            <>
              <button className="btn btn-primary" onClick={retry} autoFocus>
                🔄 Нов опит
              </button>
              <button className="btn" onClick={another}>
                🎲 Друга загадка
              </button>
            </>
          )}
          {status === 'correct' && (
            <button className="btn btn-gold" onClick={() => { audio.play('click'); onSolved(); }} autoFocus>
              ✨ Премини през портала
            </button>
          )}
          {status !== 'correct' && (
            <button className="btn btn-ghost" onClick={() => { audio.play('click'); onClose(); }}>
              ← Върни се в играта
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
