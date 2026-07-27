"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

type GameRow = {
  id: string;
  status: string;
  team_a_name: string;
  team_b_name: string;
  team_a_color: string;
  team_b_color: string;
  score_a: number;
  score_b: number;
  start_time: string | null;
};

export default function HomePage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setGames(data as GameRow[]);
      }
      setLoading(false);
    }
    loadGames();
  }, []);

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Matches...</p>
      </div>
    );
  }

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b-4 border-slate-700 gap-4">
        <h1 className="font-fredoka text-3xl md:text-4xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
      </header>

      <main className="flex flex-col flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full gap-6">
        <h2 className="font-fredoka text-2xl text-white uppercase tracking-widest">All Matches</h2>
        
        {games.length === 0 ? (
          <p className="font-nunito text-lg text-slate-400 text-center mt-10">No matches found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/game/${game.id}`}>
                <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0_#0f172a] p-4 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a] transition-all cursor-pointer h-full">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center border-b-2 border-slate-200 pb-2">
                    <span className={`font-fredoka text-sm uppercase tracking-widest font-black px-2 py-1 ${
                      game.status === 'live' || game.status === 'active' ? 'bg-[#65d421] text-slate-900' :
                      game.status === 'scheduled' ? 'bg-blue-400 text-slate-900' :
                      'bg-slate-300 text-slate-700'
                    }`}>
                      {game.status === 'active' ? 'LIVE' : game.status}
                    </span>
                    
                    {game.status === 'scheduled' && game.start_time && (
                      <span className="font-nunito text-xs font-bold text-slate-500">
                        {new Date(game.start_time).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  {/* Teams and Scores */}
                  <div className="flex flex-col gap-3 flex-1 justify-center">
                    {/* Team A */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-4 h-4 border border-slate-900 shrink-0" style={{ backgroundColor: game.team_a_color }}></div>
                        <span className="font-fredoka text-lg font-black uppercase truncate text-slate-800">{game.team_a_name}</span>
                      </div>
                      <span className="font-fredoka text-2xl font-black text-slate-900">{game.score_a}</span>
                    </div>

                    {/* Team B */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-4 h-4 border border-slate-900 shrink-0" style={{ backgroundColor: game.team_b_color }}></div>
                        <span className="font-fredoka text-lg font-black uppercase truncate text-slate-800">{game.team_b_name}</span>
                      </div>
                      <span className="font-fredoka text-2xl font-black text-slate-900">{game.score_b}</span>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
