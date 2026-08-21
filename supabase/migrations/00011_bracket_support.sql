-- Migration 00011: Bracket Support

-- Add seed number to tournament_teams for knockout ordering
ALTER TABLE tournament_teams
ADD COLUMN IF NOT EXISTS seed INT DEFAULT 0;

-- Add bracket tracking fields to games
ALTER TABLE games
ADD COLUMN IF NOT EXISTS winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS next_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS winner_slot TEXT CHECK (winner_slot IN ('A', 'B')),
ADD COLUMN IF NOT EXISTS bracket_round INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bracket_position INT DEFAULT 0;
