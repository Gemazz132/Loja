import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Badge from '@cloudscape-design/components/badge';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { equipaApi, Membro } from '../lib/api';

export default function Team() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [roles, setRoles] = useState<{ id: number; nome: string; descricao: string }[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: '', email: '', password: '', role: 'editor' });
  const [aGuardar, setAGuardar] = useState(false);

  async function carregar() {
    setMembros(await equipaApi.listar());
    setRoles(await equipaApi.roles());
  }
  useEffect(() => { carregar(); }, []);

  async function convidar() {
    setAGuardar(true);
    try {
      await equipaApi.convidar(novo);
      setModalAberto(false);
      setNovo({ nome: '', email: '', password: '', role: 'editor' });
      await carregar();
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <ContentLayout header={
      <Header variant="h1" description="Quem tem acesso ao painel e o que cada um pode fazer" actions={
        <Button variant="primary" iconName="add-plus" onClick={() => setModalAberto(true)}>Adicionar membro</Button>
      }>Equipa & Permissões</Header>
    }>
      <Table
        items={membros}
        trackBy="id"
        columnDefinitions={[
          { id: 'nome', header: 'Nome', cell: (m) => m.nome },
          { id: 'email', header: 'Email', cell: (m) => m.email },
          {
            id: 'role', header: 'Permissão', cell: (m) => (
              <Badge color={m.role === 'admin' ? 'blue' : m.role === 'editor' ? 'green' : 'grey'}>
                {m.role === 'admin' ? 'Administrador' : m.role === 'editor' ? 'Editor' : 'Autor'}
              </Badge>
            ),
          },
          { id: 'desde', header: 'Membro desde', cell: (m) => new Date(m.criado_em).toLocaleDateString('pt-PT') },
          {
            id: 'acoes', header: '', cell: (m) => (
              <Button
                variant="inline-icon" iconName="remove"
                onClick={async () => { if (confirm(`Remover ${m.nome} do painel?`)) { await equipaApi.remover(m.id); carregar(); } }}
              />
            ),
          },
        ]}
      />

      <Modal visible={modalAberto} onDismiss={() => setModalAberto(false)} header="Adicionar membro à equipa">
        <Form actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button variant="primary" loading={aGuardar} onClick={convidar}>Adicionar</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Nome"><Input value={novo.nome} onChange={({ detail }) => setNovo({ ...novo, nome: detail.value })} /></FormField>
            <FormField label="Email"><Input type="email" value={novo.email} onChange={({ detail }) => setNovo({ ...novo, email: detail.value })} /></FormField>
            <FormField label="Password inicial"><Input type="password" value={novo.password} onChange={({ detail }) => setNovo({ ...novo, password: detail.value })} /></FormField>
            <FormField label="Permissão" description="Administrador: tudo. Editor: loja + conteúdo. Autor: só conteúdo.">
              <Select
                selectedOption={{ label: novo.role, value: novo.role }}
                options={roles.map(r => ({ label: r.nome, value: r.nome, description: r.descricao }))}
                onChange={({ detail }) => setNovo({ ...novo, role: detail.selectedOption.value! })}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </ContentLayout>
  );
}
