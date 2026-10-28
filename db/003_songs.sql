-- Phase 2: user song uploads (additive).
ALTER TABLE songs ADD COLUMN language TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE songs ADD COLUMN lyrics TEXT NOT NULL DEFAULT '';
ALTER TABLE songs ADD COLUMN audio_type TEXT;
ALTER TABLE songs ADD COLUMN audio_size INTEGER;
ALTER TABLE songs ADD COLUMN cover_type TEXT;
ALTER TABLE songs ADD COLUMN declaration TEXT;
ALTER TABLE songs ADD COLUMN declared_at INTEGER;
ALTER TABLE songs ADD COLUMN ip_hash TEXT;
ALTER TABLE songs ADD COLUMN reject_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status, created_at);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
