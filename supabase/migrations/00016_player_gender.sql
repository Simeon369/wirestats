-- Add gender column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS gender TEXT;

-- Set default gender for all existing players to 'Male'
UPDATE players SET gender = 'Male' WHERE gender IS NULL;
