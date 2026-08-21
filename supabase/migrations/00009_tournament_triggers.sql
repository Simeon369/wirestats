-- Migration 00009: Tournament Triggers and Game Team Linking

-- 2. Trigger function to update tournament standings when a game finishes
CREATE OR REPLACE FUNCTION update_tournament_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the game is attached to a tournament and just finished
  IF NEW.tournament_id IS NOT NULL AND NEW.status = 'finished' AND OLD.status != 'finished' THEN
    
    -- Update Team A
    IF NEW.team_a_id IS NOT NULL THEN
      UPDATE tournament_teams
      SET 
        wins = wins + (CASE WHEN NEW.score_a > NEW.score_b THEN 1 ELSE 0 END),
        losses = losses + (CASE WHEN NEW.score_a < NEW.score_b THEN 1 ELSE 0 END),
        points_for = points_for + NEW.score_a,
        points_against = points_against + NEW.score_b,
        point_differential = point_differential + (NEW.score_a - NEW.score_b)
      WHERE tournament_id = NEW.tournament_id AND team_id = NEW.team_a_id;
    END IF;

    -- Update Team B
    IF NEW.team_b_id IS NOT NULL THEN
      UPDATE tournament_teams
      SET 
        wins = wins + (CASE WHEN NEW.score_b > NEW.score_a THEN 1 ELSE 0 END),
        losses = losses + (CASE WHEN NEW.score_b < NEW.score_a THEN 1 ELSE 0 END),
        points_for = points_for + NEW.score_b,
        points_against = points_against + NEW.score_a,
        point_differential = point_differential + (NEW.score_b - NEW.score_a)
      WHERE tournament_id = NEW.tournament_id AND team_id = NEW.team_b_id;
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tournament_standings ON games;
CREATE TRIGGER trigger_update_tournament_standings
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_tournament_standings();

