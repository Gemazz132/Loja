const BASE = ''

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`)
  return data as T
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ ok: boolean; nome: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }),
  me: () =>
    request<{ id: number; nome: string; email: string; role: string; permissoes: string[] }>('/api/admin/me'),

  // Dashboard
  dashboard: () =>
    request<{ vendasHoje: number; vendasMes: number; encomendasPendentes: number; totalClientes: number; vendasPorDia: { dia: string; total: number }[]; produtosMaisVendidos: { nome: string; quantidade: number }[] }>('/api/admin/dashboard'),

  // Products
  products: (params?: { q?: string; categoria?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<any[]>(`/api/admin/products${qs ? `?${qs}` : ''}`)
  },
  product: (id: number | string) => request<any>(`/api/admin/products/${id}`),
  createProduct: (data: any) => request<{ ok: boolean; id: number }>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number | string, data: any) => request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number | string) => request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' }),
  toggleProduct: (id: number | string) => request<{ ok: boolean; ativo: boolean }>(`/api/admin/products/${id}/toggle`, { method: 'PATCH' }),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('imagem', file)
    return fetch('/api/admin/upload', { method: 'POST', body: form, credentials: 'same-origin' }).then(async (r) => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d as { ok: boolean; url: string }
    })
  },
  uploadImages: (files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('imagens', f))
    return fetch('/api/admin/upload-multi', { method: 'POST', body: form, credentials: 'same-origin' }).then(async (r) => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d as { ok: boolean; urls: string[] }
    })
  },

  // Orders
  orders: (params?: { q?: string; estado?: string; arquivadas?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<any[]>(`/api/admin/orders${qs ? `?${qs}` : ''}`)
  },
  order: (id: number | string) => request<any>(`/api/admin/orders/${id}`),
  updateOrderStatus: (id: number | string, estado: string, notificar?: boolean) =>
    request<{ ok: boolean }>(`/api/admin/orders/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, notificar }) }),
  archiveOrder: (id: number | string) => request<{ ok: boolean }>(`/api/admin/orders/${id}/archive`, { method: 'PATCH' }),
  unarchiveOrder: (id: number | string) => request<{ ok: boolean }>(`/api/admin/orders/${id}/unarchive`, { method: 'PATCH' }),
  archiveAllDelivered: () => request<{ ok: boolean; arquivadas: number }>('/api/admin/orders/archive-all-delivered', { method: 'POST' }),

  // Customers
  customers: (q?: string) => request<any[]>(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  customer: (id: number | string) => request<any>(`/api/admin/customers/${id}`),

  // Coupons
  coupons: () => request<any[]>('/api/admin/coupons'),
  createCoupon: (data: any) => request<{ ok: boolean; id: number }>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: number | string, data: any) => request<{ ok: boolean }>(`/api/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: number | string) => request<{ ok: boolean }>(`/api/admin/coupons/${id}`, { method: 'DELETE' }),

  // CMS
  cmsPages: () => request<any[]>('/api/admin/cms/paginas'),
  createPage: (data: any) => request<{ ok: boolean; id: number }>('/api/admin/cms/paginas', { method: 'POST', body: JSON.stringify(data) }),
  updatePage: (id: number | string, data: any) => request<{ ok: boolean }>(`/api/admin/cms/paginas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePage: (id: number | string) => request<{ ok: boolean }>(`/api/admin/cms/paginas/${id}`, { method: 'DELETE' }),
  cmsPosts: () => request<any[]>('/api/admin/cms/posts'),
  createPost: (data: any) => request<{ ok: boolean; id: number }>('/api/admin/cms/posts', { method: 'POST', body: JSON.stringify(data) }),
  cmsCategories: () => request<any[]>('/api/admin/cms/categorias'),
  createCategory: (nome: string) => request<{ ok: boolean; id: number }>('/api/admin/cms/categorias', { method: 'POST', body: JSON.stringify({ nome }) }),
  media: () => request<any[]>('/api/admin/cms/media'),
  uploadMedia: (files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('imagens', f))
    return fetch('/api/admin/cms/media/upload', { method: 'POST', body: form, credentials: 'same-origin' }).then(async (r) => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d as { ok: boolean; items: any[] }
    })
  },

  // Team
  team: () => request<any[]>('/api/admin/team'),
  teamRoles: () => request<any[]>('/api/admin/team/roles'),
  createTeamMember: (data: { nome: string; email: string; password: string; role: string }) =>
    request<{ ok: boolean; id: number }>('/api/admin/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMemberRole: (id: number | string, role: string) =>
    request<{ ok: boolean }>(`/api/admin/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteTeamMember: (id: number | string) => request<{ ok: boolean }>(`/api/admin/team/${id}`, { method: 'DELETE' }),

  // Settings
  settings: () => request<Record<string, string>>('/api/admin/settings'),
  updateSettings: (data: Record<string, string>) => request<{ ok: boolean }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  config: () => request<{ portes_valor: number; portes_gratis_acima: number }>('/api/admin/config'),
  updateConfig: (data: { portes_valor?: number; portes_gratis_acima?: number }) =>
    request<{ ok: boolean }>('/api/admin/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Plugins
  plugins: () => request<any[]>('/api/admin/plugins'),
  updatePluginState: (pasta: string, ativo: boolean, config?: any) =>
    request<{ ok: boolean; aviso: string }>(`/api/admin/plugins/${pasta}/estado`, { method: 'PUT', body: JSON.stringify({ ativo, config }) }),

  // Analytics
  analytics: (dias?: number) => request<any>(`/api/admin/analytics/resumo${dias ? `?dias=${dias}` : ''}`),

  // DB viewer
  dbTables: () => request<{ tabelas: { nome: string; linhas: number }[] }>('/api/admin/db/tabelas'),
  dbTableData: (nome: string, pagina?: number, porPagina?: number) =>
    request<any>(`/api/admin/db/tabelas/${nome}?pagina=${pagina || 1}&porPagina=${porPagina || 50}`),
}

<<<<<<< HEAD
// ── Cupões ───────────────────────────────────────────────────────────────
export interface Cupom {
  id: number;
  codigo: string;
  tipo: 'percentagem' | 'fixo';
  valor: number;
  valido_de: string | null;
  valido_ate: string | null;
  usos_maximos: number | null;
  usos_atuais: number;
  ativo: number;
}
export const cuponsApi = {
  listar: () => request<Cupom[]>('/admin/coupons'),
  criar: (dados: Partial<Cupom>) => request<{ ok: true; id: number }>('/admin/coupons', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<Cupom>) => request<{ ok: true }>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
};

// ── Categorias ───────────────────────────────────────────────────────────
export interface Categoria { id: number; nome: string; slug: string; ordem: number; total_produtos: number }
export const categoriasApi = {
  listar: () => request<Categoria[]>('/admin/categories'),
  criar: (nome: string) => request<{ ok: true; id: number; slug: string }>('/admin/categories', { method: 'POST', body: JSON.stringify({ nome }) }),
  atualizar: (id: number, nome: string) => request<{ ok: true }>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/categories/${id}`, { method: 'DELETE' }),
};

