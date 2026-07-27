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
  period: number;
  clock_seconds: number;
  is_running: boolean;
  total_periods: number;
  start_time: string | null;
  created_at: string;
};

type Filter = "all" | "active" | "scheduled" | "finished";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function periodLabel(period: number, totalPeriods: number): string {
  if (!period || !totalPeriods) return "";
  if (period > totalPeriods) return `OT${period - totalPeriods}`;
  return `${totalPeriods === 4 ? "Q" : "H"}${period}`;
}

function LiveGameCard({ game }: { game: GameRow }) {
  const [clock, setClock] = useState(game.clock_seconds);

  useEffect(() => {
    setClock(game.clock_seconds);
  }, [game.clock_seconds]);

  useEffect(() => {
    if (!game.is_running) return;
    const interval = setInterval(() => {
      setClock((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [game.is_running]);

  const per = periodLabel(game.period, game.total_periods ?? 4);

  return (
    <Link href={`/game/${game.id}`}>
      <div className="relative bg-slate-900 border-4 border-[#65d421] shadow-[6px_6px_0_#65d421] p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[8px_8px_0_#65d421] transition-all cursor-pointer overflow-hidden group">
        {/* Glowing background accent */}
        <div className="absolute inset-0 bg-[#65d421] opacity-5 group-hover:opacity-10 transition-opacity" />

        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex gap-[3px] animate-pulse">
              <span className="w-2 h-5 bg-[#65d421] block" />
              <span className="w-2 h-5 bg-[#65d421] block" />
            </span>
            <span className="font-fredoka text-sm font-black uppercase tracking-widest text-[#65d421]">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-sm uppercase tracking-widest text-slate-400 font-black">{per}</span>
            <span className={`font-fredoka text-lg font-black tracking-widest tabular-nums ${game.is_running ? "text-[#65d421]" : "text-slate-400"}`}>
              {formatClock(clock)}
            </span>
          </div>
        </div>

        {/* Teams & Scores */}
        <div className="flex flex-col gap-3">
          {/* Team A */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-4 h-4 border-2 border-slate-600 shrink-0" style={{ backgroundColor: game.team_a_color }} />
              <span className="font-fredoka text-xl font-black uppercase truncate text-white">{game.team_a_name}</span>
            </div>
            <span className="font-fredoka text-4xl font-black text-white leading-none">{game.score_a}</span>
          </div>
          {/* Team B */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-4 h-4 border-2 border-slate-600 shrink-0" style={{ backgroundColor: game.team_b_color }} />
              <span className="font-fredoka text-xl font-black uppercase truncate text-white">{game.team_b_name}</span>
            </div>
            <span className="font-fredoka text-4xl font-black text-white leading-none">{game.score_b}</span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-2">
          <span className="font-nunito text-xs text-[#65d421] font-bold uppercase tracking-widest">→ View Live Scoreboard</span>
        </div>
      </div>
    </Link>
  );
}

function ScheduledGameCard({ game }: { game: GameRow }) {
  const timeStr = game.start_time
    ? new Date(game.start_time).toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Time TBD";

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-slate-800 border-4 border-slate-600 shadow-[4px_4px_0_#334155] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#334155] hover:border-slate-400 transition-all cursor-pointer h-full">
        {/* Status */}
        <div className="flex items-center justify-between border-b border-slate-600 pb-2">
          <span className="font-fredoka text-sm uppercase tracking-widest font-black text-blue-400 bg-blue-400/10 px-2 py-0.5">Upcoming</span>
          <span className="font-nunito text-xs font-bold text-slate-400">{timeStr}</span>
        </div>

        {/* Teams */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-3 h-3 border border-slate-500 shrink-0" style={{ backgroundColor: game.team_a_color }} />
            <span className="font-fredoka text-lg font-black uppercase truncate text-slate-200">{game.team_a_name}</span>
          </div>
          <div className="font-nunito text-xs text-slate-500 font-bold uppercase tracking-widest pl-5">vs</div>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-3 h-3 border border-slate-500 shrink-0" style={{ backgroundColor: game.team_b_color }} />
            <span className="font-fredoka text-lg font-black uppercase truncate text-slate-200">{game.team_b_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FinishedGameCard({ game }: { game: GameRow }) {
  const scoreAWon = game.score_a > game.score_b;
  const scoreBWon = game.score_b > game.score_a;

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-white border-4 border-slate-300 shadow-[4px_4px_0_#cbd5e1] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#94a3b8] hover:border-slate-400 transition-all cursor-pointer h-full">
        {/* Status */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
          <span className="font-fredoka text-sm uppercase tracking-widest font-black text-slate-500 bg-slate-100 px-2 py-0.5">Final</span>
        </div>

        {/* Teams & Scores */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border border-slate-400 shrink-0" style={{ backgroundColor: game.team_a_color }} />
              <span className={`font-fredoka text-lg font-black uppercase truncate ${scoreAWon ? "text-slate-900" : "text-slate-400"}`}>{game.team_a_name}</span>
            </div>
            <span className={`font-fredoka text-3xl font-black leading-none ${scoreAWon ? "text-slate-900" : "text-slate-400"}`}>{game.score_a}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border border-slate-400 shrink-0" style={{ backgroundColor: game.team_b_color }} />
              <span className={`font-fredoka text-lg font-black uppercase truncate ${scoreBWon ? "text-slate-900" : "text-slate-400"}`}>{game.team_b_name}</span>
            </div>
            <span className={`font-fredoka text-3xl font-black leading-none ${scoreBWon ? "text-slate-900" : "text-slate-400"}`}>{game.score_b}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "scheduled", label: "Upcoming" },
  { key: "finished", label: "Finished" },
];

export default function HomePage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function loadGames() {
      if (!supabase) return;
      const { data } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setGames(data as GameRow[]);
      setLoading(false);
    }
    loadGames();
  }, []);

  // Sort: active first, then scheduled, then finished
  const sorted = [...games].sort((a, b) => {
    const order = { active: 0, scheduled: 1, finished: 2 };
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
  });

  const filtered = filter === "all" ? sorted : sorted.filter((g) => g.status === filter);

  const liveGames = sorted.filter((g) => g.status === "active");
  const hasLive = liveGames.length > 0;
  const showLiveSpotlight = filter === "all" && hasLive;

  const counts = {
    all: games.length,
    active: games.filter((g) => g.status === "active").length,
    scheduled: games.filter((g) => g.status === "scheduled").length,
    finished: games.filter((g) => g.status === "finished").length,
  };

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Matches...</p>
      </div>
    );
  }

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-slate-700">
        <h1 className="font-fredoka text-3xl md:text-4xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
      </header>

      <main className="flex flex-col flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full gap-8">

        {/* Live spotlight — only shown on "All" tab when there are live games */}
        {showLiveSpotlight && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex gap-[3px] animate-pulse">
                <span className="w-2 h-5 bg-[#65d421] block" />
                <span className="w-2 h-5 bg-[#65d421] block" />
              </span>
              <h2 className="font-fredoka text-2xl font-black uppercase tracking-widest text-[#65d421]">Live Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveGames.map((game) => (
                <LiveGameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`font-fredoka text-sm uppercase tracking-widest font-black px-4 py-2 border-4 transition-all ${
                  filter === key
                    ? "bg-white text-slate-900 border-slate-900 shadow-[3px_3px_0_#0f172a]"
                    : "bg-transparent text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white"
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 font-black ${filter === key ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-300"}`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Games Grid */}
          {filtered.length === 0 ? (
            <p className="font-nunito text-lg text-slate-500 text-center mt-6">No matches in this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((game) => {
                if (game.status === "active") return <LiveGameCard key={game.id} game={game} />;
                if (game.status === "scheduled") return <ScheduledGameCard key={game.id} game={game} />;
                return <FinishedGameCard key={game.id} game={game} />;
              })}
            </div>
          )}
        </section>

      </main>

      <footer className="text-center py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
