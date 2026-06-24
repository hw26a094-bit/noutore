import { motion } from 'motion/react';
import { Brain, Palette, Calculator, Grid3X3, MousePointer, Keyboard, Award, Zap, Home, HelpCircle, Hand } from 'lucide-react';
import { GameType } from '../types';

interface MainMenuProps {
  onSelectGame: (game: GameType) => void;
  highScores: { [key in GameType]?: number };
}

export default function MainMenu({ onSelectGame, highScores }: MainMenuProps) {
  const gamesList = [
    {
      id: 'stroop' as GameType,
      title: 'ストループ判定ゲーム',
      category: '反射・判断系',
      desc: '表示されているインク色と文字の意味の矛盾（ストループ効果）を撃破！ルールに従って正しい色や言葉を瞬時に判断してクリックせよ。',
      icon: Palette,
      themeColor: 'emerald',
      controls: [{ icon: MousePointer, text: 'マウス専用' }],
      difficulties: ['3択〜4択', '色と意味の不一致'],
      borderColor: 'border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-50 bg-emerald-50/10'
    },
    {
      id: 'arithmetic' as GameType,
      title: '限界暗算ゲーム',
      category: '計算・記憶系',
      desc: '画面に表示される数式を素早く頭の中で計算！導き出した答えをキーボードまたは入力テンキーで解答せよ。',
      icon: Calculator,
      themeColor: 'amber',
      controls: [{ icon: Keyboard, text: '数字キー・テンキー・クリック' }],
      difficulties: ['足引：最大3桁', '乗除：最大2桁'],
      borderColor: 'border-amber-100 hover:border-amber-300 hover:shadow-amber-50 bg-amber-50/10'
    },
    {
      id: 'grid' as GameType,
      title: '瞬間グリッド記憶ゲーム',
      category: '空間・順序記憶系',
      desc: 'グリッド上に順番に光るパネルパターンを限界まで記憶！キーボードの方向キー（移動）やマウスを使用して完璧に同じ順番でタップせよ。',
      icon: Grid3X3,
      themeColor: 'indigo',
      controls: [{ icon: Keyboard, text: '矢印キー・Enter移動' }, { icon: MousePointer, text: 'クリック選択' }],
      difficulties: ['3x3〜5x5グリッド', '順番の一致再現'],
      borderColor: 'border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-50 bg-indigo-50/10'
    },
    {
      id: 'counting' as GameType,
      title: '人数数えゲーム',
      category: '注意力・認知系',
      desc: '家に出入りするキャラクターを脳内で追跡！おとりの動物を完全に無視して、最後まで家に残っている人間の数を正確にカウントせよ。',
      icon: Home,
      themeColor: 'indigo',
      controls: [{ icon: Keyboard, text: '数字キー・テンキー・クリック' }],
      difficulties: ['おとり（動物）の出現', '複数人の同時出入り'],
      borderColor: 'border-blue-100 hover:border-blue-300 hover:shadow-blue-50 bg-blue-50/10'
    },
    {
      id: 'nback' as GameType,
      title: 'ワーキングメモリトレーニング',
      category: '作業記憶系',
      desc: '次々に表示されるシンプルな记号を顺に暗记！リアルタイムに「N個前」に表示された記号は何かを選択肢から正確に選べ。',
      icon: HelpCircle,
      themeColor: 'violet',
      controls: [{ icon: MousePointer, text: 'マウス専用' }],
      difficulties: ['リアルタイム難度上昇', '作業記憶（ワーキングメモリ）'],
      borderColor: 'border-violet-100 hover:border-violet-300 hover:shadow-violet-50 bg-violet-50/10'
    },
    {
      id: 'janken' as GameType,
      title: '後出しジャンケン',
      category: '反射・判断系',
      desc: '指示（勝つ・負ける・あいこ）と相手の手を瞬時に判断！指示通りの手を素早く後出しで選択せよ。',
      icon: Hand,
      themeColor: 'rose',
      controls: [{ icon: MousePointer, text: 'マウス専用' }],
      difficulties: ['勝つ・負ける・あいこ', '素早い判断'],
      borderColor: 'border-rose-100 hover:border-rose-300 hover:shadow-rose-50 bg-rose-50/10'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10" id="main-menu-container">
      {/* Title Header */}
      <div className="text-center space-y-3" id="main-menu-header">
        <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight flex items-center justify-center gap-1 sm:gap-3">
          <Brain className="text-gray-900" size={38} />
          脳を鍛えるトレーニング
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          科学的脳力アプローチに基づいた本格的なミニゲーム。思考スピード、短期記憶（ワーキングメモリ）、反射神経、注意力の限界へと今すぐ挑戦。
        </p>
      </div>

      {/* Grid List of Mini Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" id="games-selection-grid">
        {gamesList.map((game, index) => {
          const GameIcon = game.icon;
          const currentHighScore = highScores[game.id] || 0;

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={`flex flex-col justify-between p-6 sm:p-7 bg-white rounded-2xl border shadow-md hover:shadow-xl transition-all duration-200 ${game.borderColor}`}
              id={`game-selection-${game.id}`}
            >
              <div className="space-y-4">
                {/* Category & Badge */}
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400 tracking-wider uppercase bg-gray-100 px-2.5 py-1 rounded-md">
                    {game.category}
                  </span>
                  
                  {currentHighScore > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full">
                      <Award size={12} />
                      ハイスコア: {currentHighScore}
                    </div>
                  )}
                </div>

                {/* Title & Icon */}
                <h3 className="font-sans text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gray-900 text-white shadow-sm flex items-center justify-center">
                    <GameIcon size={18} />
                  </div>
                  {game.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed min-h-[72px]">
                  {game.desc}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectGame(game.id)}
                className="mt-6 w-full py-3 bg-gray-900 hover:bg-gray-800 hover:scale-[1.02] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                id={`game-start-btn-${game.id}`}
              >
                挑戦する
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
