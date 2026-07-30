"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import { PlayerStatsSummary } from "@/lib/types";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

function PlayerCard({ player }: { player: PlayerStatsSummary }) {
  return (
    <Link href={`/players/${player.player_id}`}>
      <div className="bg-slate-800 border-4 border-slate-600 shadow-[3px_3px_0_#334155] sm:shadow-[4px_4px_0_#334155] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[5px_5px_0_#334155] hover:border-slate-400 transition-all cursor-pointer group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[#3b82f6] border-2 border-slate-900 text-white font-fredoka text-lg sm:text-2xl font-black rounded-full shadow-[2px_2px_0_#1e3a8a] shrink-0">
          {player.position}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-fredoka text-xl sm:text-2xl font-black text-slate-100 truncate leading-tight group-hover:text-white transition-colors">{player.full_name}</h3>
          <p className="font-nunito text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest">{player.jersey_name}</p>
        </div>
        <div className="text-slate-500 group-hover:text-[#65d421] transition-colors pr-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

const POSITIONS = ["ALL", "PG", "SG", "SF", "PF", "C"];

export default function PublicPlayersDirectory() {
  const [players, setPlayers] = useState<PlayerStatsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState<string>("ALL");

  useEffect(() => {
    async function loadPlayers() {
      if (!supabase) return;
      const { data } = await supabase
        .from("player_stats_summary")
        .select("*")
        .order("total_points", { ascending: false });
      if (data) setPlayers(data as PlayerStatsSummary[]);
      setLoading(false);
    }
    loadPlayers();
  }, []);

  const filteredPlayers = players.filter(p => {
    const matchSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.jersey_name.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos === "ALL" || p.position === filterPos;
    return matchSearch && matchPos;
  });

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-slate-700">
        <Link href="/">
          <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-white hover:opacity-80 transition-opacity">
            Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
          </h1>
        </Link>
        <Link href="/">
          <button className="font-fredoka text-xs sm:text-sm uppercase tracking-widest font-black px-3 sm:px-4 py-2 border-4 bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white transition-all whitespace-nowrap">
            ← Matches
          </button>
        </Link>
      </header>

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-4 sm:py-8 max-w-5xl mx-auto w-full gap-5 sm:gap-8">
        
        {/* Title + Search Bar */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <h2 className="font-fredoka text-3xl sm:text-4xl font-black uppercase tracking-widest text-white">
            Player Directory
          </h2>

          {/* Search */}
          <div className="bg-slate-800 p-3 sm:p-4 border-4 border-slate-700 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Search by name or jersey..."
              className="w-full bg-slate-900 border-2 border-slate-600 text-white font-nunito text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 font-bold focus:outline-none focus:border-[#3b82f6] placeholder:text-slate-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Position filters — scrollable row on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {POSITIONS.map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className={`font-fredoka text-xs sm:text-sm font-black px-3 sm:px-4 py-2 border-2 transition-all shrink-0 ${
                    filterPos === pos
                      ? "bg-[#3b82f6] border-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                      : "bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <p className="font-fredoka text-2xl sm:text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Players...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <p className="font-nunito text-base sm:text-xl text-slate-500 font-bold uppercase tracking-widest">No players found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPlayers.map(p => (
              <PlayerCard key={p.player_id} player={p} />
            ))}
          </div>
        )}

      </main>

      <footer className="text-center py-3 sm:py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest border-t-4 border-slate-700">
        Powered by WireStats
      </footer>
    </div>
  );
}
