"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tournament } from "@/lib/types";
import {
  GameRow,
  LiveMatchCard,
  ScheduledMatchCard,
  FinishedMatchCard,
} from "@/components/ui/MatchCards";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "matches" | "leaderboard";

type LeaderboardStat = "mvp" | "pts" | "reb" | "ast" | "stl" | "blk" | "3pm";

type PlayerLeaderboardRow = {
  player_id: string;
  full_name: string;
  jersey_name: string;
  position: string;
  team_id: string | null;
  team_name: string | null;
  team_color: string | null;
  tournament_id: string;
  games_played: number;
  total_points: number;
  three_pointers_made: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_fouls: number;
  mvp_rating: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STAT_TABS: { key: LeaderboardStat; label: string; emoji: string; field: keyof PlayerLeaderboardRow; unit: string }[] = [
  { key: "mvp", label: "MVP",  emoji: "🏆", field: "mvp_rating",          unit: "RTG" },
  { key: "pts", label: "PTS",  emoji: "🏀", field: "total_points",         unit: "PTS" },
  { key: "reb", label: "REB",  emoji: "🙌", field: "total_rebounds",        unit: "REB" },
  { key: "ast", label: "AST",  emoji: "🤝", field: "total_assists",         unit: "AST" },
  { key: "stl", label: "STL",  emoji: "🥷", field: "total_steals",          unit: "STL" },
  { key: "blk", label: "BLK",  emoji: "🚫", field: "total_blocks",          unit: "BLK" },
  { key: "3pm", label: "3PM",  emoji: "🎯", field: "three_pointers_made",   unit: "3PM" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

const MEDAL_RING: Record<number, string> = {
  0: "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)]",
  1: "border-slate-400 shadow-[0_0_14px_rgba(148,163,184,0.3)]",
  2: "border-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.3)]",
};

const MEDAL_BG: Record<number, string> = {
  0: "bg-yellow-950/60",
  1: "bg-slate-800/80",
  2: "bg-orange-950/50",
};

const RANK_COLOR: Record<number, string> = {
  0: "text-yellow-400",
  1: "text-slate-400",
  2: "text-orange-400",
};

function textColor(hex: string) {
  return hex.toLowerCase() === "#ffffff" ? "#0f172a" : "#ffffff";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PlayerTeamBadge({ name, color }: { name: string | null; color: string | null }) {
  if (!name || !color) return null;
  return (
    <span
      className="inline-flex items-center gap-1 font-fredoka text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border"
      style={{ backgroundColor: color, color: textColor(color), borderColor: color }}
    >
      {name}
    </span>
  );
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-nunito text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`font-fredoka text-sm font-black ${color}`}>{value}</span>
    </div>
  );
}

function PodiumCard({
  rank,
  player,
  primaryField,
  primaryUnit,
  showMvpStats,
}: {
  rank: number;
  player: PlayerLeaderboardRow;
  primaryField: keyof PlayerLeaderboardRow;
  primaryUnit: string;
  showMvpStats: boolean;
}) {
  const primaryValue = player[primaryField] as number;

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 border-4 ${MEDAL_RING[rank]} ${MEDAL_BG[rank]} transition-all`}
    >
      {/* Medal + Rank */}
      <div className="flex items-center justify-between">
        <span className="text-2xl">{MEDAL[rank]}</span>
        <span className={`font-fredoka text-3xl font-black ${RANK_COLOR[rank]}`}>
          {primaryValue}
          <span className="text-xs font-bold ml-1 opacity-70">{primaryUnit}</span>
        </span>
      </div>

      {/* Player Name */}
      <div className="flex flex-col gap-1">
        <span className="font-fredoka text-lg font-black uppercase tracking-wider text-white leading-tight">
          {player.full_name}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs text-slate-500 font-bold">{player.position}</span>
          <PlayerTeamBadge name={player.team_name} color={player.team_color} />
        </div>
      </div>

      {/* Secondary stats */}
      <div className={`border-t border-slate-700 pt-2 flex justify-between gap-1 ${showMvpStats ? "flex-wrap" : ""}`}>
        {showMvpStats ? (
          <>
            <StatPill label="PTS"  value={player.total_points}       color="text-[#65d421]" />
            <StatPill label="REB"  value={player.total_rebounds}      color="text-amber-400" />
            <StatPill label="AST"  value={player.total_assists}       color="text-indigo-400" />
            <StatPill label="STL"  value={player.total_steals}        color="text-teal-400" />
            <StatPill label="BLK"  value={player.total_blocks}        color="text-orange-400" />
            <StatPill label="PF"   value={player.total_fouls}         color="text-red-400" />
            <StatPill label="GP"   value={player.games_played}        color="text-slate-400" />
          </>
        ) : (
          <>
            <StatPill label="PTS" value={player.total_points}        color="text-[#65d421]" />
            <StatPill label="3PM" value={player.three_pointers_made} color="text-purple-400" />
            <StatPill label="GP"  value={player.games_played}        color="text-slate-400" />
          </>
        )}
      </div>
    </div>
  );
}

function RankedRow({
  rank,
  player,
  primaryField,
  primaryUnit,
}: {
  rank: number;
  player: PlayerLeaderboardRow;
  primaryField: keyof PlayerLeaderboardRow;
  primaryUnit: string;
}) {
  const primaryValue = player[primaryField] as number;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 last:border-0 hover:bg-slate-700/20 transition-colors">
      {/* Rank number */}
      <span className="font-fredoka text-base font-black text-slate-500 w-5 shrink-0 text-right">
        {rank}.
      </span>

      {/* Team color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-600"
        style={{ backgroundColor: player.team_color ?? "#64748b" }}
      />

      {/* Name + team */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-fredoka text-sm font-black uppercase tracking-wide text-white truncate leading-tight">
          {player.full_name}
        </span>
        <span className="font-nunito text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {player.position} · {player.team_name ?? "—"}
        </span>
      </div>

      {/* Primary stat */}
      <div className="flex flex-col items-end shrink-0">
        <span className="font-fredoka text-lg font-black text-white">{primaryValue}</span>
        <span className="font-nunito text-[9px] font-bold text-slate-500 uppercase tracking-widest">{primaryUnit}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MVP Featured Card
// ─────────────────────────────────────────────────────────────────────────────

function MvpFeaturedCard({ player }: { player: PlayerLeaderboardRow }) {
  return (
    <div className="relative overflow-hidden border-4 border-yellow-400 shadow-[0_0_32px_rgba(250,204,21,0.25)] p-5 flex flex-col gap-4 bg-yellow-950/40">
      {/* Glow bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent pointer-events-none" />

      {/* Crown + label */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">👑</span>
        <span className="font-fredoka text-sm font-black uppercase tracking-widest text-yellow-400">
          Tournament MVP
        </span>
      </div>

      {/* Player info */}
      <div className="flex flex-col gap-1">
        <span className="font-fredoka text-2xl font-black uppercase tracking-wider text-white">
          {player.full_name}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-slate-400">{player.position}</span>
          <PlayerTeamBadge name={player.team_name} color={player.team_color} />
          <span className="font-nunito text-xs font-bold text-slate-500">
            {player.games_played} GP
          </span>
        </div>
      </div>

      {/* Big rating */}
      <div className="flex items-end gap-2">
        <span className="font-fredoka text-5xl font-black text-yellow-400 leading-none">
          {player.mvp_rating}
        </span>
        <span className="font-nunito text-sm font-bold text-yellow-600 mb-1 uppercase tracking-widest">
          MVP Rating
        </span>
      </div>

      {/* All stats grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-yellow-400/30 pt-3">
        <StatPill label="PTS"  value={player.total_points}       color="text-[#65d421]" />
        <StatPill label="REB"  value={player.total_rebounds}      color="text-amber-400" />
        <StatPill label="AST"  value={player.total_assists}       color="text-indigo-400" />
        <StatPill label="STL"  value={player.total_steals}        color="text-teal-400" />
        <StatPill label="BLK"  value={player.total_blocks}        color="text-orange-400" />
        <StatPill label="3PM"  value={player.three_pointers_made} color="text-purple-400" />
      </div>

      {/* Formula footnote */}
      <p className="font-nunito text-[10px] text-slate-600 font-bold italic leading-snug border-t border-slate-700/60 pt-2">
        MVP Rating = PTS + 1.5×AST + 1.2×REB + 2.0×STL + 1.8×BLK − 0.5×PF
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Panel
// ─────────────────────────────────────────────────────────────────────────────

function LeaderboardPanel({ tournamentId }: { tournamentId: string }) {
  const [activeStat, setActiveStat] = useState<LeaderboardStat>("mvp");
  const [allRows, setAllRows] = useState<PlayerLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tournament_player_leaderboard")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (!error && data) {
      setAllRows(data as PlayerLeaderboardRow[]);
    }
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-fredoka text-lg text-slate-500 uppercase tracking-widest animate-pulse">
          Loading stats...
        </p>
      </div>
    );
  }

  if (allRows.length === 0) {
    return (
      <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-16">
        <span className="text-5xl">🏆</span>
        <p className="font-fredoka text-base font-black text-slate-500 uppercase tracking-wider text-center px-4">
          No stats yet
        </p>
        <p className="font-nunito text-sm text-slate-600 font-bold text-center px-4">
          Leaderboard populates after games are finished.
        </p>
      </div>
    );
  }

  // Find the active tab config
  const tabConfig = STAT_TABS.find((t) => t.key === activeStat)!;
  const isMvp = activeStat === "mvp";

  // Sort and take top 10 for the active stat
  const sorted = [...allRows]
    .sort((a, b) => (b[tabConfig.field] as number) - (a[tabConfig.field] as number))
    .filter((p) => (p[tabConfig.field] as number) > 0)
    .slice(0, 10);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stat category tab strip ── */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none">
        {STAT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStat(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 font-fredoka text-xs font-black uppercase tracking-widest border-2 transition-all ${
              activeStat === tab.key
                ? "bg-[#65d421] border-[#1b630a] text-slate-900 shadow-[2px_2px_0_#1b630a]"
                : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── MVP Featured Card (only on MVP tab) ── */}
      {isMvp && sorted.length > 0 && (
        <MvpFeaturedCard player={sorted[0]} />
      )}

      {/* ── Top 3 Podium ── */}
      {!isMvp && top3.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-fredoka text-xs font-black uppercase tracking-widest text-slate-500">
            {tabConfig.emoji} {tabConfig.label} Leaders
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {top3.map((player, i) => (
              <PodiumCard
                key={player.player_id}
                rank={i}
                player={player}
                primaryField={tabConfig.field}
                primaryUnit={tabConfig.unit}
                showMvpStats={isMvp}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MVP tab: show ranks 2-10 as a list ── */}
      {isMvp && sorted.length > 1 && (
        <div className="border-4 border-slate-700 bg-slate-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
            <span className="font-fredoka text-xs font-black uppercase tracking-widest text-slate-400">
              Full Rankings
            </span>
          </div>
          {sorted.slice(1).map((player, i) => (
            <RankedRow
              key={player.player_id}
              rank={i + 2}
              player={player}
              primaryField={tabConfig.field}
              primaryUnit={tabConfig.unit}
            />
          ))}
        </div>
      )}

      {/* ── Non-MVP: ranked list for 4–10 ── */}
      {!isMvp && rest.length > 0 && (
        <div className="border-4 border-slate-700 bg-slate-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700">
            <span className="font-fredoka text-xs font-black uppercase tracking-widest text-slate-400">
              Rankings
            </span>
          </div>
          {rest.map((player, i) => (
            <RankedRow
              key={player.player_id}
              rank={i + 4}
              player={player}
              primaryField={tabConfig.field}
              primaryUnit={tabConfig.unit}
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 py-10">
          <span className="text-3xl">{tabConfig.emoji}</span>
          <p className="font-fredoka text-sm font-black text-slate-500 uppercase tracking-wider">
            No {tabConfig.label} stats yet
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

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
      const { data: tData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (tData) setTournament(tData);

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
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b-4 border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="shrink-0 w-10 h-10 flex items-center justify-center border-2 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white transition-all"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-fredoka text-lg sm:text-xl font-black uppercase tracking-wider text-white truncate">
            {tournament.name}
          </h1>
        </div>
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
          <LeaderboardPanel tournamentId={id} />
        )}
      </main>
    </div>
  );
}
