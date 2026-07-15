'use strict';

(async () => {
  const params = new URLSearchParams(location.search);
  const produtoId = params.get('id');
  const skeleton = document.getElementById('produtoSkeleton');
  const conteudo = document.getElementById('produtoConteudo');
  const erro = document.getElementById('produtoErro');

  if (!produtoId) {
    skeleton.style.display = 'none';
    erro.style.display = '';
    return;
  }

  let produto;
  try {
    const res = await fetch(`/api/products/${produtoId}`);
    if (!res.ok) throw new Error();
    produto = await res.json();
  } catch {
    skeleton.style.display = 'none';
    erro.style.display = '';
    return;
  }

  // ── Preencher página ──────────────────────────────────
  document.title = `${produto.nome} — AURUM`;

  // Breadcrumb
  const catLabel = { casacos: 'Casacos', camisolas: 'Camisolas', camisas: 'Camisas', tshirts: 'T-Shirts', calcas: 'Calças', vestidos: 'Vestidos', saias: 'Saias' };
  document.getElementById('breadcrumbCat').textContent = catLabel[produto.categoria] || 'Colecção';
  document.getElementById('breadcrumbCat').href = `/?category=${produto.categoria}`;
  document.getElementById('breadcrumbNome').textContent = produto.nome;

  // Categoria
  document.getElementById('produtoCategoria').textContent = catLabel[produto.categoria] || produto.categoria || '';

  // Nome
  document.getElementById('produtoNome').textContent = produto.nome;

  // Preço
  const precoEl = document.getElementById('produtoPreco');
  const precoOrigEl = document.getElementById('produtoPrecoOriginal');
  const badgePromo = document.getElementById('badgePromo');
  const fmt = v => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  if (produto.preco_promocional) {
    precoEl.textContent = fmt(produto.preco_promocional);
    precoEl.classList.add('em-promo');
    precoOrigEl.textContent = fmt(produto.preco);
    precoOrigEl.style.display = '';
    badgePromo.style.display = '';
  } else {
    precoEl.textContent = fmt(produto.preco);
  }

  // Descrição curta
  document.getElementById('produtoDescricao').textContent = produto.descricao || '';

  // Descrição longa
  const descLongaEl = document.getElementById('descricaoLonga');
  descLongaEl.textContent = produto.descricao_longa || produto.descricao || 'Sem descrição detalhada disponível.';

  // Material
  if (produto.material) {
    document.getElementById('materialItem').style.display = '';
    document.getElementById('materialContent').textContent = produto.material;
  }
  if (produto.instrucoes_lavagem) {
    document.getElementById('lavagemItem').style.display = '';
    document.getElementById('lavagemContent').textContent = produto.instrucoes_lavagem;
  }

  // ── Galeria / Carrossel ───────────────────────────────
  const galeriaMain = document.getElementById('galeriaMain');
  const galeriaImg = document.getElementById('galeriaImg');
  const galeriaPlaceholder = document.getElementById('galeriaPlaceholder');
  const galeriaThumbs = document.getElementById('galeriaThumbs');
  const galeriaPrev = document.getElementById('galeriaPrev');
  const galeriaNext = document.getElementById('galeriaNext');
  const placeholderEmoji = document.getElementById('placeholderEmoji');

  // Emoji de fallback
  const emojiMap = { casacos: '🧥', camisolas: '🧶', camisas: '👔', calcas: '👖', vestidos: '👗', saias: '🩱', tshirts: '👕' };
  placeholderEmoji.textContent = emojiMap[produto.categoria] || '👕';

  const allImages = [produto.imagem, ...(produto.imagens_extra || [])].filter(Boolean);
  let indiceAtual = 0;

  function atualizarThumbAtiva() {
    galeriaThumbs.querySelectorAll('.galeria-thumb').forEach((t, i) => t.classList.toggle('active', i === indiceAtual));
  }

  function irParaImagem(indice, { instantaneo = false } = {}) {
    if (!allImages.length) return;
    indiceAtual = (indice + allImages.length) % allImages.length;
    const url = allImages[indiceAtual];

    // Transição suave (fade) em vez de troca instantânea — substitui o efeito
    // "brusco" anterior por um crossfade rápido e consistente.
    const trocar = () => {
      galeriaImg.src = url;
      galeriaImg.alt = `${produto.nome} — imagem ${indiceAtual + 1}`;
      galeriaImg.style.display = '';
      galeriaPlaceholder.style.display = 'none';
      requestAnimationFrame(() => { galeriaImg.style.opacity = '1'; });
    };

    if (instantaneo) {
      galeriaImg.style.transition = 'none';
      trocar();
    } else {
      galeriaImg.style.transition = 'opacity 0.25s ease';
      galeriaImg.style.opacity = '0';
      setTimeout(trocar, 120);
    }

    atualizarThumbAtiva();
  }

  if (allImages.length > 0) {
    irParaImagem(0, { instantaneo: true });

    galeriaThumbs.innerHTML = allImages.map((img, i) => `
      <div class="galeria-thumb ${i === 0 ? 'active' : ''}" data-indice="${i}">
        <img src="${img}" alt="${produto.nome} - imagem ${i + 1}" loading="lazy">
      </div>
    `).join('');

    galeriaThumbs.querySelectorAll('.galeria-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => irParaImagem(Number(thumb.dataset.indice)));
    });

    // Setas — só fazem sentido com mais de uma imagem
    if (allImages.length > 1) {
      galeriaPrev.style.display = '';
      galeriaNext.style.display = '';
      galeriaPrev.addEventListener('click', () => irParaImagem(indiceAtual - 1));
      galeriaNext.addEventListener('click', () => irParaImagem(indiceAtual + 1));

      // Navegação por teclado quando a galeria está focada
      galeriaMain.setAttribute('tabindex', '0');
      galeriaMain.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') irParaImagem(indiceAtual - 1);
        if (e.key === 'ArrowRight') irParaImagem(indiceAtual + 1);
      });

      // Swipe táctil (telemóvel)
      let toqueInicioX = null;
      galeriaMain.addEventListener('touchstart', (e) => { toqueInicioX = e.touches[0].clientX; }, { passive: true });
      galeriaMain.addEventListener('touchend', (e) => {
        if (toqueInicioX === null) return;
        const delta = e.changedTouches[0].clientX - toqueInicioX;
        if (Math.abs(delta) > 40) irParaImagem(indiceAtual + (delta < 0 ? 1 : -1));
        toqueInicioX = null;
      }, { passive: true });
    }
  } else {
    galeriaPlaceholder.style.display = '';
    galeriaImg.style.display = 'none';
  }

  // ── Cores ─────────────────────────────────────────────
  let corSelecionada = null;
  const coresGrupo = document.getElementById('coresGrupo');
  const coresSwatches = document.getElementById('coresSwatches');
  const corLabel = document.getElementById('corSelecionada');

  const SWATCH_COLORS = {
    'Preto': '#111', 'Branco': '#F8F8F8', 'Navy': '#1a2a4a', 'Azul Marinho': '#1a2a4a',
    'Azul Claro': '#a8c8e8', 'Cinzento': '#888', 'Cinzento Escuro': '#444', 'Cinzento Mesclado': '#aaa',
    'Antracite': '#3a3a3a', 'Camel': '#C19A6B', 'Bege': '#D4C5A9', 'Bege Clássico': '#D4C5A9',
    'Creme': '#F5F0E8', 'Natural': '#F5F0E8', 'Bordeaux': '#6B1A2A', 'Burgundy': '#6B1A2A',
    'Vinho': '#722F37', 'Borgonha': '#722F37', 'Rosa Pálido': '#F4C2C2', 'Sage': '#9DC183',
    'Verde Esmeralda': '#2ecc71', 'Azul Neblina': '#B0C4DE', 'Toupeira': '#8E7D6E',
    'Chocolate': '#5C3317', 'Caqui': '#8B864E', 'Índigo Raw': '#2B3A6E', 'Lavado Médio': '#5A7FA0',
    'Preto Rígido': '#0D0D0D', 'Riscas Navy': '#2a3a6a', 'Bege Fuzzy': '#D4C5A9',
  };

  if (produto.cores && produto.cores.length > 0) {
    coresGrupo.style.display = '';
    coresSwatches.innerHTML = produto.cores.map(cor => {
      const bg = SWATCH_COLORS[cor] || '#cccccc';
      const border = bg === '#F8F8F8' ? 'border:1px solid #ddd' : '';
      return `
        <div class="swatch" style="background:${bg};${border}" data-cor="${cor}" title="${cor}">
          <span class="swatch-label">${cor}</span>
        </div>
      `;
    }).join('');

    coresSwatches.querySelectorAll('.swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        coresSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        corSelecionada = swatch.dataset.cor;
        corLabel.textContent = corSelecionada;
      });
    });

    // Selecionar primeiro automaticamente
    const firstSwatch = coresSwatches.querySelector('.swatch');
    if (firstSwatch) firstSwatch.click();
  }

  // ── Tamanhos ──────────────────────────────────────────
  let tamanhoSelecionado = null;
  const tamanhosGrupo = document.getElementById('tamanhosGrupo');
  const tamanhosLista = document.getElementById('tamanhosLista');
  const tamanhoLabel = document.getElementById('tamanhoSelecionado');

  if (produto.tamanhos && produto.tamanhos.length > 0) {
    tamanhosGrupo.style.display = '';
    tamanhosLista.innerHTML = produto.tamanhos.map(tam => `
      <button class="tam-btn" data-tam="${tam}">${tam}</button>
    `).join('');

    tamanhosLista.querySelectorAll('.tam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tamanhosLista.querySelectorAll('.tam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tamanhoSelecionado = btn.dataset.tam;
        tamanhoLabel.textContent = tamanhoSelecionado;
      });
    });
  }

  // ── Quantidade ────────────────────────────────────────
  let quantidade = 1;
  const stockInfo = document.getElementById('stockInfo');
  const qtyValue = document.getElementById('qtyValue');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const maxQty = Math.min(produto.stock, 10);

  function updateStock() {
    if (produto.stock === 0) {
      stockInfo.textContent = 'Esgotado';
      stockInfo.className = 'stock-info out';
    } else if (produto.stock <= 3) {
      stockInfo.textContent = `Apenas ${produto.stock} em stock`;
      stockInfo.className = 'stock-info low';
    } else {
      stockInfo.textContent = `${produto.stock} em stock`;
      stockInfo.className = 'stock-info';
    }
  }

  qtyMinus?.addEventListener('click', () => {
    if (quantidade > 1) { quantidade--; qtyValue.textContent = quantidade; }
  });
  qtyPlus?.addEventListener('click', () => {
    if (quantidade < maxQty) { quantidade++; qtyValue.textContent = quantidade; }
  });

  updateStock();

  // ── Add to Cart ───────────────────────────────────────
  const addToCartBtn = document.getElementById('addToCartBtn');
  const addFeedback = document.getElementById('addFeedback');

  if (produto.stock === 0) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = 'Esgotado';
  }

  addToCartBtn?.addEventListener('click', () => {
    if (produto.tamanhos?.length > 0 && !tamanhoSelecionado) {
      addFeedback.style.color = 'var(--error)';
      addFeedback.textContent = 'Selecciona um tamanho.';
      return;
    }
    if (produto.cores?.length > 0 && !corSelecionada) {
      addFeedback.style.color = 'var(--error)';
      addFeedback.textContent = 'Selecciona uma cor.';
      return;
    }

    Cart.add(produto, tamanhoSelecionado, corSelecionada, quantidade);
    addFeedback.style.color = 'var(--success)';
    addFeedback.textContent = '✓ Adicionado ao carrinho';
    setTimeout(() => { addFeedback.textContent = ''; }, 3000);
    Cart.openCart();
  });

  // ── Mostrar conteúdo ──────────────────────────────────
  skeleton.style.display = 'none';
  conteudo.style.display = '';

  // ── Produtos relacionados ─────────────────────────────
  try {
    const res = await fetch(`/api/products?category=${produto.categoria}`);
    const rel = (await res.json()).filter(p => p.id !== produto.id).slice(0, 4);
    if (rel.length > 0) {
      const sec = document.getElementById('relacionadosSection');
      const grid = document.getElementById('relacionadosGrid');
      sec.style.display = '';
      const fmt2 = v => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
      const emojiMap2 = { casacos: '🧥', camisolas: '🧶', camisas: '👔', calcas: '👖', vestidos: '👗', saias: '🩱', tshirts: '👕' };
      grid.innerHTML = rel.map(p => `
        <article class="produto-card" onclick="location.href='/product.html?id=${p.id}'">
          <div class="card-img-outer">
            <div class="card-img-wrap">
              ${p.imagem
                ? `<img src="${p.imagem}" alt="${p.nome}" loading="lazy">`
                : `<div class="card-placeholder">${emojiMap2[p.categoria] || '👕'}</div>`}
            </div>
          </div>
          <div class="card-body">
            <div class="card-cat">${catLabel[p.categoria] || p.categoria}</div>
            <h3 class="card-nome">${p.nome}</h3>
            <div class="card-preco-wrap">
              <span class="card-preco ${p.preco_promocional ? 'promocional' : ''}">${p.preco_promocional ? fmt2(p.preco_promocional) : fmt2(p.preco)}</span>
              ${p.preco_promocional ? `<span class="card-preco-riscado">${fmt2(p.preco)}</span>` : ''}
            </div>
          </div>
        </article>
      `).join('');
    }
  } catch { /* silently ignore */ }
})();
