const UUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ARTIKEL_RE = /^[A-Za-z0-9\-_]{3,40}$/;
const PAGINAS    = ['week', 'bibliotheek', 'bronnen'];

function deviceType(ua) {
  if (!ua) return 'onbekend';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobiel';
  return 'desktop';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Serverconfiguratie onvolledig' });
  }

  const { device_id, sessie_id, pagina, editie_id, artikel_id } = req.body ?? {};

  if (
    !UUID_RE.test(device_id ?? '') ||
    !UUID_RE.test(sessie_id ?? '') ||
    !PAGINAS.includes(pagina)
  ) {
    return res.status(400).json({ error: 'Ongeldige invoer' });
  }

  if (editie_id  && !ARTIKEL_RE.test(editie_id))  return res.status(400).json({ error: 'Ongeldige editie_id' });
  if (artikel_id && !ARTIKEL_RE.test(artikel_id)) return res.status(400).json({ error: 'Ongeldige artikel_id' });

  // Vercel injecteert geo-headers automatisch
  const land  = req.headers['x-vercel-ip-country']      || null;
  const regio = req.headers['x-vercel-ip-country-region'] || null;
  const stad  = req.headers['x-vercel-ip-city']         || null;

  const referrer = (req.headers['referer'] || '').slice(0, 500) || null;
  const ua       = req.headers['user-agent'] || '';

  const record = {
    device_id,
    sessie_id,
    pagina,
    editie_id:   editie_id  || null,
    artikel_id:  artikel_id || null,
    land,
    regio,
    stad,
    referrer,
    device_type: deviceType(ua),
  };

  let response;
  try {
    response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/pageview`, {
      method: 'POST',
      headers: {
        apikey:         process.env.SUPABASE_ANON_KEY,
        Authorization:  `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify(record),
    });
  } catch (err) {
    console.error('Supabase fetch fout:', err);
    return res.status(502).json({ error: 'Database niet bereikbaar' });
  }

  if (!response.ok) {
    const text = await response.text();
    console.error('Supabase fout:', response.status, text);
    return res.status(500).json({ error: 'Opslaan mislukt' });
  }

  return res.status(200).json({ ok: true });
}
