-- Voer dit uit in Supabase > SQL Editor (apart van supabase_setup.sql)

CREATE TABLE onderwerp_suggestie (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id   TEXT        NOT NULL,
  tekst       TEXT        NOT NULL CHECK (char_length(tekst) BETWEEN 3 AND 500),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: anonieme gebruikers mogen alleen INSERT
ALTER TABLE onderwerp_suggestie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen mag een suggestie insturen"
  ON onderwerp_suggestie FOR INSERT TO anon
  WITH CHECK (true);

-- Lees-toegang alleen via service role key (dashboard)
-- Geen SELECT policy voor anon → standaard geblokkeerd
