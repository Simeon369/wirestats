"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import { PlayerStatsSummary } from "@/lib/types";
import { Jersey } from "@/components/ui/Jersey";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export default function PlayerDetailsPage() {
  const params = useParams();
  const playerId = params.id as string;
  
  const [player, setPlayer] = useState<PlayerStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayer() {
      if (!supabase || !playerId) return;
      const { data } = await supabase
        .from("player_stats_summary")
        .select("*")
        .eq("player_id", playerId)
        .single();
      
      if (data) setPlayer(data as PlayerStatsSummary);
      setLoading(false);
    }
    loadPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Player...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6`}>
        <p className="font-fredoka text-3xl text-slate-400 uppercase tracking-widest">Player not found</p>
        <Link href="/players">
          <button className="font-fredoka text-sm uppercase tracking-widest font-black px-6 py-3 border-4 bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white transition-all">
            ← Back to Directory
          </button>
        </Link>
      </div>
    );
  }

  const ppg = player.games_played > 0 ? (player.total_points / player.games_played).toFixed(1) : "0.0";
  const rpg = player.games_played > 0 ? (player.total_rebounds / player.games_played).toFixed(1) : "0.0";
  const apg = player.games_played > 0 ? (player.total_assists / player.games_played).toFixed(1) : "0.0";
  const spg = player.games_played > 0 ? (player.total_steals / player.games_played).toFixed(1) : "0.0";
  const bpg = player.games_played > 0 ? (player.total_blocks / player.games_played).toFixed(1) : "0.0";

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-slate-700">
        <Link href="/">
          <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-white hover:opacity-80 transition-opacity">
            Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
          </h1>
        </Link>
        <Link href="/players">
          <button className="font-fredoka text-xs sm:text-sm uppercase tracking-widest font-black px-3 sm:px-4 py-2 border-4 bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white transition-all whitespace-nowrap">
            ← Directory
          </button>
        </Link>
      </header>

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-6 sm:py-10 max-w-4xl mx-auto w-full gap-6 sm:gap-8">
        
        {/* Profile Header */}
        <div className="bg-slate-800 border-4 border-slate-600 shadow-[6px_6px_0_#334155] p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          <div className="shrink-0">
            <Jersey number="--" name={player.jersey_name} colorHex="#3b82f6" size="lg" />
          </div>
          <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-fredoka text-sm font-black text-white bg-slate-900 px-3 py-1 border-2 border-slate-700 rounded-full">
                {player.position}
              </span>
              <span className="font-nunito text-sm font-bold text-slate-400 uppercase tracking-widest">
                {player.jersey_name}
              </span>
            </div>
            <h2 className="font-fredoka text-4xl sm:text-5xl font-black text-white leading-tight break-words">
              {player.full_name}
            </h2>
            <p className="font-nunito text-base text-slate-400 font-bold mt-2 max-w-xl">
              Dominating the court across {player.games_played} total games. Look at the numbers below to see the impact.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border-4 border-slate-700 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#334155] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-slate-400 font-bold uppercase tracking-widest">Games Played</span>
            <span className="font-fredoka text-4xl font-black text-white">{player.games_played}</span>
          </div>
          <div className="bg-slate-800 border-4 border-[#1b630a] p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#1b630a] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-[#65d421] font-bold uppercase tracking-widest">Points Per Game</span>
            <span className="font-fredoka text-4xl font-black text-[#65d421]">{ppg}</span>
          </div>
          <div className="bg-slate-800 border-4 border-slate-700 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#334155] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-slate-400 font-bold uppercase tracking-widest">Total Points</span>
            <span className="font-fredoka text-4xl font-black text-white">{player.total_points}</span>
          </div>
          <div className="bg-slate-800 border-4 border-slate-700 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#334155] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-slate-400 font-bold uppercase tracking-widest">3-Pointers Made</span>
            <span className="font-fredoka text-4xl font-black text-white">{player.three_pointers_made}</span>
          </div>
          <div className="bg-slate-800 border-4 border-amber-900 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#78350f] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-amber-400 font-bold uppercase tracking-widest">Rebounds ({rpg}/g)</span>
            <span className="font-fredoka text-4xl font-black text-amber-400">{player.total_rebounds}</span>
          </div>
          <div className="bg-slate-800 border-4 border-orange-900 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#7c2d12] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-orange-400 font-bold uppercase tracking-widest">Blocks ({bpg}/g)</span>
            <span className="font-fredoka text-4xl font-black text-orange-400">{player.total_blocks}</span>
          </div>
          <div className="bg-slate-800 border-4 border-teal-900 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#134e4a] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-teal-400 font-bold uppercase tracking-widest">Steals ({spg}/g)</span>
            <span className="font-fredoka text-4xl font-black text-teal-400">{player.total_steals}</span>
          </div>
          <div className="bg-slate-800 border-4 border-indigo-900 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#312e81] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-indigo-400 font-bold uppercase tracking-widest">Assists ({apg}/g)</span>
            <span className="font-fredoka text-4xl font-black text-indigo-400">{player.total_assists}</span>
          </div>
          <div className="bg-slate-800 border-4 border-red-900 p-5 flex flex-col gap-1 items-center justify-center text-center shadow-[4px_4px_0_#7f1d1d] hover:-translate-y-1 transition-transform">
            <span className="font-nunito text-xs text-red-400 font-bold uppercase tracking-widest">Total Fouls</span>
            <span className="font-fredoka text-4xl font-black text-red-500">{player.total_fouls}</span>
          </div>
        </div>

      </main>

      <footer className="text-center py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest border-t-4 border-slate-700 mt-auto">
        Powered by WireStats
      </footer>
    </div>
  );
}
