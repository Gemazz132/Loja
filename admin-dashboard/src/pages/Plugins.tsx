import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Cards from '@cloudscape-design/components/cards';
import Toggle from '@cloudscape-design/components/toggle';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import { pluginsApi, Plugin } from '../lib/api';

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  async function carregar() { setPlugins(await pluginsApi.listar()); }
  useEffect(() => { carregar(); }, []);

  async function alternar(plugin: Plugin) {
    const { aviso } = await pluginsApi.alternar(plugin.pasta, !plugin.ativo);
    if (aviso) setAviso(aviso);
    await carregar();
  }

  return (
    <ContentLayout header={<Header variant="h1" description="Activa módulos opcionais sem tocar em código">Plugins</Header>}>
      {aviso && <Alert type="info" dismissible onDismiss={() => setAviso(null)}>{aviso}</Alert>}
      <Cards
        items={plugins}
        trackBy="pasta"
        cardDefinition={{
          header: (p) => <Box fontWeight="bold">{p.nome}</Box>,
          sections: [
            { id: 'descricao', content: (p) => <Box color="text-body-secondary">{p.descricao}</Box> },
            { id: 'versao', header: 'Versão', content: (p) => p.versao },
            { id: 'estado', header: 'Estado', content: (p) => <Toggle checked={p.ativo} onChange={() => alternar(p)}>{p.ativo ? 'Activo' : 'Inactivo'}</Toggle> },
          ],
        }}
        cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
        empty="Nenhum plugin encontrado na pasta /plugins."
      />
    </ContentLayout>
  );
}
