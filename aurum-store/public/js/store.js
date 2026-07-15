'use strict';

(async () => {
  let allProducts = [];
  let activeCategory = '';
  let searchQuery = '';

  const grid = document.getElementById('produtosGrid');
  const emptyState = document.getElementById('emptyState');
  const sectionTitle = document.getElementById('sectionTitle');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const heroSection = document.getElementById('heroSection');

  // ── Ler URL params ────────────────────────────────────
  const params = new URLSearchParams(location.search);
  activeCategory = params.get('category') || '';
  searchQuery = params.get('q') || '';

  // Se há categoria ou pesquisa, ocultar hero e scroll para produtos
  if (activeCategory || searchQuery) {
    if (heroSection) heroSection.style.display = 'none';
  }

  // Activar tab correcto
  filterTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.cat === activeCategory);
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.cat;
      searchQuery = '';
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const url = activeCategory ? `/?category=${activeCategory}` : '/';
      history.pushState({}, '', url);
      renderProducts();
      updateTitle();
    });
  });

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
    filterTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-cat=""]')?.classList.add('active');
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
    const map = { casacos: 'Casacos', camisolas: 'Camisolas', camisas: 'Camisas', tshirts: 'T-Shirts', calcas: 'Calças', vestidos: 'Vestidos', saias: 'Saias' };
    return map[cat] || cat;
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
