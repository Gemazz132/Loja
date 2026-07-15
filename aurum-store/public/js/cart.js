/* cart.js — Gestão do carrinho (partilhado entre páginas) */
'use strict';

const Cart = (() => {
  const STORAGE_KEY = 'aurum_cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function save(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

  function getItems() { return load(); }

  function add(produto, tamanho, cor, quantidade = 1) {
    const items = load();
    const key = `${produto.id}|${tamanho || ''}|${cor || ''}`;
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.quantidade += quantidade;
    } else {
      items.push({
        key,
        produto_id: produto.id,
        nome: produto.nome,
        preco: produto.preco_promocional || produto.preco,
        preco_original: produto.preco_promocional ? produto.preco : null,
        imagem: produto.imagem,
        tamanho,
        cor,
        quantidade,
      });
    }
    save(items);
    renderCart();
    updateBadge();
  }

  function remove(key) {
    save(load().filter(i => i.key !== key));
    renderCart();
    updateBadge();
  }

  function updateQty(key, delta) {
    const items = load();
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.quantidade = Math.max(1, item.quantidade + delta);
    save(items);
    renderCart();
    updateBadge();
  }

  function clear() { save([]); renderCart(); updateBadge(); }

  function total() {
    return load().reduce((s, i) => s + i.preco * i.quantidade, 0);
  }

  function count() {
    return load().reduce((s, i) => s + i.quantidade, 0);
  }

  function updateBadge() {
    const n = count();
    document.querySelectorAll('#cartCount').forEach(el => {
      el.textContent = n;
      el.classList.toggle('visible', n > 0);
    });
  }

  function fmt(v) {
    return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  }

  function renderCart() {
    const items = load();
    const cartItemsEl = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartEmpty = document.getElementById('cartEmpty');
    if (!cartItemsEl) return;

    if (items.length === 0) {
      cartItemsEl.innerHTML = '';
      if (cartFooter) cartFooter.style.display = 'none';
      if (cartEmpty) cartEmpty.style.display = '';
    } else {
      if (cartEmpty) cartEmpty.style.display = 'none';
      if (cartFooter) cartFooter.style.display = '';

      const sub = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
      const portes = sub >= 75 ? 0 : 4.99;
      const tot = sub + portes;

      cartItemsEl.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-img">
            ${item.imagem
              ? `<img src="${item.imagem}" alt="${item.nome}" loading="lazy">`
              : getCatEmoji(item.nome)}
          </div>
          <div>
            <div class="cart-item-nome">${item.nome}</div>
            <div class="cart-item-var">${[item.tamanho, item.cor].filter(Boolean).join(' · ')}</div>
            <div class="cart-item-qty">
              <button onclick="Cart.updateQty('${item.key}', -1)">−</button>
              <span>${item.quantidade}</span>
              <button onclick="Cart.updateQty('${item.key}', +1)">+</button>
            </div>
            <span class="cart-item-remove" onclick="Cart.remove('${item.key}')">Remover</span>
          </div>
          <div class="cart-item-preco">${fmt(item.preco * item.quantidade)}</div>
        </div>
      `).join('');

      const subEl = document.getElementById('cartSubtotal');
      const portesEl = document.getElementById('cartPortes');
      const totEl = document.getElementById('cartTotal');
      const portesInfo = document.getElementById('portesInfo');
      if (subEl) subEl.textContent = fmt(sub);
      if (portesEl) portesEl.textContent = portes === 0 ? 'Grátis' : fmt(portes);
      if (totEl) totEl.textContent = fmt(tot);
      if (portesInfo) {
        portesInfo.textContent = portes === 0
          ? '✓ Portes grátis incluídos'
          : `Faltam ${fmt(75 - sub)} para portes grátis`;
      }
    }

    // Atualizar resumo do modal de checkout
    renderOrderSummary();
  }

  function renderOrderSummary() {
    const el = document.getElementById('orderSummaryModal');
    if (!el) return;
    const items = load();
    const sub = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const portes = sub >= 75 ? 0 : 4.99;
    const tot = sub + portes;
    el.innerHTML = `
      ${items.map(i => `
        <div class="order-summary-item">
          <span>${i.nome} × ${i.quantidade}${i.tamanho ? ` (${i.tamanho})` : ''}</span>
          <span>${fmt(i.preco * i.quantidade)}</span>
        </div>
      `).join('')}
      <div class="order-summary-item">
        <span>Portes</span>
        <span>${portes === 0 ? 'Grátis' : fmt(portes)}</span>
      </div>
      <div class="order-summary-total">
        <span>Total</span>
        <span>${fmt(tot)}</span>
      </div>
    `;
  }

  function getCatEmoji(nome) {
    const n = (nome || '').toLowerCase();
    if (n.includes('casaco') || n.includes('blazer') || n.includes('trench')) return '🧥';
    if (n.includes('hoodie') || n.includes('cardigan') || n.includes('camisola') || n.includes('merino')) return '👕';
    if (n.includes('camisa')) return '👔';
    if (n.includes('calça') || n.includes('jeans')) return '👖';
    if (n.includes('vestido')) return '👗';
    if (n.includes('saia')) return '🩱';
    return '👕';
  }

  function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Checkout
  function bindCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const checkoutClose = document.getElementById('checkoutClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutError = document.getElementById('checkoutError');
    const checkoutSuccess = document.getElementById('checkoutSuccess');
    const submitCheckout = document.getElementById('submitCheckout');

    const contaLogadoTexto = document.getElementById('contaLogadoTexto');
    const contaOpcoesBox = document.getElementById('contaOpcoesBox');
    const abrirLoginCheckout = document.getElementById('abrirLoginCheckout');
    const criarContaCheckbox = document.getElementById('criarContaCheckbox');
    const passwordContaGroup = document.getElementById('passwordContaGroup');
    const passwordConta = document.getElementById('passwordConta');
    const metodoPagamentoMsg = document.getElementById('metodoPagamentoMsg');

    const MENSAGENS_METODO = {
      'Transferência': 'Após confirmares, enviamos os dados para pagamento por transferência para o teu email — a encomenda entra em preparação assim que o pagamento for confirmado.',
      'MBWay': 'Vais receber um pedido de pagamento MBWay no número que indicares após confirmar a encomenda.',
      'Multibanco': 'Após confirmares, enviamos uma referência Multibanco (entidade + referência) para o teu email, válida por 3 dias.',
    };

    // Mostra "comprando como X" se houver sessão, ou as opções de login/registo/convidado
    async function atualizarEstadoConta() {
      const user = typeof Account !== 'undefined' ? Account.getUser() : null;
      if (user) {
        if (contaLogadoTexto) {
          contaLogadoTexto.style.display = '';
          contaLogadoTexto.innerHTML = `A comprar como <strong>${user.nome}</strong> (${user.email})`;
        }
        if (contaOpcoesBox) contaOpcoesBox.style.display = 'none';
        const nomeInput = checkoutForm?.querySelector('[name="nome"]');
        const emailInput = checkoutForm?.querySelector('[name="email"]');
        if (nomeInput) nomeInput.value = user.nome;
        if (emailInput) emailInput.value = user.email;
      } else {
        if (contaLogadoTexto) contaLogadoTexto.style.display = 'none';
        if (contaOpcoesBox) contaOpcoesBox.style.display = '';
      }
    }

    if (abrirLoginCheckout) {
      abrirLoginCheckout.addEventListener('click', () => {
        checkoutOverlay?.classList.remove('open');
        if (typeof Account !== 'undefined') Account.open();
      });
    }

    if (criarContaCheckbox) {
      criarContaCheckbox.addEventListener('change', () => {
        if (passwordContaGroup) passwordContaGroup.style.display = criarContaCheckbox.checked ? '' : 'none';
      });
    }

    // Destaque visual do método de pagamento seleccionado (fallback para
    // browsers sem suporte a :has()) + actualiza a mensagem informativa
    document.querySelectorAll('input[name="metodo_pagamento"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.metodo-pagamento-card').forEach(c => c.classList.remove('selecionado'));
        radio.closest('.metodo-pagamento-card')?.classList.add('selecionado');
        if (metodoPagamentoMsg) metodoPagamentoMsg.textContent = MENSAGENS_METODO[radio.value] || '';
      });
    });

    // Estado inicial do cartão de pagamento pré-seleccionado
    document.querySelector('input[name="metodo_pagamento"]:checked')?.closest('.metodo-pagamento-card')?.classList.add('selecionado');

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        closeCart();
        renderOrderSummary();
        atualizarEstadoConta();
        if (checkoutOverlay) checkoutOverlay.classList.add('open');
      });
    }
    if (checkoutClose) {
      checkoutClose.addEventListener('click', () => checkoutOverlay?.classList.remove('open'));
    }
    if (checkoutOverlay) {
      checkoutOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open');
      });
    }
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (checkoutError) checkoutError.textContent = '';
        if (submitCheckout) { submitCheckout.disabled = true; submitCheckout.textContent = 'A processar…'; }

        const fd = new FormData(checkoutForm);

        try {
          // Se o cliente optou por criar conta neste momento, regista-a
          // primeiro (isto inicia sessão) para a encomenda ficar já ligada
          // à conta certa — antes de avançar para o pagamento.
          if (criarContaCheckbox?.checked && !(typeof Account !== 'undefined' && Account.getUser())) {
            if (!passwordConta?.value || passwordConta.value.length < 6) {
              throw new Error('Escolhe uma password com pelo menos 6 caracteres para criares a conta.');
            }
            const resReg = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nome: fd.get('nome'), email: fd.get('email'), password: passwordConta.value }),
            });
            const dataReg = await resReg.json();
            if (!resReg.ok) throw new Error(dataReg.error || 'Não foi possível criar a conta.');
          }

          const body = {
            nome: fd.get('nome'),
            email: fd.get('email'),
            telefone: fd.get('telefone'),
            morada: fd.get('morada'),
            cidade: fd.get('cidade'),
            codigo_postal: fd.get('codigo_postal'),
            pais: fd.get('pais'),
            metodo_pagamento: fd.get('metodo_pagamento'),
            cupom: (document.getElementById('cupomInput')?.value || '').trim() || undefined,
            itens: load().map(i => ({
              produto_id: i.produto_id,
              quantidade: i.quantidade,
              tamanho: i.tamanho,
              cor: i.cor,
            })),
          };

          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erro ao processar encomenda.');
          clear();
          if (checkoutForm) checkoutForm.style.display = 'none';
          if (checkoutSuccess) checkoutSuccess.style.display = '';
          const orderDisplay = document.getElementById('orderNumberDisplay');
          if (orderDisplay) orderDisplay.textContent = data.numero;
        } catch (err) {
          if (checkoutError) checkoutError.textContent = err.message;
        } finally {
          if (submitCheckout) { submitCheckout.disabled = false; submitCheckout.textContent = 'Confirmar encomenda'; }
        }
      });
    }
  }

  // Init
  function init() {
    updateBadge();
    renderCart();
    bindCheckout();

    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartShopLink = document.getElementById('cartShopLink');

    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (cartShopLink) cartShopLink.addEventListener('click', closeCart);

    // Header scroll
    window.addEventListener('scroll', () => {
      document.querySelector('.site-header')?.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  return { add, remove, updateQty, clear, total, count, getItems, init, openCart, getCatEmoji };
})();

document.addEventListener('DOMContentLoaded', () => Cart.init());
