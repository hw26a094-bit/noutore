import { useState, useEffect } from 'react';
import { GameType } from './types';
import MainMenu from './components/MainMenu';
import StroopGame from './components/StroopGame';
import ArithmeticGame from './components/ArithmeticGame';
import GridMemoryGame from './components/GridMemoryGame';

export default function App() {
  const [currentView, setCurrentView] = useState<GameType>('menu');
  const [highScores, setHighScores] = useState<{ [key in GameType]?: number }>({});

  // Load high scores from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brain_training_highscores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (e) {
      // Ignored if local storage unavailable
    }
  }, []);

  // Update high score if new one is higher
  const handleSaveScore = (score: number) => {
    if (currentView === 'menu') return;

    setHighScores((prev) => {
      const currentHigh = prev[currentView] || 0;
      if (score > currentHigh) {
        const nextScores = { ...prev, [currentView]: score };
        try {
          localStorage.setItem('brain_training_highscores', JSON.stringify(nextScores));
        } catch (e) {
          // Ignored
        }
        return nextScores;
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans selection:bg-gray-900 selection:text-white flex flex-col justify-between py-10 px-4 sm:px-6 md:px-8">
      <main className="w-full flex-grow flex items-center justify-center">
        {currentView === 'menu' && (
          <MainMenu
            onSelectGame={setCurrentView}
            highScores={highScores}
          />
        )}

        {currentView === 'stroop' && (
          <StroopGame
            onBackToMenu={() => setCurrentView('menu')}
            onSaveScore={handleSaveScore}
          />
        )}

        {currentView === 'arithmetic' && (
          <ArithmeticGame
            onBackToMenu={() => setCurrentView('menu')}
            onSaveScore={handleSaveScore}
          />
        )}

        {currentView === 'grid' && (
          <GridMemoryGame
            onBackToMenu={() => setCurrentView('menu')}
            onSaveScore={handleSaveScore}
          />
        )}
      </main>

      <footer className="mt-8 text-center" id="main-application-footer">
        <p className="text-[11px] font-mono text-gray-400 select-none">
          脳力ゲームセンター &copy; 2026. すべての計算・認知データはローカルで高速処理されます
        </p>
      </footer>
    </div>
  );
}
