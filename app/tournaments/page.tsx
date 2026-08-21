"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

type TournamentRow = {
  id: string;
  name: string;
  status: string;
  format: string;
  created_at: string;
  category: string | null;
  venue: string | null;
  start_date: string | null;
  duration_days: number | null;
};

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

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const sorted = [...(data as TournamentRow[])].sort((a, b) => {
          if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
          if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setTournaments(sorted);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className={`${fredoka.variable} ${nunito.variable} min-h-screen bg-slate-900 flex items-center justify-center`}>
        <p className="font-fredoka text-2xl text-slate-400 uppercase tracking-widest animate-pulse">Loading Tournaments...</p>
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

      <main className="flex flex-col flex-1 px-3 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto w-full gap-6">
        <div className="flex items-end justify-between">
          <h2 className="font-fredoka text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">
            All Tournaments <span className="text-slate-600 text-base font-black">({tournaments.length})</span>
          </h2>
        </div>

        {tournaments.length === 0 ? (
          <div className="border-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 py-20">
            <span className="text-5xl">🏆</span>
            <p className="font-fredoka text-lg font-black text-slate-500 uppercase tracking-wider">No tournaments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-3 sm:py-4 font-nunito text-xs text-slate-700 font-bold uppercase tracking-widest">
        Powered by WireStats
      </footer>
    </div>
  );
}
