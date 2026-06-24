import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, ArrowLeft, RotateCcw, Timer, Award, CheckCircle2, AlertCircle, Delete, Home, ShieldAlert } from 'lucide-react';

interface PeopleCountingGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

interface Actor {
  id: string;
  emoji: string;
  isHuman: boolean;
  direction: 'in' | 'out';
  delay: number;
  yOffset: number;
}

const HUMAN_EMOJIS = ['👦', '👧', '👨', '👩', '👴', '👵'];
const ANIMAL_EMOJIS = ['🐶', '🐱', '🦊', '🐰', '🐼', '🐹'];

export default function PeopleCountingGame({ onBackToMenu, onSaveScore }: PeopleCountingGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'answering' | 'ended'>('idle');
  const [gameMode, setGameMode] = useState<'normal' | 'unlimited'>('normal');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Question state
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);
  const [runningHumanCount, setRunningHumanCount] = useState(0);
  const [currentActors, setCurrentActors] = useState<Actor[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Difficulty multiplier & config
  const getLevelConfig = (lvl: number) => {
    // Return steps count, speed (ms duration), max simultaneous actors, animal spawn chance
    if (lvl <= 2) {
      return { steps: 3, duration: 1800, maxSimultaneous: 1, animalChance: 0 };
    } else if (lvl <= 4) {
      return { steps: 4, duration: 1500, maxSimultaneous: 2, animalChance: 0.15 };
    } else if (lvl <= 6) {
      return { steps: 5, duration: 1300, maxSimultaneous: 2, animalChance: 0.35 };
    } else {
      return { steps: 6, duration: 1000, maxSimultaneous: 3, animalChance: 0.5 };
    }
  };

  const generateNewQuestion = (lvl: number) => {
    const config = getLevelConfig(lvl);
    setTotalSteps(config.steps);
    setCurrentStep(1);
    setUserInput('');
    setIsAnswerCorrect(null);

    // Initial people inside the house (let's say 0 for standard start, to make it clean)
    const initialCount = 0;
    setRunningHumanCount(initialCount);

    triggerStep(1, initialCount, config);
  };

  const triggerStep = (stepIdx: number, humanCountAtStart: number, config: any) => {
    // Determine how many humans/animals are coming in or out
    // Make sure human count in house never goes negative
    const numActors = Math.floor(Math.random() * config.maxSimultaneous) + 1;
    const actorsList: Actor[] = [];
    let currentCount = humanCountAtStart;

    for (let i = 0; i < numActors; i++) {
      const isHuman = Math.random() >= config.animalChance;
      const emoji = isHuman
        ? HUMAN_EMOJIS[Math.floor(Math.random() * HUMAN_EMOJIS.length)]
        : ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)];

      // Can go out only if there is someone in the house
      // And we prevent too many humans leaving that exceeds currentCount during simultaneous generation
      // Initially (Level 1), people do not leave the house
      const canGoOut = currentLevel > 1 && (isHuman ? currentCount > 0 : Math.random() > 0.5); 
      const direction = canGoOut && Math.random() > 0.4 ? 'out' : 'in';

      if (isHuman) {
        if (direction === 'in') {
          currentCount += 1;
        } else {
          currentCount -= 1;
        }
      }

      actorsList.push({
        id: `${stepIdx}-${i}-${Math.random()}`,
        emoji,
        isHuman,
        direction,
        delay: i * 0.4,
        yOffset: (i - (numActors - 1) / 2) * 28,
      });
    }

    setRunningHumanCount(currentCount);
    setCurrentActors(actorsList);

    const maxDelay = (numActors - 1) * 0.4;

    // After animation duration, proceed to next step or answering
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentActors([]);
      
      // Delay before next step starts to give breathing room
      animationTimeoutRef.current = setTimeout(() => {
        if (stepIdx < config.steps) {
          setCurrentStep(stepIdx + 1);
          triggerStep(stepIdx + 1, currentCount, config);
        } else {
          setGameState('answering');
        }
      }, 500);

    }, config.duration + (maxDelay * 1000) + 300);
  };

  const startGame = (mode: 'normal' | 'unlimited') => {
    setGameMode(mode);
    setScore(0);
    setCurrentLevel(1);
    setCombo(0);
    setTotalQuestionsAnswered(0);
    setTimeLeft(60);
    setGameState('showing');
    generateNewQuestion(1);
  };

  const forceEndGame = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setGameState('ended');
    onSaveScore(score);
  };

  useEffect(() => {
    if ((gameState === 'showing' || gameState === 'answering') && gameMode === 'normal') {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerIntervalRef.current!);
              timerIntervalRef.current = null;
              setGameState('ended');
              onSaveScore(score);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState, gameMode, score, onSaveScore]);

  const handleKeyPress = (char: string) => {
    if (gameState !== 'answering') return;

    if (char === 'C') {
      setUserInput('');
    } else if (char === 'Del' || char === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
    } else if (char === 'Enter') {
      submitAnswer();
    } else {
      if (userInput.length < 3) {
        setUserInput(prev => prev + char);
      }
    }
  };

  const submitAnswer = () => {
    if (userInput.trim() === '') return;

    const parsedAns = parseInt(userInput, 10);
    const isCorrect = parsedAns === runningHumanCount;
    let nextScore = score;

    if (isCorrect) {
      const addedPoints = 400 + currentLevel * 100 + combo * 30;
      nextScore = score + addedPoints;
      setScore(nextScore);
      setCombo(prev => prev + 1);
      setIsAnswerCorrect(true);
    } else {
      nextScore = Math.max(0, score - 150);
      setScore(nextScore);
      setCombo(0);
      setIsAnswerCorrect(false);
    }

    const nextTotalAnswers = totalQuestionsAnswered + 1;
    setTotalQuestionsAnswered(nextTotalAnswers);

    // Delay slightly and go to next question
    setTimeout(() => {
      const nextLvl = isCorrect ? currentLevel + 1 : currentLevel;
      setCurrentLevel(nextLvl);
      setGameState('showing');
      generateNewQuestion(nextLvl);
    }, 1500);
  };

  // Keyboard Event Listeners for physical PC gaming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'answering') return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleKeyPress('Backspace');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, userInput, runningHumanCount, currentLevel, combo, totalQuestionsAnswered]);

  const activeConfig = getLevelConfig(currentLevel);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="counting-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="counting-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-indigo-50 text-indigo-700 font-mono text-sm px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1" id="counting-keyboard-badge">
          <Keyboard size={14} />
          キーボード入力可
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
            id="counting-idle-view"
          >
            <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Home size={32} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              人数数えゲーム
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              家の中に人や動物が次々と出入りします。人以外の生き物を除外して、最終的に【家に残った人間の数】を正確に答えてください！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-3 font-sans" id="counting-rules-box">
              <div className="font-semibold text-gray-700 flex items-center gap-1">
                <ShieldAlert size={15} className="text-amber-500" />
                【重要：カウント対象ルール】
              </div>
              <ul className="list-none space-y-2 text-gray-600 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">⭕ カウントする:</span>
                  <span>人間 (👦 👧 👨 👩 👴 👵)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-rose-500 font-bold">❌ カウントしない (おとり):</span>
                  <span>動物 (🐶 🐱 🦊 🐰 🐼 🐹)</span>
                </li>
              </ul>
              <div className="text-xs text-gray-500 border-t border-gray-200/60 pt-2">
                🏠 最初は家には「誰もいない(0人)」状態から始まります。出入りが終わったら、残った「人間の数」を入力してください！
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => startGame('normal')}
                className="w-full sm:w-1/2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="counting-start-normal-btn"
              >
                通常モード (60秒)
              </button>
              <button
                onClick={() => startGame('unlimited')}
                className="w-full sm:w-1/2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="counting-start-unlimited-btn"
              >
                無制限モード (時間なし)
              </button>
            </div>
          </motion.div>
        )}

        {(gameState === 'showing' || gameState === 'answering') && (
          <motion.div
            key="active-play"
            className="space-y-6"
            id="counting-active-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-5 text-center font-sans items-stretch">
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">レベル</span>
                <span className="text-sm sm:text-base font-bold text-gray-800">Lv.{currentLevel}</span>
              </div>
              <div className="bg-indigo-50/50 p-1.5 rounded-xl border border-indigo-50 flex flex-col items-center justify-center">
                <span className="text-[10px] text-indigo-600 font-semibold uppercase flex items-center gap-0.5 mb-0.5">
                  <Timer size={10} className="animate-pulse" /> {gameMode === 'normal' ? '制限時間' : '回答数'}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-indigo-600">
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
                id="counting-exit-btn"
              >
                <span>終了して</span>
                <span>リザルトへ</span>
              </button>
            </div>

            {/* Turn Message Status */}
            <div className="text-center font-sans">
              <span className={`inline-block px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide uppercase ${
                gameState === 'showing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
              }`}>
                {gameState === 'showing' ? `👀 出入りを数えましょう！ (ステップ ${currentStep} / ${totalSteps})` : '👇 ドアの中に何人残っていますか？'}
              </span>
            </div>

            {/* Graphic Stage (House and Actors) */}
            <div className="relative h-64 bg-slate-50 border border-gray-100 rounded-3xl flex justify-center items-center overflow-hidden" id="counting-stage">
              {/* Back Dropping Feedback Fades */}
              <AnimatePresence>
                {isAnswerCorrect === true && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500 z-0" />
                )}
                {isAnswerCorrect === false && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-500 z-0" />
                )}
              </AnimatePresence>

              {/* Character Walkways */}
              <div className="absolute inset-x-0 bottom-4 h-16 border-t border-dashed border-gray-200 flex items-center justify-between px-6 z-0">
                <span className="text-[10px] font-bold text-gray-400 font-mono">← 出入り口 (IN)</span>
                <span className="text-[10px] font-bold text-gray-400 font-mono">出口 (OUT) →</span>
              </div>

              {/* The Beautiful Miniature House illustration */}
              <div className="relative w-40 h-40 bg-amber-100 border-4 border-amber-800 rounded-2xl flex items-end justify-center shadow-md z-10" id="counting-house">
                {/* Roof */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[92px] border-l-transparent border-r-[92px] border-r-transparent border-b-[36px] border-b-amber-800" />
                {/* Doors */}
                <div className="w-12 h-20 bg-amber-900 rounded-t-md border border-amber-950 flex items-center justify-center relative shadow-inner">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full absolute right-1.5" />
                </div>
                {/* Windows */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-sky-200 border border-amber-800 rounded flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="w-full h-[1px] bg-amber-800" />
                  <div className="h-full w-[1px] bg-amber-800 absolute" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-sky-200 border border-amber-800 rounded flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="w-full h-[1px] bg-amber-800" />
                  <div className="h-full w-[1px] bg-amber-800 absolute" />
                </div>
              </div>

              {/* Actors Entry / Exit Animations */}
              <AnimatePresence>
                {currentActors.map((actor, aIdx) => {
                  const animDuration = activeConfig.duration / 1000; // Convert to seconds

                  // Left-to-House Entrance Path Animation
                  const enterVariants = {
                    initial: { x: -200, y: 35 + actor.yOffset, opacity: 0, scale: 1.2 },
                    animate: {
                      x: [ -200, -35, 0 ],
                      y: [ 35 + actor.yOffset, 35 + actor.yOffset, 10 + actor.yOffset ],
                      scale: [ 1.2, 1.2, 0 ],
                      opacity: [ 0, 1, 0 ],
                      transition: {
                        duration: animDuration,
                        times: [ 0, 0.7, 1 ],
                        ease: "easeInOut",
                        delay: actor.delay
                      }
                    }
                  };

                  // House-to-Right Exit Path Animation
                  const exitVariants = {
                    initial: { x: 0, y: 10 + actor.yOffset, scale: 0, opacity: 0 },
                    animate: {
                      x: [ 0, 35, 200 ],
                      y: [ 10 + actor.yOffset, 35 + actor.yOffset, 35 + actor.yOffset ],
                      scale: [ 0, 1.2, 1.2 ],
                      opacity: [ 0, 1, 0 ],
                      transition: {
                        duration: animDuration,
                        times: [ 0, 0.3, 1 ],
                        ease: "easeInOut",
                        delay: actor.delay
                      }
                    }
                  };

                  const isEntrance = actor.direction === 'in';

                  return (
                    <motion.div
                      key={actor.id}
                      variants={isEntrance ? enterVariants : exitVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute text-4xl select-none z-25 pointer-events-none filter drop-shadow-sm"
                      style={{ originY: 1 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -8, 0],
                          rotate: [-3, 3, -3]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.35,
                          ease: "easeInOut"
                        }}
                      >
                        {actor.emoji}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Result Overlay Panels */}
              {gameState === 'answering' && isAnswerCorrect !== null && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-30" id="counting-feedback-overlay">
                  {isAnswerCorrect ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-2">
                      <CheckCircle2 size={54} className="text-emerald-500 mx-auto" />
                      <h4 className="text-xl font-bold text-emerald-600">正解！</h4>
                      <p className="text-sm text-gray-500 font-mono">正解の人数: {runningHumanCount} 人</p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-2">
                      <AlertCircle size={54} className="text-rose-500 mx-auto" />
                      <h4 className="text-xl font-bold text-rose-500">不正解...</h4>
                      <p className="text-sm text-gray-500 font-mono">正解の人数: {runningHumanCount} 人</p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Answer Virtual Keyboard (Active during Answering state) */}
            <div className={`transition-all duration-200 ${gameState === 'answering' && isAnswerCorrect === null ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} id="counting-virtual-keypad">
              <div className="max-w-xs mx-auto p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                <div className="flex justify-between items-center bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-semibold text-gray-400">回答：</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black font-mono text-gray-800">
                      {userInput || ' '}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">人</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeyPress(num)}
                      className="py-2.5 bg-white hover:bg-gray-100 active:scale-95 text-lg font-bold font-mono text-gray-700 rounded-xl border border-gray-100 shadow-xs transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleKeyPress('C')}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs rounded-xl font-sans"
                  >
                    クリア
                  </button>
                  <button
                    onClick={() => handleKeyPress('0')}
                    className="py-2.5 bg-white hover:bg-gray-100 active:scale-95 text-lg font-bold font-mono text-gray-700 rounded-xl border border-gray-100 shadow-xs transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleKeyPress('Backspace')}
                    className="py-2.5 bg-white hover:bg-red-50 text-red-500 active:scale-95 rounded-xl border border-gray-100 shadow-xs transition-all flex items-center justify-center"
                  >
                    <Delete size={18} />
                  </button>
                </div>

                <button
                  onClick={submitAnswer}
                  disabled={gameState !== 'answering' || userInput === ''}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 text-sm"
                >
                  答えを決定 (Enter)
                </button>
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
            id="counting-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Award size={36} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              トレーニング終了！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              人数数えトレーニングが終了しました！
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
