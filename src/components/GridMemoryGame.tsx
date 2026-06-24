import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, ArrowLeft, RotateCcw, Timer, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface GridMemoryGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

// Minimal Synthesizer for premium retro beeps!
function playTone(frequency: number, type: OscillatorType = 'sine', duration = 0.15) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Graceful fallback if audio context blocked/unsupported
  }
}

export default function GridMemoryGame({ onBackToMenu, onSaveScore }: GridMemoryGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'playing' | 'ended'>('idle');
  const [gameMode, setGameMode] = useState<'normal' | 'unlimited'>('normal');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

  // Grid Configuration
  const [gridSize, setGridSize] = useState(3); // 3x3, 4x4, 5x5
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activePanelId, setActivePanelId] = useState<number | null>(null);

  // Keyboard navigation focus indexes
  const [focusedIndex, setFocusedIndex] = useState(0);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamically determine grid size and pattern flash count according to Level specifications
  const getLevelConfig = (lvl: number) => {
    let size = 3;
    let length = 3;

    if (lvl >= 1 && lvl <= 4) {
      size = 3;
      length = lvl <= 2 ? 3 : 4;
    } else if (lvl >= 5 && lvl <= 8) {
      size = 4;
      length = lvl <= 6 ? 4 : 5;
    } else {
      size = 5;
      length = lvl <= 10 ? 5 : 6;
    }

    return { size, length };
  };

  // Generate sequence pattern
  const generateNewSequence = (lvl: number) => {
    const { size, length } = getLevelConfig(lvl);
    setGridSize(size);
    setFocusedIndex(0); // Reset keyboard focus back to top left index 0

    const newSeq: number[] = [];
    const totalPanels = size * size;
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * totalPanels);
      newSeq.push(idx);
    }

    setSequence(newSeq);
    setUserSequence([]);
    setGameState('showing');
  };

  // Run initial game setup
  const startGame = (mode: 'normal' | 'unlimited') => {
    setGameMode(mode);
    setScore(0);
    setCurrentLevel(1);
    setCombo(0);
    setTimeLeft(60);
    setTotalQuestionsAnswered(0);
    generateNewSequence(1);
  };

  const forceEndGame = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
    setGameState('ended');
    onSaveScore(score);
  };

  // Play a sequence flash show
  useEffect(() => {
    if (gameState === 'showing' && sequence.length > 0) {
      let idx = 0;
      
      const playNextFlash = () => {
        if (idx < sequence.length) {
          const panelVal = sequence[idx];
          setActivePanelId(panelVal);

          // Audio representation note (higher panel index = higher pitched beep)
          const toneFreq = 220 + panelVal * 15; 
          playTone(toneFreq, 'sine', 0.22);

          // Hold flash for 400ms, then dim
          sequenceTimeoutRef.current = setTimeout(() => {
            setActivePanelId(null);
            idx++;
            // Gap between flashes
            sequenceTimeoutRef.current = setTimeout(playNextFlash, 250);
          }, 450);
        } else {
          setActivePanelId(null);
          setGameState('playing');
        }
      };

      // Slight initiation delay before play
      sequenceTimeoutRef.current = setTimeout(playNextFlash, 600);
    }

    return () => {
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, [gameState, sequence]);

  // General 60-second timer countdown
  useEffect(() => {
    if ((gameState === 'showing' || gameState === 'playing') && gameMode === 'normal') {
      if (!countdownIntervalRef.current) {
        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current!);
              countdownIntervalRef.current = null;
              if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
              setGameState('ended');
              onSaveScore(score);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [gameState, gameMode, score, onSaveScore]);

  // Trigger evaluation when user taps a panel
  const handlePanelTap = (panelIdx: number) => {
    if (gameState !== 'playing' || activePanelId !== null) return;

    // Visual/sound feedback on tap
    setActivePanelId(panelIdx);
    const toneFreq = 220 + panelIdx * 15; 
    playTone(toneFreq, 'triangle', 0.12);
    setTimeout(() => {
      setActivePanelId(null);
    }, 180);

    const nextUserSeq = [...userSequence, panelIdx];
    setUserSequence(nextUserSeq);

    const currentVerifyIdx = nextUserSeq.length - 1;
    const isStepCorrect = panelIdx === sequence[currentVerifyIdx];

    if (!isStepCorrect) {
      // Tap was WRONG
      setScore(prev => Math.max(0, prev - 100)); // -100 on mismatch
      setCombo(0);
      setTotalQuestionsAnswered(prev => prev + 1);
      playTone(150, 'sawtooth', 0.35); // Sad buzzer tone
      
      // Delay slightly and regenerate sequence for same level
      setGameState('showing');
      setTimeout(() => {
        generateNewSequence(currentLevel);
      }, 700);
      return;
    }

    // Correct step, check if sequence is fully completed
    if (nextUserSeq.length === sequence.length) {
      // Completed full sequence! Level Clear
      const completedCombo = combo + 1;
      setCombo(completedCombo);
      setTotalQuestionsAnswered(prev => prev + 1);
      
      const levelUpPoints = 200 + currentLevel * 100 + completedCombo * 20;
      setScore(prev => prev + levelUpPoints);
      
      playTone(523.25, 'sine', 0.1); // High pitched win C5
      setTimeout(() => playTone(659.25, 'sine', 0.15), 100); // E5 chord win

      const nextLvl = currentLevel + 1;
      setCurrentLevel(nextLvl);

      setTimeout(() => {
        generateNewSequence(nextLvl);
      }, 800);
    }
  };

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const totalCells = gridSize * gridSize;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = prev - gridSize;
            return next >= 0 ? next : prev;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = prev + gridSize;
            return next < totalCells ? next : prev;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => {
            const rowStart = Math.floor(prev / gridSize) * gridSize;
            const next = prev - 1;
            return next >= rowStart ? next : prev;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => {
            const rowEnd = Math.floor(prev / gridSize) * gridSize + gridSize - 1;
            const next = prev + 1;
            return next <= rowEnd ? next : prev;
          });
          break;
        case 'Enter':
        case ' ': // Space key
          e.preventDefault();
          handlePanelTap(focusedIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, focusedIndex, userSequence, sequence, gridSize, currentLevel, combo]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="grid-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="grid-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-emerald-50 text-emerald-700 font-mono text-sm px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1" id="grid-controls-badge">
          <Keyboard size={14} />
          矢印キー/Space/クリック操作
        </span>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center py-8"
            id="grid-idle-view"
          >
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              瞬間グリッド記憶ゲーム
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              グリッド状に並んだパネルが一瞬だけ光ります。光った、位置と【正しい順番】を正確に記憶して、同じようにパネルをタップしてください！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-3 font-sans" id="grid-rules-box">
              <div className="font-semibold text-gray-700">【ゲーム仕様】</div>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong className="text-gray-900">グリッド拡張</strong>: レベル向上に伴い、<span className="bg-gray-200 px-1 rounded">3x3</span> ➔ <span className="bg-gray-200 px-1 rounded">4x4</span> ➔ <span className="bg-gray-200 px-1 rounded">5x5</span> に巨大化！</li>
                <li><strong className="text-gray-900">操作方法</strong>: 画面へのタップ/クリックのほか、キーボードの「<strong className="text-emerald-700">矢印キー ◀ ▶ ▲ ▼</strong>」で移動し「<strong className="text-emerald-700">Space/Enter</strong>」で決定も可能です。</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => startGame('normal')}
                className="w-full sm:w-1/2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="grid-start-normal-btn"
              >
                通常モード (60秒)
              </button>
              <button
                onClick={() => startGame('unlimited')}
                className="w-full sm:w-1/2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="grid-start-unlimited-btn"
              >
                無制限モード (時間なし)
              </button>
            </div>
          </motion.div>
        )}

        {(gameState === 'showing' || gameState === 'playing') && (
          <motion.div
            key="active-play"
            className="space-y-6"
            id="grid-active-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-5 text-center font-sans items-stretch animate-fade-in">
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">レベル</span>
                <span className="text-sm sm:text-base font-bold text-gray-800">Lv.{currentLevel}</span>
              </div>
              <div className="bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-50 flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-600 font-semibold uppercase flex items-center gap-0.5 mb-0.5">
                  <Timer size={10} className="animate-pulse" /> {gameMode === 'normal' ? '制限時間' : '回答数'}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-emerald-600">
                  {gameMode === 'normal' ? `${timeLeft}秒` : `${totalQuestionsAnswered}問`}
                </span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">スコア</span>
                <span className="text-sm sm:text-base font-bold text-gray-800">{score}</span>
              </div>
              <button
                onClick={forceEndGame}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-1 rounded-xl border border-rose-200 transition-colors flex flex-col justify-center items-center text-xs sm:text-sm"
                id="grid-exit-btn"
              >
                <span>終了して</span>
                <span>リザルトへ</span>
              </button>
            </div>

            {/* Turn Status Message */}
            <div className="text-center font-sans">
              <span className={`inline-block px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide uppercase ${
                gameState === 'showing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
              }`}>
                {gameState === 'showing' ? '👀 光る順番を覚えてください！' : '👇 順番通りにタップしてください！'}
              </span>
            </div>

            {/* Display Responsive Adaptive Grid Board */}
            <div className="flex justify-center items-center py-4">
              <div
                className="grid gap-2 sm:gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner w-full max-w-[340px] aspect-square"
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                id="grid-cell-board"
              >
                {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                  const isActive = activePanelId === index;
                  // For keyboard focuses
                  const isFocused = focusedIndex === index && gameState === 'playing';

                  return (
                    <button
                      key={index}
                      onClick={() => handlePanelTap(index)}
                      disabled={gameState === 'showing'}
                      className={`relative aspect-square rounded-xl transition-all duration-150 transform cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-102 outline-none'
                          : 'bg-white hover:bg-gray-100 border border-gray-200/80 active:scale-95'
                      } ${isFocused ? 'ring-4 ring-indigo-500/85 ring-offset-2 scale-102 z-10 animate-pulse' : ''}`}
                      id={`grid-cell-${index}`}
                    >
                      {/* Show touch orders on tap as little hints during active touches */}
                      {userSequence.includes(index) && gameState === 'playing' && (
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-50/70 rounded-xl">
                          {userSequence.indexOf(index) + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-6"
            id="grid-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Award size={36} />
            </div>

             <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              トレーニング終了！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              極限の瞬間空間記憶トレーニングが終了しました！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm mx-auto mb-8 font-sans">
              <span className="text-gray-400 text-xs font-semibold uppercase block tracking-wider mb-1">最終獲得スコア</span>
              <span className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">{score} <span className="text-lg font-medium text-gray-500">点</span></span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <button
                onClick={() => startGame(gameMode)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <RotateCcw size={16} />
                もう一度プレイする
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full sm:w-auto border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-1 transition-all"
              >
                メニューに戻る
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
