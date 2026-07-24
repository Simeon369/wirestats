"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";

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
};

type StatEvent = {
  id: string;
  game_id: string;
  event_type: string;
  points: number;
  period: number;
  clock_snapshot: string | null;
  team: string | null;
  created_at: string;
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function periodLabel(period: number, totalPeriods: number): string {
  if (period > totalPeriods) return `OT${period - totalPeriods}`;
  return `${totalPeriods === 4 ? "Q" : "H"}${period}`;
}

function eventLabel(event: StatEvent): string {
  switch (event.event_type) {
    case "2pt": return "2-Pointer";
    case "3pt": return "3-Pointer";
    case "ft": return "Free Throw";
    case "foul": return "Foul";
    case "sub": return "Substitution";
    default: return event.event_type;
  }
}

export default function LiveScoreboard() {
  const [game, setGame] = useState<GameRow | null>(null);
  const [events, setEvents] = useState<StatEvent[]>([]);
  const [displayClock, setDisplayClock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noGame, setNoGame] = useState(false);

  // Load the most recent active game
  useEffect(() => {
    async function loadGame() {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        setNoGame(true);
        setLoading(false);
        return;
      }
      setGame(data as GameRow);
      setDisplayClock(data.clock_seconds);
      setLoading(false);

      // Also load recent events
      const { data: evData } = await supabase
        .from("stat_events")
        .select("*")
        .eq("game_id", data.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (evData) setEvents(evData as StatEvent[]);

      // Subscribe to game changes
      const gameChannel = supabase
        .channel(`game-${data.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${data.id}`,
        }, (payload) => {
          const updated = payload.new as GameRow;
          setGame(updated);
          setDisplayClock(updated.clock_seconds);
        })
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "stat_events",
          filter: `game_id=eq.${data.id}`,
        }, (payload) => {
          setEvents((prev) => [payload.new as StatEvent, ...prev].slice(0, 20));
        })
        .subscribe();

      return () => { supabase.removeChannel(gameChannel); };
    }

    loadGame();
  }, []);

  // Client-side clock tick when is_running
  useEffect(() => {
    if (!game?.is_running) return;
    const interval = setInterval(() => {
      setDisplayClock((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.is_running, game?.clock_seconds]);

  // Sync display clock from server when paused
  useEffect(() => {
    if (game && !game.is_running) {
      setDisplayClock(game.clock_seconds);
    }
  }, [game?.clock_seconds, game?.is_running]);

  const totalPeriods = 4; // default; could be stored in DB

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    );
  }

  if (noGame || !game) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6`}>
        <h1 className="font-fredoka text-6xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-2" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a,3px 3px 0 #1b630a,4px 4px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
        <p className="font-nunito text-xl text-slate-400 font-bold uppercase tracking-widest">No live game right now.</p>
        <p className="font-nunito text-sm text-slate-600">Check back when a match is in progress.</p>
      </div>
    );
  }

  const per = periodLabel(game.period, totalPeriods);
  const isFinished = game.status === "finished";

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-slate-700">
        <h1 className="font-fredoka text-4xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
        <div className="flex items-center gap-3">
          {isFinished ? (
            <span className="font-nunito text-sm font-black text-red-400 uppercase tracking-widest border border-red-600 px-3 py-1 animate-pulse">FINAL</span>
          ) : (
            <span className={`font-nunito text-sm font-black uppercase tracking-widest border px-3 py-1 ${game.is_running ? "text-[#65d421] border-[#65d421] animate-pulse" : "text-slate-400 border-slate-600"}`}>
              {game.is_running ? "● LIVE" : "⏸ PAUSED"}
            </span>
          )}
        </div>
      </header>

      {/* Main scoreboard */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-8 gap-8 max-w-3xl mx-auto w-full">

        {/* Period + Clock */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-fredoka text-2xl font-black uppercase tracking-widest text-slate-400">{per}</span>
          <div className={`font-fredoka text-8xl font-black tracking-widest px-8 py-4 border-4 border-slate-900 ${game.is_running ? "bg-slate-900 text-[#65d421] shadow-[6px_6px_0_#65d421]" : "bg-[#65d421] text-slate-900 shadow-[6px_6px_0_#0f172a]"}`}>
            {formatClock(displayClock)}
          </div>
        </div>

        {/* Score panel */}
        <div className="w-full border-4 border-slate-900 bg-white shadow-[8px_8px_0_#0f172a]">
          <div className="grid grid-cols-3 items-center p-6 gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center gap-3">
              <span
                className="font-fredoka text-2xl font-black uppercase tracking-widest px-4 py-2 border-2 border-slate-900 text-white text-center w-full"
                style={{ backgroundColor: game.team_a_color, color: game.team_a_color.toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff" }}
              >
                {game.team_a_name}
              </span>
              <span className="font-fredoka text-9xl font-black text-slate-900 leading-none">{game.score_a}</span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-2">
              <span className="font-fredoka text-4xl font-black text-slate-200">VS</span>
              {isFinished && (
                <span className="font-nunito text-sm font-black text-red-500 uppercase border border-red-400 px-2 py-0.5">FINAL</span>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-3">
              <span
                className="font-fredoka text-2xl font-black uppercase tracking-widest px-4 py-2 border-2 border-slate-900 text-center w-full"
                style={{ backgroundColor: game.team_b_color, color: game.team_b_color.toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff" }}
              >
                {game.team_b_name}
              </span>
              <span className="font-fredoka text-9xl font-black text-slate-900 leading-none">{game.score_b}</span>
            </div>
          </div>
        </div>

        {/* Play-by-play feed */}
        {events.length > 0 && (
          <div className="w-full border-4 border-slate-700 bg-slate-800 p-6">
            <h2 className="font-fredoka text-xl font-black uppercase tracking-widest text-slate-400 mb-4">Play-by-Play</h2>
            <div className="flex flex-col gap-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                  <span
                    className="font-fredoka text-xs font-black uppercase px-2 py-1 border text-white"
                    style={{
                      backgroundColor: ev.team === "A" ? game.team_a_color : game.team_b_color,
                      borderColor: ev.team === "A" ? game.team_a_color : game.team_b_color,
                      color: ((ev.team === "A" ? game.team_a_color : game.team_b_color) || "").toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff",
                    }}
                  >
                    {ev.team === "A" ? game.team_a_name : game.team_b_name}
                  </span>
                  <span className="font-nunito text-sm font-bold text-white flex-1">{eventLabel(ev)}</span>
                  {ev.points > 0 && (
                    <span className="font-fredoka text-sm font-black text-[#65d421]">+{ev.points}</span>
                  )}
                  <span className="font-mono text-xs text-slate-500">{ev.clock_snapshot ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
