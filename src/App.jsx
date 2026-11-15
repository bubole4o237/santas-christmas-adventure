import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainMenu from './components/MainMenu';
import LevelSelector from './components/LevelSelector';
import Instructions from './components/Instructions';
import Settings from './components/Settings';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import PauseMenu from './components/PauseMenu';
import PuzzleModal from './components/PuzzleModal';
import GameOver from './components/GameOver';
import LevelComplete from './components/LevelComplete';
import VictoryScreen from './components/VictoryScreen';
import MobileControls from './components/MobileControls';
import Snowfall from './components/Snowfall';
import { LEVELS } from './data/levels';
import audio, { LEVEL_SONGS } from './audio/AudioManager';
import {
  START_LIVES,
  TOTAL_LEVELS,
  aggregateStats,
  loadSave,
  recordLevelComplete,
  resetProgress,
  saveRun,
  saveSettings,
} from './utils/storage';
import { isTouchDevice } from './utils/helpers';

const EMPTY_HUD = {
  score: 0,
  lives: START_LIVES,
  stars: 0,
  totalStars: 0,
  gifts: 0,
  totalGifts: 0,
  keys: 0,
  hasDoors: false,
  progress: 0,
  shield: false,
  powerups: { speed: 0, superjump: 0, magnet: 0 },
};

