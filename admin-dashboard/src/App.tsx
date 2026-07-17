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

  return (
    <div id="app-container">
      <div id="top-nav">
        <TopNavigation
          identity={{ href: '#dashboard', title: 'AURUM — Painel' }}
          utilities={[{
            type: 'menu-dropdown',
            text: sessao?.nome,
            description: sessao?.email,
            iconName: 'user-profile',
            items: [{ id: 'signout', text: 'Terminar sessão' }],
            onItemClick: ({ detail }) => { if (detail.id === 'signout') logout(); },
          }]}
          i18nStrings={{ overflowMenuTriggerText: 'Mais', overflowMenuTitleText: 'Tudo', searchIconAriaLabel: 'Pesquisar', searchDismissIconAriaLabel: 'Fechar', overflowMenuBackIconAriaLabel: 'Voltar', overflowMenuDismissIconAriaLabel: 'Fechar menu' }}
        />
      </div>
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
    </div>
  );
}

function Portao() {
  const { sessao, carregando } = useAuth();
  if (carregando) return <Box padding="xxl" textAlign="center">A carregar…</Box>;
  return sessao ? <PainelAutenticado /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Portao />
    </AuthProvider>
  );
}
