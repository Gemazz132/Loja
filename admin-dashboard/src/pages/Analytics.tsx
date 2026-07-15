import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import LineChart from '@cloudscape-design/components/line-chart';
import Table from '@cloudscape-design/components/table';
import Alert from '@cloudscape-design/components/alert';
import { analyticsApi } from '../lib/api';

export default function Analytics() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof analyticsApi.resumo>> | null>(null);

  useEffect(() => { analyticsApi.resumo(30).then(setDados); }, []);

  return (
    <ContentLayout header={<Header variant="h1" description="Métricas internas, sem serviço externo">Analytics</Header>}>
      <Alert type="info">
        Este é um contador interno leve (eventos gravados na própria base de dados). Para analytics
        mais avançado (funis, sessões, dispositivos), a alternativa realista é ligar uma ferramenta
        dedicada como Plausible ou Umami — mais fiável do que reconstruir isso de raiz aqui.
      </Alert>
      {dados && (
        <Box padding={{ top: 'l' }}>
          <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
            <Container header={<Header variant="h2">Visitas por dia (últimos 30 dias)</Header>}>
              <LineChart
                series={[{
                  title: 'Visitas',
                  type: 'line',
                  data: dados.visitasPorDia.map(d => ({ x: d.dia, y: d.total })),
                }]}
                xDomain={dados.visitasPorDia.map(d => d.dia)}
                yDomain={[0, Math.max(1, ...dados.visitasPorDia.map(d => d.total))]}
                i18nStrings={{
                  xTickFormatter: (v) => String(v),
                  yTickFormatter: (v) => String(v),
                  filterLabel: 'Filtrar',
                  filterPlaceholder: 'Filtrar séries',
                  filterSelectedAriaLabel: 'Selecionado',
                  legendAriaLabel: 'Legenda',
                  chartAriaRoleDescription: 'gráfico de linha',
                  xAxisAriaRoleDescription: 'eixo x',
                  yAxisAriaRoleDescription: 'eixo y',
                }}
                ariaLabel="Visitas por dia"
                height={260}
                hideFilter
                hideLegend
              />
            </Container>
            <Container header={<Header variant="h2">Páginas mais vistas</Header>}>
              <Table
                items={dados.paginasMaisVistas}
                trackBy="pagina"
                columnDefinitions={[
                  { id: 'pagina', header: 'Página', cell: (p) => p.pagina },
                  { id: 'total', header: 'Vistas', cell: (p) => p.total },
                ]}
              />
            </Container>
          </Grid>
        </Box>
      )}
    </ContentLayout>
  );
}
