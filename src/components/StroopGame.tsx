import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer, ArrowLeft, RotateCcw, Timer, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface StroopGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

interface ColorData {
  id: string;
  name: string;
  colorClass: string; // Tailwind text color class
  bgClass: string;    // Tailwind bg color class
  hex: string;
}

const COLORS: ColorData[] = [
  { id: 'red', name: 'あか', colorClass: 'text-red-600', bgClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300', hex: '#EF4444' },
  { id: 'blue', name: 'あお', colorClass: 'text-blue-600', bgClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300', hex: '#3B82F6' },
  { id: 'green', name: 'みどり', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300', hex: '#10B981' },
  { id: 'yellow', name: 'きいろ', colorClass: 'text-amber-500', bgClass: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300', hex: '#F59E0B' },
];

export default function StroopGame({ onBackToMenu, onSaveScore }: StroopGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [gameMode, setGameMode] = useState<'normal' | 'unlimited'>('normal');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  
  // Game round state
  const [instruction, setInstruction] = useState<'meaning' | 'color'>('meaning'); // Meaning vs Ink Color
  const [wordColor, setWordColor] = useState<ColorData>(COLORS[0]);   // The semantics (the text read)
  const [inkColor, setInkColor] = useState<ColorData>(COLORS[1]);    // The actual ink color
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate next question
  const generateQuestion = () => {
    const randomInstruction = Math.random() > 0.5 ? 'meaning' : 'color';
    
    // Pick word semantics and ink color. Often dissimilar to cause Stroop effect
    const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)];
    let randomInk = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Ensure 70% of the time they are different to provoke Stroop conflict
    if (randomWord.id === randomInk.id && Math.random() < 0.7) {
      randomInk = COLORS.filter(c => c.id !== randomWord.id)[Math.floor(Math.random() * (COLORS.length - 1))];
    }

    setInstruction(randomInstruction);
    setWordColor(randomWord);
    setInkColor(randomInk);
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

  // Save latest score when game changes state to ended or score updates in exact timing
  useEffect(() => {
    if (gameState === 'ended') {
      onSaveScore(score);
    }
  }, [gameState, score, onSaveScore]);

  const handleAnswer = (selectedColor: ColorData) => {
    if (gameState !== 'playing') return;

    const correctColor = instruction === 'meaning' ? wordColor : inkColor;
    const isCorrect = selectedColor.id === correctColor.id;

    if (isCorrect) {
      const addedPoints = 100 * (1 + Math.floor(combo / 5) * 0.1); // Dynamic combo multiplier: +10% score per 5 combos
      const finalAdded = Math.round(addedPoints);
      setScore(prev => prev + finalAdded);
      setCombo(prev => prev + 1);
      setIsAnswerCorrect(true);
    } else {
      setScore(prev => Math.max(0, prev - 50)); // Penalty: -50, min 0
      setCombo(0);
      setIsAnswerCorrect(false);
    }

    setTotalQuestionsAnswered(prev => prev + 1);

    // Delay slightly to show color status feedback before advancing
    setTimeout(() => {
      generateQuestion();
    }, 200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="stroop-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="stroop-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-red-50 text-red-600 font-mono text-sm px-3 py-1 rounded-full border border-red-100 flex items-center gap-1" id="stroop-mouse-only-badge">
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
            id="stroop-idle-view"
          >
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              ストループ判定ゲーム
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              文字の意味と表示されている色に惑わされず、提示されたルール（「意味」または「色」）を頼りに、正しい答えを瞬時にクリックしてください！
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-2 font-sans" id="stroop-rules-box">
              <div className="font-semibold text-gray-700">【ルール例】</div>
              <div>🔹 <span className="font-bold text-blue-600">青色</span>で書かれた 「<span className="font-bold">あか</span>」 </div>
              <div className="pl-4 text-gray-600">・指示が<strong className="text-gray-900">「意味を答えろ！」</strong> ➔ <span className="bg-gray-200 px-1.5 py-0.5 rounded font-bold">あか</span> を選択</div>
              <div className="pl-4 text-gray-600">・指示が<strong className="text-gray-900">「色を答えろ！」</strong> ➔ <span className="bg-gray-200 px-1.5 py-0.5 rounded font-bold">あお</span> を選択</div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => startGame('normal')}
                className="w-full sm:w-1/2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="stroop-start-normal-btn"
              >
                通常モード (60秒)
              </button>
              <button
                onClick={() => startGame('unlimited')}
                className="w-full sm:w-1/2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                id="stroop-start-unlimited-btn"
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
            id="stroop-play-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-5 text-center font-sans items-stretch">
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center" id="stroop-hud-score">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">スコア</span>
                <span className="text-sm sm:text-lg font-bold text-gray-800">{score}</span>
              </div>
              <div className="bg-red-50/50 p-1.5 rounded-xl border border-red-50 flex flex-col items-center justify-center" id="stroop-hud-timer">
                <span className="text-[10px] text-red-500 font-semibold uppercase flex items-center gap-0.5 mb-0.5">
                  <Timer size={10} className="animate-pulse" /> {gameMode === 'normal' ? '制限時間' : '回答数'}
                </span>
                <span className="text-sm sm:text-lg font-mono font-bold text-red-600">
                  {gameMode === 'normal' ? `${timeLeft}秒` : `${totalQuestionsAnswered}問`}
                </span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex flex-col justify-center" id="stroop-hud-combo">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">コンボ</span>
                <span className="text-sm sm:text-lg font-bold text-gray-800">
                  {combo} <span className="text-[10px] text-gray-500">連続</span>
                </span>
              </div>
              <button
                onClick={forceEndGame}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-1 rounded-xl border border-rose-200 transition-colors flex flex-col justify-center items-center text-xs sm:text-sm"
                id="stroop-exit-btn"
              >
                <span>終了して</span>
                <span>リザルトへ</span>
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="text-center py-2" id="stroop-instruction-container">
              <motion.div
                key={instruction}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-block px-6 py-2.5 rounded-full text-base sm:text-lg font-bold border cursor-default tracking-wide shadow-sm ${
                  instruction === 'meaning'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                id="stroop-instruction-banner"
              >
                {instruction === 'meaning' ? '👇 「書かれている意味（言葉）」を答えろ！' : '👇 「文字のインク色」を答えろ！'}
              </motion.div>
            </div>

            {/* Main Word Display (The Stroop challenge) */}
            <div className="flex justify-center items-center h-48 bg-gray-50/50 border border-gray-100 rounded-2xl relative overflow-hidden" id="stroop-card-display">
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

              <motion.div
                key={`${wordColor.id}-${inkColor.id}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`text-4xl sm:text-5xl font-black tracking-widest select-none z-10 ${inkColor.colorClass}`}
                id="stroop-stimulus-word"
              >
                {wordColor.name}
              </motion.div>

              {/* Status Icons Indicator */}
              <div className="absolute right-4 top-4">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3" id="stroop-buttons-grid">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleAnswer(color)}
                  className={`py-4 px-6 rounded-xl border font-bold text-center text-lg sm:text-xl shadow-sm transition-all duration-150 transform active:scale-95 cursor-pointer flex items-center justify-center select-none ${color.bgClass}`}
                  id={`stroop-option-${color.id}`}
                >
                  {color.name}
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
            id="stroop-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm" id="stroop-ended-icon">
              <Award size={36} />
            </div>
            
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              トレーニング終了！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              脳が揺さぶられるストループ効果に打ち勝てましたか？
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm mx-auto mb-8 font-sans" id="stroop-results-card">
              <span className="text-gray-400 text-xs font-semibold uppercase block tracking-wider mb-1">最終獲得スコア</span>
              <span className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">{score} <span className="text-lg font-medium text-gray-500">点</span></span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3" id="stroop-ended-actions">
              <button
                onClick={() => startGame(gameMode)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                id="stroop-retry-btn"
              >
                <RotateCcw size={16} />
                もう一度プレイする
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full sm:w-auto border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-1 transition-all"
                id="stroop-menu-btn"
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
