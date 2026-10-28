ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS otp_codes (
  ticket_hash TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,           -- verify | login | reset
  email TEXT NOT NULL COLLATE NOCASE,
  user_id INTEGER,                 -- NULL for reset tickets of unknown emails (anti-enumeration)
  code_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
