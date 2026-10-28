-- Additive: owner-controlled verified badge for user accounts.
ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