export default function App() {
  const [save, setSave] = useState(() => loadSave());
  const [screen, setScreen] = useState('menu');
  const [session, setSession] = useState(null); // { levelIndex, startScore, lives, runKey }
  const [hud, setHud] = useState(EMPTY_HUD);
  const [paused, setPaused] = useState(false);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [pauseSettings, setPauseSettings] = useState(false);
  const [lastStats, setLastStats] = useState(null);
  const [touch] = useState(() => isTouchDevice());
  const gameRef = useRef(null);

  const settings = save.settings;
  const level = session ? LEVELS[session.levelIndex] : null;

  // настройки на звука
  useEffect(() => {
    audio.setSettings(settings);
  }, [settings]);

  // аудиото се отключва при първото действие на потребителя
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // музика според екрана
  useEffect(() => {
    if (screen === 'playing' && level) audio.playMusic(LEVEL_SONGS[level.id]);
    else if (screen === 'victory') audio.playMusic(LEVEL_SONGS.victory);
    else if (screen === 'gameOver') audio.stopMusic();
    else if (screen !== 'levelComplete') audio.playMusic(LEVEL_SONGS.menu);
  }, [screen, level]);

  const updateSettings = useCallback((partial) => {
    setSave(saveSettings(partial));
  }, []);

  /* ------------------------------ навигация ------------------------------ */

  const startLevel = useCallback((levelIndex, startScore, lives) => {
    setSession({ levelIndex, startScore, lives, runKey: Date.now() });
    setHud({ ...EMPTY_HUD, score: startScore, lives });
    setPaused(false);
    setPuzzleOpen(false);
    setPauseSettings(false);
    setSave(saveRun({ level: levelIndex + 1, score: startScore, lives }));
    setScreen('playing');
  }, []);

  const handleNewGame = useCallback(() => startLevel(0, 0, START_LIVES), [startLevel]);

  const handleContinue = useCallback(() => {
    const run = loadSave().run;
    if (!run) return;
    startLevel(Math.min(TOTAL_LEVELS, run.level) - 1, run.score || 0, run.lives || START_LIVES);
  }, [startLevel]);

  const handleSelectLevel = useCallback((index) => startLevel(index, 0, START_LIVES), [startLevel]);

  const goMenu = useCallback(() => {
    setPaused(false);
    setPuzzleOpen(false);
    setPauseSettings(false);
    setSession(null);
    setScreen('menu');
  }, []);

  const quitToMenu = useCallback(() => {
    if (session) {
      setSave(saveRun({ level: session.levelIndex + 1, score: session.startScore, lives: session.lives }));
    }
    goMenu();
  }, [session, goMenu]);

  /* ------------------------------ събития от engine-а ------------------------------ */

  const handlePortal = useCallback(() => {
    setPuzzleOpen(true);
  }, []);

  const handleLevelComplete = useCallback(
    (stats) => {
      const isLast = stats.levelId >= TOTAL_LEVELS;
      const run = isLast ? null : { level: stats.levelId + 1, score: stats.totalScore, lives: Math.max(START_LIVES, stats.lives) };
      setSave(recordLevelComplete(stats.levelId, stats, run));
      setLastStats(stats);
      setPaused(false);
      setScreen(isLast ? 'victory' : 'levelComplete');
    },
    [],
  );

  const handleGameOver = useCallback(
    (stats) => {
      setLastStats(stats);
      if (session) setSave(saveRun({ level: session.levelIndex + 1, score: session.startScore, lives: START_LIVES }));
      setScreen('gameOver');
    },
    [session],
  );

  const requestPause = useCallback(() => {
    setPaused((p) => {
      if (!p) audio.play('pause');
      return true;
    });
  }, []);

  const callbacks = useMemo(
    () => ({
      onHud: setHud,
      onPortal: handlePortal,
      onLevelComplete: handleLevelComplete,
      onGameOver: handleGameOver,
      onRequestPause: () => {
        if (!puzzleOpen) requestPause();
      },
    }),
    [handlePortal, handleLevelComplete, handleGameOver, requestPause, puzzleOpen],
  );

  // Esc / P – пауза
  useEffect(() => {
    if (screen !== 'playing') return undefined;
    const onKey = (e) => {
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      if (puzzleOpen) return;
      e.preventDefault();
      if (pauseSettings) {
        setPauseSettings(false);
        return;
      }
      setPaused((p) => !p);
      audio.play('pause');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, puzzleOpen, pauseSettings]);

  const handlePuzzleSolved = useCallback(() => {
    setPuzzleOpen(false);
    gameRef.current?.unlockPortal();
  }, []);

  const handlePuzzleClose = useCallback(() => {
    setPuzzleOpen(false);
    gameRef.current?.cancelPuzzle();
  }, []);

  const handleNextLevel = useCallback(() => {
    const s = loadSave();
    const run = s.run;
    if (run) startLevel(run.level - 1, run.score, run.lives);
  }, [startLevel]);

  const handleReset = useCallback(() => {
    setSave(resetProgress());
  }, []);

  const aggregate = useMemo(() => aggregateStats(save), [save]);
  const gamePaused = paused || puzzleOpen || screen !== 'playing';
  const showMenuBg = screen !== 'playing' && screen !== 'levelComplete' && screen !== 'gameOver' && screen !== 'victory';

  return (
    <div className="app">
      {showMenuBg && (
        <div className="menu-bg">
          <Snowfall count={70} />
        </div>
      )}

      {screen === 'menu' && (
        <MainMenu
          hasRun={!!save.run}
          runInfo={save.run}
          aggregate={aggregate}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onLevels={() => setScreen('levels')}
          onInstructions={() => setScreen('instructions')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'levels' && (
        <LevelSelector
          unlocked={save.unlockedLevel}
          levelsSave={save.levels}
          onSelect={handleSelectLevel}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'instructions' && <Instructions onBack={() => setScreen('menu')} />}
      {screen === 'settings' && (
        <Settings settings={settings} onChange={updateSettings} onReset={handleReset} onBack={() => setScreen('menu')} />
      )}

      {session && (screen === 'playing' || screen === 'levelComplete' || screen === 'gameOver' || screen === 'victory') && (
        <div className="game-screen">
          <GameCanvas
            key={session.runKey}
            ref={gameRef}
            levelIndex={session.levelIndex}
            score={session.startScore}
            lives={session.lives}
            paused={gamePaused}
            callbacks={callbacks}
          />
          {screen === 'playing' && (
            <>
              <GameHUD level={level} hud={hud} onPause={requestPause} />
              {touch && !gamePaused && <MobileControls gameRef={gameRef} />}
            </>
          )}

          {screen === 'playing' && paused && !pauseSettings && (
            <PauseMenu
              level={level}
              onResume={() => setPaused(false)}
              onRestart={() => startLevel(session.levelIndex, session.startScore, session.lives)}
              onSettings={() => setPauseSettings(true)}
              onMenu={quitToMenu}
            />
          )}
          {screen === 'playing' && paused && pauseSettings && (
            <div className="overlay">
              <Settings settings={settings} onChange={updateSettings} onBack={() => setPauseSettings(false)} compact />
            </div>
          )}
          {screen === 'playing' && puzzleOpen && (
            <PuzzleModal levelId={level.id} final={level.id === TOTAL_LEVELS} onSolved={handlePuzzleSolved} onClose={handlePuzzleClose} />
          )}
          {screen === 'gameOver' && (
            <GameOver
              stats={lastStats}
              level={level}
              onRetry={() => startLevel(session.levelIndex, session.startScore, START_LIVES)}
              onMenu={goMenu}
            />
          )}
          {screen === 'levelComplete' && (
            <LevelComplete
              stats={lastStats}
              level={level}
              onNext={handleNextLevel}
              onReplay={() => startLevel(session.levelIndex, session.startScore, START_LIVES)}
              onMenu={goMenu}
            />
          )}
          {screen === 'victory' && (
            <VictoryScreen
              stats={lastStats}
              aggregate={aggregate}
              onMenu={goMenu}
              onLevels={() => {
                setSession(null);
                setScreen('levels');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
