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
  tournament_id: string | null;
};

type TournamentRow = {
  id: string;
  name: string;
  status: string;
  format: string;
  created_at: string;
  category: string | null;
  venue: string | null;
};

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

function TournamentCard({ tournament }: { tournament: TournamentRow }) {
  const isActive = tournament.status === "ACTIVE";
  const isCompleted = tournament.status === "COMPLETED";

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className={`relative flex flex-col gap-3 p-5 border-4 shadow-[4px_4px_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] transition-all cursor-pointer h-full group overflow-hidden ${isActive ? "bg-slate-900 border-[#65d421]" : "bg-slate-800 border-slate-600 hover:border-slate-400"}`}>
        {isActive && <div className="absolute inset-0 bg-[#65d421] opacity-5 group-hover:opacity-10 transition-opacity" />}
        <div className="flex items-center justify-between">
          <span className={`font-fredoka text-xs font-black uppercase tracking-widest px-2 py-1 inline-flex items-center gap-1 ${isActive ? "bg-[#65d421] text-slate-900" : isCompleted ? "bg-slate-200 text-slate-700" : "bg-amber-300 text-slate-900"}`}>
            {tournament.status}
          </span>
          <span className="font-nunito text-xs font-bold text-slate-500 uppercase tracking-wider">{tournament.format.replace(/_/g, " ")}</span>
        </div>
        <h3 className={`font-fredoka text-xl font-black uppercase tracking-wider leading-tight ${isActive ? "text-white" : "text-slate-200 group-hover:text-white transition-colors"}`}>
          {tournament.name}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs font-nunito font-bold text-slate-500 mt-auto">
          {tournament.category && <span>📋 {tournament.category}</span>}
          {tournament.venue && <span>📍 {tournament.venue}</span>}
          {tournament.start_date && (
            <span>📅 {new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} ({tournament.duration_days} Day{tournament.duration_days !== 1 ? 's' : ''})</span>
          )}
        </div>
        <div className={`border-t pt-2 ${isActive ? "border-[#65d421]/40" : "border-slate-700"}`}>
          <span className={`font-nunito text-xs font-bold uppercase tracking-widest ${isActive ? "text-[#65d421]" : "text-slate-500 group-hover:text-slate-300 transition-colors"}`}>→ View Tournament</span>
        </div>
      </div>
    </Link>
  );
}

