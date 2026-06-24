import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer, ArrowLeft, RotateCcw, Timer, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface RockPaperScissorsGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

type HandType = 'rock' | 'scissors' | 'paper';
type InstructionType = 'win' | 'lose' | 'draw';

interface HandData {
  id: HandType;
  emoji: string;
  name: string;
  bgClass: string;
}

const HANDS: HandData[] = [
  { id: 'rock', emoji: '✊', name: 'グー', bgClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300' },
  { id: 'scissors', emoji: '✌', name: 'チョキ', bgClass: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'paper', emoji: '✋', name: 'パー', bgClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300' },
];

const INSTRUCTIONS = [
  { id: 'win' as InstructionType, text: '勝ってください', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'lose' as InstructionType, text: '負けてください', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'draw' as InstructionType, text: 'あいこ（引き分け）にしてください', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];

export default function RockPaperScissorsGame({ onBackToMenu, onSaveScore }: RockPaperScissorsGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [gameMode, setGameMode] = useState<'normal' | 'unlimited'>('normal');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

  // Round states
  const [opponentHand, setOpponentHand] = useState<HandData>(HANDS[0]);
  const [currentInstruction, setCurrentInstruction] = useState<typeof INSTRUCTIONS[0]>(INSTRUCTIONS[0]);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate next round
  const generateQuestion = () => {
    const randomHand = HANDS[Math.floor(Math.random() * HANDS.length)];
    const randomInstruction = INSTRUCTIONS[Math.floor(Math.random() * INSTRUCTIONS.length)];

    setOpponentHand(randomHand);
    setCurrentInstruction(randomInstruction);
    setIsAnswerCorrect(null);
  };

  const startGame = (mode: 'normal' | 'unlimited') => {
    setGameMode(mode);
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setTotalQuestionsAnswered(0);
    setGameState('playing');
    generateQuestion();
  };

  const forceEndGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState('ended');
    onSaveScore(score);
  };

  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'normal') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('ended');
            onSaveScore(score);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, gameMode, score, onSaveScore]);

  useEffect(() => {
    if (gameState === 'ended') {
      onSaveScore(score);
    }
  }, [gameState, score, onSaveScore]);

  const handleAnswer = (playerHandId: HandType) => {
    if (gameState !== 'playing') return;

    let isCorrect = false;

    // Logic verification
    // Opponent Hand vs Player Hand
    const opp = opponentHand.id;
    const inst = currentInstruction.id;

    if (inst === 'win') {
      if ((opp === 'rock' && playerHandId === 'paper') ||
          (opp === 'scissors' && playerHandId === 'rock') ||
          (opp === 'paper' && playerHandId === 'scissors')) {
        isCorrect = true;
      }
    } else if (inst === 'lose') {
      if ((opp === 'rock' && playerHandId === 'scissors') ||
          (opp === 'scissors' && playerHandId === 'paper') ||
          (opp === 'paper' && playerHandId === 'rock')) {
        isCorrect = true;
      }
    } else if (inst === 'draw') {
      if (opp === playerHandId) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      const addedPoints = 100 * (1 + Math.floor(combo / 5) * 0.1);
      const finalAdded = Math.round(addedPoints);
      setScore(prev => prev + finalAdded);
      setCombo(prev => prev + 1);
      setIsAnswerCorrect(true);
    } else {
      setScore(prev => Math.max(0, prev - 50));
      setCombo(0);
      setIsAnswerCorrect(false);
    }

    setTotalQuestionsAnswered(prev => prev + 1);

    setTimeout(() => {
      generateQuestion();
    }, 200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="janken-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="janken-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-rose-50 text-rose-600 font-mono text-sm px-3 py-1 rounded-full border border-rose-100 flex items-center gap-1" id="janken-mouse-only-badge">
          <MousePointer size={14} />
          マウス操作専用
        </span>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <motion.div
            key="idle-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center py-8"
            id="janken-idle-view"
          >
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              後出しジャンケン
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              画面に出る「相手の手」と「指示」を確認し、指示通りの手（勝つ・負ける・あいこ）を瞬時に後出しで選んでください！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-2 font-sans" id="janken-rules-box">
              <div className="font-semibold text-gray-700">【ルール説明（仕様範囲）】</div>
              <div>🔹 相手の手： ✊ (グー) / ✌ (チョキ) / ✋ (パー)</div>
              <div>🔹 プレイヤーへの指示：</div>
              <div className="pl-4 text-gray-600">・「勝ってください」</div>
              <div className="pl-4 text-gray-600">・「負けてください」</div>
              <div className="pl-4 text-gray-600">・「あいこ（引き分け）にしてください」</div>
              <div className="pt-2 text-xs text-gray-400">※ミスをするとスコアが減点されますが、プレイは制限時間まで継続されます。</div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => startGame('normal')}
                className="w-full sm:w-1/2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="janken-start-normal-btn"
              >
                通常モード (60秒)
              </button>
              <button
                onClick={() => startGame('unlimited')}
                className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="janken-start-unlimited-btn"
              >
                無制限モード (時間なし)
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="play-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
            id="janken-play-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-5 text-center font-sans items-stretch">
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center" id="janken-hud-score">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">スコア</span>
                <span className="text-sm sm:text-lg font-bold text-gray-800">{score}</span>
              </div>
              <div className="bg-red-50/50 p-1.5 rounded-xl border border-red-50 flex flex-col items-center justify-center" id="janken-hud-timer">
                <span className="text-[10px] text-red-500 font-semibold uppercase flex items-center gap-0.5 mb-0.5">
                  <Timer size={10} className="animate-pulse" /> {gameMode === 'normal' ? '制限時間' : '回答数'}
                </span>
                <span className="text-sm sm:text-lg font-mono font-bold text-red-600">
                  {gameMode === 'normal' ? `${timeLeft}秒` : `${totalQuestionsAnswered}問`}
                </span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center" id="janken-hud-combo">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">コンボ</span>
                <span className="text-sm sm:text-lg font-bold text-gray-800">
                  {combo} <span className="text-[10px] text-gray-500">連続</span>
                </span>
              </div>
              <button
                onClick={forceEndGame}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-1 rounded-xl border border-rose-200 transition-colors flex flex-col justify-center items-center text-xs sm:text-sm"
                id="janken-exit-btn"
              >
                <span>終了して</span>
                <span>リザルトへ</span>
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="text-center py-2" id="janken-instruction-container">
              <motion.div
                key={currentInstruction.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-block px-6 py-2.5 rounded-full text-base sm:text-lg font-bold border cursor-default tracking-wide shadow-sm ${currentInstruction.colorClass}`}
                id="janken-instruction-banner"
              >
                👇 {currentInstruction.text}
              </motion.div>
            </div>

            {/* Main Hand Display */}
            <div className="flex flex-col justify-center items-center h-48 bg-gray-50/50 border border-gray-100 rounded-2xl relative overflow-hidden" id="janken-card-display">
              {/* Correct / Incorrect Feedback Background Flash */}
              <AnimatePresence>
                {isAnswerCorrect === true && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-emerald-500 z-0"
                  />
                )}
                {isAnswerCorrect === false && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-rose-500 z-0"
                  />
                )}
              </AnimatePresence>

              {/* Opponent's hand */}
              <motion.div
                key={`${opponentHand.id}-${currentInstruction.id}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center select-none z-10"
                id="janken-stimulus-hand"
              >
                <span className="text-6xl sm:text-7xl mb-2">{opponentHand.emoji}</span>
                <span className="text-xs text-gray-400 font-bold tracking-wider">{opponentHand.name}</span>
              </motion.div>

              {/* Status Icons Indicator */}
              <div className="absolute right-4 top-4 z-20">
                {isAnswerCorrect === true && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 bg-white rounded-full p-1 shadow-sm">
                    <CheckCircle2 size={24} />
                  </motion.div>
                )}
                {isAnswerCorrect === false && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-rose-500 bg-white rounded-full p-1 shadow-sm">
                    <AlertCircle size={24} />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Answer Options Grid (Strictly Mouse clickable) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3" id="janken-buttons-grid">
              {HANDS.map((hand) => (
                <button
                  key={hand.id}
                  onClick={() => handleAnswer(hand.id)}
                  className={`py-4 px-2 rounded-xl border font-bold text-center transition-all duration-150 transform active:scale-95 cursor-pointer flex flex-col items-center justify-center select-none ${hand.bgClass}`}
                  id={`janken-option-${hand.id}`}
                >
                  <span className="text-4xl sm:text-5xl mb-2">{hand.emoji}</span>
                  <span className="text-sm">{hand.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'ended' && (
          <motion.div
            key="ended-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-6"
            id="janken-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm" id="janken-ended-icon">
              <Award size={36} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              トレーニング終了！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              指示通りの手を素早く出すことができましたか？
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm mx-auto mb-8 font-sans" id="janken-results-card">
              <span className="text-gray-400 text-xs font-semibold uppercase block tracking-wider mb-1">最終獲得スコア</span>
              <span className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">{score} <span className="text-lg font-medium text-gray-500">点</span></span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3" id="janken-ended-actions">
              <button
                onClick={() => startGame(gameMode)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                id="janken-retry-btn"
              >
                <RotateCcw size={16} />
                もう一度プレイする
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full sm:w-auto border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-1 transition-all"
                id="janken-menu-btn"
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
