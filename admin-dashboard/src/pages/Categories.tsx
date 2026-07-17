import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Badge from '@cloudscape-design/components/badge';
import Alert from '@cloudscape-design/components/alert';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { categoriasApi, Categoria } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Categories() {
  const { pode } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Categoria | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);

  async function carregar() { setCategorias(await categoriasApi.listar()); }
  useEffect(() => { carregar(); }, []);

  function novaCategoria() {
    setEmEdicao(null);
    setNomeInput('');
    setErro(null);
    setModalAberto(true);
  }

  function editarCategoria(c: Categoria) {
    setEmEdicao(c);
    setNomeInput(c.nome);
    setErro(null);
    setModalAberto(true);
  }

  async function guardar() {
    if (!nomeInput.trim()) return;
    setAGuardar(true);
    setErro(null);
    try {
      if (emEdicao) await categoriasApi.atualizar(emEdicao.id, nomeInput.trim());
      else await categoriasApi.criar(nomeInput.trim());
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar.');
    } finally {
      setAGuardar(false);
    }
  }

  async function eliminar(c: Categoria) {
    if (!confirm(`Eliminar a categoria "${c.nome}"?`)) return;
    setErroLista(null);
    try {
      await categoriasApi.remover(c.id);
      await carregar();
    } catch (e) {
      setErroLista(e instanceof Error ? e.message : 'Erro ao eliminar.');
    }
  }

  return (
    <ContentLayout header={
      <Header
        variant="h1"
        description="O nome aqui muda logo no menu e nos filtros da loja — o slug interno nunca muda, por isso os produtos já atribuídos não são afectados."
        actions={pode('produtos.editar') && <Button variant="primary" iconName="add-plus" onClick={novaCategoria}>Nova categoria</Button>}
      >
        Categorias
      </Header>
    }>
      {erroLista && <Alert type="error" dismissible onDismiss={() => setErroLista(null)}>{erroLista}</Alert>}
      <Table
        items={categorias}
        trackBy="id"
        columnDefinitions={[
          { id: 'nome', header: 'Nome', cell: (c) => <strong>{c.nome}</strong> },
          { id: 'slug', header: 'Slug (interno)', cell: (c) => <code>{c.slug}</code> },
          { id: 'produtos', header: 'Produtos', cell: (c) => <Badge color={c.total_produtos > 0 ? 'blue' : 'grey'}>{c.total_produtos}</Badge> },
          {
            id: 'acoes', header: '', cell: (c) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="inline-icon" iconName="edit" ariaLabel="Editar" onClick={() => editarCategoria(c)} disabled={!pode('produtos.editar')} />
                <Button variant="inline-icon" iconName="remove" ariaLabel="Eliminar" onClick={() => eliminar(c)} disabled={!pode('produtos.editar')} />
              </SpaceBetween>
            ),
          },
        ]}
        empty="Ainda não existem categorias."
      />

      <Modal visible={modalAberto} onDismiss={() => setModalAberto(false)} header={emEdicao ? 'Editar categoria' : 'Nova categoria'}>
        <Form actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button variant="primary" loading={aGuardar} onClick={guardar}>Guardar</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            {erro && <Alert type="error">{erro}</Alert>}
            <FormField label="Nome da categoria">
              <Input value={nomeInput} onChange={({ detail }) => setNomeInput(detail.value)} autoFocus />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </ContentLayout>
  );
}
