import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';
import Button from '@cloudscape-design/components/button';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { encomendasApi, Encomenda } from '../lib/api';
import { useAuth } from '../lib/auth';

const ESTADOS: Encomenda['estado'][] = ['Pendente', 'Pago', 'Preparação', 'Enviado', 'Entregue', 'Cancelado'];

const CORES_ESTADO: Record<Encomenda['estado'], 'blue' | 'green' | 'red' | 'grey' | 'severity-medium'> = {
  'Pendente': 'grey',
  'Pago': 'blue',
  'Preparação': 'severity-medium',
  'Enviado': 'blue',
  'Entregue': 'green',
  'Cancelado': 'red',
};

// Próximo estado lógico do fluxo — usado para o botão de ação rápida
const PROXIMO_ESTADO: Partial<Record<Encomenda['estado'], Encomenda['estado']>> = {
  'Pendente': 'Pago',
  'Pago': 'Preparação',
  'Preparação': 'Enviado',
  'Enviado': 'Entregue',
};

export default function Orders() {
  const { pode } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [aAtualizar, setAAtualizar] = useState<number | null>(null);

  async function carregar() {
    setCarregando(true);
    setEncomendas(await encomendasApi.listar(filtroEstado ? { estado: filtroEstado } : undefined));
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, [filtroEstado]);

  async function avancarEstado(e: Encomenda) {
    const proximo = PROXIMO_ESTADO[e.estado];
    if (!proximo) return;
    setAAtualizar(e.id);
    try {
      // notificarCliente=true → o backend envia um email ao cliente a
      // informar da mudança de estado (usa nodemailer, já configurado no projecto)
      await encomendasApi.atualizarEstado(e.id, proximo, true);
      await carregar();
    } finally {
      setAAtualizar(null);
    }
  }

  const { items, collectionProps, filterProps, paginationProps, filteredItemsCount } = useCollection(encomendas, {
    filtering: {},
    pagination: { pageSize: 10 },
    sorting: {},
  });

  return (
    <ContentLayout header={<Header variant="h1" description={`${encomendas.length} encomendas`}>Encomendas</Header>}>
      <Table
        {...collectionProps}
        items={items}
        loading={carregando}
        trackBy="id"
        pagination={<Pagination {...paginationProps} />}
        filter={
          <SpaceBetween direction="horizontal" size="xs">
            <TextFilter {...filterProps} filteringPlaceholder="Pesquisar por nº, nome ou email"
              countText={filteredItemsCount !== undefined ? `${filteredItemsCount} resultado(s)` : undefined} />
            <Select
              placeholder="Filtrar por estado"
              options={[{ label: 'Todos os estados', value: '' }, ...ESTADOS.map(e => ({ label: e, value: e }))]}
              selectedOption={filtroEstado ? { label: filtroEstado, value: filtroEstado } : { label: 'Todos os estados', value: '' }}
              onChange={({ detail }) => setFiltroEstado(detail.selectedOption.value || '')}
            />
          </SpaceBetween>
        }
        columnDefinitions={[
          { id: 'numero', header: 'Nº Encomenda', cell: (e) => <Box fontWeight="bold">{e.numero}</Box> },
          { id: 'cliente', header: 'Cliente', cell: (e) => <SpaceBetween size="xxxs"><Box>{e.nome_cliente}</Box><Box color="text-body-secondary" fontSize="body-s">{e.email_cliente}</Box></SpaceBetween> },
          { id: 'total', header: 'Total', cell: (e) => `${e.total.toFixed(2)} €` },
          { id: 'pagamento', header: 'Pagamento', cell: (e) => e.pagamento },
          { id: 'estado', header: 'Estado', cell: (e) => <Badge color={CORES_ESTADO[e.estado]}>{e.estado}</Badge> },
          { id: 'data', header: 'Data', cell: (e) => new Date(e.criado_em).toLocaleDateString('pt-PT') },
          {
            id: 'acoes', header: 'Ação rápida',
            cell: (e) => {
              const proximo = PROXIMO_ESTADO[e.estado];
              if (!proximo || !pode('encomendas.editar')) return '—';
              return (
                <Button loading={aAtualizar === e.id} onClick={() => avancarEstado(e)}>
                  Marcar como "{proximo}" + notificar
                </Button>
              );
            },
          },
        ]}
      />
    </ContentLayout>
  );
}
