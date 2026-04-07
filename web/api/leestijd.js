const UUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ARTIKEL_RE = /^[A-Za-z0-9\-_]{3,40}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Serverconfiguratie onvolledig' });
  }

  const { device_id, sessie_id, artikel_id, editie_id, seconden } = req.body ?? {};

  if (
    !UUID_RE.test(device_id ?? '') ||
    !UUID_RE.test(sessie_id ?? '') ||
    !ARTIKEL_RE.test(artikel_id ?? '') ||
    !ARTIKEL_RE.test(editie_id ?? '') ||
    typeof seconden !== 'number' ||
    seconden < 3 ||
    seconden > 3600
  ) {
    return res.status(400).json({ error: 'Ongeldige invoer' });
  }

  let response;
  try {
    response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/artikel_leestijd`, {
      method: 'POST',
      headers: {
        apikey:         process.env.SUPABASE_ANON_KEY,
        Authorization:  `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify({ device_id, sessie_id, artikel_id, editie_id, seconden: Math.round(seconden) }),
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
