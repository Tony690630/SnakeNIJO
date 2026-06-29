import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Skull, RotateCcw, ShieldCheck } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  lives: number;
  score: number;
  length: number;
  onRevive: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  lives,
  score,
  length,
  onRevive,
  onRestart,
}) => {
  const hasLives = lives > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 w-full max-w-sm text-center relative shadow-2xl shadow-cyan-500/10 z-10 overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full blur-2xl opacity-20 ${hasLives ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-20 bg-indigo-500" />

            {/* Icon Header */}
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${hasLives ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'}`}>
                {hasLives ? <ShieldCheck className="w-8 h-8 animate-pulse" /> : <Skull className="w-8 h-8" />}
              </div>
            </div>

            {/* Title */}
            <h2 className={`text-2xl font-black tracking-tight mb-2 ${hasLives ? 'text-amber-400' : 'text-rose-500'}`}>
              {hasLives ? '💥 撞到了！' : '💀 GAME OVER'}
            </h2>

            {/* Text description */}
            <div className="text-slate-300 text-sm leading-relaxed mb-6">
              {hasLives ? (
                <>
                  別擔心，你還有 <span className="text-rose-400 font-bold text-base px-1">{lives}</span> 次復活機會。
                  <br />
                  要消耗 1 次生命值在原地復活嗎？
                  <br />
                  <span className="text-xs text-slate-400 block mt-2">
                    (復活後長度將重設為 1，但保留得分)
                  </span>
                </>
              ) : (
                <>
                  這次挑戰的最終得分是：
                  <span className="text-cyan-400 font-bold block text-2xl my-2 font-mono">
                    {score} 分
                  </span>
                  身長達到：<span className="text-indigo-400 font-bold">{length} 節</span>。
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {hasLives && (
                <button
                  id="modal-revive-btn"
                  onClick={onRevive}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5 fill-current animate-bounce" />
                  消耗生命復活
                </button>
              )}

              <button
                id="modal-restart-btn"
                onClick={onRestart}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-98 flex items-center justify-center gap-2 ${
                  hasLives
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                {hasLives ? '重新開始 (不復活)' : '再試一次'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default GameOverModal;
