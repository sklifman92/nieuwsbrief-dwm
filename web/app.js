(async function () {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const errorEl = document.getElementById('error');

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function pijlerLabel(p) {
    const map = {
      'research': 'Onderzoek', 'projecten': 'Projecten', 'smart-grid': 'Smart Grid',
      'ZLT': 'ZLT', 'subsidies': 'Subsidies', 'beleid-NL': 'Beleid NL',
      'beleid-HT-MT': 'Beleid HT/MT', 'netcongestie': 'Netcongestie',
      'technologie-product': 'Technologie', 'technologie-systeem': 'Systemen',
    };
    return map[p] || p;
  }

  function imgOrPlaceholder(url, cls, alt) {
    if (url) {
      return `<img src="${url}" alt="${alt || ''}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'${cls}-placeholder\\'>♨</div>'" />`;
    }
    return `<div class="${cls}-placeholder">♨</div>`;
  }

  function openModal(article) {
    const bron = article.bronnen?.[0] || {};
    document.getElementById('modal-img').src = bron.img_url || '';
    document.getElementById('modal-img').alt = article.titel;
    document.getElementById('modal-img').style.display = bron.img_url ? '' : 'none';
    document.getElementById('modal-categorie').textContent = article.categorie;
    document.getElementById('modal-titel').textContent = article.titel;
    document.getElementById('modal-lead').textContent = article.lead;

    const bodyEl = document.getElementById('modal-text');
    bodyEl.innerHTML = (article.body || '').split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

    const pijlersEl = document.getElementById('modal-pijlers');
    pijlersEl.innerHTML = (article.pijlers || []).map(p => `<span class="pijler-tag">${pijlerLabel(p)}</span>`).join('');

    const bronnenEl = document.getElementById('modal-bronnen');
    if (article.bronnen?.length) {
      bronnenEl.innerHTML = `<h4>Bronnen</h4>` + article.bronnen.map(b =>
        `<a href="${b.url}" target="_blank" rel="noopener" class="bron-link">
          <span class="bron-link-icon">↗</span>
          <span>${b.naam} — ${formatDate(b.datum_publicatie)}</span>
        </a>`
      ).join('');
    } else {
      bronnenEl.innerHTML = '';
    }

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

  try {
    const indexRes = await fetch('data/edities/index.json');
    if (!indexRes.ok) throw new Error('index niet gevonden');
    const index = await indexRes.json();
    const latestId = index.latest;

    const editieRes = await fetch(`data/edities/${latestId}/editie.json`);
    if (!editieRes.ok) throw new Error('editie niet gevonden');
    const editie = await editieRes.json();

    // Badge
    document.getElementById('editie-badge').textContent = `Week ${editie.weeknummer} · ${formatDate(editie.datum_publicatie)}`;
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
        <div class="hero-card" data-id="${hero.id}">
          <div class="hero-img-wrap">
            ${imgOrPlaceholder(heroBron.img_url, 'hero-img', hero.titel)}
            <span class="hero-badge">Uitgelicht</span>
          </div>
          <div class="hero-body">
            <span class="categorie-tag">${hero.categorie}</span>
            <h2>${hero.titel}</h2>
            <p class="lead">${hero.lead}</p>
            <div class="pijler-list">${(hero.pijlers || []).map(p => `<span class="pijler-tag">${pijlerLabel(p)}</span>`).join('')}</div>
            <span class="read-more">Lees meer</span>
          </div>
        </div>
      `;
      heroSection.querySelector('.hero-card').addEventListener('click', () => openModal(hero));
    }

    // Group by category
    const categories = {};
    rest.forEach(a => {
      if (!categories[a.categorie]) categories[a.categorie] = [];
      categories[a.categorie].push(a);
    });

    const catSection = document.getElementById('categories-section');
    Object.entries(categories).forEach(([cat, arts]) => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.innerHTML = `<h3>${cat}</h3><div class="articles-grid"></div>`;
      const grid = block.querySelector('.articles-grid');

      arts.forEach(a => {
        const bron = a.bronnen?.[0] || {};
        const card = document.createElement('div');
        card.className = 'article-card';
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
          </div>
        `;
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
