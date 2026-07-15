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
import DatePicker from '@cloudscape-design/components/date-picker';
import Toggle from '@cloudscape-design/components/toggle';
import Badge from '@cloudscape-design/components/badge';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { cuponsApi, Cupom } from '../lib/api';

export default function Coupons() {
  const [cupoes, setCupoes] = useState<Cupom[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Partial<Cupom> | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  async function carregar() { setCupoes(await cuponsApi.listar()); }
  useEffect(() => { carregar(); }, []);

  function novo() {
    setEmEdicao({ codigo: '', tipo: 'percentagem', valor: 10, ativo: 1 });
    setModalAberto(true);
  }

  async function guardar() {
    if (!emEdicao || !emEdicao.codigo || !emEdicao.valor) return;
    setAGuardar(true);
    try {
      if (emEdicao.id) await cuponsApi.atualizar(emEdicao.id, emEdicao);
      else await cuponsApi.criar(emEdicao);
      setModalAberto(false);
      await carregar();
    } finally {
      setAGuardar(false);
    }
  }

  const hoje = new Date();
  const estaValido = (c: Cupom) => {
    if (!c.ativo) return false;
    if (c.valido_ate && new Date(c.valido_ate) < hoje) return false;
    if (c.usos_maximos !== null && c.usos_atuais >= c.usos_maximos) return false;
    return true;
  };

  return (
    <ContentLayout header={
      <Header variant="h1" description="Códigos de desconto para a loja" actions={
        <Button variant="primary" iconName="add-plus" onClick={novo}>Novo cupão</Button>
      }>Cupões e Descontos</Header>
    }>
      <Table
        items={cupoes}
        trackBy="id"
        columnDefinitions={[
          { id: 'codigo', header: 'Código', cell: (c) => <strong>{c.codigo}</strong> },
          { id: 'desconto', header: 'Desconto', cell: (c) => c.tipo === 'percentagem' ? `${c.valor}%` : `${c.valor.toFixed(2)} €` },
          { id: 'validade', header: 'Validade', cell: (c) => c.valido_ate ? `até ${new Date(c.valido_ate).toLocaleDateString('pt-PT')}` : 'sem expiração' },
          { id: 'usos', header: 'Utilizações', cell: (c) => `${c.usos_atuais}${c.usos_maximos ? ` / ${c.usos_maximos}` : ''}` },
          { id: 'estado', header: 'Estado', cell: (c) => estaValido(c) ? <Badge color="green">Válido</Badge> : <Badge color="grey">Inativo/expirado</Badge> },
          { id: 'acoes', header: '', cell: (c) => <Button variant="inline-icon" iconName="edit" onClick={() => { setEmEdicao(c); setModalAberto(true); }} /> },
        ]}
        empty="Ainda não criaste nenhum cupão."
      />

      <Modal visible={modalAberto} onDismiss={() => setModalAberto(false)} header={emEdicao?.id ? 'Editar cupão' : 'Novo cupão'}>
        {emEdicao && (
          <Form actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button variant="primary" loading={aGuardar} onClick={guardar}>Guardar</Button>
            </SpaceBetween>
          }>
            <SpaceBetween size="m">
              <FormField label="Código" description='Ex: "GYM20" — fica sempre em maiúsculas'>
                <Input value={emEdicao.codigo || ''} onChange={({ detail }) => setEmEdicao({ ...emEdicao, codigo: detail.value.toUpperCase() })} />
              </FormField>
              <FormField label="Tipo de desconto">
                <Select
                  selectedOption={{ label: emEdicao.tipo === 'fixo' ? 'Valor fixo (€)' : 'Percentagem (%)', value: emEdicao.tipo || 'percentagem' }}
                  options={[{ label: 'Percentagem (%)', value: 'percentagem' }, { label: 'Valor fixo (€)', value: 'fixo' }]}
                  onChange={({ detail }) => setEmEdicao({ ...emEdicao, tipo: detail.selectedOption.value as 'percentagem' | 'fixo' })}
                />
              </FormField>
              <FormField label={emEdicao.tipo === 'fixo' ? 'Valor (€)' : 'Percentagem (%)'}>
                <Input type="number" value={String(emEdicao.valor ?? '')} onChange={({ detail }) => setEmEdicao({ ...emEdicao, valor: Number(detail.value) })} />
              </FormField>
              <FormField label="Válido até (opcional)">
                <DatePicker
                  value={emEdicao.valido_ate?.slice(0, 10) || ''}
                  onChange={({ detail }) => setEmEdicao({ ...emEdicao, valido_ate: detail.value })}
                  placeholder="AAAA/MM/DD"
                />
              </FormField>
              <FormField label="Limite de utilizações (opcional)">
                <Input type="number" value={String(emEdicao.usos_maximos ?? '')} onChange={({ detail }) => setEmEdicao({ ...emEdicao, usos_maximos: detail.value ? Number(detail.value) : null })} />
              </FormField>
              <FormField label="Ativo">
                <Toggle checked={!!emEdicao.ativo} onChange={({ detail }) => setEmEdicao({ ...emEdicao, ativo: detail.checked ? 1 : 0 })} />
              </FormField>
            </SpaceBetween>
          </Form>
        )}
      </Modal>
    </ContentLayout>
  );
}
