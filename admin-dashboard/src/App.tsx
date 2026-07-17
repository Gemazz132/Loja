<<<<<<< HEAD
import { useState } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Box from '@cloudscape-design/components/box';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Coupons from './pages/Coupons';
import Content from './pages/Content';
import Team from './pages/Team';
import Plugins from './pages/Plugins';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

type Pagina =
  | 'dashboard' | 'orders' | 'products' | 'categories' | 'customers' | 'discounts'
  | 'content' | 'team' | 'plugins' | 'analytics' | 'settings';

const TITULOS: Record<Pagina, string> = {
  dashboard: 'Dashboard', orders: 'Encomendas', products: 'Produtos', customers: 'Clientes',
  discounts: 'Cupões e Descontos', content: 'Conteúdo', team: 'Equipa & Permissões',
  categories: 'Categorias',
  plugins: 'Plugins', analytics: 'Analytics', settings: 'Definições',
};

function PainelAutenticado() {
  const { sessao, logout, pode } = useAuth();
  const [pagina, setPagina] = useState<Pagina>('dashboard');
  const [navAberta, setNavAberta] = useState(true);

  function ir(href: string) {
    const p = href.replace('#', '') as Pagina;
    if (p in TITULOS) setPagina(p);
  }

  const conteudo: Record<Pagina, JSX.Element> = {
    dashboard: <Dashboard />,
    orders: <Orders />,
    products: <Products />,
    customers: <Customers />,
    discounts: <Coupons />,
    categories: <Categories />,
    content: <Content />,
    team: <Team />,
    plugins: <Plugins />,
    analytics: <Analytics />,
    settings: <Settings />,
  };
=======
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar, TopBar } from '@/components/layout/Sidebar'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import ProductsPage from '@/pages/Products'
import OrdersPage from '@/pages/Orders'
import CustomersPage from '@/pages/Customers'
import CouponsPage from '@/pages/Coupons'
import ContentPage from '@/pages/Content'
import TeamPage from '@/pages/Team'
import PluginsPage from '@/pages/Plugins'
import AnalyticsPage from '@/pages/Analytics'
import SettingsPage from '@/pages/Settings'
import { cn } from '@/lib/utils'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">A carregar…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('ml-64')}>
        <TopBar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/encomendas" element={<OrdersPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/cupoes" element={<CouponsPage />} />
            <Route path="/conteudo" element={<ContentPage />} />
            <Route path="/equipa" element={<TeamPage />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/definicoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
<<<<<<< HEAD
      <AppLayout
        headerSelector="#top-nav"
        navigationOpen={navAberta}
        onNavigationChange={({ detail }) => setNavAberta(detail.open)}
        toolsHide
        navigation={
          <SideNavigation
            activeHref={`#${pagina}`}
            header={{ text: 'AURUM', href: '#dashboard' }}
            onFollow={(e) => { e.preventDefault(); ir(e.detail.href); }}
            items={[
              { type: 'link', text: 'Dashboard', href: '#dashboard' },
              { type: 'divider' },
              { type: 'section', text: 'Loja', items: [
                { type: 'link', text: 'Produtos', href: '#products' },
                { type: 'link', text: 'Categorias', href: '#categories' },
                { type: 'link', text: 'Encomendas', href: '#orders' },
                { type: 'link', text: 'Clientes', href: '#customers' },
                { type: 'link', text: 'Cupões e Descontos', href: '#discounts' },
              ]},
              { type: 'section', text: 'Conteúdo', items: [
                { type: 'link', text: 'Páginas & Posts', href: '#content' },
              ]},
              { type: 'section', text: 'Sistema', items: [
                ...(pode('equipa.editar') ? [{ type: 'link' as const, text: 'Equipa & Permissões', href: '#team' }] : []),
                ...(pode('plugins.editar') ? [{ type: 'link' as const, text: 'Plugins', href: '#plugins' }] : []),
                ...(pode('analytics.ver') ? [{ type: 'link' as const, text: 'Analytics', href: '#analytics' }] : []),
                ...(pode('definicoes.editar') ? [{ type: 'link' as const, text: 'Definições', href: '#settings' }] : []),
              ]},
            ]}
          />
        }
        breadcrumbs={<BreadcrumbGroup items={[{ text: TITULOS[pagina], href: '#' }]} ariaLabel="Localização" />}
        content={conteudo[pagina]}
      />
=======
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
