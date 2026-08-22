"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import { PlayerStatsSummary } from "@/lib/types";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

// ── Custom Dropdown ─────────────────────────────────────────────
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isFiltered = value !== options[0];

  return (
    <div ref={ref} className="relative flex-1 min-w-[110px]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border-2 font-fredoka text-xs font-black uppercase tracking-widest transition-all ${
          isFiltered
            ? "bg-[#65d421] border-[#1b630a] text-slate-900"
            : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white"
        }`}
      >
        <span>{isFiltered ? value : label}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-0.5 z-50 bg-slate-800 border-2 border-slate-600 shadow-[4px_4px_0_#0f172a] flex flex-col overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-3 py-2 text-left font-fredoka text-xs font-black uppercase tracking-widest transition-colors ${
                value === opt
                  ? "bg-[#65d421] text-slate-900"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {opt === options[0] ? `All ${label}s` : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, index }: { player: PlayerStatsSummary, index: number }) {
  return (
    <Link href={`/players/${player.player_id}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-2 border-slate-700 hover:border-slate-500 transition-colors group cursor-pointer">
        <span className="font-fredoka text-sm font-black text-slate-600 w-5 shrink-0 text-right">
          {index + 1}
        </span>
        <span className="font-fredoka text-xs font-black px-2 py-1 bg-slate-700 text-slate-300 border border-slate-600 shrink-0 w-9 text-center">
          {player.position}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-fredoka text-base sm:text-lg font-black text-white truncate block group-hover:text-[#65d421] transition-colors">{player.full_name}</span>
          {player.gender && (
            <span className="font-nunito text-[10px] font-bold px-1.5 py-0.5 bg-slate-700 text-slate-300 border border-slate-600 uppercase tracking-widest shrink-0">
              {player.gender}
            </span>
          )}
        </div>
        <span className="font-nunito text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0 hidden sm:block pr-2">
          {player.jersey_name}
        </span>
        <div className="text-slate-500 group-hover:text-[#65d421] transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

const POSITIONS = ["ALL", "PG", "SG", "SF", "PF", "C"];
const GENDERS = ["ALL", "Male", "Female", "Other"];

export default function PublicPlayersDirectory() {
  const [players, setPlayers] = useState<PlayerStatsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");

  useEffect(() => {
    async function loadPlayers() {
      if (!supabase) return;
      const { data } = await supabase
        .from("player_stats_summary")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setPlayers(data as PlayerStatsSummary[]);
      setLoading(false);
    }
    loadPlayers();
  }, []);

  const isSearching = search.trim().length > 0 || filterPos !== "ALL" || filterGender !== "ALL";

  const filteredPlayers = players.filter(p => {
    const matchSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.jersey_name.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos === "ALL" || p.position === filterPos;
    const matchGender = filterGender === "ALL" || p.gender === filterGender;
    return matchSearch && matchPos && matchGender;
  });

  const displayedPlayers = isSearching ? filteredPlayers : filteredPlayers.slice(0, 5);

  return (
    <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex flex-col`}>
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

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-4 sm:py-8 max-w-3xl mx-auto w-full gap-5 sm:gap-8">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h2 className="font-fredoka text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">
            Player Directory
          </h2>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search to see all results…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-600 focus:border-[#65d421] outline-none text-white font-nunito font-bold px-3 py-2.5 text-sm placeholder:text-slate-600 transition-colors"
            />
            <div className="flex gap-2">
              <FilterDropdown label="Position" options={POSITIONS} value={filterPos} onChange={setFilterPos} />
              <FilterDropdown label="Gender" options={GENDERS} value={filterGender} onChange={setFilterGender} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isSearching && (
            <p className="font-nunito text-xs font-bold text-slate-500 uppercase tracking-widest">
              {filteredPlayers.length} result{filteredPlayers.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <p className="font-fredoka text-2xl sm:text-3xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Players...</p>
              </div>
            ) : displayedPlayers.length === 0 ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <p className="font-nunito text-base sm:text-xl text-slate-500 font-bold uppercase tracking-widest">No players found.</p>
              </div>
            ) : (
              displayedPlayers.map((p, i) => (
                <PlayerRow key={p.player_id} player={p} index={i} />
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-3 sm:py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest border-t-4 border-slate-700">
        Powered by WireStats
      </footer>
    </div>
  );
}
