-- Voer dit uit in Supabase > SQL Editor

CREATE TABLE artikel_feedback (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  artikel_id  TEXT        NOT NULL,
  editie_id   TEXT        NOT NULL,
  device_id   TEXT        NOT NULL,
  waarde      BOOLEAN     NOT NULL,   -- true = Ja, false = Nee
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artikel_id, device_id)        -- één stem per artikel per apparaat
);

-- Row Level Security: anonieme gebruikers mogen alleen INSERT
ALTER TABLE artikel_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen mag feedback geven"
  ON artikel_feedback FOR INSERT TO anon
  WITH CHECK (true);

-- Lees-toegang alleen via service role key (dashboard / algoritme)
-- Geen SELECT policy voor anon → standaard geblokkeerd
