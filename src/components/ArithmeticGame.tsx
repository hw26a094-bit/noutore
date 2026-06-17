import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, ArrowLeft, RotateCcw, Timer, Award, CheckCircle2, AlertCircle, Delete } from 'lucide-react';

interface ArithmeticGameProps {
  onBackToMenu: () => void;
  onSaveScore: (score: number) => void;
}

interface MathStep {
  text: string;
  op: '+' | '-' | '*' | '/' | 'init';
  val: number;
}

export default function ArithmeticGame({ onBackToMenu, onSaveScore }: ArithmeticGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'answering' | 'ended'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  
  // Stages and steps configuration
  const [steps, setSteps] = useState<MathStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a valid list of math operations that remain integers
  const generateProblem = () => {
    const totalSteps = 4; // Standard steps to keep game fast-paced
    const sequence: MathStep[] = [];
    
    // Choose start number: let's start with a friendly positive number
    let runningTotal = Math.floor(Math.random() * 20) + 5; 
    sequence.push({ text: `${runningTotal}`, op: 'init', val: runningTotal });

    for (let i = 1; i < totalSteps; i++) {
      const ops: ('+' | '-' | '*' | '/')[] = ['+', '-', '*', '/'];
      const op = ops[Math.floor(Math.random() * ops.length)];

      if (op === '+') {
        const val = Math.floor(Math.random() * 150) + 5; // Up to 3 digits (usually double-digit or triple-digit up to 150-500)
        runningTotal += val;
        sequence.push({ text: `+ ${val}`, op, val });
      } else if (op === '-') {
        const val = Math.floor(Math.random() * 120) + 5; // Up to 3 digits
        runningTotal -= val;
        sequence.push({ text: `- ${val}`, op, val });
      } else if (op === '*') {
        // Up to 2-digit multiplication, keeping it human-solvable (e.g. 2 to 12)
        const val = Math.floor(Math.random() * 10) + 2; 
        runningTotal *= val;
        sequence.push({ text: `× ${val}`, op, val });
      } else { // division
        // To guarantee a clean integer: find small divisors of the absolute running total
        const n = Math.abs(runningTotal);
        const divisors: number[] = [];
        
        // Find divisors up to 2-digits (max 15 for human mental arithmetic comfort)
        for (let d = 2; d <= Math.min(n, 15); d++) {
          if (n % d === 0) {
            divisors.push(d);
          }
        }

        if (divisors.length > 0) {
          const val = divisors[Math.floor(Math.random() * divisors.length)];
          runningTotal = runningTotal / val;
          sequence.push({ text: `÷ ${val}`, op, val });
        } else {
          // Fallback to simple addition to preserve game pace
          const val = Math.floor(Math.random() * 30) + 5;
          runningTotal += val;
          sequence.push({ text: `+ ${val}`, op: '+', val });
        }
      }
    }

    setSteps(sequence);
    setCurrentStepIndex(0);
    setCorrectAnswer(runningTotal);
    setUserInput('');
    setIsAnswerCorrect(null);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameState('showing');
    generateProblem();
  };

  // Main countdown timer (60s)
  useEffect(() => {
    if (gameState === 'showing' || gameState === 'answering') {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerIntervalRef.current!);
              timerIntervalRef.current = null;
              if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
              setGameState('ended');
              onSaveScore(score);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (gameState === 'ended' || gameState === 'idle') {
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
  }, [gameState, score, onSaveScore]);

  // Handle sequence presentation steps
  useEffect(() => {
    if (gameState === 'showing' && steps.length > 0) {
      stepIntervalRef.current = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          if (prevIndex >= steps.length - 1) {
            clearInterval(stepIntervalRef.current!);
            setGameState('answering');
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 1200); // 1.2 seconds presentation time per card
    }

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [gameState, steps]);

  const handleKeyPress = (char: string) => {
    if (gameState !== 'answering') return;

    if (char === 'C') {
      setUserInput('');
    } else if (char === 'Del' || char === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
    } else if (char === '-') {
      // Toggle or insert minus sign at start
      setUserInput(prev => {
        if (prev.startsWith('-')) {
          return prev.substring(1);
        } else {
          return '-' + prev;
        }
      });
    } else if (char === 'Enter') {
      submitAnswer();
    } else {
      // Limit answer string length to 6 digits max
      if (userInput.replace('-', '').length < 6) {
        setUserInput(prev => prev + char);
      }
    }
  };

  const submitAnswer = () => {
    if (userInput.trim() === '') return;

    const parsedAns = parseInt(userInput, 10);
    const isCorrect = parsedAns === correctAnswer;

    if (isCorrect) {
      setScore(prev => prev + 500);
      setIsAnswerCorrect(true);
    } else {
      setScore(prev => Math.max(0, prev - 200));
      setIsAnswerCorrect(false);
    }

    // Keep state highlighted for half a second, then generate next question
    setTimeout(() => {
      if (timeLeft > 0) {
        generateProblem();
        setGameState('showing');
      } else {
        setGameState('ended');
      }
    }, 800);
  };

  // Keyboard Event Listeners for physical PC gaming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'answering') return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === '-') {
        handleKeyPress('-');
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
  }, [gameState, userInput, correctAnswer]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-8" id="arithmetic-game-container">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          id="arithmetic-back-btn"
        >
          <ArrowLeft size={16} />
          メニューに戻る
        </button>
        <span className="bg-amber-50 text-amber-700 font-mono text-sm px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1" id="arithmetic-keyboard-badge">
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
            id="arithmetic-idle-view"
          >
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              限界暗算ゲーム
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              画面の真ん中に1ステップずつ順番に表示される数字や数式を、頭の中で計算し続けてください。最後に表示が終わった時点での答えを入力します！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left text-xs sm:text-sm max-w-sm mx-auto space-y-3 font-sans" id="arithmetic-rules-box">
              <div className="font-semibold text-gray-700">【数字・桁数】</div>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong className="text-gray-900">足し算・引き算</strong>: 1桁から3桁まで登場</li>
                <li><strong className="text-gray-900">掛け算・割り算</strong>: 1桁から2桁まで登場（割り算は、必ずピタッと整数で割り切れます）</li>
              </ul>
              <div className="text-xs text-gray-500 border-t border-gray-200/60 pt-2 flex items-center gap-1">
                ⌨️ PCのテンキー/数字キーで素早く打ち込んで Enter で送信できます。
              </div>
            </div>

            <button
              onClick={startGame}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
              id="arithmetic-start-btn"
            >
              ゲームを開始する
            </button>
          </motion.div>
        )}

        {(gameState === 'showing' || gameState === 'answering') && (
          <motion.div
            key="active-play"
            className="space-y-6"
            id="arithmetic-active-view"
          >
            {/* HUD */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-5 text-center font-sans">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100" id="arithmetic-hud-score">
                <span className="block text-xs text-gray-400 uppercase font-semibold">スコア</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">{score}</span>
              </div>
              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-50 flex flex-col items-center justify-center">
                <span className="text-xs text-amber-600 font-semibold uppercase flex items-center gap-1 mb-0.5">
                  <Timer size={12} className="animate-pulse" /> 残りタイム
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-amber-600">{timeLeft} <span className="text-xs">秒</span></span>
              </div>
            </div>

            {/* Main Stage Display Card */}
            <div className="flex flex-col justify-center items-center h-52 bg-gray-50/50 border border-gray-100 rounded-2xl relative overflow-hidden" id="arithmetic-card-display">
              {/* Top Step Progress Bar */}
              {gameState === 'showing' && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-semibold text-gray-400">
                  <span>暗記・暗算フェーズ</span>
                  <span>ステップ {currentStepIndex + 1} / {steps.length}</span>
                </div>
              )}

              {/* Success/Wrong overlays */}
              <AnimatePresence>
                {isAnswerCorrect === true && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500 z-0" />
                )}
                {isAnswerCorrect === false && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-500 z-0" />
                )}
              </AnimatePresence>

              {gameState === 'showing' ? (
                <div className="text-center z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIndex}
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 1.05, opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="text-4xl sm:text-5xl font-black text-gray-800 tracking-widest font-mono"
                      id="arithmetic-formula"
                    >
                      {steps[currentStepIndex]?.text}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center z-10 w-full px-6">
                  {isAnswerCorrect === null ? (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">合計の答えを入力してください</p>
                      <div className="flex justify-center items-center gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight font-mono">
                          {userInput || ' '}
                        </span>
                        <span className="w-1 h-10 bg-gray-800 animate-pulse inline-block" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      {isAnswerCorrect ? (
                        <>
                          <CheckCircle2 size={48} className="text-emerald-500" />
                          <span className="text-lg font-bold text-emerald-600">正解！ (+500 pt)</span>
                          <span className="font-mono text-sm text-gray-400">答え：{correctAnswer}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={48} className="text-rose-500" />
                          <span className="text-lg font-bold text-rose-500">不正解 (-200 pt)</span>
                          <span className="font-mono text-sm text-gray-500">正しい答え：{correctAnswer}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Digital Pad Interface (for Mouse) */}
            <div className={`transition-all duration-200 ${gameState === 'answering' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} id="arithmetic-virtual-keypad">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm mx-auto p-2 bg-gray-50 rounded-2xl border border-gray-100">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    className="py-3 bg-white hover:bg-gray-100 active:scale-95 text-xl font-bold font-mono text-gray-700 rounded-xl border border-gray-100 shadow-sm transition-all"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleKeyPress('-')}
                  className="py-3 bg-white hover:bg-gray-100 active:scale-95 text-xl font-bold font-mono text-gray-600 rounded-xl border border-gray-100 shadow-sm transition-all"
                >
                  +/-
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="py-3 bg-white hover:bg-gray-100 active:scale-95 text-xl font-bold font-mono text-gray-700 rounded-xl border border-gray-100 shadow-sm transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeyPress('Backspace')}
                  className="py-3 bg-white hover:bg-red-50 text-red-500 active:scale-95 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center justify-center"
                  title="バックスペース"
                >
                  <Delete size={20} />
                </button>
                
                <button
                  onClick={() => handleKeyPress('C')}
                  className="col-span-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all font-sans"
                >
                  クリア
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={gameState !== 'answering' || userInput === ''}
                  className="col-span-2 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 font-sans"
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
            id="arithmetic-ended-view"
          >
            <div className="mx-auto w-16 h-16 bg-yellow-50 text-yellow-500 border border-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Award size={36} />
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              タイムアップ！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              脳の超高速限界暗算トレーニングが終了しました！
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm mx-auto mb-8 font-sans">
              <span className="text-gray-400 text-xs font-semibold uppercase block tracking-wider mb-1">最終獲得スコア</span>
              <span className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">{score} <span className="text-lg font-medium text-gray-500">点</span></span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <button
                onClick={startGame}
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
