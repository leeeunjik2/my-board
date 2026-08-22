CREATE TABLE IF NOT EXISTS post_reactions (
  post_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, emoji),
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx
  ON post_reactions (post_id);
