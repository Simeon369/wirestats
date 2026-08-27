"use client";

import { useEffect, useRef, useState, use, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import { Jersey } from "@/components/ui/Jersey";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

type Player = {
  id: string;
  number: string;
  name: string;
};

type PlayerStats = {
  id: string;
  team: string;
  name: string;
  number: string;
  points: number;
  threes: number;
  rebounds: number;
  blocks: number;
  steals: number;
  assists: number;
};

type GameRow = {
  id: string;
  status: string;
  team_a_name: string;
  team_b_name: string;
  team_a_color: string;
  team_b_color: string;
  score_a: number;
  score_b: number;
  fouls_a: number;
  fouls_b: number;
  roster_active_a: Player[];
  roster_active_b: Player[];
  roster_bench_a: Player[];
  roster_bench_b: Player[];
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
  player_name: string | null;
  player_number: string | null;
  player_out_name: string | null;
  player_out_number: string | null;
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
    case "2pt": return "🏀 +2";
    case "3pt": return "🏀 +3";
    case "ft":  return "🏀 +1";
    case "foul": return "🚨 Foul";
    case "reb":  return "🙌 Reb";
    case "blk":  return "🚫 Blk";
    case "stl":  return "🥷🏻 Stl";
    case "ast":  return "🤝 Ast";
    case "sub":  return " ";
    default: return event.event_type;
  }
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [game, setGame] = useState<GameRow | null>(null);
  const [events, setEvents] = useState<StatEvent[]>([]);
  const [allEvents, setAllEvents] = useState<StatEvent[]>([]);
  const [displayClock, setDisplayClock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noGame, setNoGame] = useState(false);

  // Holds the active realtime channel so cleanup always has a reference
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load the specific game by ID
  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      if (!supabase) { setNoGame(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

      if (cancelled) return; // component unmounted while awaiting

      if (error || !data) {
        setNoGame(true);
        setLoading(false);
        return;
      }
      setGame(data as GameRow);
      setDisplayClock(data.clock_seconds);
      setLoading(false);

      const { data: evData } = await supabase
        .from("stat_events")
        .select("*")
        .eq("game_id", data.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (evData) {
        setAllEvents(evData as StatEvent[]);
        setEvents((evData as StatEvent[]).slice(0, 20));
      }

      // Don't open a realtime channel for already-finished games
      if (data.status === "finished") return;

      const ch = supabase
        .channel(`game-${data.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${data.id}`,
        }, (payload) => {
          const updated = payload.new as GameRow;
          setGame((prev) => {
            if (prev) {
              setDisplayClock((currentClock) => {
                if (!updated.is_running) return updated.clock_seconds;
                if (!prev.is_running && updated.is_running) return updated.clock_seconds;
                if (Math.abs(currentClock - updated.clock_seconds) > 3) return updated.clock_seconds;
                return currentClock;
              });
            } else {
              setDisplayClock(updated.clock_seconds);
            }
            return updated;
          });
        })
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "stat_events",
          filter: `game_id=eq.${data.id}`,
        }, (payload) => {
          const newEv = payload.new as StatEvent;
          setAllEvents((prev) => [newEv, ...prev]);
          setEvents((prev) => [newEv, ...prev].slice(0, 20));
        })
        .subscribe();

      channelRef.current = ch;
    }

    loadGame();

    // Cleanup runs synchronously when id changes or component unmounts
    return () => {
      cancelled = true;
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id]);

  // Client-side clock tick when is_running
  useEffect(() => {
    if (!game?.is_running) return;
    const interval = setInterval(() => {
      setDisplayClock((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.is_running]);

  const leaderboard = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};
    for (const ev of allEvents) {
      if (ev.player_number && ev.team) {
        const key = `${ev.team}-${ev.player_number}`;
        if (!stats[key]) {
          stats[key] = {
            id: key,
            team: ev.team,
            name: ev.player_name || `Player ${ev.player_number}`,
            number: ev.player_number,
            points: 0,
            threes: 0,
            rebounds: 0,
            blocks: 0,
            steals: 0,
            assists: 0,
          };
        }
        if (ev.points > 0) stats[key].points += ev.points;
        if (ev.event_type === "3pt") stats[key].threes += 1;
        if (ev.event_type === "reb") stats[key].rebounds += 1;
        if (ev.event_type === "blk") stats[key].blocks += 1;
        if (ev.event_type === "stl") stats[key].steals += 1;
        if (ev.event_type === "ast") stats[key].assists += 1;
      }
    }
    const arr = Object.values(stats);
    const teamA = arr.filter(p => p.team === "A").sort((a, b) => b.points - a.points).slice(0, 5);
    const teamB = arr.filter(p => p.team === "B").sort((a, b) => b.points - a.points).slice(0, 5);
    return { teamA, teamB };
  }, [allEvents]);

  const totalPeriods = 4;

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
        <h1 className="font-fredoka text-4xl md:text-6xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-2" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a,3px 3px 0 #1b630a,4px 4px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
        <p className="font-nunito text-lg md:text-xl text-slate-400 font-bold uppercase tracking-widest text-center px-4">Game not found.</p>
        <p className="font-nunito text-sm text-slate-600 text-center px-4">Please check the URL or go back to the homepage.</p>
      </div>
    );
  }

  const per = periodLabel(game.period, totalPeriods);
  const isFinished = game.status === "finished";

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b-4 border-slate-700 gap-4">
        <h1 className="font-fredoka text-3xl md:text-4xl font-black tracking-widest text-white">
          Wire<span className="text-[#65d421] ml-1" style={{ textShadow: "1px 1px 0 #1b630a,2px 2px 0 #1b630a", WebkitTextStroke: "1px #1b630a" }}>Stats</span>
        </h1>
      </header>

      <main className="flex flex-col items-center justify-start flex-1 px-4 sm:px-6 py-6 sm:py-8 gap-6 max-w-3xl mx-auto w-full">
        {/* Row: Period | Clock | Status */}
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex-1 flex justify-start">
            <span className="font-fredoka text-2xl font-black uppercase tracking-widest text-slate-400">{per}</span>
          </div>
          
          <div className={`font-fredoka text-4xl sm:text-8xl font-black tracking-widest px-6 sm:px-8 py-2 border-4 border-slate-900 ${game.is_running ? "bg-slate-900 text-[#65d421] shadow-[4px_4px_0_#65d421]" : "bg-[#65d421] text-slate-900 shadow-[4px_4px_0_#0f172a]"}`}>
            {formatClock(displayClock)}
          </div>

          <div className="flex-1 flex justify-end">
            {isFinished ? (
              <span className="font-nunito text-lg font-black text-red-400 uppercase tracking-widest border-2 border-red-600 px-2 py-1 animate-pulse">FINAL</span>
            ) : game.is_running ? (
              <div className="flex gap-1 animate-pulse">
                <div className="w-3 h-8 bg-[#65d421]"></div>
                <div className="w-3 h-8 bg-[#65d421]"></div>
              </div>
            ) : (
              <div className="flex gap-1">
                <div className="w-3 h-8 bg-slate-500"></div>
                <div className="w-3 h-8 bg-slate-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Score panel */}
        <div className="w-full border-4 border-slate-900 bg-white shadow-[8px_8px_0_#0f172a] p-4 flex flex-col gap-6 mt-2">
          {/* Top Row: Team Names and Fouls */}
          <div className="flex justify-between items-end gap-4">
            <div className="flex flex-col items-center flex-1 w-0">
              <span className="font-nunito text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 min-h-[16px]">
                {Array.from({ length: game.fouls_a ?? 0 }).map((_, i) => (
                  <span key={i} className="text-[10px]">🚨</span>
                ))}
              </span>
              <span
                className="font-fredoka text-md font-black uppercase tracking-widest px-3 py-1 border-2 border-slate-900 text-center w-full truncate"
                style={{ backgroundColor: game.team_a_color, color: game.team_a_color.toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff" }}
              >
                {game.team_a_name}
              </span>
            </div>
            <div className="flex flex-col items-center flex-1 w-0">
              <span className="font-nunito text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 min-h-[16px]">
                {Array.from({ length: game.fouls_b ?? 0 }).map((_, i) => (
                  <span key={i} className="text-[10px]">🚨</span>
                ))}
              </span>
              <span
                className="font-fredoka text-md font-black uppercase tracking-widest px-3 py-1 border-2 border-slate-900 text-center w-full truncate"
                style={{ backgroundColor: game.team_b_color, color: game.team_b_color.toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff" }}
              >
                {game.team_b_name}
              </span>
            </div>
          </div>

          {/* Middle Row: Scores */}
          <div className="flex justify-between items-center px-4 sm:px-6">
            <span className="font-fredoka text-7xl font-black text-slate-900 leading-none">{game.score_a}</span>
            <span className="font-fredoka text-xl font-black text-slate-300">VS</span>
            <span className="font-fredoka text-7xl font-black text-slate-900 leading-none">{game.score_b}</span>
          </div>
          
          {/* Bottom Row: Rosters */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Active Players */}
            <div className="flex justify-between">
              <div className="flex gap-1 flex-wrap w-[45%]">
                {(game.roster_active_a || []).map(p => (
                  <div key={p.id} className="scale-75 origin-top-left">
                    <Jersey number={p.number} colorHex={game.team_a_color} size="sm" />
                  </div>
                ))}{(game.roster_bench_a || []).map(p => (
                  <div key={p.id} className="scale-75 origin-top-left">
                    <Jersey number={p.number} colorHex={game.team_a_color} size="sm" dimmed />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap w-[45%] justify-end">
                {(game.roster_active_b || []).map(p => (
                  <div key={p.id} className="scale-75 origin-top-right">
                    <Jersey number={p.number} colorHex={game.team_b_color} size="sm" />
                  </div>
                ))}{(game.roster_bench_b || []).map(p => (
                  <div key={p.id} className="scale-75 origin-top-right">
                    <Jersey number={p.number} colorHex={game.team_b_color} size="sm" dimmed />
                  </div>
                ))}
              </div>
            </div>
            
            
          </div>
        </div>

        {/* Play-by-play feed */}
        {events.length > 0 && (
          <div className="w-full border-4 border-slate-700 bg-slate-800 mt-4">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="font-fredoka text-xl font-black uppercase tracking-widest text-slate-400">Play-by-Play</h2>
              
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
              <div className="flex flex-col px-4 pb-4">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                    <div className="flex items-center gap-2">
                      {ev.player_number ? (
                        <Jersey
                          number={ev.player_number}
                          colorHex={ev.team === "A" ? game.team_a_color : game.team_b_color}
                          size="sm"
                        />
                      ) : (
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
                      )}

                      {ev.event_type === "sub" && ev.player_out_number && (
                        <>
                          <span className="text-slate-500 font-bold px-1">🔄</span>
                          <Jersey
                            number={ev.player_out_number}
                            colorHex={ev.team === "A" ? game.team_a_color : game.team_b_color}
                            size="sm"
                            dimmed
                          />
                        </>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-nunito text-sm font-bold text-white">{eventLabel(ev)}</span>
                      {ev.player_name && (
                        <span className="font-nunito text-xs text-slate-400">
                          {ev.player_name}
                          {ev.event_type === "sub" && ev.player_out_name ? ` (for ${ev.player_out_name})` : ""}
                        </span>
                      )}
                    </div>
                    {ev.points > 0 && (
                      <span className="font-fredoka text-sm font-black text-[#65d421]">+{ev.points}</span>
                    )}
                    <span className="font-mono text-xs text-slate-500">{ev.clock_snapshot ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {(leaderboard.teamA.length > 0 || leaderboard.teamB.length > 0) && (
          <div className="w-full border-4 border-slate-700 bg-slate-800 mt-4 p-4">
            <h2 className="font-fredoka text-xl font-black uppercase tracking-widest text-slate-400 mb-4">Top Performers</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Team A Leaderboard */}
              <div className="flex-1">
                <h3 className="font-fredoka text-md font-black uppercase text-white mb-2" style={{ color: game.team_a_color }}>{game.team_a_name}</h3>
                <div className="flex flex-col gap-2">
                  {leaderboard.teamA.map(p => (
                    <div key={p.id} className="flex flex-col bg-slate-700 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Jersey number={p.number} colorHex={game.team_a_color} size="sm" />
                        <span className="font-nunito font-bold text-white text-sm">{p.name}</span>
                      </div>
                      <div className="flex justify-end gap-3 text-sm font-fredoka font-black">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">PTS</span>
                          <span className="text-[#65d421]">{p.points}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">3PT</span>
                          <span className="text-white">{p.threes}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">REB</span>
                          <span className="text-amber-400">{p.rebounds}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">BLK</span>
                          <span className="text-orange-400">{p.blocks}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">STL</span>
                          <span className="text-teal-400">{p.steals}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">AST</span>
                          <span className="text-indigo-400">{p.assists}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaderboard.teamA.length === 0 && <span className="text-sm text-slate-500 font-nunito">No stats yet</span>}
                </div>
              </div>
              
              {/* Team B Leaderboard */}
              <div className="flex-1">
                <h3 className="font-fredoka text-md font-black uppercase text-white mb-2" style={{ color: game.team_b_color }}>{game.team_b_name}</h3>
                <div className="flex flex-col gap-2">
                  {leaderboard.teamB.map(p => (
                    <div key={p.id} className="flex flex-col bg-slate-700 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Jersey number={p.number} colorHex={game.team_b_color} size="sm" />
                        <span className="font-nunito font-bold text-white text-sm">{p.name}</span>
                      </div>
                      <div className="flex justify-end gap-3 text-sm font-fredoka font-black">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">PTS</span>
                          <span className="text-[#65d421]">{p.points}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">3PT</span>
                          <span className="text-white">{p.threes}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">REB</span>
                          <span className="text-amber-400">{p.rebounds}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">BLK</span>
                          <span className="text-orange-400">{p.blocks}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">STL</span>
                          <span className="text-teal-400">{p.steals}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">AST</span>
                          <span className="text-indigo-400">{p.assists}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaderboard.teamB.length === 0 && <span className="text-sm text-slate-500 font-nunito">No stats yet</span>}
                </div>
              </div>
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
