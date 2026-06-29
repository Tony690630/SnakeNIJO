import React from 'react';
import { Trophy, Compass, Flame, Heart, Crown } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  length: number;
  speed: string;
  lives: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  length,
  speed,
  lives,
}) => {
  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-xl">
      {/* Score */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <Trophy className="w-4 h-4 text-cyan-400 mb-1" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">得分</span>
        <span className="text-sm font-black font-mono text-cyan-400 animate-pulse">{score}</span>
      </div>

      {/* High Score */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
        <Crown className="w-4 h-4 text-amber-400 mb-1" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">最高</span>
        <span className="text-sm font-black font-mono text-amber-400">{highScore}</span>
      </div>

      {/* Length */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        <Compass className="w-4 h-4 text-emerald-400 mb-1" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">長度</span>
        <span className="text-sm font-black font-mono text-emerald-400">{length}</span>
      </div>

      {/* Speed */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <Flame className="w-4 h-4 text-indigo-400 mb-1" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">速度</span>
        <span className="text-xs font-black font-mono text-indigo-400 truncate w-full text-center">
          {speed} <span className="text-[8px] text-slate-500">步/秒</span>
        </span>
      </div>

      {/* Lives */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
        <div className="flex gap-[1px] mb-1">
          <Heart className={`w-4 h-4 ${lives > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">生命</span>
        <span className="text-sm font-black font-mono text-rose-500">{lives}</span>
      </div>
    </div>
  );
};
export default ScoreBoard;
