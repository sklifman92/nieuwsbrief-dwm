-- Analytics schema voor De Energiebalans
-- Voer uit in Supabase > SQL Editor
-- Veilig om meerdere keren uit te voeren (IF NOT EXISTS / CREATE OR REPLACE)

-- ─── Tabel: paginabezoeken ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pageview (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id   TEXT        NOT NULL,
  sessie_id   TEXT        NOT NULL,

  -- Wat werd bekeken
  pagina      TEXT        NOT NULL CHECK (pagina IN ('week', 'bibliotheek', 'bronnen')),
  editie_id   TEXT,
  artikel_id  TEXT,

  -- Locatie (afgeleid van IP via Vercel geo, IP zelf wordt niet opgeslagen)
  land        TEXT,
  regio       TEXT,
  stad        TEXT,

  -- Herkomst en apparaat
  referrer    TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobiel', 'tablet', 'onbekend')),

  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pageview_created_at_idx  ON pageview (created_at DESC);
CREATE INDEX IF NOT EXISTS pageview_device_id_idx   ON pageview (device_id);
CREATE INDEX IF NOT EXISTS pageview_editie_id_idx   ON pageview (editie_id)  WHERE editie_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS pageview_artikel_id_idx  ON pageview (artikel_id) WHERE artikel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pageview_stad_idx        ON pageview (stad)       WHERE stad        IS NOT NULL;
CREATE INDEX IF NOT EXISTS pageview_regio_idx       ON pageview (regio)      WHERE regio       IS NOT NULL;

-- ─── Tabel: leestijd per artikel ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artikel_leestijd (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id   TEXT        NOT NULL,
  sessie_id   TEXT        NOT NULL,
  artikel_id  TEXT        NOT NULL,
  editie_id   TEXT        NOT NULL,
  seconden    INTEGER     NOT NULL CHECK (seconden BETWEEN 3 AND 3600),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leestijd_artikel_id_idx ON artikel_leestijd (artikel_id);
CREATE INDEX IF NOT EXISTS leestijd_editie_id_idx  ON artikel_leestijd (editie_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE pageview         ENABLE ROW LEVEL SECURITY;
ALTER TABLE artikel_leestijd ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pageview' AND policyname = 'Anoniem mag pageview insturen'
  ) THEN
    CREATE POLICY "Anoniem mag pageview insturen"
      ON pageview FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'artikel_leestijd' AND policyname = 'Anoniem mag leestijd insturen'
  ) THEN
    CREATE POLICY "Anoniem mag leestijd insturen"
      ON artikel_leestijd FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- ─── Views voor analyse ───────────────────────────────────────────────────────

CREATE OR REPLACE VIEW stats_per_dag AS
  SELECT
    DATE(created_at AT TIME ZONE 'Europe/Amsterdam') AS dag,
    COUNT(DISTINCT device_id)   AS unieke_bezoekers,
    COUNT(DISTINCT sessie_id)   AS sessies,
    COUNT(*)                    AS pageviews
  FROM pageview
  GROUP BY dag
  ORDER BY dag DESC;

CREATE OR REPLACE VIEW stats_per_week AS
  SELECT
    DATE_TRUNC('week', created_at AT TIME ZONE 'Europe/Amsterdam')::DATE AS week_start,
    COUNT(DISTINCT device_id)   AS unieke_bezoekers,
    COUNT(DISTINCT sessie_id)   AS sessies,
    COUNT(*)                    AS pageviews
  FROM pageview
  GROUP BY week_start
  ORDER BY week_start DESC;

CREATE OR REPLACE VIEW top_steden AS
  SELECT
    regio,
    stad,
    COUNT(DISTINCT device_id)  AS unieke_bezoekers,
    COUNT(*)                   AS pageviews
  FROM pageview
  WHERE stad IS NOT NULL
  GROUP BY regio, stad
  ORDER BY unieke_bezoekers DESC
  LIMIT 50;

CREATE OR REPLACE VIEW top_regioos AS
  SELECT
    regio,
    COUNT(DISTINCT device_id)  AS unieke_bezoekers,
    COUNT(*)                   AS pageviews
  FROM pageview
  WHERE regio IS NOT NULL
  GROUP BY regio
  ORDER BY unieke_bezoekers DESC;

CREATE OR REPLACE VIEW top_artikelen AS
  SELECT
    p.artikel_id,
    p.editie_id,
    COUNT(DISTINCT p.device_id)  AS unieke_lezers,
    COUNT(*)                     AS opens,
    ROUND(AVG(l.seconden))       AS gem_leestijd_sec,
    COUNT(l.id)                  AS met_leestijd
  FROM pageview p
  LEFT JOIN artikel_leestijd l
    ON l.artikel_id = p.artikel_id AND l.device_id = p.device_id
  WHERE p.artikel_id IS NOT NULL
  GROUP BY p.artikel_id, p.editie_id
  ORDER BY unieke_lezers DESC;

CREATE OR REPLACE VIEW stats_per_editie AS
  SELECT
    editie_id,
    COUNT(DISTINCT device_id)  AS unieke_bezoekers,
    COUNT(*)                   AS pageviews,
    COUNT(artikel_id)          AS artikel_opens,
    COUNT(DISTINCT sessie_id)  AS sessies
  FROM pageview
  WHERE editie_id IS NOT NULL
  GROUP BY editie_id
  ORDER BY editie_id DESC;

CREATE OR REPLACE VIEW terugkerende_bezoekers AS
  SELECT
    COUNT(*) FILTER (WHERE sessie_count = 1)  AS eenmalig,
    COUNT(*) FILTER (WHERE sessie_count > 1)  AS terugkerend,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE sessie_count > 1)
      / NULLIF(COUNT(*), 0), 1
    ) AS pct_terugkerend
  FROM (
    SELECT device_id, COUNT(DISTINCT sessie_id) AS sessie_count
    FROM pageview
    GROUP BY device_id
  ) sub;

CREATE OR REPLACE VIEW stats_device_type AS
  SELECT
    device_type,
    COUNT(DISTINCT device_id)  AS unieke_bezoekers,
    COUNT(*)                   AS pageviews
  FROM pageview
  GROUP BY device_type
  ORDER BY pageviews DESC;
