
import React from 'react';
import { Player, Position } from '../types';
import { ATTRIBUTE_DISPLAY_NAMES } from '../constants';

interface PlayerCardProps {
  player: Player;
  clubName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, clubName, size = 'md' }) => {
  const scale = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-125' : 'scale-100';
  
  return (
    <div className={`relative w-64 h-96 bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 rounded-2xl p-0.5 shadow-2xl ${scale} origin-top-left transition-transform hover:rotate-1`}>
      <div className="w-full h-full bg-zinc-950 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-yellow-500/10 to-transparent"></div>
        
        {/* Top Info */}
        <div className="w-full flex justify-between items-start z-10">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-white italic tracking-tighter leading-none">{player.ovr}</span>
            <span className="text-xl font-bold text-yellow-500 uppercase tracking-tighter">{player.position}</span>
          </div>
          <div className="flex flex-col items-end opacity-40">
            <span className="text-xs font-black uppercase tracking-widest">{player.nationality.substring(0, 3)}</span>
          </div>
        </div>

        {/* Player Image Placeholder */}
        <div className="w-40 h-40 mt-4 relative z-10 flex items-center justify-center">
          <div className="w-32 h-32 bg-zinc-900 rounded-full border-4 border-yellow-500/20 flex items-end justify-center overflow-hidden">
            <div className="w-20 h-24 bg-zinc-800 rounded-t-full"></div>
          </div>
        </div>

        {/* Name */}
        <div className="mt-4 text-center z-10 w-full">
          <h3 className="text-xl font-black uppercase tracking-tighter italic truncate">{player.name}</h3>
          <div className="h-0.5 w-12 mx-auto bg-yellow-500 my-2"></div>
        </div>

        {/* Stats Grid - Now with all 7 stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full mt-2 text-sm z-10 px-2">
          {Object.entries(player.attributes).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center border-b border-zinc-900 py-0.5">
              <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">{ATTRIBUTE_DISPLAY_NAMES[key] || key.substring(0,3).toUpperCase()}</span>
              <span className="font-black text-white italic">{val}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {clubName && (
          <div className="mt-auto pt-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest z-10">
            {clubName}
          </div>
        )}
      </div>
    </div>
  );
};
