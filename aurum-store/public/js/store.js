'use strict';

(async () => {
  let allProducts = [];
  let categorias = []; // [{ nome, slug }] — vindo de /api/categories
  let activeCategory = '';
  let searchQuery = '';

  const grid = document.getElementById('produtosGrid');
  const emptyState = document.getElementById('emptyState');
  const sectionTitle = document.getElementById('sectionTitle');
  const filterTabsContainer = document.getElementById('filterTabs');
  const headerNavLeft = document.querySelector('.header-nav-left');
  const heroSection = document.getElementById('heroSection');

  // ── Ler URL params ────────────────────────────────────
  const params = new URLSearchParams(location.search);
  activeCategory = params.get('category') || '';
  searchQuery = params.get('q') || '';

  // Se há categoria ou pesquisa, ocultar hero e scroll para produtos
  if (activeCategory || searchQuery) {
    if (heroSection) heroSection.style.display = 'none';
  }

  // ── Carregar categorias reais (admin → loja, em tempo real) ──────────
  try {
    const resCat = await fetch('/api/categories');
    categorias = await resCat.json();
  } catch {
    categorias = []; // sem categorias, mostra só "Tudo"
  }

  function renderFilterTabs() {
    if (!filterTabsContainer) return;
    filterTabsContainer.innerHTML = `
      <button class="filter-tab${activeCategory === '' ? ' active' : ''}" data-cat="">Tudo</button>
      ${categorias.map(c => `
        <button class="filter-tab${activeCategory === c.slug ? ' active' : ''}" data-cat="${c.slug}">${c.nome}</button>
      `).join('')}
    `;
    filterTabsContainer.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.cat;
        searchQuery = '';
        filterTabsContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const url = activeCategory ? `/?category=${activeCategory}` : '/';
        history.pushState({}, '', url);
        renderProducts();
        updateTitle();
      });
    });
  }

  function renderHeaderNav() {
    if (headerNavLeft) {
      // Mostra até 4 categorias no menu principal (mantém o cabeçalho limpo);
      // o resto continua acessível através dos separadores por baixo do hero.
      headerNavLeft.innerHTML = categorias.slice(0, 4).map(c => `
        <a href="/?category=${c.slug}">${c.nome}</a>
      `).join('');
    }
    const footerCategorias = document.getElementById('footerCategorias');
    if (footerCategorias) {
      footerCategorias.innerHTML = categorias.slice(0, 4).map(c => `
        <a href="/?category=${c.slug}">${c.nome}</a>
      `).join('');
    }
  }

  renderFilterTabs();
  renderHeaderNav();

  // ── Carregar produtos ─────────────────────────────────
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
  } catch {
    grid.innerHTML = '<p style="color:var(--stone);padding:20px">Erro ao carregar produtos.</p>';
    return;
  }

  // ── Search ────────────────────────────────────────────
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');

  searchToggle?.addEventListener('click', () => {
    searchBar.classList.toggle('open');
    if (searchBar.classList.contains('open')) {
      setTimeout(() => searchInput.focus(), 100);
    }
  });
  searchClose?.addEventListener('click', () => {
    searchBar.classList.remove('open');
    searchQuery = '';
    searchInput.value = '';
    renderProducts();
  });
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    activeCategory = '';
    filterTabsContainer?.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    filterTabsContainer?.querySelector('[data-cat=""]')?.classList.add('active');
    renderProducts();
    updateTitle();
  });

  // ── Render ────────────────────────────────────────────
  function getFiltered() {
    return allProducts.filter(p => {
      const matchCat = !activeCategory || p.categoria === activeCategory;
      const matchQ = !searchQuery
        || p.nome.toLowerCase().includes(searchQuery.toLowerCase())
        || (p.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });
  }

  function fmt(v) {
    return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  }

  function getCatEmoji(p) {
    const cat = (p.categoria || '').toLowerCase();
    const nome = (p.nome || '').toLowerCase();
    if (cat === 'casacos' || nome.includes('trench') || nome.includes('blazer')) return '🧥';
    if (cat === 'camisolas' || cat === 'hoodies') return '🧶';
    if (cat === 'camisas') return '👔';
    if (cat === 'calcas' || cat === 'jeans') return '👖';
    if (cat === 'vestidos') return '👗';
    if (cat === 'saias') return '🩱';
    if (cat === 'tshirts') return '👕';
    return '👕';
  }

  function catLabel(cat) {
    return categorias.find(c => c.slug === cat)?.nome || cat;
  }

  function renderProducts() {
    const filtered = getFiltered();

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = '';
      return;
    }
    emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(p => {
      const preco = p.preco_promocional ? fmt(p.preco_promocional) : fmt(p.preco);
      const isPromo = !!p.preco_promocional;
      const esgotado = p.stock === 0;
      const emoji = getCatEmoji(p);

      return `
        <article class="produto-card" onclick="location.href='/product.html?id=${p.id}'">
          <div class="card-img-outer">
            <div class="card-img-wrap">
              ${p.imagem
                ? `<img src="${p.imagem}" alt="${p.nome}" loading="lazy">`
                : `<div class="card-placeholder">${emoji}</div>`}
            </div>
            ${esgotado ? '<span class="card-badge">Esgotado</span>' : ''}
            ${isPromo && !esgotado ? '<span class="card-badge promo">Promoção</span>' : ''}
          </div>
          <div class="card-body">
            <div class="card-cat">${catLabel(p.categoria)}</div>
            <h3 class="card-nome">${p.nome}</h3>
            <div class="card-preco-wrap">
              <span class="card-preco ${isPromo ? 'promocional' : ''}">${preco}</span>
              ${isPromo ? `<span class="card-preco-riscado">${fmt(p.preco)}</span>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function updateTitle() {
    if (searchQuery) {
      sectionTitle.textContent = `Resultados para "${searchQuery}"`;
    } else if (activeCategory) {
      sectionTitle.textContent = catLabel(activeCategory);
    } else {
      sectionTitle.textContent = 'Todos os artigos';
    }
  }

  // ── Init ──────────────────────────────────────────────
  if (searchQuery && searchInput) searchInput.value = searchQuery;
  updateTitle();
  renderProducts();
})();
