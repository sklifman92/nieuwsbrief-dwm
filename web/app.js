(async function () {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const errorEl = document.getElementById('error');

  // ── Device ID (anoniem, per apparaat) ──────────────────────────────────────
  function getDeviceId() {
    let id = localStorage.getItem('dwm_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('dwm_device_id', id);
    }
    return id;
  }

  // ── Feedback localStorage ──────────────────────────────────────────────────
  function getSavedFeedback(artikelId) {
    return localStorage.getItem(`dwm_fb_${artikelId}`); // 'ja', 'nee', of null
  }

  function saveFeedbackLocally(artikelId, waarde) {
    localStorage.setItem(`dwm_fb_${artikelId}`, waarde);
  }

  // ── Onderwerp suggestie ────────────────────────────────────────────────────
  const suggestieForm = document.getElementById('suggestie-form');
  const suggestieInput = document.getElementById('suggestie-input');
  const suggestieStatus = document.getElementById('suggestie-status');

  suggestieForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tekst = suggestieInput.value.trim();
    if (tekst.length < 3) return;

    const btn = document.getElementById('suggestie-btn');
    btn.disabled = true;
    btn.textContent = '…';

    try {
      const res = await fetch('/api/suggestie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId(), tekst }),
      });

      if (res.ok) {
        suggestieInput.value = '';
        suggestieStatus.textContent = '✓ Bedankt — jouw suggestie is ontvangen!';
        suggestieStatus.className = 'suggestie-status suggestie-ok';
      } else {
        suggestieStatus.textContent = 'Kon niet opslaan. Probeer opnieuw.';
        suggestieStatus.className = 'suggestie-status suggestie-err';
      }
    } catch {
      suggestieStatus.textContent = 'Geen verbinding. Probeer opnieuw.';
      suggestieStatus.className = 'suggestie-status suggestie-err';
    }

    btn.disabled = false;
    btn.textContent = 'Insturen';
    setTimeout(() => { suggestieStatus.className = 'suggestie-status hidden'; }, 4000);
  });

  // ── Feedback naar API sturen ───────────────────────────────────────────────
  async function submitFeedback(artikelId, editieId, waarde) {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artikel_id: artikelId,
          editie_id: editieId,
          device_id: getDeviceId(),
          waarde: waarde === 'ja',
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Feedback UI renderen ───────────────────────────────────────────────────
  function renderFeedback(artikelId, editieId, container) {
    const bestaand = getSavedFeedback(artikelId);

    if (bestaand) {
      container.innerHTML = `
        <div class="feedback-done">
          <span class="feedback-check">✓</span>
          Jouw feedback: <strong>${bestaand === 'ja' ? 'Waardevol' : 'Niet waardevol'}</strong> — bedankt!
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="feedback-prompt">
        <p class="feedback-question">Was dit artikel waardevol voor je?</p>
        <div class="feedback-buttons">
          <button class="feedback-btn feedback-ja" data-waarde="ja">👍 Ja</button>
          <button class="feedback-btn feedback-nee" data-waarde="nee">👎 Nee</button>
        </div>
        <p class="feedback-privacy">Anoniem — niemand ziet jouw antwoord.</p>
      </div>`;

    container.querySelectorAll('.feedback-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const waarde = btn.dataset.waarde;
        container.querySelectorAll('.feedback-btn').forEach(b => b.disabled = true);
        btn.classList.add('feedback-loading');

        const ok = await submitFeedback(artikelId, editieId, waarde);

        if (ok) {
          saveFeedbackLocally(artikelId, waarde);
          container.innerHTML = `
            <div class="feedback-done">
              <span class="feedback-check">✓</span>
              Jouw feedback: <strong>${waarde === 'ja' ? 'Waardevol' : 'Niet waardevol'}</strong> — bedankt!
            </div>`;
        } else {
          container.innerHTML = `
            <div class="feedback-error">
              Kon feedback niet opslaan. Probeer het opnieuw.
              <button class="feedback-retry">Opnieuw</button>
            </div>`;
          container.querySelector('.feedback-retry')
            .addEventListener('click', () => renderFeedback(artikelId, editieId, container));
        }
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function pijlerLabel(p) {
    const map = {
      research: 'Onderzoek', projecten: 'Projecten', 'smart-grid': 'Smart Grid',
      ZLT: 'ZLT', subsidies: 'Subsidies', 'beleid-NL': 'Beleid NL',
      'beleid-HT-MT': 'Beleid HT/MT', netcongestie: 'Netcongestie',
      'technologie-product': 'Technologie', 'technologie-systeem': 'Systemen',
      'sociaal-domein': 'Sociaal domein',
    };
    return map[p] || p;
  }

  function imgOrPlaceholder(url, cls, alt) {
    if (url) {
      return `<img src="${url}" alt="${alt || ''}" loading="lazy" data-fallback-cls="${cls}" />`;
    }
    return `<div class="${cls}-placeholder">♨</div>`;
  }

  // Voeg onerror-listeners toe aan img-elementen na innerHTML-insertie
  // (inline onerror handlers worden geblokkeerd door de CSP)
  function applyImgFallbacks(container) {
    container.querySelectorAll('img[data-fallback-cls]').forEach(img => {
      img.addEventListener('error', () => {
        const cls = img.dataset.fallbackCls;
        if (img.parentElement) {
          img.parentElement.innerHTML = `<div class="${cls}-placeholder">♨</div>`;
        }
      }, { once: true });
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  let currentEditieId = '';

  function openModal(article) {
    const bron = article.bronnen?.[0] || {};
    const img = document.getElementById('modal-img');
    img.src = bron.img_url || '';
    img.alt = article.titel;
    img.style.display = bron.img_url ? '' : 'none';

    document.getElementById('modal-categorie').textContent = article.categorie;
    document.getElementById('modal-titel').textContent = article.titel;
    document.getElementById('modal-lead').textContent = article.lead;

    document.getElementById('modal-text').innerHTML =
      (article.body || '').split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

    document.getElementById('modal-pijlers').innerHTML =
      (article.pijlers || []).map(p => `<span class="pijler-tag">${pijlerLabel(p)}</span>`).join('');

    const bronnenEl = document.getElementById('modal-bronnen');
    bronnenEl.innerHTML = article.bronnen?.length
      ? `<h4>Bronnen</h4>` + article.bronnen.map(b =>
          `<a href="${b.url}" target="_blank" rel="noopener" class="bron-link">
            <span class="bron-link-icon">↗</span>
            <span>${b.naam} — ${formatDate(b.datum_publicatie)}</span>
          </a>`).join('')
      : '';

    const feedbackEl = document.getElementById('modal-feedback');
    renderFeedback(article.id, currentEditieId, feedbackEl);

    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── Data laden ─────────────────────────────────────────────────────────────
  try {
    const indexRes = await fetch('data/edities/index.json');
    if (!indexRes.ok) throw new Error('index niet gevonden');
    const index = await indexRes.json();
    const latestId = index.latest;
    currentEditieId = latestId;

    const editieRes = await fetch(`data/edities/${latestId}/editie.json`);
    if (!editieRes.ok) throw new Error('editie niet gevonden');
    const editie = await editieRes.json();

    document.getElementById('editie-badge').textContent =
      `Week ${editie.weeknummer} · ${formatDate(editie.datum_publicatie)}`;
    document.getElementById('footer-week').textContent = `${editie.weeknummer} · ${editie.jaar}`;
    document.title = `DWM Nieuwsbrief — Week ${editie.weeknummer}`;

    // Highlights
    const highlightsList = document.getElementById('highlights-list');
    (editie.highlights || []).forEach(h => {
      const li = document.createElement('li');
      li.textContent = h;
      highlightsList.appendChild(li);
    });

    const artikelen = editie.artikelen || [];
    const hero = artikelen.find(a => a.is_hero) || artikelen[0];
    const rest = artikelen.filter(a => a !== hero);

    // Hero
    if (hero) {
      const heroBron = hero.bronnen?.[0] || {};
      const heroSection = document.getElementById('hero-section');
      heroSection.innerHTML = `
        <div class="hero-card" tabindex="0" role="button" aria-label="${hero.titel}">
          <div class="hero-img-wrap">
            ${imgOrPlaceholder(heroBron.img_url, 'hero-img', hero.titel)}
            <span class="hero-badge">Uitgelicht</span>
          </div>
          <div class="hero-body">
            <span class="categorie-tag">${hero.categorie}</span>
            <h2>${hero.titel}</h2>
            <p class="lead">${hero.lead}</p>
            <div class="pijler-list">
              ${(hero.pijlers || []).map(p => `<span class="pijler-tag">${pijlerLabel(p)}</span>`).join('')}
            </div>
            <span class="read-more">Lees meer</span>
          </div>
        </div>`;
      applyImgFallbacks(heroSection);
      heroSection.querySelector('.hero-card').addEventListener('click', () => openModal(hero));
    }

    // Categorieën
    const categories = {};
    rest.forEach(a => {
      if (!categories[a.categorie]) categories[a.categorie] = [];
      categories[a.categorie].push(a);
    });

    const categoryPriority = new Map([
      ['Sociaal domein & bewoners', 0],
    ]);

    const catSection = document.getElementById('categories-section');
    Object.entries(categories)
      .sort(([a], [b]) => {
        const aIndex = categoryPriority.get(a) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = categoryPriority.get(b) ?? Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      })
      .forEach(([cat, arts]) => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.innerHTML = `<h3>${cat}</h3><div class="articles-grid"></div>`;
      const grid = block.querySelector('.articles-grid');

      arts.forEach(a => {
        const bron = a.bronnen?.[0] || {};
        const card = document.createElement('div');
        card.className = 'article-card';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="card-img-wrap">
            ${imgOrPlaceholder(bron.img_url, 'card-img', a.titel)}
          </div>
          <div class="card-body">
            <h4>${a.titel}</h4>
            <p class="lead">${a.lead}</p>
          </div>
          <div class="card-footer">
            <span class="card-bron">${bron.naam || ''}</span>
            <span class="card-datum">${formatDate(bron.datum_publicatie)}</span>
          </div>`;
        applyImgFallbacks(card);
        card.addEventListener('click', () => openModal(a));
        grid.appendChild(card);
      });

      catSection.appendChild(block);
    });

    loading.classList.add('hidden');
    content.classList.remove('hidden');

  } catch (err) {
    console.error(err);
    loading.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
})();
