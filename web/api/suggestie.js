const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Ontbrekende omgevingsvariabelen: SUPABASE_URL of SUPABASE_ANON_KEY');
    return res.status(500).json({ error: 'Serverconfiguratie onvolledig' });
  }

  const { device_id, tekst } = req.body ?? {};

  if (
    !UUID_RE.test(device_id ?? '') ||
    typeof tekst !== 'string' ||
    tekst.trim().length < 3 ||
    tekst.trim().length > 500
  ) {
    return res.status(400).json({ error: 'Ongeldige invoer' });
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1/onderwerp_suggestie`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_id, tekst: tekst.trim() }),
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
