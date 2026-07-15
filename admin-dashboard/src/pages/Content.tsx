import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Select from '@cloudscape-design/components/select';
import Badge from '@cloudscape-design/components/badge';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { cmsApi, PaginaCMS } from '../lib/api';
import { useAuth } from '../lib/auth';

// Nota: Posts e Media Library seguem exactamente o mesmo padrão desta página
// (cmsApi.paginas/criarPagina/atualizarPagina → cmsApi.posts equivalente,
// já existente em server/src/routes/cms.js). Omitidos aqui para não repetir
// código quase idêntico — a Fase 6 do ARCHITECTURE.md detalha o resto.

export default function Content() {
  const { pode } = useAuth();
  const [paginas, setPaginas] = useState<PaginaCMS[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Partial<PaginaCMS> | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  async function carregar() { setPaginas(await cmsApi.paginas()); }
  useEffect(() => { carregar(); }, []);

  async function guardar() {
    if (!emEdicao || !emEdicao.titulo) return;
    setAGuardar(true);
    try {
      if (emEdicao.id) await cmsApi.atualizarPagina(emEdicao.id, emEdicao);
      else await cmsApi.criarPagina({ titulo: emEdicao.titulo, conteudo: emEdicao.conteudo || '', estado: emEdicao.estado || 'rascunho' });
      setModalAberto(false);
      await carregar();
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <ContentLayout header={
      <Header variant="h1" description="Páginas estáticas do site (Sobre, FAQ, Termos...)" actions={
        pode('cms.editar') && <Button variant="primary" iconName="add-plus" onClick={() => { setEmEdicao({ titulo: '', conteudo: '', estado: 'rascunho' }); setModalAberto(true); }}>Nova página</Button>
      }>Conteúdo — Páginas</Header>
    }>
      <Table
        items={paginas}
        trackBy="id"
        columnDefinitions={[
          { id: 'titulo', header: 'Título', cell: (p) => <strong>{p.titulo}</strong> },
          { id: 'slug', header: 'URL', cell: (p) => `/p/${p.slug}` },
          { id: 'estado', header: 'Estado', cell: (p) => p.estado === 'publicado' ? <Badge color="green">Publicado</Badge> : <Badge color="grey">Rascunho</Badge> },
          { id: 'atualizado', header: 'Última edição', cell: (p) => new Date(p.atualizado_em).toLocaleDateString('pt-PT') },
          { id: 'acoes', header: '', cell: (p) => <Button variant="inline-icon" iconName="edit" onClick={() => { setEmEdicao(p); setModalAberto(true); }} disabled={!pode('cms.editar')} /> },
        ]}
        empty="Ainda não existem páginas."
      />

      <Modal visible={modalAberto} onDismiss={() => setModalAberto(false)} header={emEdicao?.id ? 'Editar página' : 'Nova página'} size="large">
        {emEdicao && (
          <Form actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button variant="primary" loading={aGuardar} onClick={guardar}>Guardar</Button>
            </SpaceBetween>
          }>
            <SpaceBetween size="m">
              <FormField label="Título"><Input value={emEdicao.titulo || ''} onChange={({ detail }) => setEmEdicao({ ...emEdicao, titulo: detail.value })} /></FormField>
              <FormField label="Conteúdo" description="Suporta HTML simples."><Textarea rows={10} value={emEdicao.conteudo || ''} onChange={({ detail }) => setEmEdicao({ ...emEdicao, conteudo: detail.value })} /></FormField>
              <FormField label="Estado">
                <Select
                  selectedOption={{ label: emEdicao.estado === 'publicado' ? 'Publicado' : 'Rascunho', value: emEdicao.estado || 'rascunho' }}
                  options={[{ label: 'Rascunho', value: 'rascunho' }, { label: 'Publicado', value: 'publicado' }]}
                  onChange={({ detail }) => setEmEdicao({ ...emEdicao, estado: detail.selectedOption.value as 'rascunho' | 'publicado' })}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        )}
      </Modal>
    </ContentLayout>
  );
}
