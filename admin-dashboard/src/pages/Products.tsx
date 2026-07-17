import { useEffect, useState, useRef } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Toggle from '@cloudscape-design/components/toggle';
import TokenGroup from '@cloudscape-design/components/token-group';
import Badge from '@cloudscape-design/components/badge';
import { useCollection } from '@cloudscape-design/collection-hooks';
import Select from '@cloudscape-design/components/select';
import { produtosApi, Produto, parseImagensExtra, parseVariantes, categoriasApi, Categoria } from '../lib/api';
import { useAuth } from '../lib/auth';

const LIMIAR_STOCK_BAIXO = 5;

function BadgeStock({ stock }: { stock: number }) {
  if (stock === 0) return <Badge color="red">Esgotado</Badge>;
  if (stock <= LIMIAR_STOCK_BAIXO) return <Badge color="severity-medium">Poucas unidades ({stock})</Badge>;
  return <Badge color="green">{stock} em stock</Badge>;
}

export default function Products() {
  const { pode } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Partial<Produto> | null>(null);
  const [galeria, setGaleria] = useState<string[]>([]);
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [cores, setCores] = useState<string[]>([]);
  const [aGuardar, setAGuardar] = useState(false);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    setProdutos(await produtosApi.listar());
    setCarregando(false);
  }
  useEffect(() => { carregar(); categoriasApi.listar().then(setCategorias); }, []);

  const { items, collectionProps, filterProps, paginationProps, filteredItemsCount } = useCollection(produtos, {
    filtering: { empty: <Box textAlign="center">Nenhum produto encontrado.</Box> },
    pagination: { pageSize: 10 },
    sorting: {},
  });

  function abrirNovo() {
    setEmEdicao({ nome: '', preco: 0, stock: 0, categoria: '', ativo: 1 });
    setGaleria([]);
    setTamanhos([]);
    setCores([]);
    setModalAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setEmEdicao(p);
    setGaleria(parseImagensExtra(p));
    setTamanhos(parseVariantes(p.tamanhos));
    setCores(parseVariantes(p.cores));
    setModalAberto(true);
  }

  async function adicionarImagensGaleria(files: FileList | null) {
    if (!files || !files.length) return;
    const urls = await produtosApi.uploadGaleria(Array.from(files));
    setGaleria(g => [...g, ...urls].slice(0, 6)); // máx. 6 imagens por produto
  }

  async function guardar() {
    if (!emEdicao || !emEdicao.nome || !emEdicao.preco) return;
    setAGuardar(true);
    const dados = { ...emEdicao, imagens_extra: galeria, tamanhos, cores };
    try {
      if (emEdicao.id) await produtosApi.atualizar(emEdicao.id, dados);
      else await produtosApi.criar(dados);
      setModalAberto(false);
      await carregar();
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={`${produtos.length} produtos`}
          actions={pode('produtos.editar') && (
            <Button variant="primary" iconName="add-plus" onClick={abrirNovo}>Novo produto</Button>
          )}
        >
          Produtos
        </Header>
      }
    >
      <Table
        {...collectionProps}
        items={items}
        loading={carregando}
        trackBy="id"
        pagination={<Pagination {...paginationProps} />}
        filter={
          <TextFilter
            {...filterProps}
            filteringPlaceholder="Pesquisar produtos"
            countText={filteredItemsCount !== undefined ? `${filteredItemsCount} resultado(s)` : undefined}
          />
        }
        columnDefinitions={[
          {
            id: 'imagem', header: '', width: 60,
            cell: (p) => p.imagem
              ? <img src={p.imagem} alt={p.nome} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              : <Box color="text-status-inactive">—</Box>,
          },
          {
            id: 'nome', header: 'Produto', sortingField: 'nome',
            cell: (p) => (
              <SpaceBetween size="xxxs">
                <Box fontWeight="bold">{p.nome}</Box>
                <Box color="text-body-secondary" fontSize="body-s">{p.categoria}</Box>
              </SpaceBetween>
            ),
          },
          { id: 'preco', header: 'Preço', sortingField: 'preco', cell: (p) => `${p.preco.toFixed(2)} €` },
          { id: 'stock', header: 'Stock', sortingField: 'stock', cell: (p) => <BadgeStock stock={p.stock} /> },
          {
            id: 'galeria', header: 'Imagens', cell: (p) => {
              const extra = parseImagensExtra(p);
              return `${p.imagem ? 1 : 0}${extra.length ? ` + ${extra.length} galeria` : ''}`;
            },
          },
          { id: 'ativo', header: 'Estado', cell: (p) => p.ativo ? <Badge color="green">Ativo</Badge> : <Badge color="grey">Inativo</Badge> },
          {
            id: 'acoes', header: '', cell: (p) => (
              <Button variant="inline-icon" iconName="edit" ariaLabel="Editar" onClick={() => abrirEdicao(p)} disabled={!pode('produtos.editar')} />
            ),
          },
        ]}
      />

      <Modal
        visible={modalAberto}
        onDismiss={() => setModalAberto(false)}
        header={emEdicao?.id ? 'Editar produto' : 'Novo produto'}
        size="large"
      >
        {emEdicao && (
          <Form actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button variant="primary" loading={aGuardar} onClick={guardar}>Guardar</Button>
            </SpaceBetween>
          }>
            <SpaceBetween size="m">
              <FormField label="Nome"><Input value={emEdicao.nome || ''} onChange={({ detail }) => setEmEdicao({ ...emEdicao, nome: detail.value })} /></FormField>
              <FormField label="Descrição"><Textarea value={emEdicao.descricao || ''} onChange={({ detail }) => setEmEdicao({ ...emEdicao, descricao: detail.value })} /></FormField>

              <SpaceBetween direction="horizontal" size="m">
                <FormField label="Preço (€)"><Input type="number" value={String(emEdicao.preco ?? '')} onChange={({ detail }) => setEmEdicao({ ...emEdicao, preco: Number(detail.value) })} /></FormField>
                <FormField label="Preço promocional (€)"><Input type="number" value={String(emEdicao.preco_promocional ?? '')} onChange={({ detail }) => setEmEdicao({ ...emEdicao, preco_promocional: Number(detail.value) })} /></FormField>
                <FormField label="Stock"><Input type="number" value={String(emEdicao.stock ?? '')} onChange={({ detail }) => setEmEdicao({ ...emEdicao, stock: Number(detail.value) })} /></FormField>
              </SpaceBetween>

              <FormField label="Categoria">
                <Select
                  selectedOption={
                    emEdicao.categoria
                      ? { label: categorias.find(c => c.slug === emEdicao.categoria)?.nome || emEdicao.categoria, value: emEdicao.categoria }
                      : null
                  }
                  placeholder="Escolhe uma categoria"
                  options={categorias.map(c => ({ label: c.nome, value: c.slug }))}
                  onChange={({ detail }) => setEmEdicao({ ...emEdicao, categoria: detail.selectedOption.value })}
                  empty="Ainda não há categorias — cria uma em Categorias no menu."
                />
              </FormField>

              <FormField label="Imagem principal">
                <SpaceBetween direction="horizontal" size="s">
                  {emEdicao.imagem && <img src={emEdicao.imagem} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />}
                  <Button iconName="upload" onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file'; input.accept = 'image/*';
                    input.onchange = async () => {
                      if (input.files?.[0]) {
                        const url = await produtosApi.uploadImagemPrincipal(input.files[0]);
                        setEmEdicao(e => e && { ...e, imagem: url });
                      }
                    };
                    input.click();
                  }}>{emEdicao.imagem ? 'Substituir' : 'Carregar imagem'}</Button>
                </SpaceBetween>
              </FormField>

              <FormField
                label="Galeria de imagens (até 6)"
                description="Aparecem no carrossel de fotos na ficha do produto na loja."
              >
                <SpaceBetween size="s">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {galeria.map((url, i) => (
                      <div key={url} style={{ position: 'relative' }}>
                        <img src={url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                        <button
                          type="button"
                          onClick={() => setGaleria(g => g.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: -6, right: -6, background: '#1C1C1C', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' }}
                          aria-label="Remover imagem"
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <input ref={inputGaleriaRef} type="file" accept="image/*" multiple hidden
                    onChange={(e) => adicionarImagensGaleria(e.target.files)} />
                  <Button iconName="add-plus" onClick={() => inputGaleriaRef.current?.click()} disabled={galeria.length >= 6}>
                    Adicionar imagens
                  </Button>
                </SpaceBetween>
              </FormField>

              <FormField label="Tamanhos disponíveis" description="Escreve e prime Enter para adicionar (ex: S, M, L).">
                <SeletorTokens valores={tamanhos} onChange={setTamanhos} placeholder="Ex: M" />
              </FormField>
              <FormField label="Cores disponíveis">
                <SeletorTokens valores={cores} onChange={setCores} placeholder="Ex: Preto" />
              </FormField>

              <FormField label="Produto ativo (visível na loja)">
                <Toggle checked={!!emEdicao.ativo} onChange={({ detail }) => setEmEdicao({ ...emEdicao, ativo: detail.checked ? 1 : 0 })} />
              </FormField>
            </SpaceBetween>
          </Form>
        )}
      </Modal>
    </ContentLayout>
  );
}

/** Pequeno input + TokenGroup para gerir listas simples (tamanhos/cores) sem
 *  precisar de um componente dedicado do Cloudscape para "tags". */
function SeletorTokens({ valores, onChange, placeholder }: { valores: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [texto, setTexto] = useState('');
  return (
    <SpaceBetween size="xs">
      <Input
        value={texto}
        placeholder={placeholder}
        onChange={({ detail }) => setTexto(detail.value)}
        onKeyDown={({ detail }) => {
          if (detail.key === 'Enter' && texto.trim()) {
            onChange([...valores, texto.trim()]);
            setTexto('');
          }
        }}
      />
      <TokenGroup
        items={valores.map(v => ({ label: v }))}
        onDismiss={({ detail }) => onChange(valores.filter((_, i) => i !== detail.itemIndex))}
      />
    </SpaceBetween>
  );
}
