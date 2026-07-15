import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Box from '@cloudscape-design/components/box';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { clientesApi, Cliente } from '../lib/api';

export default function Customers() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    clientesApi.listar().then((c) => { setClientes(c); setCarregando(false); });
  }, []);

  const { items, collectionProps, filterProps, paginationProps, filteredItemsCount } = useCollection(clientes, {
    filtering: {},
    pagination: { pageSize: 10 },
    sorting: { defaultState: { sortingColumn: { sortingField: 'total_gasto' }, isDescending: true } },
  });

  return (
    <ContentLayout header={<Header variant="h1" description={`${clientes.length} clientes registados`}>Clientes</Header>}>
      <Table
        {...collectionProps}
        items={items}
        loading={carregando}
        trackBy="id"
        pagination={<Pagination {...paginationProps} />}
        filter={<TextFilter {...filterProps} filteringPlaceholder="Pesquisar por nome ou email"
          countText={filteredItemsCount !== undefined ? `${filteredItemsCount} resultado(s)` : undefined} />}
        columnDefinitions={[
          { id: 'nome', header: 'Nome', sortingField: 'nome', cell: (c) => c.nome },
          { id: 'email', header: 'Email', cell: (c) => c.email },
          { id: 'encomendas', header: 'Encomendas', sortingField: 'total_encomendas', cell: (c) => c.total_encomendas },
          { id: 'gasto', header: 'Total gasto (LTV)', sortingField: 'total_gasto', cell: (c) => <Box fontWeight="bold">{c.total_gasto.toFixed(2)} €</Box> },
          { id: 'desde', header: 'Cliente desde', cell: (c) => new Date(c.criado_em).toLocaleDateString('pt-PT') },
        ]}
      />
    </ContentLayout>
  );
}
