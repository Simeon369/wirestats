-- Migration: Initial Schema for WireStats
-- Tables: games, players, stat_events

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Games Table
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished'))
);

-- 2. Players Table
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name TEXT,
    jersey_number TEXT NOT NULL,
    team_color TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'bench' CHECK (status IN ('court', 'bench')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Stat Events Table
CREATE TABLE public.stat_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ft', '2pt', '3pt', 'foul', 'toggle_status')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Row Level Security) - optional but recommended
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access during MVP development
CREATE POLICY "Allow public read access on games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public insert on games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert on players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on stat_events" ON public.stat_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stat_events" ON public.stat_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stat_events" ON public.stat_events FOR UPDATE USING (true);

-- Enable Supabase Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stat_events;
