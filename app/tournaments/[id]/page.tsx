"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import {
  GameRow,
  LiveMatchCard,
  ScheduledMatchCard,
  FinishedMatchCard,
} from "@/components/ui/MatchCards";

type Tab = "matches" | "leaderboard";

export default function TournamentHub() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      // Fetch tournament info
      const { data: tData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (tData) setTournament(tData);

      // Fetch all matches for this tournament
      const { data: gData } = await supabase
        .from("games")
        .select("*")
        .eq("tournament_id", id)
        .order("created_at", { ascending: false });

      if (gData) setGames(gData as GameRow[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sort: live first, then scheduled, then finished
  // Live games first, then ordered by game_number
  const sortedGames = [...games].sort((a, b) => {
    const aLive = a.status === "active" ? 0 : 1;
    const bLive = b.status === "active" ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (a.game_number ?? 0) - (b.game_number ?? 0);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="font-fredoka text-2xl text-slate-400 uppercase tracking-widest animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="font-fredoka text-2xl text-white uppercase tracking-widest">
          Tournament Not Found
        </p>
        <button
          onClick={() => router.back()}
          className="font-fredoka text-sm uppercase tracking-widest font-black text-slate-400 border-2 border-slate-600 px-4 py-2 hover:text-white hover:border-slate-400 transition-all"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* ─── Compact Header ─── */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b-4 border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="shrink-0 w-10 h-10 flex items-center justify-center border-2 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white transition-all"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-fredoka text-lg sm:text-xl font-black uppercase tracking-wider text-white truncate">
            {tournament.name}
          </h1>
        </div>
        {tournament.status === "ACTIVE" && (
          <span className="shrink-0 font-fredoka text-[10px] font-black uppercase tracking-widest bg-[#65d421] text-slate-900 px-2 py-1 flex items-center gap-1">
            <span className="flex gap-[2px] animate-pulse">
              <span className="w-1 h-2.5 bg-slate-900 block" />
              <span className="w-1 h-2.5 bg-slate-900 block" />
            </span>
            Live
          </span>
        )}
      </header>

      {/* ─── Tab Switcher ─── */}
      <div className="flex border-b-4 border-slate-700">
        {(["matches", "leaderboard"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-fredoka text-sm sm:text-base font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "matches" ? "Matches" : "Leaderboard"}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#65d421]" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      <main className="flex-1 flex flex-col px-3 sm:px-4 py-4 sm:py-6 max-w-2xl mx-auto w-full">
        {activeTab === "matches" && (
          <div className="flex flex-col gap-3 sm:gap-4">
            {sortedGames.length === 0 ? (
              <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-16">
                <span className="text-5xl">🏀</span>
                <p className="font-fredoka text-base font-black text-slate-500 uppercase tracking-wider">
                  No matches scheduled yet
                </p>
              </div>
            ) : (
              sortedGames.map((game) => {
                if (game.status === "active")
                  return <LiveMatchCard key={game.id} game={game} />;
                if (game.status === "scheduled")
                  return <ScheduledMatchCard key={game.id} game={game} />;
                return <FinishedMatchCard key={game.id} game={game} />;
              })
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-16">
            <span className="text-5xl">🏆</span>
            <p className="font-fredoka text-base font-black text-slate-500 uppercase tracking-wider">
              Leaderboard coming soon
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
