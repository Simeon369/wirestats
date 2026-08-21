"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import {
  GameRow,
  LiveMatchCard,
  ScheduledMatchCard,
  FinishedMatchCard,
} from "@/components/ui/MatchCards";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

type Filter = "all" | "active" | "scheduled" | "finished";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "🔴 Live" },
  { key: "scheduled", label: "Upcoming" },
  { key: "finished", label: "Finished" },
];

export default function MatchesPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from("games")
        .select("*")
        .is("tournament_id", null)
        .order("created_at", { ascending: false });
      if (data) setGames(data as GameRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...games].sort((a, b) => {
    const order = { active: 0, scheduled: 1, finished: 2 };
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
  });

  const filtered = filter === "all" ? sorted : sorted.filter((g) => g.status === filter);

  const counts = {
    all: games.length,
    active: games.filter((g) => g.status === "active").length,
    scheduled: games.filter((g) => g.status === "scheduled").length,
    finished: games.filter((g) => g.status === "finished").length,
  };

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-2xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Matches...</p>
      </div>
    );
  }

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-slate-700">
        <Link href="/">
          <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-white cursor-pointer">
            Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
          </h1>
        </Link>
        <Link href="/" className="font-fredoka text-xs sm:text-sm uppercase tracking-widest font-black px-3 sm:px-4 py-2 border-2 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white transition-all">
          ← Back
        </Link>
      </header>

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto w-full gap-6 sm:gap-8">
        <div className="flex items-end justify-between">
          <h2 className="font-fredoka text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">
            All Matches <span className="text-slate-600 text-base font-black">({counts.all})</span>
          </h2>
        </div>

        {counts.active > 0 && filter === "all" && (
          <section className="bg-slate-950 border-4 border-[#65d421] p-4 sm:p-6 shadow-[6px_6px_0_#1b630a]">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <span className="flex gap-[3px] animate-pulse">
                <span className="w-2 h-5 bg-[#65d421] block" />
                <span className="w-2 h-5 bg-[#65d421] block" />
              </span>
              <h3 className="font-fredoka text-xl sm:text-2xl font-black uppercase tracking-widest text-[#65d421]">
                Live Now — {counts.active} {counts.active === 1 ? "Match" : "Matches"}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sorted.filter((g) => g.status === "active").map((game) => (
                <LiveMatchCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              id={`filter-${key}`}
              className={`font-fredoka text-xs sm:text-sm uppercase tracking-widest font-black px-3 sm:px-4 py-2 border-4 transition-all shrink-0 ${
                filter === key
                  ? "bg-white text-slate-900 border-slate-900 shadow-[3px_3px_0_#0f172a]"
                  : "bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white"
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1.5 text-xs px-1 py-0.5 font-black ${filter === key ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-300"}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-20">
            <span className="text-5xl">🏀</span>
            <p className="font-fredoka text-lg font-black text-slate-500 uppercase tracking-wider">No matches in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((game) => {
              if (game.status === "active") return <LiveMatchCard key={game.id} game={game} />;
              if (game.status === "scheduled") return <ScheduledMatchCard key={game.id} game={game} />;
              return <FinishedMatchCard key={game.id} game={game} />;
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-3 sm:py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
