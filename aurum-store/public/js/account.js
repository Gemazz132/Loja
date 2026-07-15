/* account.js — Modal de conta partilhado entre páginas */
'use strict';

const Account = (() => {
  let user = null; // { id, nome, email } ou null

  // ── Injectar modal HTML no body ───────────────────────
  function injectModal() {
    const html = `
    <!-- ACCOUNT DRAWER -->
    <div class="cart-overlay" id="accountOverlay"></div>
    <aside class="cart-drawer" id="accountDrawer">
      <div class="cart-header">
        <h3 id="accountDrawerTitle">A minha conta</h3>
        <button class="icon-btn" id="accountClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Estado: não autenticado → tabs login/registo -->
      <div id="accountGuest">
        <div class="account-tabs">
          <button class="account-tab active" data-tab="login">Entrar</button>
          <button class="account-tab" data-tab="register">Criar conta</button>
        </div>

        <!-- LOGIN -->
        <div class="account-panel" id="panelLogin">
          <p class="account-intro">Acede à tua conta para ver as tuas encomendas.</p>
          <div class="account-form" id="loginForm">
            <div class="acc-form-group">
              <label>Email</label>
              <input type="email" id="loginEmail" autocomplete="email" placeholder="o.teu@email.pt">
            </div>
            <div class="acc-form-group">
              <label>Password</label>
              <input type="password" id="loginPassword" autocomplete="current-password" placeholder="••••••••">
            </div>
            <p class="acc-error" id="loginError"></p>
            <button class="btn-primary full-width" id="loginSubmit">Entrar</button>
          </div>
        </div>

        <!-- REGISTO -->
        <div class="account-panel" id="panelRegister" style="display:none">
          <p class="account-intro">Cria uma conta para acompanhar as tuas encomendas.</p>
          <div class="account-form" id="registerForm">
            <div class="acc-form-group">
              <label>Nome completo</label>
              <input type="text" id="regNome" autocomplete="name" placeholder="O teu nome">
            </div>
            <div class="acc-form-group">
              <label>Email</label>
              <input type="email" id="regEmail" autocomplete="email" placeholder="o.teu@email.pt">
            </div>
            <div class="acc-form-group">
              <label>Password</label>
              <input type="password" id="regPassword" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
            </div>
            <p class="acc-error" id="registerError"></p>
            <button class="btn-primary full-width" id="registerSubmit">Criar conta</button>
          </div>
        </div>
      </div>

      <!-- Estado: autenticado → área de cliente -->
      <div id="accountUser" style="display:none">
        <div class="account-user-header">
          <div class="account-avatar" id="accountAvatar">A</div>
          <div>
            <div class="account-user-nome" id="accountUserNome">—</div>
            <div class="account-user-email" id="accountUserEmail">—</div>
          </div>
        </div>

        <div class="account-section-label">As minhas encomendas</div>
        <div id="accountOrders">
          <div class="acc-loading">A carregar…</div>
        </div>

        <div style="padding: 20px 24px; border-top: 1px solid var(--blush); margin-top: auto;">
          <button class="btn-outline full-width" id="accountLogout">Terminar sessão</button>
        </div>
      </div>
    </aside>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ── Abrir / fechar ────────────────────────────────────
  function open() {
    document.getElementById('accountDrawer').classList.add('open');
    document.getElementById('accountOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (user) loadOrders();
  }
  function close() {
    document.getElementById('accountDrawer').classList.remove('open');
    document.getElementById('accountOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Atualizar UI consoante estado ─────────────────────
  function renderState() {
    const guestEl = document.getElementById('accountGuest');
    const userEl = document.getElementById('accountUser');
    const btn = document.getElementById('accountBtn');

    if (user) {
      guestEl.style.display = 'none';
      userEl.style.display = '';
      document.getElementById('accountUserNome').textContent = user.nome;
      document.getElementById('accountUserEmail').textContent = user.email;
      document.getElementById('accountAvatar').textContent = user.nome.charAt(0).toUpperCase();
      document.getElementById('accountDrawerTitle').textContent = `Olá, ${user.nome.split(' ')[0]}`;
      // Marcar ícone como activo
      if (btn) btn.style.color = 'var(--gold)';
    } else {
      guestEl.style.display = '';
      userEl.style.display = 'none';
      document.getElementById('accountDrawerTitle').textContent = 'A minha conta';
      if (btn) btn.style.color = '';
    }
  }

  // ── Carregar encomendas ───────────────────────────────
  async function loadOrders() {
    const el = document.getElementById('accountOrders');
    el.innerHTML = '<div class="acc-loading">A carregar…</div>';
    try {
      const res = await fetch('/api/account/orders');
      if (!res.ok) throw new Error();
      const orders = await res.json();
      if (!orders.length) {
        el.innerHTML = '<p class="acc-empty">Ainda não fizeste nenhuma encomenda.</p>';
        return;
      }
      const estadoCor = { Pendente: '#C2410C', Pago: '#15803D', 'Preparação': '#1D4ED8', Enviado: '#6D28D9', Entregue: '#15803D', Cancelado: '#B91C1C' };
      el.innerHTML = orders.map(o => `
        <div class="acc-order">
          <div class="acc-order-header">
            <span class="acc-order-num">${o.numero}</span>
            <span class="acc-order-estado" style="color:${estadoCor[o.estado] || '#888'}">${o.estado}</span>
          </div>
          <div class="acc-order-meta">
            ${new Date(o.criado_em).toLocaleDateString('pt-PT')}
            &nbsp;·&nbsp;
            ${Number(o.total).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
          ${o.items_resumo ? `<div class="acc-order-items">${o.items_resumo}</div>` : ''}
        </div>
      `).join('');
    } catch {
      el.innerHTML = '<p class="acc-empty">Não foi possível carregar as encomendas.</p>';
    }
  }

  // ── Login ─────────────────────────────────────────────
  async function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginSubmit');
    errEl.textContent = '';
    if (!email || !password) { errEl.textContent = 'Preenche todos os campos.'; return; }
    btn.disabled = true; btn.textContent = 'A entrar…';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar.');
      user = { nome: data.nome, email };
      // fetch id
      const me = await fetch('/api/auth/me').then(r => r.json());
      user = { id: me.id, nome: me.nome, email: me.email };
      renderState();
      loadOrders();
    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  }

  // ── Registo ───────────────────────────────────────────
  async function doRegister() {
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errEl = document.getElementById('registerError');
    const btn = document.getElementById('registerSubmit');
    errEl.textContent = '';
    if (!nome || !email || !password) { errEl.textContent = 'Preenche todos os campos.'; return; }
    if (password.length < 6) { errEl.textContent = 'A password precisa de ter pelo menos 6 caracteres.'; return; }
    btn.disabled = true; btn.textContent = 'A criar conta…';
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');
      const me = await fetch('/api/auth/me').then(r => r.json());
      user = { id: me.id, nome: me.nome, email: me.email };
      renderState();
      loadOrders();
    } catch (e) {
      errEl.textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Criar conta';
    }
  }

  // ── Logout ────────────────────────────────────────────
  async function doLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    user = null;
    renderState();
    // Limpar campos
    ['loginEmail','loginPassword','regNome','regEmail','regPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    // Voltar ao tab de login
    switchTab('login');
  }

  function switchTab(tab) {
    document.querySelectorAll('.account-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('panelLogin').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('panelRegister').style.display = tab === 'register' ? '' : 'none';
  }

  // ── Init ──────────────────────────────────────────────
  async function init() {
    injectModal();

    // Verificar sessão activa
    try {
      const me = await fetch('/api/auth/me').then(r => r.json());
      if (me.autenticado) user = { id: me.id, nome: me.nome, email: me.email };
    } catch { /* sem sessão */ }

    renderState();

    // Eventos
    document.getElementById('accountBtn')?.addEventListener('click', e => { e.preventDefault(); open(); });
    document.getElementById('accountClose')?.addEventListener('click', close);
    document.getElementById('accountOverlay')?.addEventListener('click', close);

    document.querySelectorAll('.account-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.getElementById('loginSubmit')?.addEventListener('click', doLogin);
    document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    document.getElementById('registerSubmit')?.addEventListener('click', doRegister);
    document.getElementById('regPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

    document.getElementById('accountLogout')?.addEventListener('click', doLogout);
  }

  return { init, open, getUser: () => user };
})();

document.addEventListener('DOMContentLoaded', () => Account.init());