function LiveMatchCard({ game }: { game: GameRow }) {
  const [clock, setClock] = useState(game.clock_seconds);
  const targetClock = game.clock_seconds;
  if (!game.is_running && clock !== targetClock) setClock(targetClock);

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
      <div className="relative bg-slate-900 border-4 border-[#65d421] shadow-[4px_4px_0_#65d421] p-4 sm:p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#65d421] transition-all cursor-pointer overflow-hidden group h-full">
        <div className="absolute inset-0 bg-[#65d421] opacity-5 group-hover:opacity-10 transition-opacity" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex gap-[3px] animate-pulse"><span className="w-1.5 h-4 bg-[#65d421] block" /><span className="w-1.5 h-4 bg-[#65d421] block" /></span>
            <span className="font-fredoka text-xs font-black uppercase tracking-widest text-[#65d421]">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-xs uppercase tracking-widest text-slate-400 font-black">{per}</span>
            <span className={`font-fredoka text-base font-black tracking-widest tabular-nums ${game.is_running ? "text-[#65d421]" : "text-slate-400"}`}>{formatClock(clock)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border-2 border-slate-600 shrink-0" style={{ backgroundColor: game.team_a_color }} />
              <span className="font-fredoka text-lg font-black uppercase truncate text-white">{game.team_a_name}</span>
            </div>
            <span className="font-fredoka text-3xl font-black text-white leading-none">{game.score_a}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border-2 border-slate-600 shrink-0" style={{ backgroundColor: game.team_b_color }} />
              <span className="font-fredoka text-lg font-black uppercase truncate text-white">{game.team_b_name}</span>
            </div>
            <span className="font-fredoka text-3xl font-black text-white leading-none">{game.score_b}</span>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-2">
          <span className="font-nunito text-xs text-[#65d421] font-bold uppercase tracking-widest">→ View Live Scoreboard</span>
        </div>
      </div>
    </Link>
  );
}

function ScheduledMatchCard({ game }: { game: GameRow }) {
  const timeStr = game.start_time
    ? new Date(game.start_time).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Time TBD";

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-slate-800 border-4 border-slate-600 shadow-[4px_4px_0_#334155] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#334155] hover:border-slate-400 transition-all cursor-pointer h-full">
        <div className="flex items-center justify-between border-b border-slate-600 pb-2">
          <span className="font-fredoka text-xs uppercase tracking-widest font-black text-blue-400 bg-blue-400/10 px-2 py-0.5">Upcoming</span>
          <span className="font-nunito text-xs font-bold text-slate-400">{timeStr}</span>
        </div>
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-3 h-3 border border-slate-500 shrink-0" style={{ backgroundColor: game.team_a_color }} />
            <span className="font-fredoka text-base font-black uppercase truncate text-slate-200">{game.team_a_name}</span>
          </div>
          <div className="font-nunito text-xs text-slate-500 font-bold uppercase tracking-widest pl-5">vs</div>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-3 h-3 border border-slate-500 shrink-0" style={{ backgroundColor: game.team_b_color }} />
            <span className="font-fredoka text-base font-black uppercase truncate text-slate-200">{game.team_b_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FinishedMatchCard({ game }: { game: GameRow }) {
  const scoreAWon = game.score_a > game.score_b;
  const scoreBWon = game.score_b > game.score_a;

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-white border-4 border-slate-300 shadow-[4px_4px_0_#cbd5e1] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#94a3b8] hover:border-slate-400 transition-all cursor-pointer h-full">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
          <span className="font-fredoka text-xs uppercase tracking-widest font-black text-slate-500 bg-slate-100 px-2 py-0.5">Final</span>
        </div>
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border border-slate-400 shrink-0" style={{ backgroundColor: game.team_a_color }} />
              <span className={`font-fredoka text-base font-black uppercase truncate ${scoreAWon ? "text-slate-900" : "text-slate-400"}`}>{game.team_a_name}</span>
            </div>
            <span className={`font-fredoka text-2xl font-black leading-none ${scoreAWon ? "text-slate-900" : "text-slate-400"}`}>{game.score_a}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-3 h-3 border border-slate-400 shrink-0" style={{ backgroundColor: game.team_b_color }} />
              <span className={`font-fredoka text-base font-black uppercase truncate ${scoreBWon ? "text-slate-900" : "text-slate-400"}`}>{game.team_b_name}</span>
            </div>
            <span className={`font-fredoka text-2xl font-black leading-none ${scoreBWon ? "text-slate-900" : "text-slate-400"}`}>{game.score_b}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ title, count, viewAllHref, showViewAll }: { title: string; count: number; viewAllHref: string; showViewAll: boolean }) {
  return (
    <div className="flex items-end justify-between mb-4 sm:mb-6">
      <h2 className="font-fredoka text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">
        {title} <span className="text-slate-600 text-base font-black">({count})</span>
      </h2>
      {showViewAll && (
        <Link href={viewAllHref}>
          <button className="font-fredoka text-xs uppercase tracking-widest font-black px-4 py-2 border-2 border-slate-600 text-slate-400 hover:border-[#65d421] hover:text-[#65d421] transition-all">
            View All →
          </button>
        </Link>
      )}
    </div>
  );
}

const PREVIEW_COUNT = 3;

export default function HomePage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [{ data: gData }, { data: tData }] = await Promise.all([
        supabase.from("games").select("*").order("created_at", { ascending: false }),
        supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      ]);
      if (gData) setGames(gData as GameRow[]);
      if (tData) setTournaments(tData as TournamentRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const sortedTournaments = [...tournaments]
    .filter((t) => t.status !== "DRAFT")
    .sort((a, b) => {
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const previewTournaments = sortedTournaments.slice(0, PREVIEW_COUNT);
  const hasMoreTournaments = sortedTournaments.length > PREVIEW_COUNT;

  const standAloneGames = games
    .filter((g) => !g.tournament_id)
    .sort((a, b) => {
      const order = { active: 0, scheduled: 1, finished: 2 };
      return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
    });

  const previewGames = standAloneGames.slice(0, PREVIEW_COUNT);
  const hasMoreGames = standAloneGames.length > PREVIEW_COUNT;

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-2xl text-slate-400 uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-slate-700">
        <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
        <Link href="/players">
          <button className="font-fredoka text-xs sm:text-sm uppercase tracking-widest font-black px-3 sm:px-4 py-2 border-4 bg-[#3b82f6] text-white border-slate-900 shadow-[2px_2px_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a] transition-all whitespace-nowrap">
            🏀 Players
          </button>
        </Link>
      </header>

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto w-full gap-10 sm:gap-14">

        {/* Tournaments Section */}
        <section>
          <SectionHeader
            title="Tournaments"
            count={sortedTournaments.length}
            viewAllHref="/tournaments"
            showViewAll={hasMoreTournaments}
          />
          {sortedTournaments.length === 0 ? (
            <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-14">
              <span className="text-5xl">🏆</span>
              <p className="font-fredoka text-lg font-black text-slate-500 uppercase tracking-wider">No tournaments yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {previewTournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </section>

        <div className="border-t-2 border-slate-800" />

        {/* Matches Section */}
        <section>
          <SectionHeader
            title="Matches"
            count={standAloneGames.length}
            viewAllHref="/matches"
            showViewAll={hasMoreGames}
          />
          {standAloneGames.length === 0 ? (
            <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-14">
              <span className="text-5xl">🏀</span>
              <p className="font-fredoka text-lg font-black text-slate-500 uppercase tracking-wider">No standalone matches yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {previewGames.map((game) => {
                if (game.status === "active") return <LiveMatchCard key={game.id} game={game} />;
                if (game.status === "scheduled") return <ScheduledMatchCard key={game.id} game={game} />;
                return <FinishedMatchCard key={game.id} game={game} />;
              })}
            </div>
          )}
        </section>

      </main>

      <footer className="text-center py-3 sm:py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