// ── Dashboard ────────────────────────────────────────────────────────────
export interface ResumoDashboard {
  vendasHoje: number;
  vendasMes: number;
  encomendasPendentes: number;
  totalClientes: number;
  vendasPorDia: { dia: string; total: number }[];
  produtosMaisVendidos: { nome: string; quantidade: number }[];
}
export const dashboardApi = {
  resumo: () => request<ResumoDashboard>('/admin/dashboard'),
};

// ── Equipa (RBAC) ────────────────────────────────────────────────────────
export interface Membro { id: number; nome: string; email: string; role: string; criado_em: string }
export const equipaApi = {
  listar: () => request<Membro[]>('/admin/team'),
  roles: () => request<{ id: number; nome: string; descricao: string }[]>('/admin/team/roles'),
  convidar: (dados: { nome: string; email: string; password: string; role: string }) =>
    request<{ ok: true; id: number }>('/admin/team', { method: 'POST', body: JSON.stringify(dados) }),
  alterarRole: (id: number, role: string) => request<{ ok: true }>(`/admin/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/team/${id}`, { method: 'DELETE' }),
};

// ── CMS ──────────────────────────────────────────────────────────────────
export interface PaginaCMS { id: number; titulo: string; slug: string; conteudo: string; estado: 'rascunho' | 'publicado'; atualizado_em: string }
export const cmsApi = {
  paginas: () => request<PaginaCMS[]>('/admin/cms/paginas'),
  criarPagina: (dados: { titulo: string; conteudo: string; estado: string }) =>
    request<{ ok: true; id: number }>('/admin/cms/paginas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarPagina: (id: number, dados: Partial<PaginaCMS>) =>
    request<{ ok: true }>(`/admin/cms/paginas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerPagina: (id: number) => request<{ ok: true }>(`/admin/cms/paginas/${id}`, { method: 'DELETE' }),
  media: () => request<{ id: number; url: string; tipo: string }[]>('/admin/cms/media'),
};

// ── Plugins ──────────────────────────────────────────────────────────────
export interface Plugin { pasta: string; nome: string; versao: string; descricao: string; ativo: boolean; config: Record<string, unknown> }
export const pluginsApi = {
  listar: () => request<Plugin[]>('/admin/plugins'),
  alternar: (pasta: string, ativo: boolean) =>
    request<{ ok: true; aviso?: string }>(`/admin/plugins/${pasta}/estado`, { method: 'PUT', body: JSON.stringify({ ativo }) }),
};

// ── Definições do site ───────────────────────────────────────────────────
export interface SiteConfig { titulo_site: string; idioma: string; cor_primaria: string; cor_fundo: string; logotipo_url: string }
export const settingsApi = {
  obter: () => request<SiteConfig>('/admin/settings'),
  guardar: (dados: Partial<SiteConfig>) => request<{ ok: true }>('/admin/settings', { method: 'PUT', body: JSON.stringify(dados) }),
  portes: () => request<{ portes_valor: string; portes_gratis_acima: string }>('/admin/config'),
  guardarPortes: (dados: { portes_valor: string; portes_gratis_acima: string }) =>
    request<{ ok: true }>('/admin/config', { method: 'PUT', body: JSON.stringify(dados) }),
};

// ── Analytics ────────────────────────────────────────────────────────────
export const analyticsApi = {
  resumo: (dias = 30) => request<{
    visitasPorDia: { dia: string; total: number }[];
    paginasMaisVistas: { pagina: string; total: number }[];
    totalVisitantesUnicos: number;
  }>(`/admin/analytics/resumo?dias=${dias}`),
};

export { ApiError };
=======
export type AdminUser = { id: number; nome: string; email: string; role: string; permissoes: string[] }
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3
