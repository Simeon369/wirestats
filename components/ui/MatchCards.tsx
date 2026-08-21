"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type GameRow = {
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
  game_number: number | null;
  round_name: string | null;
  match_day: string | null;
  match_time: string | null;
};

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function periodLabel(period: number, totalPeriods: number): string {
  if (!period || !totalPeriods) return "";
  if (period > totalPeriods) return `OT${period - totalPeriods}`;
  return `${totalPeriods === 4 ? "Q" : "H"}${period}`;
}

export function LiveMatchCard({ game }: { game: GameRow }) {
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
            {game.round_name && <span className="font-nunito text-[10px] font-bold uppercase tracking-wider text-slate-500">· {game.round_name}</span>}
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

export function ScheduledMatchCard({ game }: { game: GameRow }) {
  // Build schedule display: prefer match_day + match_time, fallback to start_time
  const scheduleLabel = game.match_day
    ? [game.match_day, game.match_time].filter(Boolean).join(' · ')
    : game.start_time
    ? new Date(game.start_time).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-slate-800 border-4 border-slate-600 shadow-[4px_4px_0_#334155] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#334155] hover:border-slate-400 transition-all cursor-pointer h-full">
        <div className="flex items-center justify-between border-b border-slate-600 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-xs uppercase tracking-widest font-black text-blue-400 bg-blue-400/10 px-2 py-0.5">Upcoming</span>
            {game.round_name && <span className="font-nunito text-[10px] font-bold uppercase tracking-wider text-slate-500">· {game.round_name}</span>}
          </div>
          {scheduleLabel && (
            <span className="font-nunito text-xs font-bold text-slate-400">{scheduleLabel}</span>
          )}
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

export function FinishedMatchCard({ game }: { game: GameRow }) {
  const scoreAWon = game.score_a > game.score_b;
  const scoreBWon = game.score_b > game.score_a;

  return (
    <Link href={`/game/${game.id}`}>
      <div className="bg-white border-4 border-slate-300 shadow-[4px_4px_0_#cbd5e1] p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_#94a3b8] hover:border-slate-400 transition-all cursor-pointer h-full">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-xs uppercase tracking-widest font-black text-slate-500 bg-slate-100 px-2 py-0.5">Final</span>
            {game.round_name && <span className="font-nunito text-[10px] font-bold uppercase tracking-wider text-slate-400">· {game.round_name}</span>}
          </div>
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
