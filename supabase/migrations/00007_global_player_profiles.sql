-- Migration 00007: Global Player Profiles

-- 1. Remove old foreign key constraints from stat_events
ALTER TABLE public.stat_events DROP CONSTRAINT IF EXISTS stat_events_player_id_fkey;
ALTER TABLE public.stat_events DROP CONSTRAINT IF EXISTS stat_events_player_out_id_fkey;

-- 2. Nullify old player IDs to allow adding the new constraint (since we are neglecting old players)
UPDATE public.stat_events SET player_id = NULL, player_out_id = NULL;

-- 3. Drop the old players table
DROP TABLE IF EXISTS public.players CASCADE;

-- 4. Create the new Global Players Table
CREATE TABLE public.players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  jersey_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C'))
);

-- 5. Re-add foreign key constraints to stat_events
ALTER TABLE public.stat_events
ADD CONSTRAINT stat_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE SET NULL;

ALTER TABLE public.stat_events
ADD CONSTRAINT stat_events_player_out_id_fkey FOREIGN KEY (player_out_id) REFERENCES public.players(id) ON DELETE SET NULL;

-- 6. Create Match Roster Junction Table
CREATE TABLE public.game_rosters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  jersey_number INT NOT NULL,
  is_starting_five BOOLEAN DEFAULT false,
  UNIQUE(game_id, player_id),
  UNIQUE(game_id, team, jersey_number)
);

-- 7. Create Consolidated Player Stats View
-- Note: 'match_events' in the spec corresponds to our 'stat_events' table.
CREATE OR REPLACE VIEW public.player_stats_summary AS
SELECT 
  p.id AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  COUNT(DISTINCT gr.game_id) AS games_played,
  COALESCE(SUM(CASE WHEN e.event_type = '2pt' THEN 2 WHEN e.event_type = '3pt' THEN 3 WHEN e.event_type = 'ft' THEN 1 ELSE 0 END), 0) AS total_points,
  COALESCE(SUM(CASE WHEN e.event_type = '3pt' THEN 1 ELSE 0 END), 0) AS three_pointers_made,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls
FROM public.players p
LEFT JOIN public.game_rosters gr ON p.id = gr.player_id
LEFT JOIN public.stat_events e ON gr.game_id = e.game_id AND gr.player_id = e.player_id
GROUP BY p.id, p.full_name, p.jersey_name, p.position;

-- 8. RLS Policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert on players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Allow public read access on game_rosters" ON public.game_rosters FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_rosters" ON public.game_rosters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_rosters" ON public.game_rosters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on game_rosters" ON public.game_rosters FOR DELETE USING (true);

-- Enable Supabase Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rosters;
