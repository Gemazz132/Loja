import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Grid from '@cloudscape-design/components/grid';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import LineChart from '@cloudscape-design/components/line-chart';
import BarChart from '@cloudscape-design/components/bar-chart';
import { dashboardApi, ResumoDashboard } from '../lib/api';

function CartaoMetrica({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Container>
      <Box variant="awsui-key-label">{titulo}</Box>
      <Box fontSize="display-l" fontWeight="bold">{valor}</Box>
    </Container>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);

  useEffect(() => { dashboardApi.resumo().then(setResumo); }, []);

  if (!resumo) return <Box padding="l">A carregar…</Box>;

  return (
    <ContentLayout header={<Header variant="h1">Dashboard</Header>}>
      <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
        <CartaoMetrica titulo="Vendas hoje" valor={`${resumo.vendasHoje.toFixed(2)} €`} />
        <CartaoMetrica titulo="Vendas este mês" valor={`${resumo.vendasMes.toFixed(2)} €`} />
        <CartaoMetrica titulo="Encomendas pendentes" valor={String(resumo.encomendasPendentes)} />
        <CartaoMetrica titulo="Total de clientes" valor={String(resumo.totalClientes)} />
      </Grid>

      <Box padding={{ top: 'l' }}>
        <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
          <Container header={<Header variant="h2">Vendas por dia</Header>}>
            <LineChart
              series={[{
                title: 'Vendas (€)',
                type: 'line',
                data: resumo.vendasPorDia.map(d => ({ x: d.dia, y: d.total })),
              }]}
              xDomain={resumo.vendasPorDia.map(d => d.dia)}
              yDomain={[0, Math.max(10, ...resumo.vendasPorDia.map(d => d.total)) * 1.2]}
              i18nStrings={{
                xTickFormatter: (v) => String(v),
                yTickFormatter: (v) => `${(v as number).toFixed(0)}€`,
                filterLabel: 'Filtrar',
                filterPlaceholder: 'Filtrar séries',
                filterSelectedAriaLabel: 'Selecionado',
                legendAriaLabel: 'Legenda',
                chartAriaRoleDescription: 'gráfico de linha',
                xAxisAriaRoleDescription: 'eixo x',
                yAxisAriaRoleDescription: 'eixo y',
              }}
              ariaLabel="Vendas por dia"
              height={260}
              hideFilter
              hideLegend
            />
          </Container>
          <Container header={<Header variant="h2">Produtos mais vendidos</Header>}>
            <BarChart
              series={[{
                title: 'Unidades vendidas',
                type: 'bar',
                data: resumo.produtosMaisVendidos.map(p => ({ x: p.nome, y: p.quantidade })),
              }]}
              xDomain={resumo.produtosMaisVendidos.map(p => p.nome)}
              yDomain={[0, Math.max(1, ...resumo.produtosMaisVendidos.map(p => p.quantidade))]}
              i18nStrings={{
                xTickFormatter: (v) => String(v),
                yTickFormatter: (v) => String(v),
                filterLabel: 'Filtrar',
                filterPlaceholder: 'Filtrar séries',
                filterSelectedAriaLabel: 'Selecionado',
                legendAriaLabel: 'Legenda',
                chartAriaRoleDescription: 'gráfico de barras',
                xAxisAriaRoleDescription: 'eixo x',
                yAxisAriaRoleDescription: 'eixo y',
              }}
              ariaLabel="Produtos mais vendidos"
              height={260}
              hideFilter
              hideLegend
            />
          </Container>
        </Grid>
      </Box>
    </ContentLayout>
  );
}
