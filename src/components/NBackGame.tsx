import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Award, CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface NBackGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

const SHAPES = ['〇', '✕', '△', '□'];

export default function NBackGame({ onBackToMenu, onSaveScore }: NBackGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'memorizing' | 'playing' | 'ended'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0); // Max 25
  const [nValue, setNValue] = useState(1); // 1-back, 2-back, 3-back
  
  // History of symbols shown
  const [history, setHistory] = useState<string[]>([]);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setTotalAnswers(0);
    setNValue(1);
    setIsAnswerCorrect(null);
    
    // Choose first symbol
    const firstSymbol = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setCurrentSymbol(firstSymbol);
    setHistory([firstSymbol]);
    setGameState('memorizing');
  };

  // Triggered when clicking "Next" during memorization phase
  const handleNextMemorize = () => {
    const nextSymbol = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const updatedHistory = [...history, nextSymbol];
    setHistory(updatedHistory);
    setCurrentSymbol(nextSymbol);

    // If we have collected enough symbols to start answering (we need at least nValue + 1 symbols in history)
    // For example, if N=1, we need 2 symbols to answer the 1st symbol's N-back (the 1st is 1-back to the 2nd)
    if (updatedHistory.length > nValue) {
      setGameState('playing');
    }
  };

  const handleAnswerSubmit = (selectedShape: string) => {
    if (gameState !== 'playing' || isAnswerCorrect !== null) return;

    // The index of the correct answer is (history length - 1) - nValue
    // e.g., if history is ['〇', '✕'] and N=1:
    // current is '✕' (index 1), 1-back is '〇' (index 0).
    // Formula: (2 - 1) - 1 = 0.
    const targetIndex = (history.length - 1) - nValue;
    const actualCorrect = history[targetIndex];
    setCorrectAnswer(actualCorrect);

    const isCorrect = selectedShape === actualCorrect;
    setIsAnswerCorrect(isCorrect);

    // Adjust score and combo
    let nextCombo = combo;
    let nextNValue = nValue;
    if (isCorrect) {
      nextCombo += 1;
      const addedPoints = 200 + nValue * 100 + nextCombo * 20;
      setScore(prev => prev + addedPoints);

      // Level up N-value based on consecutive correct answers
      // 1 -> 2 after 3 combo, 2 -> 3 after 6 combo
      if (nValue === 1 && nextCombo >= 3) {
        nextNValue = 2;
        nextCombo = 0; // reset combo for next tier
      } else if (nValue === 2 && nextCombo >= 4) {
        nextNValue = 3;
        nextCombo = 0;
      }
    } else {
      nextCombo = 0;
      setScore(prev => Math.max(0, prev - 80));
      
      // Level down N-value on mistake
      if (nValue > 1) {
        nextNValue = nValue - 1;
      }
    }

    setCombo(nextCombo);
    setNValue(nextNValue);
    const nextTotalAnswers = totalAnswers + 1;
    setTotalAnswers(nextTotalAnswers);

    // Move to next step after a short delay
    setTimeout(() => {
      if (nextTotalAnswers >= 25) {
        setGameState('ended');
        onSaveScore(score + (isCorrect ? (200 + nValue * 100 + nextCombo * 20) : 0)); // capture last score correctly
      } else {
        setIsAnswerCorrect(null);
        // Show next symbol
        const nextSymbol = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const updatedHistory = [...history, nextSymbol];
        setHistory(updatedHistory);
        setCurrentSymbol(nextSymbol);

        // If history isn't long enough for the new N value (e.g. N increased), go back to memorization briefly
        if (updatedHistory.length <= nextNValue) {
          setGameState('memorizing');
        }
      }
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="nback-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="nback-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-indigo-50 text-indigo-700 font-mono text-sm px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1" id="nback-mouse-badge">
          マウス専用
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
            id="nback-idle-view"
          >
            <div className="mx-auto w-16 h-16 bg-violet-50 text-violet-600 border border-violet-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <HelpCircle size={32} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Nバック記号記憶ゲーム
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              順番に表示される記号を暗記し、リアルタイムで「そのN個前に表示された記号」を選択肢から選んで回答してください！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-3 font-sans" id="nback-rules-box">
              <div className="font-semibold text-gray-700 flex items-center gap-1">
                【ルール説明】
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-600 pl-1">
                <li>
                  <strong>1つ前 (1-Back):</strong> 直前に表示された記号を答えます。
                </li>
                <li>
                  <strong>2つ前 (2-Back):</strong> 2つ前に表示された記号を答えます。
                </li>
                <li>
                  連続で正解すると、リアルタイムで難易度(N)が <strong>1 ➔ 2 ➔ 3</strong> と上昇します！
                </li>
                <li>
                  ミスするとNが減少します。合計<strong>25回</strong>回答するとゲーム終了です。
                </li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer"
              id="nback-start-btn"
            >
              ゲームを開始する
            </button>
          </motion.div>
        )}

        {(gameState === 'memorizing' || gameState === 'playing') && (
          <motion.div
            key="active-play"
            className="space-y-6"
            id="nback-active-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5 text-center font-sans">
              <div className="bg-violet-50 p-2.5 rounded-xl border border-violet-100">
                <span className="block text-xs text-violet-600 font-semibold uppercase">現在の難易度</span>
                <span className="text-xl sm:text-2xl font-bold text-violet-800">{nValue}つ前 (N={nValue})</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400 font-semibold uppercase">進捗度</span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-gray-800">{totalAnswers} <span className="text-xs text-gray-400">/ 25 問</span></span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="block text-xs text-gray-400 uppercase font-semibold">スコア</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">{score}</span>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="text-center font-sans">
              {gameState === 'memorizing' ? (
                <span className="inline-block px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide uppercase bg-amber-50 text-amber-700 border-amber-200">
                  📥 記号を順番に記憶してください！ (覚えたら次へ)
                </span>
              ) : (
                <span className="inline-block px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide uppercase bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm">
                  🤔 いま表示された記号の【 {nValue}つ前 】に表示されたのは？
                </span>
              )}
            </div>

            {/* Display Stage */}
            <div className="relative h-60 bg-slate-50 border border-gray-100 rounded-3xl flex justify-center items-center overflow-hidden" id="nback-stage">
              {/* Back Feedback Fades */}
              <AnimatePresence>
                {isAnswerCorrect === true && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500 z-0" />
                )}
                {isAnswerCorrect === false && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-500 z-0" />
                )}
              </AnimatePresence>

              {/* Symbol Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSymbol}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-36 h-36 bg-white border-2 border-gray-200 rounded-2xl shadow-md flex items-center justify-center z-10"
                  id="nback-symbol-card"
                >
                  <span className="text-6xl font-black text-gray-900 select-none">
                    {currentSymbol}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Feedback Overlay Panel */}
              {isAnswerCorrect !== null && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-20" id="nback-feedback-overlay">
                  {isAnswerCorrect ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-1">
                      <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                      <h4 className="text-lg font-bold text-emerald-600">正解！</h4>
                      <p className="text-xs text-gray-500 font-mono">{nValue}つ前は「{correctAnswer}」でした</p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-1">
                      <AlertCircle size={48} className="text-rose-500 mx-auto" />
                      <h4 className="text-lg font-bold text-rose-500">不正解...</h4>
                      <p className="text-xs text-gray-500 font-mono">{nValue}つ前は「{correctAnswer}」でした</p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Controls / Inputs */}
            <div className="flex justify-center" id="nback-interaction-area">
              {gameState === 'memorizing' ? (
                <button
                  onClick={handleNextMemorize}
                  className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  id="nback-next-btn"
                >
                  覚えた (次の記号へ)
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div className="space-y-4 w-full max-w-sm">
                  <div className="grid grid-cols-4 gap-3">
                    {SHAPES.map((shape) => (
                      <button
                        key={shape}
                        onClick={() => handleAnswerSubmit(shape)}
                        disabled={isAnswerCorrect !== null}
                        className="py-4 bg-white hover:bg-indigo-50 hover:border-indigo-200 active:scale-95 text-2xl font-black text-gray-800 rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[11px] text-gray-400 font-mono">上記から「{nValue}つ前の記号」をクリックして回答してください</p>
                </div>
              )}
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
            id="nback-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Award size={36} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              トレーニング終了！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              25問の記号記憶Nバックトレーニングを完走しました！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm mx-auto mb-8 font-sans">
              <span className="text-gray-400 text-xs font-semibold uppercase block tracking-wider mb-1">最終獲得スコア</span>
              <span className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">{score} <span className="text-lg font-medium text-gray-500">点</span></span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <button
                onClick={startGame}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <RotateCcw size={16} />
                もう一度プレイする
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full sm:w-auto border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-6 py-2.5 rounded-full flex items-center justify-center gap-1 transition-all cursor-pointer"
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
